import { useEffect, useRef } from 'react';
import type {
  AvatarBackground,
  AvatarConfig,
  AvatarEyeColor,
  AvatarHairColor,
  AvatarOutfitColor,
  AvatarSkinTone,
  StaticPhotoPreset,
} from '../shared/types';
import { DEFAULT_GLB_MODEL_URL } from '../store/useAniaStore';
import { ThreeAvatarCanvas } from './ThreeAvatarCanvas';

interface RealisticAvatarCanvasProps {
  config: AvatarConfig;
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  speechEnergyRef: React.MutableRefObject<number>;
  className?: string;
}

const STATIC_PHOTOS: Record<StaticPhotoPreset, { src: string; label: string }> = {
  clara: {
    src: '/src/assets/images/avatar_clara_1794846993145.jpg',
    label: 'Retrato sereno · Clara',
  },
  mateo: {
    src: '/src/assets/images/avatar_mateo_1794846992796.jpg',
    label: 'Retrato sereno · Mateo',
  },
  nora: {
    src: '/src/assets/images/avatar_nora_1794846993034.jpg',
    label: 'Retrato sereno · Nora',
  },
};

const SKIN_PALETTES: Record<
  AvatarSkinTone,
  { base: string; highlight: string; shadow: string; blush: string; lip: string; lipDark: string }
> = {
  porcelain: {
    base: '#F6DDD0',
    highlight: '#FFF0E8',
    shadow: '#DFB7A5',
    blush: 'rgba(225, 138, 122, 0.22)',
    lip: '#C9857E',
    lipDark: '#9A5A55',
  },
  warm_light: {
    base: '#ECC6AD',
    highlight: '#F8DEC9',
    shadow: '#CE9B7E',
    blush: 'rgba(214, 120, 98, 0.22)',
    lip: '#BD756B',
    lipDark: '#8B4D45',
  },
  olive: {
    base: '#D9AE88',
    highlight: '#EBC8A6',
    shadow: '#B5845D',
    blush: 'rgba(196, 108, 86, 0.2)',
    lip: '#AD665B',
    lipDark: '#7C4038',
  },
  caramel: {
    base: '#B7815A',
    highlight: '#CE9B75',
    shadow: '#8D5B39',
    blush: 'rgba(176, 86, 68, 0.22)',
    lip: '#8F4D44',
    lipDark: '#63302A',
  },
  deep: {
    base: '#7D5138',
    highlight: '#98694C',
    shadow: '#583522',
    blush: 'rgba(155, 72, 60, 0.2)',
    lip: '#6B3833',
    lipDark: '#47211D',
  },
};

const HAIR_PALETTES: Record<AvatarHairColor, { main: string; highlight: string; shadow: string }> = {
  espresso: { main: '#2A201B', highlight: '#45362E', shadow: '#19120F' },
  chestnut: { main: '#5E3D2B', highlight: '#7D553E', shadow: '#3F271B' },
  sand_blonde: { main: '#C4A06C', highlight: '#DEC090', shadow: '#997748' },
  auburn: { main: '#8A3E29', highlight: '#AA563D', shadow: '#5E2717' },
  silver: { main: '#A8ADB0', highlight: '#CDD1D4', shadow: '#7D8286' },
};

const EYE_COLORS: Record<AvatarEyeColor, string> = {
  hazel: '#6E5534',
  sage: '#4F705B',
  ocean: '#446A85',
  dark_brown: '#3B281E',
};

const OUTFIT_COLORS: Record<AvatarOutfitColor, { main: string; fold: string; collar: string }> = {
  sage: { main: '#7E9F8B', fold: '#62836F', collar: '#A3BFAD' },
  oatmeal: { main: '#D4C7B4', fold: '#B8A993', collar: '#E6DDD0' },
  lavender: { main: '#9D93C4', fold: '#7F74A8', collar: '#BEB7DF' },
  terracotta: { main: '#C27E66', fold: '#A1604A', collar: '#DBA18C' },
  navy: { main: '#41556B', fold: '#2C3D50', collar: '#607790' },
};

const BACKGROUNDS: Record<AvatarBackground, { top: string; bottom: string; glow: string }> = {
  window_light: { top: '#F5EFE6', bottom: '#E5DDD0', glow: 'rgba(255, 250, 240, 0.85)' },
  sage_studio: { top: '#E9F2EC', bottom: '#D3E3D9', glow: 'rgba(244, 250, 246, 0.8)' },
  warm_dusk: { top: '#F8ECE3', bottom: '#EBD3C5', glow: 'rgba(255, 243, 232, 0.78)' },
  evening_calm: { top: '#E7E4F3', bottom: '#D4CFE8', glow: 'rgba(244, 242, 252, 0.78)' },
};

export function RealisticAvatarCanvas({
  config,
  isSpeaking,
  isListening,
  isThinking,
  speechEnergyRef,
  className = '',
}: RealisticAvatarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (config.renderMode === 'static_photo' || config.renderMode === 'model_3d') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isAnimated = config.renderMode === 'animated_lipsync';
    let rafId = 0;
    const startTime = performance.now();
    let nextBlinkAt = 2400;
    let blinkProgress = 0; // 0 open -> 1 closed
    let smoothMouth = 0;
    let smoothWidth = 0;

    const renderFrame = (now: number) => {
      const t = (now - startTime) / 1000;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = 420;
      const height = 420;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Update animation parameters
      const elapsedMs = now - startTime;
      if (isAnimated) {
        if (elapsedMs > nextBlinkAt) {
          blinkProgress += 0.18;
          if (blinkProgress >= 2) {
            blinkProgress = 0;
            nextBlinkAt = elapsedMs + 2800 + Math.random() * 2400;
          }
        }
        const targetEnergy = isSpeaking ? Math.min(1, Math.max(0.08, speechEnergyRef.current)) : 0;
        smoothMouth += (targetEnergy - smoothMouth) * 0.34;
        const targetWidth = isSpeaking ? Math.sin(t * 9.5) * 0.35 + targetEnergy * 0.45 : 0;
        smoothWidth += (targetWidth - smoothWidth) * 0.25;
      } else {
        blinkProgress = 0;
        smoothMouth = 0;
        smoothWidth = 0;
      }

      const eyeClosure = blinkProgress <= 1 ? blinkProgress : 2 - blinkProgress;
      const breathY = isAnimated ? Math.sin(t * 1.4) * 2.2 : 0;
      const headSwayX = isAnimated
        ? isSpeaking
          ? Math.sin(t * 2.1) * 2.5
          : isListening
            ? Math.sin(t * 0.9) * 1.4
            : Math.sin(t * 0.6) * 1.0
        : 0;
      const headTilt = isAnimated
        ? isListening
          ? 0.025 + Math.sin(t * 0.8) * 0.01
          : isSpeaking
            ? Math.sin(t * 1.7) * 0.018
            : Math.sin(t * 0.5) * 0.008
        : 0;

      const bg = BACKGROUNDS[config.background];
      const skin = SKIN_PALETTES[config.skinTone];
      const hair = HAIR_PALETTES[config.hairColor];
      const eyeColor = EYE_COLORS[config.eyeColor];
      const outfit = OUTFIT_COLORS[config.outfitColor];

      // 1. Background soft daylight gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, bg.top);
      bgGrad.addColorStop(1, bg.bottom);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Soft window light halo behind portrait
      const haloGrad = ctx.createRadialGradient(width * 0.36, height * 0.32, 20, width * 0.45, height * 0.45, 240);
      haloGrad.addColorStop(0, bg.glow);
      haloGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = haloGrad;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = 205;

      // 2. Shoulders & Outfit (moves subtly with breathing)
      ctx.save();
      ctx.translate(0, breathY * 0.7);
      const shoulderGrad = ctx.createLinearGradient(cx, 285, cx, 425);
      shoulderGrad.addColorStop(0, outfit.main);
      shoulderGrad.addColorStop(1, outfit.fold);
      ctx.fillStyle = shoulderGrad;
      ctx.beginPath();
      ctx.moveTo(52, 430);
      ctx.quadraticCurveTo(64, 320, 148, 304);
      ctx.lineTo(272, 304);
      ctx.quadraticCurveTo(356, 320, 368, 430);
      ctx.closePath();
      ctx.fill();

      // Knit / collar neckline detail
      ctx.strokeStyle = outfit.collar;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(156, 306);
      ctx.quadraticCurveTo(210, 344, 264, 306);
      ctx.stroke();

      // Neck with anatomical shadow under chin
      const neckGrad = ctx.createLinearGradient(cx, 248, cx, 330);
      neckGrad.addColorStop(0, skin.shadow);
      neckGrad.addColorStop(0.5, skin.base);
      neckGrad.addColorStop(1, skin.base);
      ctx.fillStyle = neckGrad;
      ctx.beginPath();
      ctx.moveTo(176, 250);
      ctx.lineTo(244, 250);
      ctx.lineTo(250, 315);
      ctx.quadraticCurveTo(210, 334, 170, 315);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 3. Head Group (head sway & tilt)
      ctx.save();
      ctx.translate(cx + headSwayX, cy + breathY);
      ctx.rotate(headTilt);

      // Back hair layer
      if (config.hairStyle !== 'bald') {
        ctx.fillStyle = hair.shadow;
        if (config.hairStyle === 'long_smooth') {
          ctx.beginPath();
          ctx.ellipse(0, 26, 102, 138, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (config.hairStyle === 'wavy_bob') {
          ctx.beginPath();
          ctx.moveTo(-88, -10);
          ctx.quadraticCurveTo(-104, 72, -78, 118);
          ctx.quadraticCurveTo(-48, 128, -32, 92);
          ctx.lineTo(32, 92);
          ctx.quadraticCurveTo(48, 128, 78, 118);
          ctx.quadraticCurveTo(104, 72, 88, -10);
          ctx.arc(0, -18, 90, 0, Math.PI, true);
          ctx.fill();
        } else if (config.hairStyle === 'soft_bun') {
          ctx.beginPath();
          ctx.arc(0, -104, 36, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(0, -14, 84, 92, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (config.hairStyle === 'short_crop') {
          ctx.beginPath();
          ctx.ellipse(0, -24, 84, 86, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Ears
      ctx.fillStyle = skin.shadow;
      ctx.beginPath();
      ctx.ellipse(-74, 10, 12, 22, -0.1, 0, Math.PI * 2);
      ctx.ellipse(74, 10, 12, 22, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Face silhouette (natural oval-jaw proportion)
      const faceGrad = ctx.createRadialGradient(-16, -24, 16, 0, 6, 112);
      faceGrad.addColorStop(0, skin.highlight);
      faceGrad.addColorStop(0.65, skin.base);
      faceGrad.addColorStop(1, skin.shadow);
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.moveTo(0, -96);
      ctx.bezierCurveTo(58, -96, 76, -42, 74, 8);
      ctx.bezierCurveTo(72, 56, 42, 96, 0, 102);
      ctx.bezierCurveTo(-42, 96, -72, 56, -74, 8);
      ctx.bezierCurveTo(-76, -42, -58, -96, 0, -96);
      ctx.closePath();
      ctx.fill();

      // Soft cheek warmth
      ctx.fillStyle = skin.blush;
      ctx.beginPath();
      ctx.ellipse(-38, 22, 20, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(38, 22, 20, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Optional Beard (soft groomed shading)
      if (config.beard) {
        ctx.fillStyle = hair.shadow;
        ctx.globalAlpha = 0.38;
        ctx.beginPath();
        ctx.moveTo(-68, 16);
        ctx.quadraticCurveTo(-66, 78, 0, 103);
        ctx.quadraticCurveTo(66, 78, 68, 16);
        ctx.quadraticCurveTo(54, 48, 34, 52);
        ctx.quadraticCurveTo(0, 44, -34, 52);
        ctx.quadraticCurveTo(-54, 48, -68, 16);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Nose bridge & gentle tip shadow
      ctx.strokeStyle = skin.shadow;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-2, -16);
      ctx.quadraticCurveTo(4, 14, 2, 24);
      ctx.stroke();
      ctx.fillStyle = skin.shadow;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.ellipse(0, 27, 9, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Eyes (realistic almond contour, iris, pupil, catchlight, blinking)
      const drawEye = (ex: number) => {
        const ey = -10;
        const openHeight = Math.max(0.8, 8.5 * (1 - eyeClosure));

        // Sclera
        ctx.fillStyle = '#FAF8F5';
        ctx.beginPath();
        ctx.moveTo(ex - 16, ey);
        ctx.quadraticCurveTo(ex, ey - openHeight * 1.25, ex + 16, ey);
        ctx.quadraticCurveTo(ex, ey + openHeight * 1.15, ex - 16, ey);
        ctx.closePath();
        ctx.fill();

        if (eyeClosure < 0.85) {
          ctx.save();
          ctx.clip();

          // Iris
          ctx.fillStyle = eyeColor;
          ctx.beginPath();
          ctx.arc(ex, ey, 7.2, 0, Math.PI * 2);
          ctx.fill();

          // Pupil
          ctx.fillStyle = '#1A1715';
          ctx.beginPath();
          ctx.arc(ex, ey, 3.4, 0, Math.PI * 2);
          ctx.fill();

          // Daylight catchlight
          ctx.fillStyle = 'rgba(255,255,255,0.88)';
          ctx.beginPath();
          ctx.arc(ex - 2.2, ey - 2.3, 1.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }

        // Upper lash line
        ctx.strokeStyle = '#2B221D';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(ex - 16, ey + 0.5);
        ctx.quadraticCurveTo(ex, ey - openHeight * 1.28, ex + 16, ey + 0.5);
        ctx.stroke();

        // Eyebrow (slightly softer empathetic tilt)
        const browLift = isListening ? -2.2 : isSpeaking ? -1.4 * smoothMouth : 0;
        ctx.strokeStyle = hair.main;
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        const dir = ex < 0 ? -1 : 1;
        ctx.moveTo(ex - 17, ey - 16 + browLift);
        ctx.quadraticCurveTo(ex, ey - 22 + browLift, ex + 17 * dir * dir, ey - 15 + browLift);
        ctx.stroke();
      };

      drawEye(-30);
      drawEye(30);

      // Optional thin glasses
      if (config.glasses) {
        ctx.strokeStyle = '#4A433C';
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.roundRect(-52, -25, 44, 30, 11);
        ctx.roundRect(8, -25, 44, 30, 11);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-8, -12);
        ctx.quadraticCurveTo(0, -16, 8, -12);
        ctx.stroke();
      }

      // Mouth & Realistic Lip-Sync Articulation
      const mouthY = 53;
      const mouthOpenPx = smoothMouth * 15; // 0..15px jaw/lip opening
      const mouthHalfW = 21 - smoothWidth * 3.5;
      const gentleSmile = isSpeaking ? 1.5 : 3.2;

      if (mouthOpenPx > 1.2) {
        // Inner dark mouth cavity
        ctx.fillStyle = '#4A2022';
        ctx.beginPath();
        ctx.moveTo(-mouthHalfW, mouthY);
        ctx.quadraticCurveTo(0, mouthY - 3 - mouthOpenPx * 0.25, mouthHalfW, mouthY);
        ctx.quadraticCurveTo(0, mouthY + mouthOpenPx * 1.15 + 3, -mouthHalfW, mouthY);
        ctx.closePath();
        ctx.fill();

        // Subtle upper teeth hint when open
        if (mouthOpenPx > 4.5) {
          ctx.fillStyle = '#F7F3EE';
          ctx.beginPath();
          ctx.roundRect(-mouthHalfW * 0.55, mouthY - 1, mouthHalfW * 1.1, Math.min(4.2, mouthOpenPx * 0.35), 2);
          ctx.fill();
        }
      }

      // Upper lip (Cupid's bow)
      ctx.fillStyle = skin.lip;
      ctx.beginPath();
      ctx.moveTo(-mouthHalfW - 2, mouthY);
      ctx.quadraticCurveTo(-8, mouthY - 6.5, 0, mouthY - 4.2);
      ctx.quadraticCurveTo(8, mouthY - 6.5, mouthHalfW + 2, mouthY);
      ctx.quadraticCurveTo(0, mouthY + 1.5 - mouthOpenPx * 0.15, -mouthHalfW - 2, mouthY);
      ctx.closePath();
      ctx.fill();

      // Lower lip
      ctx.fillStyle = skin.lip;
      ctx.beginPath();
      ctx.moveTo(-mouthHalfW, mouthY + mouthOpenPx * 0.2);
      ctx.quadraticCurveTo(0, mouthY + mouthOpenPx * 1.0 + 1, mouthHalfW, mouthY + mouthOpenPx * 0.2);
      ctx.quadraticCurveTo(0, mouthY + mouthOpenPx * 1.05 + 8.5, -mouthHalfW, mouthY + mouthOpenPx * 0.2);
      ctx.closePath();
      ctx.fill();

      // Lip line when closed/relaxed
      if (mouthOpenPx <= 1.2) {
        ctx.strokeStyle = skin.lipDark;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-mouthHalfW, mouthY);
        ctx.quadraticCurveTo(0, mouthY + gentleSmile, mouthHalfW, mouthY);
        ctx.stroke();
      }

      // Front Hair Layer
      if (config.hairStyle !== 'bald') {
        const frontGrad = ctx.createLinearGradient(0, -110, 0, 10);
        frontGrad.addColorStop(0, hair.highlight);
        frontGrad.addColorStop(1, hair.main);
        ctx.fillStyle = frontGrad;

        if (config.hairStyle === 'wavy_bob' || config.hairStyle === 'long_smooth') {
          ctx.beginPath();
          ctx.moveTo(-82, -14);
          ctx.bezierCurveTo(-86, -86, -42, -110, 0, -108);
          ctx.bezierCurveTo(42, -110, 86, -86, 82, -14);
          ctx.bezierCurveTo(68, -56, 36, -68, 6, -66);
          ctx.bezierCurveTo(-24, -68, -66, -48, -82, -14);
          ctx.closePath();
          ctx.fill();
        } else if (config.hairStyle === 'short_crop') {
          ctx.beginPath();
          ctx.moveTo(-78, -22);
          ctx.bezierCurveTo(-80, -88, -36, -110, 0, -108);
          ctx.bezierCurveTo(36, -110, 80, -88, 78, -22);
          ctx.quadraticCurveTo(42, -74, 0, -68);
          ctx.quadraticCurveTo(-42, -74, -78, -22);
          ctx.closePath();
          ctx.fill();
        } else if (config.hairStyle === 'soft_bun') {
          ctx.beginPath();
          ctx.moveTo(-78, -16);
          ctx.bezierCurveTo(-78, -88, -36, -106, 0, -104);
          ctx.bezierCurveTo(36, -106, 78, -88, 78, -16);
          ctx.quadraticCurveTo(40, -68, 0, -72);
          ctx.quadraticCurveTo(-40, -68, -78, -16);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.restore(); // end head transform
      ctx.restore(); // end DPR scale

      if (isAnimated) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [config, isSpeaking, isListening, isThinking, speechEnergyRef]);

  if (config.renderMode === 'model_3d') {
    return (
      <ThreeAvatarCanvas
        config={config}
        modelUrl={config.customModelUrl || DEFAULT_GLB_MODEL_URL}
        isSpeaking={isSpeaking}
        isListening={isListening}
        isThinking={isThinking}
        speechEnergyRef={speechEnergyRef}
        className={className}
      />
    );
  }

  if (config.renderMode === 'static_photo') {
    if (config.customMediaUrl) {
      return (
        <div className={`relative overflow-hidden rounded-3xl bg-ania-surface-muted border border-ania-border ${className}`}>
          {config.customMediaKind === 'video' ? (
            <video
              src={config.customMediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={config.customMediaUrl}
              alt={`Avatar de ${config.displayName}`}
              className="w-full h-full object-cover"
            />
          )}
          {(isSpeaking || isListening) && (
            <div className="absolute bottom-3 left-3 right-3 bg-ania-surface/95 border border-ania-border rounded-xl px-3 py-1.5 text-center text-xs font-medium text-ania-accent-text">
              {isSpeaking ? 'Hablando con calma…' : 'Escuchándote con atención…'}
            </div>
          )}
        </div>
      );
    }

    const preset = STATIC_PHOTOS[config.staticPhotoPreset] ?? STATIC_PHOTOS.clara;
    return (
      <div className={`relative overflow-hidden rounded-3xl bg-ania-surface-muted border border-ania-border ${className}`}>
        <img
          src={preset.src}
          alt={preset.label}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        {(isSpeaking || isListening) && (
          <div className="absolute bottom-3 left-3 right-3 bg-ania-surface/95 border border-ania-border rounded-xl px-3 py-1.5 text-center text-xs font-medium text-ania-accent-text">
            {isSpeaking ? 'Hablando con calma…' : 'Escuchándote con atención…'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-ania-surface-muted border border-ania-border ${className}`}>
      <canvas
        ref={canvasRef}
        aria-label={`Avatar visual de ${config.displayName}`}
        className="w-full h-full object-cover block"
      />
      {(isSpeaking || isListening || isThinking) && (
        <div className="absolute bottom-3 left-3 right-3 bg-ania-surface/95 border border-ania-border rounded-xl px-3 py-1.5 text-center text-xs font-medium text-ania-accent-text">
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
