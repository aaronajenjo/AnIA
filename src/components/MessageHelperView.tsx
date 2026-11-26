import { Bookmark, Check, Compass, Copy, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { postAniaJson } from '../shared/api';
import type { DemoMessagePreview } from '../shared/demoData';
import { detectRiskIndicators } from '../shared/safety';
import type {
  AppView,
  CommunicativeGoal,
  MessageProposal,
  MessageToneKey,
  SavedMessageDraft,
} from '../shared/types';

interface MessageHelperViewProps {
  drafts: SavedMessageDraft[];
  easyRead: boolean;
  prefilledRecipient: string;
  prefilledGoal: CommunicativeGoal | null;
  onClearPrefill: () => void;
  onSaveDraft: (draft: Omit<SavedMessageDraft, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteDraft: (id: string) => void;
  onTriggerSafety: (reason?: string) => void;
  onNavigate: (view: AppView) => void;
  demoPreview?: DemoMessagePreview | null;
}

const GOALS: Array<{ id: CommunicativeGoal; label: string; hint: string }> = [
  { id: 'contar_como_estoy', label: 'Contar cómo estoy', hint: 'Compartir lo que sientes sin exigir soluciones' },
  { id: 'pedir_ayuda', label: 'Pedir ayuda', hint: 'Solicitar apoyo concreto o compañía' },
  { id: 'ser_escuchado', label: 'Ser escuchado/a', hint: 'Pedir escucha tranquila sin juicios ni prisas' },
  { id: 'poner_limite', label: 'Poner un límite', hint: 'Expresar lo que necesitas cuidar o frenar' },
  { id: 'explicar_situacion', label: 'Explicar una situación', hint: 'Aclarar algo difícil que te cuesta ordenar' },
];

export function MessageHelperView({
  drafts,
  easyRead,
  prefilledRecipient,
  prefilledGoal,
  onClearPrefill,
  onSaveDraft,
  onDeleteDraft,
  onTriggerSafety,
  onNavigate,
  demoPreview = null,
}: MessageHelperViewProps) {
  const [goal, setGoal] = useState<CommunicativeGoal>('contar_como_estoy');
  const [recipientName, setRecipientName] = useState('');
  const [context, setContext] = useState('');
  const [fears, setFears] = useState('');
  const [proposals, setProposals] = useState<MessageProposal[]>([]);
  const [selectedTone, setSelectedTone] = useState<MessageToneKey | null>(null);
  const [editableText, setEditableText] = useState('');
  const [explicitlyApproved, setExplicitlyApproved] = useState(false);
  const [reformulateNote, setReformulateNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (prefilledRecipient) {
      setRecipientName(prefilledRecipient);
      if (prefilledGoal) setGoal(prefilledGoal);
      onClearPrefill();
    }
  }, [prefilledRecipient, prefilledGoal, onClearPrefill]);

  useEffect(() => {
    if (!demoPreview) return;
    setGoal(demoPreview.goal);
    setRecipientName(demoPreview.recipientName);
    setContext(demoPreview.context);
    setFears(demoPreview.fears);
    setProposals(demoPreview.proposals);
    const preferred =
      demoPreview.proposals.find((p) => p.tone === demoPreview.selectedTone) ??
      demoPreview.proposals[0];
    setSelectedTone(preferred?.tone ?? null);
    setEditableText(preferred?.body ?? '');
    setExplicitlyApproved(true);
  }, [demoPreview]);

  const generateProposals = async (withReformulation?: string) => {
    if (!context.trim()) return;
    const localSafety = detectRiskIndicators(`${context} ${fears} ${editableText}`);
    if (localSafety.triggered) {
      onTriggerSafety(localSafety.reason);
      return;
    }

    setLoading(true);
    setError(null);
    setExplicitlyApproved(false);

    try {
      const data = await postAniaJson(
        '/api/ania/draft-message',
        {
          goal,
          recipientName: recipientName.trim(),
          context: context.trim(),
          fears: fears.trim(),
          currentDraft: withReformulation ? editableText : undefined,
          reformulateInstruction: withReformulation,
          easyRead,
        },
        'No se pudieron crear propuestas.'
      );
      if (data.safetyTriggered) {
        onTriggerSafety(data.safetyReason);
        return;
      }
      setProposals(data.proposals ?? []);
      if (data.proposals?.length > 0 && withReformulation) {
        const match = data.proposals.find((p: MessageProposal) => p.tone === selectedTone) ?? data.proposals[0];
        setSelectedTone(match.tone);
        setEditableText(match.body);
      } else {
        setSelectedTone(null);
        setEditableText('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al redactar opciones.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!explicitlyApproved || !editableText.trim()) return;
    navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = () => {
    if (!editableText.trim()) return;
    onSaveDraft({
      recipientName: recipientName.trim() || 'Sin especificar',
      goal,
      context,
      fears,
      selectedTone: selectedTone ?? undefined,
      finalText: editableText,
      explicitlyApproved,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
      {/* Intro & CU6 Bridge */}
      <div className="bg-ania-surface-soft border border-ania-border rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ania-ink">
            El mensaje que no sé cómo decir
          </h2>
          <p className="text-xs text-ania-ink-subtle mt-0.5">
            AnIA te ofrece borradores en varios tonos para ayudarte a empezar. Nunca enviará nada ni hablará en tu nombre.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('apoyo')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ania-surface border border-ania-border-strong text-xs font-medium text-ania-accent-text hover:bg-ania-accent-tint"
        >
          <Compass className="w-3.5 h-3.5" aria-hidden="true" />
          <span>¿No sabes a quién pedir ayuda?</span>
        </button>
      </div>

      {/* Step 1: Goal BEFORE drafting */}
      <section className="bg-ania-surface border border-ania-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-ania-accent-text mb-2">
            1. ¿Qué te gustaría conseguir con este mensaje?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {GOALS.map((g) => {
              const active = goal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    active
                      ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text'
                      : 'bg-ania-surface-soft border-ania-border text-ania-ink hover:bg-ania-surface-hover'
                  }`}
                >
                  <p className="text-xs font-semibold">{g.label}</p>
                  <p className="text-[11px] text-ania-ink-muted mt-0.5">{g.hint}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Context & fears */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-ania-ink-secondary mb-1">
              ¿A quién va dirigido? (opcional)
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Ej. Mi hermana, mi pareja, un amigo, mi responsable..."
              className="w-full px-3.5 py-2 text-xs bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ania-ink-secondary mb-1">
              ¿Qué miedos o dudas te frenan al decirlo? (opcional)
            </label>
            <input
              type="text"
              value={fears}
              onChange={(e) => setFears(e.target.value)}
              placeholder="Ej. Miedo a molestar, a sonar brusca o a que no me entiendan..."
              className="w-full px-3.5 py-2 text-xs bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ania-ink-secondary mb-1">
            2. Cuéntame con tus palabras qué quieres expresar
          </label>
          <textarea
            rows={3}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Ej. Llevo semanas desbordada cuidando de todo y necesito decirle que necesito un respiro este fin de semana..."
            className="w-full p-3.5 text-xs bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!context.trim() || loading}
            onClick={() => void generateProposals()}
            className="px-5 py-2.5 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-semibold hover:bg-ania-accent-hover disabled:opacity-40 transition-colors"
          >
            {loading ? 'Preparando opciones…' : 'Ver propuestas de mensaje'}
          </button>
        </div>

        {error && <p className="text-xs text-ania-safety-accent">{error}</p>}
      </section>

      {/* Step 3: 3 Tone Proposals */}
      {proposals.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold text-ania-ink">
            3. Elige el enfoque que te resulte más natural (ninguno es el único correcto):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {proposals.map((prop) => {
              const selected = selectedTone === prop.tone;
              return (
                <button
                  key={prop.tone}
                  type="button"
                  onClick={() => {
                    setSelectedTone(prop.tone);
                    setEditableText(prop.body);
                    setExplicitlyApproved(false);
                  }}
                  className={`text-left p-4 rounded-2xl border transition-colors flex flex-col justify-between gap-2 ${
                    selected
                      ? 'bg-ania-accent-tint border-ania-accent'
                      : 'bg-ania-surface border-ania-border hover:border-ania-accent-border'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-ania-accent-text capitalize mb-1.5">
                      Enfoque {prop.tone} · {prop.title}
                    </p>
                    <p className="text-xs text-ania-ink leading-relaxed">{prop.body}</p>
                  </div>
                  <span className="text-[11px] font-medium text-ania-accent-text">
                    {selected ? 'Seleccionado para editar' : 'Usar como base'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 4: Edit, Reformulate & Explicit Approval Gate */}
      {editableText && (
        <section className="bg-ania-surface border border-ania-accent-border rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-ania-heading">
              4. Adapta el mensaje con tus propias palabras
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditableText('');
                setSelectedTone(null);
                setExplicitlyApproved(false);
              }}
              className="text-xs text-ania-safety-accent hover:underline"
            >
              Descartar borrador
            </button>
          </div>

          <textarea
            rows={4}
            value={editableText}
            onChange={(e) => {
              setEditableText(e.target.value);
              setExplicitlyApproved(false);
            }}
            className="w-full p-4 text-sm bg-ania-surface-soft text-ania-ink border border-ania-border-strong rounded-xl leading-relaxed"
          />

          {/* Ask AnIA to reformulate part */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={reformulateNote}
              onChange={(e) => setReformulateNote(e.target.value)}
              placeholder="¿Quieres cambiar algo? Ej. 'Hazlo más breve' o 'Quita la última frase'..."
              className="flex-1 px-3.5 py-2 text-xs bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
            />
            <button
              type="button"
              disabled={!reformulateNote.trim() || loading}
              onClick={() => {
                void generateProposals(reformulateNote);
                setReformulateNote('');
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-ania-accent-border bg-ania-accent-tint text-xs font-medium text-ania-accent-text disabled:opacity-40"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reformular</span>
            </button>
          </div>

          {/* Explicit Approval Checkbox */}
          <div className="pt-2 border-t border-ania-border space-y-3">
            <label className="flex items-start gap-2.5 text-xs text-ania-ink cursor-pointer">
              <input
                type="checkbox"
                checked={explicitlyApproved}
                onChange={(e) => setExplicitlyApproved(e.target.checked)}
                className="mt-0.5 accent-ania-accent"
              />
              <span>
                <strong>Aprobación explícita:</strong> He revisado este texto, me representa y quiero copiarlo o guardarlo para usarlo cuando yo decida.
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={!explicitlyApproved}
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-semibold hover:bg-ania-accent-hover disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Mensaje copiado' : 'Copiar mensaje aprobado'}</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-ania-border-strong bg-ania-surface text-xs font-medium text-ania-ink hover:bg-ania-surface-soft"
              >
                <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{savedNotice ? 'Borrador guardado' : 'Guardar borrador para después'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Saved Private Drafts */}
      {drafts.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-base font-semibold text-ania-ink">
            Tus borradores guardados en privado ({drafts.length})
          </h3>
          <div className="space-y-2.5">
            {drafts.map((d) => (
              <div
                key={d.id}
                className="bg-ania-surface border border-ania-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="text-xs text-ania-ink-subtle">
                    Para: <strong>{d.recipientName}</strong> ·{' '}
                    {GOALS.find((g) => g.id === d.goal)?.label}
                  </p>
                  <p className="text-xs text-ania-ink leading-relaxed">{d.finalText}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientName(d.recipientName);
                      setGoal(d.goal);
                      setContext(d.context);
                      setFears(d.fears);
                      setEditableText(d.finalText);
                      setExplicitlyApproved(d.explicitlyApproved);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-ania-border-strong text-xs font-medium text-ania-accent-text"
                  >
                    Retomar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteDraft(d.id)}
                    className="p-1.5 text-ania-ink-subtle hover:text-ania-safety-accent"
                    title="Eliminar borrador"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
