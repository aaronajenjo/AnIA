import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Palette,
  Pause,
  Play,
  PlayCircle,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import aniaLogo from '../assets/images/logo.png';
import type { AppView, HomeConversationMode } from '../shared/types';

export interface DemoStepDefinition {
  id: string;
  sectionLabel: string;
  title: string;
  description: string;
  howItWorks: string;
  view: AppView;
  homeMode?: HomeConversationMode;
  optionalAction?: 'avatar_customizer' | 'theme_customizer' | 'privacy_modal';
  optionalActionLabel?: string;
}

export const DEMO_STEPS: DemoStepDefinition[] = [
  {
    id: 'inicio',
    sectionLabel: 'Inicio',
    title: 'Elige cómo prefieres expresarte hoy',
    description:
      'AnIA es un espacio de acompañamiento emocional para poner palabras a lo que sientes. No sustituye a un profesional ni realiza diagnósticos clínicos.',
    howItWorks:
      'Desde Inicio puedes elegir hablar por Chat escrito o con el Avatar IA. Ambos comparten exactamente la misma conversación y el contexto de tu espacio personal.',
    view: 'conversar',
    homeMode: 'choose',
  },
  {
    id: 'chat',
    sectionLabel: 'Chat escrito · Ejemplo en vivo',
    title: 'Mira cómo responde AnIA en el chat',
    description:
      'Acabamos de enviar un mensaje de ejemplo para que veas la respuesta real: lenguaje abierto y respetuoso, emociones sugeridas que puedes confirmar o cambiar y un resumen descriptivo.',
    howItWorks:
      'Puedes probar a pulsar las emociones sugeridas en pantalla o ver cómo un mensaje queda marcado como guardado para tus notas de consulta.',
    view: 'conversar',
    homeMode: 'chat',
  },
  {
    id: 'avatar',
    sectionLabel: 'Avatar IA · Mismo contexto',
    title: 'Continúa la charla cara a cara con tu Avatar IA',
    description:
      'Al cambiar al Avatar IA, la conversación continúa exactamente donde la dejaste y se añade un segundo intercambio en directo con el avatar 3D.',
    howItWorks:
      'Puedes hablar con el micrófono, escribir abajo o abrir Personalizar para elegir avatar 3D, retrato fotográfico o ilustrado y voz. En móvil aparece en formato llamada con el avatar siempre arriba.',
    view: 'conversar',
    homeMode: 'avatar',
    optionalAction: 'avatar_customizer',
    optionalActionLabel: 'Probar personalizador de avatar',
  },
  {
    id: 'diario',
    sectionLabel: 'Mi diario · Tendencias en vivo',
    title: 'Registros y observaciones puramente descriptivas',
    description:
      'Con los registros de ejemplo de esta semana, AnIA muestra tendencias descriptivas (como la relación entre descanso escaso y sobrecarga alta) sin notas ni diagnósticos clínicos.',
    howItWorks:
      'Tú decides siempre si esas observaciones te encajan, quieres matizarlas o prefieres descartarlas, y qué entradas autorizas para tu consulta.',
    view: 'diario',
  },
  {
    id: 'calmarme',
    sectionLabel: 'Calmarme',
    title: 'Pausas prácticas para momentos de sobrecarga',
    description:
      'Cuando no te apetece escribir, tienes ejercicios guiados de respiración pausada y anclaje sensorial (5-4-3-2-1) listos para usar al instante.',
    howItWorks:
      'Inicia la respiración visual o sigue el anclaje sensorial; al terminar puedes guardar con un clic lo que te ha servido en tu diario.',
    view: 'calmarme',
  },
  {
    id: 'mensaje',
    sectionLabel: 'Redactar mensaje · 3 propuestas en vivo',
    title: 'El mensaje que no sabes cómo decir',
    description:
      'A partir de la misma situación del chat, AnIA ha preparado 3 borradores distintos (Cercano, Sereno y Directo) para hablar con tu pareja sin tensión.',
    howItWorks:
      'Selecciona el tono que más encaje contigo, edítalo con tus propias palabras y aprueba el texto final antes de copiarlo o guardarlo.',
    view: 'mensaje',
  },
  {
    id: 'consulta',
    sectionLabel: 'Notas para mi terapia · Resumen en vivo',
    title: 'Llega a consulta con las ideas claras',
    description:
      'Aquí ves el resumen organizado con los fragmentos autorizados del chat y del diario, diferenciando claramente tus palabras literales de la organización de AnIA.',
    howItWorks:
      'No es un informe clínico: puedes editar, excluir o añadir puntos y copiarlo o descargarlo solo cuando tú decidas compartirlo.',
    view: 'consulta',
  },
  {
    id: 'apoyo-personalizacion',
    sectionLabel: 'Red de apoyo, temas y seguridad',
    title: 'Apoyo humano, personalización y control total',
    description:
      'Guarda tus personas de confianza (como en el ejemplo en pantalla) y ten siempre a mano el 024 y el 112. Si AnIA detecta riesgo o crisis, pausa el resto y prioriza ayuda humana.',
    howItWorks:
      'Puedes personalizar colores y modo oscuro en «Tema» o activar Lectura fácil en «Privacidad». Al finalizar la demo, todos estos datos de ejemplo desaparecen y tu espacio queda limpio.',
    view: 'apoyo',
    optionalAction: 'theme_customizer',
    optionalActionLabel: 'Ver temas y colores',
  },
];

interface DemoTutorialOverlayProps {
  mode: 'idle' | 'prompt' | 'tour';
  stepIndex: number;
  autoPlay: boolean;
  liveStatus: string | null;
  onStartDemo: (startAutoPlay?: boolean) => void;
  onSkipDemo: () => void;
  onToggleAutoPlay: () => void;
  onStepChange: (nextIndex: number) => void;
  onFinishDemo: () => void;
  onTriggerOptionalAction: (
    action: 'avatar_customizer' | 'theme_customizer' | 'privacy_modal'
  ) => void;
}

export function DemoTutorialOverlay({
  mode,
  stepIndex,
  autoPlay,
  liveStatus,
  onStartDemo,
  onSkipDemo,
  onToggleAutoPlay,
  onStepChange,
  onFinishDemo,
  onTriggerOptionalAction,
}: DemoTutorialOverlayProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (mode !== 'tour') {
      setCollapsed(false);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'idle') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode === 'prompt') onSkipDemo();
        else onFinishDemo();
        return;
      }
      if (mode !== 'tour') return;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (isTyping) return;

      if (e.key === 'ArrowRight' && stepIndex < DEMO_STEPS.length - 1) {
        onStepChange(stepIndex + 1);
      } else if (e.key === 'ArrowLeft' && stepIndex > 0) {
        onStepChange(stepIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, stepIndex, onSkipDemo, onFinishDemo, onStepChange]);

  if (mode === 'idle') return null;

  if (mode === 'prompt') {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ania-demo-prompt-title"
      >
        <div className="bg-ania-surface border border-ania-border rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={aniaLogo}
                alt="Logo de AnIA"
                className="w-12 h-12 object-contain shrink-0"
              />
              <div>
                <p className="text-xs font-medium text-ania-accent-text">
                  Bienvenida a AnIA · Recorrido interactivo
                </p>
                <h2
                  id="ania-demo-prompt-title"
                  className="font-display text-xl sm:text-2xl font-semibold text-ania-heading mt-0.5 text-balance"
                >
                  ¿Quieres hacer una demo guiada de la aplicación?
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onSkipDemo}
              className="p-2 rounded-xl text-ania-ink-muted hover:bg-ania-surface-soft hover:text-ania-ink transition-colors shrink-0"
              aria-label="Cerrar bienvenida"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-ania-ink-secondary leading-relaxed">
            La demo enviará mensajes de ejemplo en directo y te mostrará las respuestas repartidas
            por toda la app: Chat, Avatar IA 3D, Mi diario con tendencias, Redactar mensaje, Notas
            para consulta y Red de apoyo.
          </p>

          <div className="border-t border-b border-ania-border-subtle py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-ania-ink-secondary">
            <div>
              <p className="font-semibold text-ania-heading">Ejemplos en vivo del tirón</p>
              <p className="text-ania-ink-muted mt-0.5 leading-relaxed">
                Puedes avanzar a tu ritmo o pulsar «Ver del tirón» para verlo todo seguido automáticamente.
              </p>
            </div>
            <div>
              <p className="font-semibold text-ania-heading">Espacio limpio al terminar</p>
              <p className="text-ania-ink-muted mt-0.5 leading-relaxed">
                Los datos de ejemplo son temporales: al cerrar la demo tu espacio personal queda intacto.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <button
              type="button"
              onClick={onSkipDemo}
              className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-ania-ink-muted hover:text-ania-ink transition-colors whitespace-nowrap"
            >
              Ahora no, entrar directo
            </button>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={() => onStartDemo(false)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-ania-border-strong bg-ania-surface text-xs font-semibold text-ania-ink hover:bg-ania-surface-soft transition-colors whitespace-nowrap"
              >
                <span>Paso a paso</span>
              </button>
              <button
                type="button"
                onClick={() => onStartDemo(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-semibold hover:bg-ania-accent-hover transition-colors whitespace-nowrap"
              >
                <PlayCircle className="w-4 h-4" aria-hidden="true" />
                <span>Ver demo del tirón</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const step = DEMO_STEPS[stepIndex] ?? DEMO_STEPS[0];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === DEMO_STEPS.length - 1;
  const progressPercent = ((stepIndex + 1) / DEMO_STEPS.length) * 100;

  return (
    <aside
      aria-label="Demo guiada de AnIA"
      className="fixed bottom-3 left-3 right-3 sm:bottom-5 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 sm:w-[min(700px,calc(100vw-2rem))]"
    >
      <div className="bg-ania-surface border border-ania-accent-border rounded-2xl shadow-xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-ania-surface-muted w-full">
          <div
            className="h-full bg-ania-accent transition-transform duration-200 origin-left"
            style={{ transform: `scaleX(${progressPercent / 100})` }}
          />
        </div>

        {/* Top Row: Step info & Controls */}
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 border-b border-ania-border-subtle">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={aniaLogo}
              alt=""
              aria-hidden="true"
              className="w-6 h-6 object-contain shrink-0"
            />
            <div className="text-xs text-ania-ink-muted truncate tabular-nums">
              <span className="font-semibold text-ania-accent-text">
                Paso {stepIndex + 1} de {DEMO_STEPS.length}
              </span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span className="text-ania-ink-secondary font-medium">{step.sectionLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isLast && (
              <button
                type="button"
                onClick={onToggleAutoPlay}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  autoPlay
                    ? 'bg-ania-accent-soft text-ania-accent-text'
                    : 'text-ania-ink-muted hover:bg-ania-surface-soft hover:text-ania-ink'
                }`}
                title={autoPlay ? 'Pausar reproducción automática' : 'Reproducir todos los pasos del tirón'}
              >
                {autoPlay ? (
                  <>
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Ver del tirón</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ania-ink-muted hover:bg-ania-surface-soft hover:text-ania-ink transition-colors whitespace-nowrap"
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Expandir</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Ver pantalla</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onFinishDemo}
              className="p-1.5 rounded-lg text-ania-ink-muted hover:bg-ania-surface-soft hover:text-ania-ink transition-colors"
              aria-label="Cerrar demo guiada"
              title="Salir de la demo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!collapsed && (
          <div className="px-4 sm:px-5 py-3.5 space-y-2.5 max-h-[38vh] overflow-y-auto">
            {liveStatus && (
              <p className="text-xs font-medium text-ania-accent-text">
                {liveStatus}
              </p>
            )}

            <div>
              <h3 className="font-display text-base sm:text-lg font-semibold text-ania-heading">
                {step.title}
              </h3>
              <p className="text-sm text-ania-ink-secondary leading-relaxed mt-1">
                {step.description}
              </p>
            </div>

            <div className="bg-ania-surface-soft border border-ania-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-ania-ink-secondary leading-relaxed">
              <span className="font-semibold text-ania-heading">Cómo funciona: </span>
              {step.howItWorks}
            </div>

            {step.optionalAction && step.optionalActionLabel && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => onTriggerOptionalAction(step.optionalAction!)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ania-accent-soft text-ania-accent-text text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  {step.optionalAction === 'theme_customizer' ? (
                    <Palette className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{step.optionalActionLabel}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="px-4 sm:px-5 py-3 bg-ania-surface-soft/70 border-t border-ania-border-subtle flex flex-wrap items-center justify-between gap-3">
          {/* Quick step selector */}
          <div className="hidden sm:flex items-center gap-1.5" aria-label="Pasos de la demo">
            {DEMO_STEPS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onStepChange(idx)}
                title={`${idx + 1}. ${item.sectionLabel}`}
                aria-label={`Ir al paso ${idx + 1}: ${item.sectionLabel}`}
                aria-current={idx === stepIndex ? 'step' : undefined}
                className={`h-2 rounded-full transition-all ${
                  idx === stepIndex
                    ? 'w-6 bg-ania-accent'
                    : idx < stepIndex
                      ? 'w-2 bg-ania-accent/45 hover:bg-ania-accent/70'
                      : 'w-2 bg-ania-border-strong hover:bg-ania-ink-faint'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onFinishDemo}
              className="px-3 py-2 rounded-xl text-xs font-medium text-ania-ink-muted hover:text-ania-ink transition-colors whitespace-nowrap"
            >
              Salir de la demo
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onStepChange(Math.max(0, stepIndex - 1))}
                disabled={isFirst}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-ania-border-strong bg-ania-surface text-xs font-medium text-ania-ink hover:bg-ania-surface-hover disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Anterior</span>
              </button>

              {isLast ? (
                <button
                  type="button"
                  onClick={onFinishDemo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-semibold hover:bg-ania-accent-hover transition-colors whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Finalizar y empezar limpio</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onStepChange(Math.min(DEMO_STEPS.length - 1, stepIndex + 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-semibold hover:bg-ania-accent-hover transition-colors whitespace-nowrap"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
