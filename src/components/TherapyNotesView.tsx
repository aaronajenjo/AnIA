import { Check, Copy, Download, Edit3, Eye, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { postAniaJson } from '../shared/api';
import { detectRiskIndicators } from '../shared/safety';
import type {
  ConsultaItem,
  ConsultaSectionKey,
  ConsultaSummaryState,
  DiaryEntry,
} from '../shared/types';

interface TherapyNotesViewProps {
  authorizedConversationNotes: string[];
  diaryEntries: DiaryEntry[];
  summaryState: ConsultaSummaryState;
  easyRead: boolean;
  onSetItems: (items: ConsultaItem[]) => void;
  onAddItem: (
    section: ConsultaSectionKey,
    text: string,
    origin?: 'user_literal' | 'ania_organized'
  ) => void;
  onUpdateItem: (id: string, patch: Partial<ConsultaItem>) => void;
  onDeleteItem: (id: string) => void;
  onToggleShowApproved: (val: boolean) => void;
  onClearSummary: () => void;
  onTriggerSafety: (reason?: string) => void;
}

const SECTION_META: Array<{ key: ConsultaSectionKey; title: string; placeholder: string }> = [
  {
    key: 'comoMeHeSentido',
    title: 'Cómo me he sentido',
    placeholder: 'Añade con tus palabras cómo te has sentido últimamente...',
  },
  {
    key: 'situacionesDificiles',
    title: 'Situaciones difíciles o factores que he relacionado',
    placeholder: 'Situaciones, momentos o cargas que relacionas con tu malestar...',
  },
  {
    key: 'cosasQueMeHanAyudado',
    title: 'Cosas que me han ayudado',
    placeholder: 'Qué te ha aliviado o sostenido aunque sea un poco...',
  },
  {
    key: 'cambiosObservados',
    title: 'Cambios que he notado',
    placeholder: 'Cambios en descanso, energía, ánimo o rutinas...',
  },
  {
    key: 'preocupacionesYTemas',
    title: 'Preocupaciones y temas que quiero tratar',
    placeholder: 'Qué no quieres que se te olvide comentar en tu cita...',
  },
  {
    key: 'preguntasParaLaConsulta',
    title: 'Preguntas para hacerle a mi profesional',
    placeholder: 'Dudas o preguntas concretas para tu próxima sesión...',
  },
];

export function TherapyNotesView({
  authorizedConversationNotes,
  diaryEntries,
  summaryState,
  easyRead,
  onSetItems,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onToggleShowApproved,
  onClearSummary,
  onTriggerSafety,
}: TherapyNotesViewProps) {
  const [extraNote, setExtraNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [newSectionInputs, setNewSectionInputs] = useState<Partial<Record<ConsultaSectionKey, string>>>({});
  const [copied, setCopied] = useState(false);
  const [postConsultOpen, setPostConsultOpen] = useState(false);

  const approvedDiary = diaryEntries.filter((d) => d.approvedForConsulta);
  const hasAnyInput =
    authorizedConversationNotes.length > 0 || approvedDiary.length > 0 || extraNote.trim().length > 0;

  const generateSummary = async () => {
    const localCheck = detectRiskIndicators(`${extraNote} ${authorizedConversationNotes.join(' ')}`);
    if (localCheck.triggered) {
      onTriggerSafety(localCheck.reason);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await postAniaJson(
        '/api/ania/consultation-summary',
        {
          authorizedNotes: authorizedConversationNotes,
          diaryEntries: approvedDiary,
          extraNote: extraNote.trim(),
          easyRead,
        },
        'No se pudo organizar el resumen.'
      );
      if (data.safetyTriggered) {
        onTriggerSafety(data.safetyReason);
        return;
      }

      const sections = data.sections ?? {};
      const collected: ConsultaItem[] = [];
      for (const meta of SECTION_META) {
        const list = Array.isArray(sections[meta.key]) ? sections[meta.key] : [];
        for (const entry of list) {
          if (entry?.text) {
            collected.push({
              id: `citem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              section: meta.key,
              text: entry.text,
              origin: entry.origin === 'user_literal' ? 'user_literal' : 'ania_organized',
              included: true,
            });
          }
        }
      }
      onSetItems(collected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al organizar el resumen.');
    } finally {
      setLoading(false);
    }
  };

  const buildApprovedMarkdown = () => {
    const lines: string[] = [
      'RESUMEN PERSONAL PARA MI CONSULTA',
      'Documento personal revisado y autorizado por la persona. No constituye un informe psicológico ni diagnóstico.',
      `Fecha de preparación: ${new Date().toLocaleDateString('es-ES')}`,
      '',
    ];
    for (const meta of SECTION_META) {
      const items = summaryState.items.filter((i) => i.section === meta.key && i.included);
      if (items.length === 0) continue;
      lines.push(`## ${meta.title}`);
      for (const item of items) {
        const prefix = item.origin === 'user_literal' ? '[Mis palabras]' : '[Organización revisada]';
        lines.push(`- ${prefix} ${item.text}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  };

  const handleCopyApproved = () => {
    navigator.clipboard.writeText(buildApprovedMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([buildApprovedMarkdown()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resumen-personal-consulta-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleItems = summaryState.showOnlyApproved
    ? summaryState.items.filter((i) => i.included)
    : summaryState.items;

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="bg-ania-accent-tint border border-ania-accent-border rounded-2xl p-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ania-heading">
              Resumen personal para mi consulta
            </h2>
            <p className="text-xs text-ania-ink-muted mt-0.5">
              Organización personal revisada por ti para facilitar tu conversación profesional. No es un informe clínico ni diagnóstico y nunca se envía automáticamente.
            </p>
          </div>
          <div className="text-xs text-ania-accent-text font-medium tabular-nums">
            {authorizedConversationNotes.length} notas de chat · {approvedDiary.length} registros de diario
          </div>
        </div>
      </div>

      {/* Prepare / Organize Controls */}
      <section className="bg-ania-surface border border-ania-border rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-ania-ink-secondary mb-1.5">
            ¿Hay algo más que quieras añadir antes de preparar o actualizar tu resumen? (opcional)
          </label>
          <textarea
            rows={2}
            value={extraNote}
            onChange={(e) => setExtraNote(e.target.value)}
            placeholder="Ej. Quiero asegurarme de preguntar cómo manejar las noches sin dormir bien..."
            className="w-full p-3 text-xs bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ania-ink-subtle">
            {hasAnyInput
              ? 'AnIA diferenciará visualmente tus palabras literales de la organización propuesta.'
              : 'Si aún tienes pocos registros, añade una nota arriba o escribe directamente en cada apartado abajo.'}
          </p>
          <button
            type="button"
            disabled={!hasAnyInput || loading}
            onClick={() => void generateSummary()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-semibold hover:bg-ania-accent-hover disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{loading ? 'Organizando…' : 'Preparar mi resumen personal'}</span>
          </button>
        </div>

        {error && <p className="text-xs text-ania-safety-accent">{error}</p>}
      </section>

      {/* Visual Differentiation Legend & Approval Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-ania-ink-secondary">
            <span className="w-3 h-3 rounded bg-ania-user-bubble border border-ania-border-strong" />
            Tus palabras literales
          </span>
          <span className="inline-flex items-center gap-1.5 text-ania-accent-text">
            <span className="w-3 h-3 rounded bg-ania-accent-tint border border-ania-accent-border" />
            Organización propuesta por AnIA (editable)
          </span>
        </div>

        <button
          type="button"
          onClick={() => onToggleShowApproved(!summaryState.showOnlyApproved)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border ${
            summaryState.showOnlyApproved
              ? 'bg-ania-accent border-ania-accent text-ania-accent-on'
              : 'bg-ania-surface border-ania-border-strong text-ania-ink'
          }`}
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            {summaryState.showOnlyApproved
              ? 'Mostrando solo versión aprobada'
              : 'Ver solo versión aprobada'}
          </span>
        </button>
      </div>

      {/* 6 Structured Editable Sections */}
      <div className="space-y-4">
        {SECTION_META.map((meta) => {
          const sectionItems = visibleItems.filter((i) => i.section === meta.key);
          return (
            <section
              key={meta.key}
              className="bg-ania-surface border border-ania-border rounded-2xl p-5 space-y-3"
            >
              <h3 className="font-display text-base font-semibold text-ania-ink">{meta.title}</h3>

              {sectionItems.length === 0 ? (
                <p className="text-xs text-ania-ink-faint">Sin puntos añadidos todavía en este apartado.</p>
              ) : (
                <div className="space-y-2">
                  {sectionItems.map((item) => {
                    const isLiteral = item.origin === 'user_literal';
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl p-3 border flex items-start justify-between gap-3 ${
                          !item.included
                            ? 'bg-ania-surface-soft border-ania-border opacity-55'
                            : isLiteral
                              ? 'bg-ania-user-bubble-soft border-ania-border-strong'
                              : 'bg-ania-accent-tint border-ania-accent-border'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 flex-1">
                          <input
                            type="checkbox"
                            checked={item.included}
                            onChange={(e) =>
                              onUpdateItem(item.id, { included: e.target.checked })
                            }
                            aria-label="Incluir este punto al compartir"
                            className="mt-1 accent-ania-accent"
                          />
                          <div className="flex-1 space-y-1">
                            <span className="text-[11px] font-semibold text-ania-ink-muted">
                              {isLiteral ? 'Tus palabras' : 'Organización de AnIA'}
                            </span>
                            {editingId === item.id ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="flex-1 px-2.5 py-1.5 text-xs bg-ania-surface text-ania-ink border border-ania-border-strong rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateItem(item.id, {
                                      text: editingText.trim(),
                                      origin: 'user_literal',
                                    });
                                    setEditingId(null);
                                  }}
                                  className="px-3 py-1 rounded-lg bg-ania-accent text-ania-accent-on text-xs"
                                >
                                  Guardar
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-ania-ink leading-relaxed">{item.text}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditingText(item.text);
                            }}
                            className="p-1 text-ania-ink-subtle hover:text-ania-ink"
                            title="Editar o reformular"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 text-ania-ink-subtle hover:text-ania-safety-accent"
                            title="Eliminar punto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!summaryState.showOnlyApproved && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newSectionInputs[meta.key] ?? ''}
                    onChange={(e) =>
                      setNewSectionInputs((prev) => ({ ...prev, [meta.key]: e.target.value }))
                    }
                    placeholder={meta.placeholder}
                    className="flex-1 px-3 py-1.5 text-xs bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = (newSectionInputs[meta.key] ?? '').trim();
                      if (!val) return;
                      const safety = detectRiskIndicators(val);
                      if (safety.triggered) {
                        onTriggerSafety(safety.reason);
                        return;
                      }
                      onAddItem(meta.key, val, 'user_literal');
                      setNewSectionInputs((prev) => ({ ...prev, [meta.key]: '' }));
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-ania-border-strong bg-ania-surface text-xs font-medium text-ania-accent-text hover:bg-ania-accent-tint"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Explicit Share / Download / Post-Consultation Actions */}
      <section className="bg-ania-surface-soft border border-ania-border rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ania-ink">
              Tú decides qué hacer con este resumen
            </p>
            <p className="text-xs text-ania-ink-subtle">
              Solo se incluyen los elementos marcados. Puedes llevarlo contigo, descargarlo o guardarlo solo para ti.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={summaryState.items.filter((i) => i.included).length === 0}
              onClick={handleCopyApproved}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-semibold hover:bg-ania-accent-hover disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Resumen copiado' : 'Copiar resumen aprobado'}</span>
            </button>
            <button
              type="button"
              disabled={summaryState.items.filter((i) => i.included).length === 0}
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ania-surface border border-ania-border-strong text-xs font-medium text-ania-ink hover:bg-ania-surface-hover disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar (.txt)</span>
            </button>
            <button
              type="button"
              onClick={() => setPostConsultOpen((v) => !v)}
              className="px-4 py-2 rounded-xl bg-ania-surface border border-ania-border-strong text-xs font-medium text-ania-ink-muted hover:text-ania-ink"
            >
              Ya tuve mi consulta
            </button>
          </div>
        </div>

        {postConsultOpen && (
          <div className="pt-3 border-t border-ania-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <p className="text-ania-ink-secondary">
              ¿Qué prefieres hacer ahora con este resumen personal?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPostConsultOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-ania-surface border border-ania-border-strong font-medium text-ania-ink"
              >
                Conservarlo en mi espacio
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearSummary();
                  setPostConsultOpen(false);
                }}
                className="px-3.5 py-2 rounded-xl bg-ania-safety-bg border border-ania-safety-border font-medium text-ania-safety-accent"
              >
                Eliminar resumen tras la consulta
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
