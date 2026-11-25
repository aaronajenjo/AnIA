import { Check, Upload, Volume2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type {
  AvatarBackground,
  AvatarConfig,
  AvatarEyeColor,
  AvatarHairColor,
  AvatarHairStyle,
  AvatarOutfitColor,
  AvatarRenderMode,
  AvatarSkinTone,
  AvatarVoiceName,
  StaticPhotoPreset,
} from '../shared/types';
import { DEFAULT_GLB_MODEL_URL } from '../store/useAniaStore';
import { RealisticAvatarCanvas } from './RealisticAvatarCanvas';

interface AvatarCustomizerModalProps {
  open: boolean;
  config: AvatarConfig;
  onChange: (next: AvatarConfig) => void;
  onClose: () => void;
}

const RENDER_MODES: Array<{ id: AvatarRenderMode; title: string; desc: string }> = [
  {
    id: 'model_3d',
    title: 'Avatar 3D · Tu modelo (.glb)',
    desc: 'Renderiza tu modelo 3D interactivo con iluminación cálida y movimiento opcional al hablar.',
  },
  {
    id: 'animated_lipsync',
    title: 'Realista con movimiento de labios',
    desc: 'Articulación labial sincronizada con la voz, parpadeo y gestos suaves.',
  },
  {
    id: 'static_photo',
    title: 'Estático · Retrato fotográfico o vídeo',
    desc: 'Retrato realista o clip subido por ti, sin movimiento facial generado.',
  },
  {
    id: 'static_custom',
    title: 'Estático · Avatar personalizado',
    desc: 'Tu diseño personalizado completamente quieto, sin animación facial.',
  },
];

const PHOTO_PRESETS: Array<{ id: StaticPhotoPreset; label: string; src: string }> = [
  { id: 'clara', label: 'Clara', src: '/src/assets/images/avatar_clara_1794846993145.jpg' },
  { id: 'mateo', label: 'Mateo', src: '/src/assets/images/avatar_mateo_1794846992796.jpg' },
  { id: 'nora', label: 'Nora', src: '/src/assets/images/avatar_nora_1794846993034.jpg' },
];

const SKIN_TONES: Array<{ id: AvatarSkinTone; label: string; hex: string }> = [
  { id: 'porcelain', label: 'Muy claro', hex: '#F6DDD0' },
  { id: 'warm_light', label: 'Claro cálido', hex: '#ECC6AD' },
  { id: 'olive', label: 'Medio oliva', hex: '#D9AE88' },
  { id: 'caramel', label: 'Canela', hex: '#B7815A' },
  { id: 'deep', label: 'Oscuro', hex: '#7D5138' },
];

const HAIR_STYLES: Array<{ id: AvatarHairStyle; label: string }> = [
  { id: 'wavy_bob', label: 'Media melena' },
  { id: 'short_crop', label: 'Corto natural' },
  { id: 'soft_bun', label: 'Recogido suave' },
  { id: 'long_smooth', label: 'Largo' },
  { id: 'bald', label: 'Sin cabello' },
];

const HAIR_COLORS: Array<{ id: AvatarHairColor; label: string; hex: string }> = [
  { id: 'espresso', label: 'Negro', hex: '#2A201B' },
  { id: 'chestnut', label: 'Castaño', hex: '#5E3D2B' },
  { id: 'auburn', label: 'Cobrizo', hex: '#8A3E29' },
  { id: 'sand_blonde', label: 'Rubio arena', hex: '#C4A06C' },
  { id: 'silver', label: 'Plata', hex: '#A8ADB0' },
];

const EYE_COLORS: Array<{ id: AvatarEyeColor; label: string; hex: string }> = [
  { id: 'hazel', label: 'Avellana', hex: '#6E5534' },
  { id: 'sage', label: 'Verde', hex: '#4F705B' },
  { id: 'ocean', label: 'Azul', hex: '#446A85' },
  { id: 'dark_brown', label: 'Oscuros', hex: '#3B281E' },
];

const OUTFITS: Array<{ id: AvatarOutfitColor; label: string; hex: string }> = [
  { id: 'sage', label: 'Salvia', hex: '#7E9F8B' },
  { id: 'oatmeal', label: 'Avena', hex: '#D4C7B4' },
  { id: 'lavender', label: 'Lavanda', hex: '#9D93C4' },
  { id: 'terracotta', label: 'Terracota', hex: '#C27E66' },
  { id: 'navy', label: 'Marino', hex: '#41556B' },
];

const BACKGROUNDS: Array<{ id: AvatarBackground; label: string; hex: string }> = [
  { id: 'window_light', label: 'Luz de mañana', hex: '#F5EFE6' },
  { id: 'sage_studio', label: 'Salvia suave', hex: '#E9F2EC' },
  { id: 'warm_dusk', label: 'Tarde cálida', hex: '#F8ECE3' },
  { id: 'evening_calm', label: 'Sereno lavanda', hex: '#E7E4F3' },
];

const VOICES: Array<{ id: AvatarVoiceName; label: string }> = [
  { id: 'Kore', label: 'Cálida y pausada' },
  { id: 'Zephyr', label: 'Serena y clara' },
  { id: 'Puck', label: 'Ligera y amable' },
  { id: 'Charon', label: 'Grave y tranquila' },
];

export function AvatarCustomizerModal({
  open,
  config,
  onChange,
  onClose,
}: AvatarCustomizerModalProps) {
  const [previewSpeaking, setPreviewSpeaking] = useState(false);
  const previewEnergyRef = useRef(0);

  if (!open) return null;

  const update = (patch: Partial<AvatarConfig>) => onChange({ ...config, ...patch });

  const testPreview = () => {
    setPreviewSpeaking(true);
    const interval = setInterval(() => {
      previewEnergyRef.current = 0.25 + Math.random() * 0.65;
    }, 85);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        `Hola, soy ${config.displayName || 'AnIA'}. Estoy aquí para acompañarte a tu ritmo.`
      );
      u.lang = 'es-ES';
      u.rate = config.voiceRate === 'slow' ? 0.85 : config.voiceRate === 'brisk' ? 1.08 : 0.96;
      u.onend = () => {
        clearInterval(interval);
        previewEnergyRef.current = 0;
        setPreviewSpeaking(false);
      };
      u.onerror = () => {
        clearInterval(interval);
        previewEnergyRef.current = 0;
        setPreviewSpeaking(false);
      };
      window.speechSynthesis.speak(u);
    } else {
      setTimeout(() => {
        clearInterval(interval);
        previewEnergyRef.current = 0;
        setPreviewSpeaking(false);
      }, 2800);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-customizer-title"
    >
      <div className="bg-ania-surface border border-ania-border rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-ania-border flex items-center justify-between gap-3">
          <div>
            <h2
              id="avatar-customizer-title"
              className="font-display text-lg font-semibold text-ania-heading"
            >
              Personalizar tu Avatar IA
            </h2>
            <p className="text-xs text-ania-ink-subtle">
              Elige si prefieres una presencia estática o realista con movimiento de labios, y adapta su aspecto y voz.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-ania-surface-soft text-ania-ink-muted"
            aria-label="Cerrar personalización"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Live Preview Column */}
          <div className="md:col-span-5 flex flex-col items-center gap-3">
            <RealisticAvatarCanvas
              config={config}
              isSpeaking={previewSpeaking}
              isListening={false}
              isThinking={false}
              speechEnergyRef={previewEnergyRef}
              className="w-full max-w-[290px] aspect-square"
            />
            <button
              type="button"
              onClick={testPreview}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-ania-accent-border bg-ania-accent-tint text-xs font-semibold text-ania-accent-text hover:bg-ania-accent-soft"
            >
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{previewSpeaking ? 'Hablando…' : 'Probar voz y gesto'}</span>
            </button>
            <p className="text-[11px] text-center text-ania-ink-faint px-3 leading-relaxed">
              Este avatar es una interfaz visual de acompañamiento; recuerda que no sustituye a un profesional.
            </p>
          </div>

          {/* Controls Column */}
          <div className="md:col-span-7 space-y-5 text-xs">
            {/* Render Mode */}
            <div className="space-y-2">
              <p className="font-semibold text-ania-ink">1. Tipo de avatar</p>
              <div className="space-y-2">
                {RENDER_MODES.map((m) => {
                  const active = config.renderMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => update({ renderMode: m.id })}
                      className={`w-full text-left p-3 rounded-xl border transition-colors flex items-start justify-between gap-2 ${
                        active
                          ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text'
                          : 'bg-ania-surface-soft border-ania-border text-ania-ink hover:bg-ania-surface-hover'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{m.title}</p>
                        <p className="text-[11px] text-ania-ink-muted mt-0.5">{m.desc}</p>
                      </div>
                      {active && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-ania-ink">2. Nombre visible</label>
              <input
                type="text"
                value={config.displayName}
                onChange={(e) => update({ displayName: e.target.value })}
                placeholder="Ej. AnIA, Clara, Mateo..."
                maxLength={24}
                className="w-full px-3.5 py-2 bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
              />
            </div>

            {/* Mode-specific appearance controls */}
            {config.renderMode === 'model_3d' ? (
              <div className="space-y-4">
                <p className="font-semibold text-ania-ink">3. Opciones del modelo 3D</p>

                <div className="bg-ania-surface-soft border border-ania-border rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ania-heading">
                        Archivo activo: {config.customModelName || 'lmmfdolj.glb'}
                      </p>
                      <p className="text-[11px] text-ania-ink-subtle">
                        Puedes girar suavemente el modelo arrastrando sobre la vista previa.
                      </p>
                    </div>
                    {config.customModelUrl !== DEFAULT_GLB_MODEL_URL && (
                      <button
                        type="button"
                        onClick={() =>
                          update({
                            customModelUrl: DEFAULT_GLB_MODEL_URL,
                            customModelName: 'lmmfdolj.glb',
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-ania-surface border border-ania-border-strong text-[11px] font-medium text-ania-ink"
                      >
                        Usar lmmfdolj.glb
                      </button>
                    )}
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ania-surface border border-ania-accent-border text-xs font-medium text-ania-accent-text hover:bg-ania-accent-tint cursor-pointer">
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Cargar otro archivo .glb / .gltf</span>
                    <input
                      type="file"
                      accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = URL.createObjectURL(file);
                        update({
                          renderMode: 'model_3d',
                          customModelUrl: url,
                          customModelName: file.name,
                          model3dInitialized: true,
                        });
                      }}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-24 text-ania-ink-muted">Movimiento</span>
                  <button
                    type="button"
                    onClick={() => update({ animate3d: true })}
                    className={`px-3 py-1.5 rounded-lg border ${
                      config.animate3d !== false
                        ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text font-medium'
                        : 'bg-ania-surface-soft border-ania-border text-ania-ink-secondary'
                    }`}
                  >
                    Presencia viva al hablar
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ animate3d: false })}
                    className={`px-3 py-1.5 rounded-lg border ${
                      config.animate3d === false
                        ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text font-medium'
                        : 'bg-ania-surface-soft border-ania-border text-ania-ink-secondary'
                    }`}
                  >
                    Quieto (estático)
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-24 text-ania-ink-muted">Ambiente</span>
                  {BACKGROUNDS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => update({ background: b.id })}
                      className={`px-2.5 py-1 rounded-lg border ${
                        config.background === b.id
                          ? 'border-ania-accent font-medium text-[#1E4D3B]'
                          : 'border-ania-border-strong text-[#333A36]'
                      }`}
                      style={{ backgroundColor: b.hex }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : config.renderMode === 'static_photo' ? (
              <div className="space-y-3">
                <p className="font-semibold text-ania-ink">3. Retrato fotográfico o archivo propio</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {PHOTO_PRESETS.map((p) => {
                    const selected = !config.customMediaUrl && config.staticPhotoPreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          update({
                            customMediaUrl: undefined,
                            customMediaKind: undefined,
                            staticPhotoPreset: p.id,
                            displayName:
                              config.displayName === 'AnIA' ||
                              ['Clara', 'Mateo', 'Nora'].includes(config.displayName)
                                ? p.label
                                : config.displayName,
                          })
                        }
                        className={`rounded-2xl overflow-hidden border-2 transition-colors text-left ${
                          selected ? 'border-ania-accent' : 'border-transparent hover:border-ania-border-strong'
                        }`}
                      >
                        <img
                          src={p.src}
                          alt={p.label}
                          referrerPolicy="no-referrer"
                          className="w-full aspect-square object-cover"
                        />
                        <p className="py-1.5 px-2 text-center font-medium bg-ania-surface-soft text-ania-ink">
                          {p.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ania-surface-soft border border-ania-border-strong text-xs font-medium text-ania-ink hover:bg-ania-surface-hover cursor-pointer">
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Subir imagen o vídeo (.jpg, .png, .mp4, .webm)</span>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const isVideo = file.type.startsWith('video/');
                        const url = URL.createObjectURL(file);
                        update({
                          customMediaUrl: url,
                          customMediaKind: isVideo ? 'video' : 'image',
                        });
                      }}
                    />
                  </label>
                  {config.customMediaUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        update({ customMediaUrl: undefined, customMediaKind: undefined })
                      }
                      className="px-2.5 py-1.5 rounded-lg text-[11px] text-ania-safety-accent hover:bg-ania-safety-bg"
                    >
                      Quitar archivo subido
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="font-semibold text-ania-ink">3. Rasgos y estilo del avatar</p>

                {/* Skin tone */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-24 text-ania-ink-muted">Tono de piel</span>
                  {SKIN_TONES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => update({ skinTone: s.id })}
                      title={s.label}
                      aria-label={`Tono ${s.label}`}
                      className={`w-7 h-7 rounded-full border-2 ${
                        config.skinTone === s.id ? 'border-ania-accent scale-110' : 'border-ania-border-strong'
                      }`}
                      style={{ backgroundColor: s.hex }}
                    />
                  ))}
                </div>

                {/* Hair style */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="w-24 text-ania-ink-muted">Cabello</span>
                  {HAIR_STYLES.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => update({ hairStyle: h.id })}
                      className={`px-2.5 py-1 rounded-lg border ${
                        config.hairStyle === h.id
                          ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text font-medium'
                          : 'bg-ania-surface-soft border-ania-border text-ania-ink-secondary'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>

                {/* Hair color */}
                {config.hairStyle !== 'bald' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-24 text-ania-ink-muted">Color pelo</span>
                    {HAIR_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => update({ hairColor: c.id })}
                        title={c.label}
                        aria-label={`Cabello ${c.label}`}
                        className={`w-6 h-6 rounded-full border-2 ${
                          config.hairColor === c.id ? 'border-ania-accent scale-110' : 'border-ania-border-strong'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                )}

                {/* Eye color */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-24 text-ania-ink-muted">Ojos</span>
                  {EYE_COLORS.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => update({ eyeColor: e.id })}
                      title={e.label}
                      aria-label={`Ojos ${e.label}`}
                      className={`w-6 h-6 rounded-full border-2 ${
                        config.eyeColor === e.id ? 'border-ania-accent scale-110' : 'border-ania-border-strong'
                      }`}
                      style={{ backgroundColor: e.hex }}
                    />
                  ))}
                </div>

                {/* Accessories */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-24 text-ania-ink-muted">Rasgos</span>
                  <button
                    type="button"
                    onClick={() => update({ glasses: !config.glasses })}
                    className={`px-3 py-1 rounded-lg border ${
                      config.glasses
                        ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text font-medium'
                        : 'bg-ania-surface-soft border-ania-border text-ania-ink-secondary'
                    }`}
                  >
                    {config.glasses ? 'Con gafas' : 'Sin gafas'}
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ beard: !config.beard })}
                    className={`px-3 py-1 rounded-lg border ${
                      config.beard
                        ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text font-medium'
                        : 'bg-ania-surface-soft border-ania-border text-ania-ink-secondary'
                    }`}
                  >
                    {config.beard ? 'Con barba suave' : 'Sin barba'}
                  </button>
                </div>

                {/* Outfit & Background */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-24 text-ania-ink-muted">Ropa</span>
                  {OUTFITS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => update({ outfitColor: o.id })}
                      title={o.label}
                      aria-label={`Ropa ${o.label}`}
                      className={`w-6 h-6 rounded-full border-2 ${
                        config.outfitColor === o.id ? 'border-ania-accent scale-110' : 'border-ania-border-strong'
                      }`}
                      style={{ backgroundColor: o.hex }}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-24 text-ania-ink-muted">Ambiente</span>
                  {BACKGROUNDS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => update({ background: b.id })}
                      className={`px-2.5 py-1 rounded-lg border ${
                        config.background === b.id
                          ? 'border-ania-accent font-medium text-[#1E4D3B]'
                          : 'border-ania-border-strong text-[#333A36]'
                      }`}
                      style={{ backgroundColor: b.hex }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Settings */}
            <div className="space-y-2.5 border-t border-ania-border pt-4">
              <p className="font-semibold text-ania-ink">4. Voz y ritmo al hablar</p>
              <div className="grid grid-cols-2 gap-2">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => update({ voiceName: v.id })}
                    className={`px-3 py-2 rounded-xl border text-left ${
                      config.voiceName === v.id
                        ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text font-medium'
                        : 'bg-ania-surface-soft border-ania-border text-ania-ink-secondary'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-ania-ink-muted">Ritmo:</span>
                  {(['slow', 'normal', 'brisk'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => update({ voiceRate: r })}
                      className={`px-2.5 py-1 rounded-lg border ${
                        config.voiceRate === r
                          ? 'bg-ania-accent border-ania-accent text-ania-accent-on'
                          : 'bg-ania-surface border-ania-border-strong text-ania-ink-secondary'
                      }`}
                    >
                      {r === 'slow' ? 'Pausado' : r === 'normal' ? 'Natural' : 'Ágil'}
                    </button>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer text-ania-ink">
                  <input
                    type="checkbox"
                    checked={config.autoSpeak}
                    onChange={(e) => update({ autoSpeak: e.target.checked })}
                    className="accent-ania-accent"
                  />
                  <span>Hablar en voz alta automáticamente</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-ania-border bg-ania-surface-soft flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-semibold hover:bg-ania-accent-hover"
          >
            Guardar configuración del avatar
          </button>
        </div>
      </div>
    </div>
  );
}
