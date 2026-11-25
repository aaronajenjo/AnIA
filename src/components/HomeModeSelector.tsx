import { MessageCircle, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useRef } from 'react';
import type { AvatarConfig } from '../shared/types';
import { RealisticAvatarCanvas } from './RealisticAvatarCanvas';

interface HomeModeSelectorProps {
  avatarConfig: AvatarConfig;
  messageCount: number;
  onSelectChat: () => void;
  onSelectAvatar: () => void;
  onOpenCustomizer: () => void;
}

export function HomeModeSelector({
  avatarConfig,
  messageCount,
  onSelectChat,
  onSelectAvatar,
  onOpenCustomizer,
}: HomeModeSelectorProps) {
  const idleEnergyRef = useRef(0);

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col justify-center">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ania-heading">
            ¿Cómo prefieres conversar hoy?
          </h2>
          <p className="text-sm text-ania-ink-muted leading-relaxed">
            Puedes expresarte por escrito en el chat o hablar cara a cara con un avatar personalizable. Ambos mantienen el mismo contexto de tu diario, notas para consulta y red de apoyo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {/* Option 1: Chat */}
          <div className="bg-ania-surface-soft border border-ania-border rounded-3xl p-6 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-ania-accent-soft text-ania-accent-text flex items-center justify-center">
                <MessageCircle className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-xl font-semibold text-ania-heading">
                Conversar por chat
              </h3>
              <p className="text-xs sm:text-sm text-ania-ink-secondary leading-relaxed">
                Un espacio escrito tranquilo, a tu ritmo. Ideal si prefieres leer con calma, usar respuestas rápidas, validar emociones orientativas o dictar por voz.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {messageCount > 1 && (
                <p className="text-[11px] text-ania-ink-subtle tabular-nums">
                  Conversación en curso · {messageCount} mensajes guardados
                </p>
              )}
              <button
                type="button"
                onClick={onSelectChat}
                className="w-full py-3 px-5 rounded-xl bg-ania-surface border border-ania-accent text-ania-accent-text text-sm font-semibold hover:bg-ania-accent-tint transition-colors"
              >
                Entrar por chat
              </button>
            </div>
          </div>

          {/* Option 2: Customizable AI Avatar */}
          <div className="bg-ania-accent-tint border border-ania-accent-border rounded-3xl p-6 flex flex-col justify-between gap-5">
            <div className="flex items-start gap-4">
              <RealisticAvatarCanvas
                config={avatarConfig}
                isSpeaking={false}
                isListening={false}
                isThinking={false}
                speechEnergyRef={idleEnergyRef}
                className="w-20 h-20 rounded-2xl shrink-0"
              />
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-ania-accent-text">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {avatarConfig.renderMode === 'model_3d'
                      ? `Avatar 3D · ${avatarConfig.customModelName || 'lmmfdolj.glb'}`
                      : avatarConfig.renderMode === 'animated_lipsync'
                        ? 'Realista con movimiento de labios'
                        : 'Modo estático'}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold text-ania-heading">
                  Hablar con {avatarConfig.displayName || 'Avatar IA'}
                </h3>
                <p className="text-xs sm:text-sm text-ania-ink-secondary leading-relaxed">
                  Conversa por voz o texto con una presencia visual que puedes adaptar a tu gusto (estática o con movimiento labial realista).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={onSelectAvatar}
                className="flex-1 py-3 px-5 rounded-xl bg-ania-accent text-ania-accent-on text-sm font-semibold hover:bg-ania-accent-hover transition-colors whitespace-nowrap"
              >
                Hablar con avatar
              </button>
              <button
                type="button"
                onClick={onOpenCustomizer}
                className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-ania-surface border border-ania-accent-border text-xs font-semibold text-ania-accent-text hover:bg-ania-accent-soft transition-colors whitespace-nowrap"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Personalizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
