import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import defaultAvatarGlbUrl from '../assets/lmmfdolj.glb?url';
import type { AvatarBackground, AvatarConfig } from '../shared/types';

interface ThreeAvatarCanvasProps {
  config: AvatarConfig;
  modelUrl: string;
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  speechEnergyRef: React.MutableRefObject<number>;
  className?: string;
}

const BG_HEX: Record<AvatarBackground, { bg: number; floor: number; fog: number }> = {
  window_light: { bg: 0xf4ede3, floor: 0xe2d8c9, fog: 0xf4ede3 },
  sage_studio: { bg: 0xe8f1eb, floor: 0xd0e1d6, fog: 0xe8f1eb },
  warm_dusk: { bg: 0xf7ebe2, floor: 0xe8d0c1, fog: 0xf7ebe2 },
  evening_calm: { bg: 0xe6e3f2, floor: 0xd1cce6, fog: 0xe6e3f2 },
};

const _box = new THREE.Box3();
const _center = new THREE.Vector3();
const _size = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function ThreeAvatarCanvas({
  config,
  modelUrl,
  isSpeaking,
  isListening,
  isThinking,
  speechEnergyRef,
  className = '',
}: ThreeAvatarCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Store reactive props in refs so WebGL scene never tears down on state changes
  const stateRef = useRef({
    isSpeaking,
    isListening,
    isThinking,
    animate3d: config.animate3d !== false,
    background: config.background,
  });
  stateRef.current = {
    isSpeaking,
    isListening,
    isThinking,
    animate3d: config.animate3d !== false,
    background: config.background,
  };

  const sceneRefs = useRef<{
    scene?: THREE.Scene;
    floorMat?: THREE.MeshStandardMaterial;
    auraLight?: THREE.PointLight;
    requestRender?: () => void;
  }>({});

  // Sync background color cleanly without recreating renderer
  useEffect(() => {
    const { scene, floorMat, requestRender } = sceneRefs.current;
    if (!scene) return;
    const palette = BG_HEX[config.background] ?? BG_HEX.window_light;
    scene.background = new THREE.Color(palette.bg);
    scene.fog = new THREE.Fog(palette.fog, 3.2, 8.5);
    if (floorMat) {
      floorMat.color.setHex(palette.floor);
    }
    requestRender?.();
  }, [config.background]);

  // Trigger an on-demand redraw when animation is toggled off
  useEffect(() => {
    sceneRefs.current.requestRender?.();
  }, [config.animate3d, isSpeaking, isListening, isThinking]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    let frameId = 0;
    const isSoftwareGl = detectSoftwareWebGL();
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const width = Math.max(container.clientWidth || 320, 120);
    const height = Math.max(container.clientHeight || 320, 120);
    const palette = BG_HEX[stateRef.current.background] ?? BG_HEX.window_light;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(palette.bg);
    scene.fog = new THREE.Fog(palette.fog, 3.2, 8.5);

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 40);
    camera.position.set(0, 0.72, 2.05);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Mandatory studio environment map via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3-point warm/cool studio lighting rig
    const hemiLight = new THREE.HemisphereLight(0xfff9f0, 0xc9d7ce, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff3e4, 1.65);
    keyLight.position.set(1.8, 2.6, 2.4);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 9;
      keyLight.shadow.camera.left = -1.2;
      keyLight.shadow.camera.right = 1.2;
      keyLight.shadow.camera.top = 1.5;
      keyLight.shadow.camera.bottom = -0.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd9e8f5, 0.75);
    rimLight.position.set(-1.8, 1.6, -2.0);
    scene.add(rimLight);

    const auraLight = new THREE.PointLight(0x6fb392, 0.25, 4, 2);
    auraLight.position.set(0, 0.65, 1.1);
    scene.add(auraLight);

    // Subtle grounded pedestal disc + soft contact shadow plane
    const pedestalGeo = new THREE.CylinderGeometry(0.62, 0.68, 0.04, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: palette.floor,
      roughness: 0.88,
      metalness: 0.04,
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.y = -0.02;
    pedestalMesh.receiveShadow = true;
    scene.add(pedestalMesh);

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 12, 128, 128, 120);
      grad.addColorStop(0, 'rgba(30, 51, 43, 0.34)');
      grad.addColorStop(0.6, 'rgba(30, 51, 43, 0.1)');
      grad.addColorStop(1, 'rgba(30, 51, 43, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const contactGeo = new THREE.PlaneGeometry(1.1, 1.1);
    const contactMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const contactPlane = new THREE.Mesh(contactGeo, contactMat);
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.y = 0.002;
    scene.add(contactPlane);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 1.15;
    controls.maxDistance = 3.2;
    controls.minPolarAngle = Math.PI * 0.28;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.56, 0);
    controls.update();

    let userInteracting = false;
    controls.addEventListener('start', () => {
      userInteracting = true;
    });
    controls.addEventListener('end', () => {
      userInteracting = false;
    });

    // Model pivot + animation references
    const avatarPivot = new THREE.Group();
    scene.add(avatarPivot);

    let mixer: THREE.AnimationMixer | null = null;
    const morphMeshes: THREE.Mesh[] = [];
    let headBone: THREE.Object3D | null = null;
    let basePivotY = 0;

    // On-demand render helper + paced loop for Software WebGL
    let renderBusy = false;
    let renderDirty = false;
    const afterDraw = (cb: () => void) => {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        controls.update();
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    sceneRefs.current = {
      scene,
      floorMat: pedestalMat,
      auraLight,
      requestRender,
    };

    controls.addEventListener('change', () => {
      if (!stateRef.current.animate3d || prefersReducedMotion) {
        requestRender();
      }
    });

    // Load the GLB model
    setLoadStatus('loading');
    setErrorMsg(null);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    const onGltfLoaded = (gltf: { scene: THREE.Group; animations: THREE.AnimationClip[] }) => {
      if (disposed) return;
      const model = gltf.scene;

      // Normalize model scale to ~1.06 units tall and sit flush on y = 0
      _box.setFromObject(model);
      _box.getCenter(_center);
      _box.getSize(_size);
      const maxDim = Math.max(_size.x, _size.y, _size.z) || 1;
      const targetHeight = 1.06;
      const scale = targetHeight / (_size.y || maxDim);
      model.scale.setScalar(scale);

      // Recompute bounds after scaling
      model.updateMatrixWorld(true);
      _box.setFromObject(model);
      _box.getCenter(_center);
      _box.getSize(_size);

      model.position.x -= _center.x;
      model.position.z -= _center.z;
      model.position.y -= _box.min.y; // Flush at y = 0 on pedestal

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = !isSoftwareGl;
          mesh.receiveShadow = true;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((mat) => {
            if (!mat) return;
            mat.side = THREE.DoubleSide;
            if ('envMapIntensity' in mat) {
              (mat as THREE.MeshStandardMaterial).envMapIntensity = 0.85;
            }
          });
          if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
            morphMeshes.push(mesh);
          }
        }
        if (
          !headBone &&
          /head|neck/i.test(child.name) &&
          (child.type === 'Bone' || child.children.length > 0)
        ) {
          headBone = child;
        }
      });

      avatarPivot.add(model);
      basePivotY = 0;

      // Frame camera comfortably on upper bust / full figure
      const finalHeight = _size.y;
      const focusY = finalHeight * 0.56;
      controls.target.set(0, focusY, 0);
      camera.position.set(0, focusY + 0.1, Math.max(1.65, finalHeight * 1.75));
      controls.update();

      // Embedded animations if present
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
      }

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      setLoadStatus('ready');
      requestRender();
    };

    gltfLoader.load(
      modelUrl,
      onGltfLoaded,
      undefined,
      () => {
        if (disposed) return;
        if (modelUrl !== defaultAvatarGlbUrl) {
          gltfLoader.load(
            defaultAvatarGlbUrl,
            onGltfLoaded,
            undefined,
            () => {
              if (disposed) return;
              setLoadStatus('error');
              setErrorMsg('No se pudo cargar el modelo 3D (.glb).');
            }
          );
          return;
        }
        setLoadStatus('error');
        setErrorMsg('No se pudo cargar el modelo 3D (.glb).');
      }
    );

    // ResizeObserver for responsive container
    const resizeObserver = new ResizeObserver((entries) => {
      if (disposed) return;
      for (const entry of entries) {
        const w = Math.max(entry.contentRect.width, 100);
        const h = Math.max(entry.contentRect.height, 100);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        requestRender();
      }
    });
    resizeObserver.observe(container);

    // Animation loop
    const clock = new THREE.Clock();
    let smoothEnergy = 0;
    let nextBlinkAt = 2.6;
    let blinkState = 0;

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const { animate3d, isSpeaking: speakingNow, isListening: listeningNow } = stateRef.current;

      if (animate3d && !prefersReducedMotion) {
        if (mixer) {
          mixer.update(delta);
        }

        const rawEnergy = speakingNow ? Math.min(1, Math.max(0.1, speechEnergyRef.current)) : 0;
        smoothEnergy = THREE.MathUtils.damp(smoothEnergy, rawEnergy, 14, delta);

        // Gentle breathing & empathetic posture motion
        const breath = Math.sin(elapsed * 1.45) * 0.008;
        avatarPivot.position.y = basePivotY + breath;

        if (!userInteracting) {
          const targetRotY = speakingNow
            ? Math.sin(elapsed * 1.7) * (0.045 + smoothEnergy * 0.05)
            : listeningNow
              ? Math.sin(elapsed * 0.85) * 0.03
              : Math.sin(elapsed * 0.5) * 0.025;
          const targetRotX = speakingNow
            ? Math.sin(elapsed * 3.8) * (0.015 + smoothEnergy * 0.03)
            : listeningNow
              ? 0.035
              : Math.sin(elapsed * 0.7) * 0.01;
          const targetRotZ = listeningNow ? 0.028 : Math.sin(elapsed * 0.65) * 0.01;

          avatarPivot.rotation.y = THREE.MathUtils.damp(avatarPivot.rotation.y, targetRotY, 6, delta);
          avatarPivot.rotation.x = THREE.MathUtils.damp(avatarPivot.rotation.x, targetRotX, 6, delta);
          avatarPivot.rotation.z = THREE.MathUtils.damp(avatarPivot.rotation.z, targetRotZ, 5, delta);
        }

        if (headBone) {
          headBone.rotation.x = speakingNow ? Math.sin(elapsed * 5.2) * smoothEnergy * 0.06 : 0;
        }

        // Morph target lip-sync & blink if the GLB includes blendshapes
        if (morphMeshes.length > 0) {
          if (elapsed > nextBlinkAt) {
            blinkState += delta * 7.5;
            if (blinkState >= 2) {
              blinkState = 0;
              nextBlinkAt = elapsed + 2.8 + Math.random() * 2.2;
            }
          }
          const blinkWeight = blinkState <= 1 ? blinkState : 2 - blinkState;

          for (const mesh of morphMeshes) {
            const dict = mesh.morphTargetDictionary;
            const infl = mesh.morphTargetInfluences;
            if (!dict || !infl) continue;

            for (const [key, idx] of Object.entries(dict)) {
              const lower = key.toLowerCase();
              if (
                lower.includes('jawopen') ||
                lower.includes('mouthopen') ||
                lower === 'viseme_aa' ||
                lower === 'vrc.v_aa'
              ) {
                infl[idx] = smoothEnergy * 0.75;
              } else if (lower.includes('blink') || lower.includes('eyeclose')) {
                infl[idx] = blinkWeight;
              }
            }
          }
        }

        // Subtle aura glow while speaking or listening
        const targetAura = speakingNow ? 0.55 + smoothEnergy * 0.55 : listeningNow ? 0.45 : 0.2;
        auraLight.intensity = THREE.MathUtils.damp(auraLight.intensity, targetAura, 8, delta);
      } else {
        avatarPivot.position.y = THREE.MathUtils.damp(avatarPivot.position.y, 0, 8, delta);
        avatarPivot.rotation.set(0, 0, 0);
      }

      controls.update();
      renderer.render(scene, camera);

      if (animate3d && !prefersReducedMotion) {
        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      }
    };

    if (stateRef.current.animate3d && !prefersReducedMotion) {
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    } else {
      requestRender();
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      dracoLoader.dispose();
      envTarget.dispose();
      pedestalGeo.dispose();
      pedestalMat.dispose();
      contactGeo.dispose();
      contactMat.dispose();
      shadowTex.dispose();

      avatarPivot.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => {
            if (!mat) return;
            for (const val of Object.values(mat)) {
              if (val && typeof (val as THREE.Texture).dispose === 'function') {
                (val as THREE.Texture).dispose();
              }
            }
            mat.dispose();
          });
        }
      });

      renderer.dispose();
      sceneRefs.current = {};
    };
  }, [modelUrl, config.animate3d, speechEnergyRef]);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-ania-surface-muted border border-ania-border ${className}`}
    >
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full"
        aria-label={`Avatar 3D de ${config.displayName}`}
      />

      {loadStatus === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-ania-canvas/90 text-xs font-medium text-ania-muted pointer-events-none">
          Cargando avatar 3D…
        </div>
      )}

      {loadStatus === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-ania-safety text-xs text-center text-ania-safety-text">
          {errorMsg}
        </div>
      )}

      {(isSpeaking || isListening || isThinking) && loadStatus === 'ready' && (
        <div className="absolute bottom-3 left-3 right-3 bg-ania-surface/95 border border-ania-border rounded-xl px-3 py-1.5 text-center text-xs font-medium text-ania-accent-text pointer-events-none">
          {isSpeaking
            ? 'Hablando…'
            : isListening
              ? 'Escuchándote…'
              : 'Preparando respuesta…'}
        </div>
      )}
    </div>
  );
}
