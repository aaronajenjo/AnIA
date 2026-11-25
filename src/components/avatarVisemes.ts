import * as THREE from 'three';

export interface SpeechTelemetry {
  energy: number;
  lowBand: number;
  midBand: number;
  highBand: number;
  currentPhoneme: 'sil' | 'aa' | 'E' | 'O' | 'PP' | 'FF';
}

export function createInitialSpeechTelemetry(): SpeechTelemetry {
  return {
    energy: 0,
    lowBand: 0,
    midBand: 0,
    highBand: 0,
    currentPhoneme: 'sil',
  };
}

/**
 * Maps a Spanish character (from TTS boundary events or syllable stream)
 * to a basic viseme category.
 */
export function charToViseme(ch: string): SpeechTelemetry['currentPhoneme'] {
  const c = ch.toLowerCase();
  if (!c || /[\s.,;:!?¡¿\-()"\n]/.test(c)) return 'sil';
  if (/[aá]/.test(c)) return 'aa';
  if (/[eéiíy]/.test(c)) return 'E';
  if (/[oóuúüw]/.test(c)) return 'O';
  if (/[pbm]/.test(c)) return 'PP';
  if (/[fvsrzc]/.test(c)) return 'FF';
  return 'aa';
}

/**
 * Extracts normalized low / mid / high acoustic energy bands from Web Audio FFT bins
 * to infer realistic vowel/consonant viseme ratios alongside RMS loudness.
 */
export function analyzeFftVisemes(
  freqData: Uint8Array,
  sampleRate = 48000
): Omit<SpeechTelemetry, 'energy'> {
  const binHz = sampleRate / (freqData.length * 2);
  let lowSum = 0;
  let lowCnt = 0;
  let midSum = 0;
  let midCnt = 0;
  let highSum = 0;
  let highCnt = 0;

  for (let i = 0; i < freqData.length; i++) {
    const hz = i * binHz;
    const val = freqData[i] / 255;
    if (hz >= 120 && hz < 750) {
      lowSum += val;
      lowCnt++;
    } else if (hz >= 750 && hz < 2400) {
      midSum += val;
      midCnt++;
    } else if (hz >= 2400 && hz <= 6500) {
      highSum += val;
      highCnt++;
    }
  }

  const lowBand = lowCnt > 0 ? Math.min(1, (lowSum / lowCnt) * 1.9) : 0;
  const midBand = midCnt > 0 ? Math.min(1, (midSum / midCnt) * 2.2) : 0;
  const highBand = highCnt > 0 ? Math.min(1, (highSum / highCnt) * 2.6) : 0;

  let currentPhoneme: SpeechTelemetry['currentPhoneme'] = 'sil';
  const peak = Math.max(lowBand, midBand, highBand);
  if (peak < 0.08) {
    currentPhoneme = 'PP';
  } else if (highBand > lowBand * 1.15 && highBand > 0.22) {
    currentPhoneme = 'FF';
  } else if (midBand > lowBand * 1.05 && midBand > 0.2) {
    currentPhoneme = 'E';
  } else if (lowBand > midBand * 1.25) {
    currentPhoneme = 'O';
  } else {
    currentPhoneme = 'aa';
  }

  return { lowBand, midBand, highBand, currentPhoneme };
}

/**
 * Ensures a loaded Three.js Mesh has viseme morph targets (`viseme_aa`, `viseme_O`,
 * `viseme_E`, `viseme_PP`, `viseme_FF`).
 * - If the GLB already contains morph targets, keeps them untouched.
 * - If the GLB is a static mesh (like `lmmfdolj.glb`), synthesizes smooth, localized
 *   lower-face/jaw/lip morph attributes in `geometry.morphAttributes.position` and
 *   calls `mesh.updateMorphTargets()` so GPU morph-target interpolation drives real lip-sync.
 */
export function ensureVisemeMorphTargets(mesh: THREE.Mesh): boolean {
  const geom = mesh.geometry;
  if (!geom || !geom.attributes?.position) return false;

  // Preserve native morph targets when a GLB already ships them
  if (
    mesh.morphTargetDictionary &&
    Object.keys(mesh.morphTargetDictionary).length > 0 &&
    mesh.morphTargetInfluences &&
    mesh.morphTargetInfluences.length > 0
  ) {
    return true;
  }

  const pos = geom.attributes.position as THREE.BufferAttribute;
  const count = pos.count;
  if (count < 20) return false;

  geom.computeBoundingBox();
  const bbox = geom.boundingBox;
  if (!bbox) return false;

  const sizeX = Math.max(bbox.max.x - bbox.min.x, 0.001);
  const sizeY = Math.max(bbox.max.y - bbox.min.y, 0.001);
  const sizeZ = Math.max(bbox.max.z - bbox.min.z, 0.001);
  const centerX = (bbox.min.x + bbox.max.x) * 0.5;
  const centerZ = (bbox.min.z + bbox.max.z) * 0.5;

  // Anatomical anchor ratios calibrated for frontal portrait/bust GLBs (e.g. lmmfdolj.glb: y 0..0.45):
  // mouth center ~56.5% height (y ≈ 0.254), chin ~49% height (y ≈ 0.220), nose tip >= 61.5% height.
  const mouthY = bbox.min.y + sizeY * 0.565;
  const chinY = bbox.min.y + sizeY * 0.495;
  const mouthRadiusX = sizeX * 0.145;
  const mouthRadiusY = sizeY * 0.068;
  const frontThresholdZ = centerZ + sizeZ * 0.15;

  const aaArr = new Float32Array(count * 3);
  const oArr = new Float32Array(count * 3);
  const eArr = new Float32Array(count * 3);
  const ppArr = new Float32Array(count * 3);
  const ffArr = new Float32Array(count * 3);

  let affectedVertices = 0;

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const i3 = i * 3;
    // Default = neutral base vertex (morphTargetsRelative = false requires full target coordinates)
    aaArr[i3] = x;
    aaArr[i3 + 1] = y;
    aaArr[i3 + 2] = z;
    oArr[i3] = x;
    oArr[i3 + 1] = y;
    oArr[i3 + 2] = z;
    eArr[i3] = x;
    eArr[i3 + 1] = y;
    eArr[i3 + 2] = z;
    ppArr[i3] = x;
    ppArr[i3 + 1] = y;
    ppArr[i3 + 2] = z;
    ffArr[i3] = x;
    ffArr[i3 + 1] = y;
    ffArr[i3 + 2] = z;

    if (z <= frontThresholdZ) continue;

    // Ellipsoidal weight around the mouth/lower-jaw zone, strictly keeping nose/eyes untouched
    const nx = (x - centerX) / mouthRadiusX;
    const ny = (y - mouthY) / mouthRadiusY;
    const distSq = nx * nx + ny * ny;

    // Jaw/chin envelope below the lip line for natural jaw drop
    const jnx = (x - centerX) / (sizeX * 0.165);
    const jny = (y - chinY) / (sizeY * 0.078);
    const jawDistSq = jnx * jnx + jny * jny;

    if (distSq >= 1.0 && jawDistSq >= 1.0) continue;

    const zWeight = THREE.MathUtils.clamp((z - frontThresholdZ) / (sizeZ * 0.18), 0, 1);
    const lipWeight = distSq < 1.0 ? Math.pow(1 - distSq, 1.5) * zWeight : 0;
    const jawWeight =
      jawDistSq < 1.0 && y <= mouthY + sizeY * 0.015
        ? Math.pow(1 - jawDistSq, 1.4) * zWeight
        : 0;

    if (lipWeight <= 0.001 && jawWeight <= 0.001) continue;
    affectedVertices++;

    const signX = x >= centerX ? 1 : -1;
    const absNx = Math.min(1, Math.abs(nx));
    const isLowerLip = y <= mouthY;

    // 1. viseme_aa: open jaw + slight lower-lip separation & subtle inner recess
    const aaDrop = (isLowerLip ? 1.0 : 0.15) * jawWeight * sizeY * 0.036 + lipWeight * (isLowerLip ? -sizeY * 0.018 : sizeY * 0.006);
    aaArr[i3 + 1] = y - aaDrop;
    aaArr[i3 + 2] = z - lipWeight * sizeZ * 0.022;

    // 2. viseme_O: lip funnel forward, narrow corners inward, moderate jaw drop
    oArr[i3] = x - signX * absNx * lipWeight * sizeX * 0.022;
    oArr[i3 + 1] = y - (isLowerLip ? jawWeight * sizeY * 0.022 : 0);
    oArr[i3 + 2] = z + lipWeight * sizeZ * 0.042;

    // 3. viseme_E: wide horizontal lip corners + mild lift & slight opening
    eArr[i3] = x + signX * absNx * lipWeight * sizeX * 0.028;
    eArr[i3 + 1] = y + absNx * lipWeight * sizeY * 0.012 - (isLowerLip ? jawWeight * sizeY * 0.014 : 0);
    eArr[i3 + 2] = z - lipWeight * sizeZ * 0.01;

    // 4. viseme_PP: gentle bilabial lip press together
    const towardSeam = (mouthY - y) * 0.45 * lipWeight;
    ppArr[i3 + 1] = y + towardSeam;
    ppArr[i3 + 2] = z - lipWeight * sizeZ * 0.014;

    // 5. viseme_FF: slight lower-lip tuck inward + subtle upper-lip lift
    ffArr[i3 + 1] = y + (isLowerLip ? lipWeight * sizeY * 0.01 : lipWeight * sizeY * 0.006);
    ffArr[i3 + 2] = z + (isLowerLip ? -lipWeight * sizeZ * 0.02 : lipWeight * sizeZ * 0.012);
  }

  if (affectedVertices === 0) return false;

  const visemeNames = ['viseme_aa', 'viseme_O', 'viseme_E', 'viseme_PP', 'viseme_FF'];
  const arrays = [aaArr, oArr, eArr, ppArr, ffArr];

  geom.morphTargetsRelative = false;
  geom.morphAttributes.position = arrays.map((arr, idx) => {
    const attr = new THREE.BufferAttribute(arr, 3);
    attr.name = visemeNames[idx];
    return attr;
  });

  // Register targetNames on geometry.userData so updateMorphTargets builds morphTargetDictionary cleanly
  geom.userData.targetNames = visemeNames;
  mesh.updateMorphTargets();
  if (!mesh.morphTargetDictionary || Object.keys(mesh.morphTargetDictionary).length === 0) {
    mesh.morphTargetDictionary = {
      viseme_aa: 0,
      viseme_O: 1,
      viseme_E: 2,
      viseme_PP: 3,
      viseme_FF: 4,
    };
  }
  mesh.morphTargetInfluences = new Array(visemeNames.length).fill(0);

  return true;
}

/**
 * Computes damped target morph weights from current speech telemetry and applies them
 * across either native GLB morph targets (ARKit/Oculus/VRM) or synthesized viseme targets.
 */
export function applyVisemeMorphTargets(
  meshes: THREE.Mesh[],
  telemetry: SpeechTelemetry,
  isSpeaking: boolean,
  blinkWeight: number,
  elapsed: number,
  delta: number,
  smoothedState: Record<'aa' | 'O' | 'E' | 'PP' | 'FF', number>
) {
  const energy = isSpeaking ? THREE.MathUtils.clamp(telemetry.energy, 0.06, 1) : 0;

  // Target weights per viseme channel
  let targetAa = 0;
  let targetO = 0;
  let targetE = 0;
  let targetPP = 0;
  let targetFF = 0;

  if (isSpeaking) {
    // Organic syllable cadence overlay so even steady tones articulate naturally
    const syllablePulse = 0.72 + 0.28 * Math.sin(elapsed * 14.5);
    const modulated = Math.min(1, energy * syllablePulse);

    switch (telemetry.currentPhoneme) {
      case 'O':
        targetO = modulated * 0.92;
        targetAa = modulated * 0.24;
        break;
      case 'E':
        targetE = modulated * 0.88;
        targetAa = modulated * 0.28;
        break;
      case 'PP':
        targetPP = 0.72;
        break;
      case 'FF':
        targetFF = modulated * 0.85;
        targetE = modulated * 0.22;
        break;
      case 'sil':
        targetPP = 0.25;
        break;
      case 'aa':
      default:
        targetAa = modulated * 0.95;
        targetO = telemetry.lowBand * 0.25;
        targetE = telemetry.midBand * 0.2;
        break;
    }
  }

  const speed = isSpeaking ? 18 : 10;
  smoothedState.aa = THREE.MathUtils.damp(smoothedState.aa, targetAa, speed, delta);
  smoothedState.O = THREE.MathUtils.damp(smoothedState.O, targetO, speed, delta);
  smoothedState.E = THREE.MathUtils.damp(smoothedState.E, targetE, speed, delta);
  smoothedState.PP = THREE.MathUtils.damp(smoothedState.PP, targetPP, speed, delta);
  smoothedState.FF = THREE.MathUtils.damp(smoothedState.FF, targetFF, speed, delta);

  for (const mesh of meshes) {
    const dict = mesh.morphTargetDictionary;
    const infl = mesh.morphTargetInfluences;
    if (!dict || !infl) continue;

    for (const [rawKey, idx] of Object.entries(dict)) {
      const k = rawKey.toLowerCase();

      if (k === 'viseme_aa' || k === 'vrc.v_aa' || k === 'jawopen' || k === 'mouthopen') {
        infl[idx] = smoothedState.aa;
      } else if (
        k === 'viseme_o' ||
        k === 'viseme_u' ||
        k === 'vrc.v_oh' ||
        k === 'vrc.v_ou' ||
        k === 'mouthfunnel' ||
        k === 'mouthpucker'
      ) {
        infl[idx] = smoothedState.O;
      } else if (
        k === 'viseme_e' ||
        k === 'viseme_i' ||
        k === 'vrc.v_e' ||
        k === 'vrc.v_ih' ||
        k === 'mouthsmile' ||
        k === 'mouthsmileleft' ||
        k === 'mouthsmileright'
      ) {
        infl[idx] = smoothedState.E;
      } else if (k === 'viseme_pp' || k === 'vrc.v_pp' || k === 'mouthclose') {
        infl[idx] = smoothedState.PP;
      } else if (
        k === 'viseme_ff' ||
        k === 'viseme_ss' ||
        k === 'vrc.v_ff' ||
        k === 'vrc.v_ss'
      ) {
        infl[idx] = smoothedState.FF;
      } else if (k.includes('blink') || k.includes('eyeclose')) {
        infl[idx] = blinkWeight;
      }
    }
  }
}
