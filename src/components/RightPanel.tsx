import { BookOpen, Disc, MessageSquareHeart, PhoneCall, Wind } from 'lucide-react';
import { useState } from 'react';
import type { AppView } from '../shared/types';

interface RightPanelProps {
  currentMood: string | null;
  onSelectMood: (mood: string | null) => void;
  onQuickStartWithMood: (mood: string) => void;
  onNavigate: (view: AppView) => void;
  onOpenSafety: () => void;
  diaryCount: number;
}

const MOOD_OPTIONS = ['Tranquilo/a', 'Cansado/a', 'Ansioso/a', 'Triste', 'Enfadado/a'];

export function RightPanel({
  currentMood,
  onSelectMood,
  onQuickStartWithMood,
  onNavigate,
  onOpenSafety,
  diaryCount,
}: RightPanelProps) {
  const [skippedMood, setSkippedMood] = useState(false);

  return (
    <aside
      aria-label="Herramientas rápidas y apoyo"
      className="w-full xl:w-[320px] shrink-0 space-y-4"
    >
      {/* Card 1: ¿Cómo te sientes ahora? */}
      <section className="bg-ania-surface border border-ania-border rounded-2xl p-5 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-ania-ink">
              ¿Cómo te sientes ahora?
            </h2>
            <p className="text-xs text-ania-ink-subtle mt-0.5">
              Solo si te apetece. Puedes saltarlo.
            </p>
          </div>
          {skippedMood && (
            <button
              type="button"
              onClick={() => setSkippedMood(false)}
              className="text-xs text-ania-accent-text underline whitespace-nowrap shrink-0"
            >
              Mostrar
            </button>
          )}
        </div>

        {!skippedMood ? (
          <>
            <div className="flex flex-wrap gap-2 mt-4">
              {MOOD_OPTIONS.map((mood) => {
                const selected = currentMood === mood;
                return (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => onSelectMood(selected ? null : mood)}
                    className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                      selected
                        ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text'
                        : 'bg-ania-surface-muted border-ania-border text-ania-ink hover:bg-ania-surface-hover'
                    }`}
                  >
                    {mood}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  onSelectMood(null);
                  setSkippedMood(true);
                }}
                className="px-3.5 py-2 rounded-full text-xs font-medium bg-ania-surface border border-ania-border-strong text-ania-ink-muted hover:bg-ania-surface-soft transition-colors whitespace-nowrap"
              >
                Prefiero no decirlo
              </button>
            </div>

            {currentMood && (
              <div className="mt-3.5 pt-3 border-t border-ania-border-subtle flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onQuickStartWithMood(currentMood)}
                  className="text-xs font-medium text-ania-accent-text hover:underline text-left"
                >
                  Hablar de cómo me siento ({currentMood.toLowerCase()})
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('diario')}
                  className="text-xs text-ania-ink-subtle hover:text-ania-ink whitespace-nowrap shrink-0"
                >
                  Anotar en diario
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-ania-ink-subtle mt-3">
            De acuerdo, no hace falta ponerle nombre ahora.
          </p>
        )}
      </section>

      {/* Card 2: Para cuando lo necesites */}
      <section className="bg-ania-surface border border-ania-border rounded-2xl p-5 transition-colors">
        <h2 className="font-display text-base font-semibold text-ania-ink mb-3.5">
          Para cuando lo necesites
        </h2>
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => onNavigate('calmarme')}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-ania-accent-tint hover:bg-ania-accent-soft transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-ania-accent-soft text-ania-accent-text flex items-center justify-center shrink-0">
              <Wind className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-ania-ink">Respirar con calma</p>
              <p className="text-xs text-ania-ink-muted">2 minutos</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('calmarme')}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-ania-lavender-bg hover:opacity-90 transition-opacity text-left"
          >
            <div className="w-9 h-9 rounded-full bg-ania-surface/70 text-ania-lavender-accent flex items-center justify-center shrink-0">
              <Disc className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-ania-lavender-text">Volver al presente</p>
              <p className="text-xs text-ania-lavender-muted">Ejercicio 5-4-3-2-1</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('diario')}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-ania-user-bubble-soft hover:bg-ania-user-bubble transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-ania-user-bubble text-ania-user-bubble-text flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-ania-ink">Escribir en mi diario</p>
              <p className="text-xs text-ania-ink-muted">Sin prisa</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('mensaje')}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-ania-surface-soft hover:bg-ania-surface-hover transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-ania-surface-muted text-ania-ink-secondary flex items-center justify-center shrink-0">
              <MessageSquareHeart className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-ania-ink">El mensaje que no sé decir</p>
              <p className="text-xs text-ania-ink-muted">Preparar con calma</p>
            </div>
          </button>
        </div>
      </section>

      {/* Card 3: Tu semana, a tu ritmo */}
      <section className="bg-ania-lavender-bg border border-ania-lavender-border rounded-2xl p-5 transition-colors">
        <h2 className="font-display text-base font-semibold text-ania-lavender-text">
          Tu semana, a tu ritmo
        </h2>
        <p className="text-xs leading-relaxed text-ania-lavender-muted mt-1.5">
          Si algún día quieres mirar cómo ha ido, estará aquí. Sin números ni objetivos.
          {diaryCount > 0 ? ` (${diaryCount} registros guardados por ti).` : ''}
        </p>
        <button
          type="button"
          onClick={() => onNavigate('diario')}
          className="mt-3 text-xs font-semibold text-ania-lavender-accent underline underline-offset-2 hover:opacity-80"
        >
          Verla cuando me apetezca
        </button>
      </section>

      {/* Card 4: ¿Necesitas hablar con alguien ahora? */}
      <section className="bg-ania-safety-bg border border-ania-safety-border rounded-2xl p-5 transition-colors">
        <h2 className="font-display text-sm font-semibold text-ania-safety-text">
          ¿Necesitas hablar con alguien ahora?
        </h2>
        <p className="text-xs text-ania-safety-accent mt-1">
          Línea 024, atención las 24 horas, gratuita.
        </p>
        <button
          type="button"
          onClick={onOpenSafety}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-ania-surface border border-ania-safety-border text-ania-safety-text text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-ania-surface-soft transition-colors"
        >
          <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Ver líneas de ayuda</span>
        </button>
      </section>
    </aside>
  );
}
