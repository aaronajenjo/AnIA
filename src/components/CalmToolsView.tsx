import { CheckCircle2, Disc, Pause, Play, RotateCcw, Wind } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DiaryEntry } from '../shared/types';

interface CalmToolsViewProps {
  onLogHelpfulTool: (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => void;
}

const GROUNDING_STEPS = [
  { count: 5, sense: 'cosas que puedes ver a tu alrededor', placeholder: 'Ej. la luz de la ventana, una taza, una planta...' },
  { count: 4, sense: 'cosas que puedes tocar ahora', placeholder: 'Ej. la tela de tu ropa, la mesa, tus manos...' },
  { count: 3, sense: 'sonidos que puedes escuchar', placeholder: 'Ej. un reloj, el viento, pasos lejanos...' },
  { count: 2, sense: 'olores que percibes o recuerdas', placeholder: 'Ej. café, aire fresco, jabón...' },
  { count: 1, sense: 'respiración profunda o sensación agradable', placeholder: 'Ej. notar cómo entra el aire despacio...' },
];

export function CalmToolsView({ onLogHelpfulTool }: CalmToolsViewProps) {
  // Breathing 4-4-6 timer (2 minutes = 120s)
  const [breathingActive, setBreathingActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [groundingNotes, setGroundingNotes] = useState<string[]>(['', '', '', '', '']);
  const [loggedNote, setLoggedNote] = useState<string | null>(null);

  useEffect(() => {
    if (!breathingActive) return;
    if (secondsLeft <= 0) {
      setBreathingActive(false);
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [breathingActive, secondsLeft]);

  const elapsed = 120 - secondsLeft;
  const cycleSec = elapsed % 14;
  const phase =
    !breathingActive && secondsLeft === 120
      ? 'Listo cuando quieras'
      : secondsLeft === 0
        ? 'Completado'
        : cycleSec < 4
          ? 'Inhala despacio (4s)'
          : cycleSec < 8
            ? 'Sostén suave (4s)'
            : 'Suelta el aire largo (6s)';

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const saveHelpfulToDiary = (toolName: string) => {
    onLogHelpfulTool({
      emotions: ['Calma'],
      intensity: 2,
      overloadLevel: 'baja',
      restQuality: 'irregular',
      associatedSituations: 'Pausa de regulación',
      helpfulElements: toolName,
      approvedForConsulta: true,
    });
    setLoggedNote(`Anotado en Mi diario: "${toolName}"`);
    setTimeout(() => setLoggedNote(null), 3500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
      {loggedNote && (
        <div className="bg-ania-accent-soft border border-ania-accent-border rounded-xl px-4 py-2.5 text-xs font-medium text-ania-accent-text flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{loggedNote}</span>
        </div>
      )}

      {/* Tool 1: Respirar con calma (2 minutos) */}
      <section className="bg-ania-accent-tint border border-ania-accent-border rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ania-surface text-ania-accent-text flex items-center justify-center shrink-0">
              <Wind className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-ania-heading">
                Respirar con calma · 2 minutos
              </h2>
              <p className="text-xs text-ania-ink-muted">
                Ritmo suave 4-4-6. Puedes pausar o parar en cualquier momento.
              </p>
            </div>
          </div>
          <span className="text-lg font-semibold text-ania-accent-text tabular-nums">{formattedTime}</span>
        </div>

        <div className="flex flex-col items-center justify-center py-4 gap-4">
          <div
            className={`w-36 h-36 rounded-full flex items-center justify-center text-center px-4 transition-transform duration-1000 border-2 ${
              cycleSec < 4 && breathingActive
                ? 'scale-110 bg-ania-accent-soft border-ania-accent'
                : cycleSec >= 8 && breathingActive
                  ? 'scale-95 bg-ania-surface border-ania-accent-border'
                  : 'scale-100 bg-ania-accent-soft border-ania-accent-border'
            }`}
          >
            <span className="text-xs font-semibold text-ania-heading">{phase}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setBreathingActive((a) => !a)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-semibold hover:bg-ania-accent-hover"
            >
              {breathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{breathingActive ? 'Pausar' : secondsLeft === 0 ? 'Repetir' : 'Empezar'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBreathingActive(false);
                setSecondsLeft(120);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-ania-surface border border-ania-accent-border text-xs font-medium text-ania-accent-text"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
            <button
              type="button"
              onClick={() => saveHelpfulToDiary('Respirar con calma (2 minutos)')}
              className="px-4 py-2.5 rounded-xl bg-ania-surface border border-ania-accent-border text-xs font-medium text-ania-accent-text hover:bg-ania-accent-soft"
            >
              Me ayudó · Guardar en diario
            </button>
          </div>
        </div>
      </section>

      {/* Tool 2: Volver al presente (5-4-3-2-1) */}
      <section className="bg-ania-surface border border-ania-border rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ania-lavender-bg text-ania-lavender-accent flex items-center justify-center shrink-0">
              <Disc className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-ania-ink">
                Volver al presente · Ejercicio 5-4-3-2-1
              </h2>
              <p className="text-xs text-ania-ink-subtle">
                Conecta despacio con tus sentidos aquí y ahora. No es obligatorio rellenar todos los campos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => saveHelpfulToDiary('Ejercicio 5-4-3-2-1 para volver al presente')}
            className="px-3.5 py-2 rounded-xl bg-ania-lavender-bg text-xs font-semibold text-ania-lavender-accent hover:opacity-90"
          >
            Me ayudó · Guardar en diario
          </button>
        </div>

        <div className="space-y-3">
          {GROUNDING_STEPS.map((step, i) => (
            <div
              key={step.count}
              className="bg-ania-surface-soft border border-ania-border rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex items-center gap-2.5 sm:w-64 shrink-0">
                <span className="w-7 h-7 rounded-full bg-ania-lavender-bg text-ania-lavender-accent text-xs font-bold flex items-center justify-center tabular-nums shrink-0">
                  {step.count}
                </span>
                <span className="text-xs font-medium text-ania-ink">{step.sense}</span>
              </div>
              <input
                type="text"
                value={groundingNotes[i]}
                onChange={(e) =>
                  setGroundingNotes((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                }
                placeholder={step.placeholder}
                className="flex-1 bg-ania-surface border border-ania-border-strong rounded-lg px-3 py-2 text-xs text-ania-ink placeholder:text-ania-ink-faint"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
