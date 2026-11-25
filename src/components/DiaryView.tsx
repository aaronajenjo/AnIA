import { CalendarClock, Check, Edit3, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { postAniaJson } from '../shared/api';
import { detectRiskIndicators } from '../shared/safety';
import type {
  AppView,
  DescriptiveTrendObservation,
  DiaryEntry,
  FollowUpConfig,
  FollowUpFrequency,
  SelfPerceivedIntensity,
} from '../shared/types';

interface DiaryViewProps {
  entries: DiaryEntry[];
  followUpConfig: FollowUpConfig;
  trendObservation: DescriptiveTrendObservation | null;
  easyRead: boolean;
  onAddEntry: (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => void;
  onUpdateEntry: (id: string, patch: Partial<DiaryEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateConfig: (cfg: FollowUpConfig) => void;
  onSetTrendObservation: (obs: DescriptiveTrendObservation | null) => void;
  onTriggerSafety: (reason?: string) => void;
  onNavigate: (view: AppView) => void;
}

const EMOTION_TAGS = [
  'Calma',
  'Cansancio',
  'Sobrecarga',
  'Tristeza',
  'Inquietud',
  'Rabia',
  'Soledad',
  'Alivio',
];

const INTENSITY_LABELS: Record<SelfPerceivedIntensity, string> = {
  1: 'Muy suave',
  2: 'Leve',
  3: 'Moderada',
  4: 'Intensa',
  5: 'Muy intensa',
};

export function DiaryView({
  entries,
  followUpConfig,
  trendObservation,
  easyRead,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onUpdateConfig,
  onSetTrendObservation,
  onTriggerSafety,
  onNavigate,
}: DiaryViewProps) {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [customEmotionNote, setCustomEmotionNote] = useState('');
  const [intensity, setIntensity] = useState<SelfPerceivedIntensity>(3);
  const [overloadLevel, setOverloadLevel] = useState<'baja' | 'media' | 'alta'>('media');
  const [restQuality, setRestQuality] = useState<'bueno' | 'irregular' | 'escaso'>('irregular');
  const [associatedSituations, setAssociatedSituations] = useState('');
  const [helpfulElements, setHelpfulElements] = useState('');
  const [approvedForConsulta, setApprovedForConsulta] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [nuanceInput, setNuanceInput] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editSituations, setEditSituations] = useState('');

  const toggleEmotion = (emo: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emo) ? prev.filter((x) => x !== emo) : [...prev, emo]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCheck = `${customEmotionNote} ${associatedSituations} ${helpfulElements}`;
    const safety = detectRiskIndicators(rawCheck);
    if (safety.triggered) {
      onTriggerSafety(safety.reason);
      return;
    }

    onAddEntry({
      emotions: selectedEmotions,
      customEmotionNote: customEmotionNote.trim() || undefined,
      intensity,
      overloadLevel,
      restQuality,
      associatedSituations: associatedSituations.trim(),
      helpfulElements: helpfulElements.trim(),
      approvedForConsulta,
    });

    setSelectedEmotions([]);
    setCustomEmotionNote('');
    setAssociatedSituations('');
    setHelpfulElements('');
  };

  const handleGenerateTrends = async () => {
    if (entries.length < 2) return;
    setTrendLoading(true);
    setTrendError(null);
    try {
      const data = await postAniaJson(
        '/api/ania/descriptive-trends',
        { entries, easyRead },
        'No se pudieron observar patrones.'
      );
      if (data.safetyTriggered) {
        onTriggerSafety(data.safetyReason);
        return;
      }
      onSetTrendObservation({
        id: `trend-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        observations: data.observations ?? [],
        persistentDistressNotice: Boolean(data.persistentDistressNotice),
        validationStatus: 'pending',
      });
    } catch (err) {
      setTrendError(err instanceof Error ? err.message : 'Error al generar observaciones.');
    } finally {
      setTrendLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
      {/* Voluntary Follow-up Configuration */}
      <div className="bg-ania-surface-soft border border-ania-border rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="w-4 h-4 text-ania-accent-text" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ania-ink">
                Seguimiento a tu ritmo (voluntario)
              </p>
              <p className="text-xs text-ania-ink-subtle">
                {followUpConfig.enabled
                  ? `Recordatorio ${followUpConfig.frequency === 'daily' ? 'diario' : followUpConfig.frequency === 'every_2_3_days' ? 'cada 2-3 días' : 'semanal'} (${followUpConfig.preferredTime}). Si dejas de registrar, nunca se interpreta como empeoramiento.`
                  : 'Sin avisos automáticos. Registras solo cuando tú quieres.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowConfig((s) => !s)}
            className="px-3.5 py-1.5 rounded-xl bg-ania-surface border border-ania-border-strong text-xs font-medium text-ania-ink hover:bg-ania-surface-hover"
          >
            {showConfig ? 'Cerrar ajustes' : 'Configurar seguimiento'}
          </button>
        </div>

        {showConfig && (
          <div className="pt-3 border-t border-ania-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-medium text-ania-ink-secondary mb-1">Frecuencia</label>
              <select
                value={followUpConfig.enabled ? followUpConfig.frequency : 'none'}
                onChange={(e) => {
                  const freq = e.target.value as FollowUpFrequency;
                  onUpdateConfig({
                    ...followUpConfig,
                    enabled: freq !== 'none',
                    frequency: freq,
                  });
                }}
                className="w-full bg-ania-surface text-ania-ink border border-ania-border-strong rounded-xl px-3 py-2"
              >
                <option value="none">Solo cuando yo entre (pausado)</option>
                <option value="daily">Diario</option>
                <option value="every_2_3_days">Cada 2 o 3 días</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-ania-ink-secondary mb-1">Día preferido</label>
              <select
                value={followUpConfig.preferredDay}
                onChange={(e) =>
                  onUpdateConfig({ ...followUpConfig, preferredDay: e.target.value })
                }
                disabled={!followUpConfig.enabled}
                className="w-full bg-ania-surface text-ania-ink border border-ania-border-strong rounded-xl px-3 py-2 disabled:opacity-50"
              >
                <option value="lunes">Lunes</option>
                <option value="miercoles">Miércoles</option>
                <option value="viernes">Viernes</option>
                <option value="domingo">Domingo</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-ania-ink-secondary mb-1">Hora aproximada</label>
              <input
                type="time"
                value={followUpConfig.preferredTime}
                disabled={!followUpConfig.enabled}
                onChange={(e) =>
                  onUpdateConfig({ ...followUpConfig, preferredTime: e.target.value })
                }
                className="w-full bg-ania-surface text-ania-ink border border-ania-border-strong rounded-xl px-3 py-2 disabled:opacity-50 tabular-nums"
              />
            </div>
          </div>
        )}
      </div>

      {/* Self-reported Check-in Form (zero clinical scores) */}
      <form
        onSubmit={handleSubmit}
        className="bg-ania-surface border border-ania-border rounded-2xl p-5 sm:p-6 space-y-5"
      >
        <div>
          <h3 className="font-display text-lg font-semibold text-ania-ink">
            Registrar cómo me encuentro hoy
          </h3>
          <p className="text-xs text-ania-ink-subtle mt-0.5">
            Datos autoinformados para observar tu experiencia sin etiquetas clínicas ni puntuaciones.
          </p>
        </div>

        {/* Emotions */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-ania-ink-secondary">
            Emociones o sensaciones (opcional)
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOTION_TAGS.map((tag) => {
              const active = selectedEmotions.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleEmotion(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text'
                      : 'bg-ania-surface-soft border-ania-border text-ania-ink-secondary hover:bg-ania-surface-hover'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={customEmotionNote}
            onChange={(e) => setCustomEmotionNote(e.target.value)}
            placeholder="O descríbelo con tus propias palabras..."
            className="w-full mt-2 px-3.5 py-2 text-xs bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
          />
        </div>

        {/* Self-perceived Intensity, Overload, Rest */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ania-ink-secondary">
              Intensidad autopercibida: <span className="text-ania-accent-text">{INTENSITY_LABELS[intensity]}</span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value) as SelfPerceivedIntensity)}
              className="w-full accent-ania-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ania-ink-secondary">Sobrecarga percibida</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['baja', 'media', 'alta'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setOverloadLevel(lvl)}
                  className={`py-1.5 rounded-lg text-xs capitalize border ${
                    overloadLevel === lvl
                      ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text font-medium'
                      : 'bg-ania-surface-soft border-ania-border text-ania-ink-muted'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ania-ink-secondary">Descanso reciente</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['bueno', 'irregular', 'escaso'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRestQuality(r)}
                  className={`py-1.5 rounded-lg text-xs capitalize border ${
                    restQuality === r
                      ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text font-medium'
                      : 'bg-ania-surface-soft border-ania-border text-ania-ink-muted'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Associated situations & Helpful elements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ania-ink-secondary mb-1">
              Situaciones o factores que relacionas (opcional)
            </label>
            <textarea
              rows={2}
              value={associatedSituations}
              onChange={(e) => setAssociatedSituations(e.target.value)}
              placeholder="Ej. Muchas tareas de cuidado seguidas, discusión en el trabajo..."
              className="w-full p-3 text-xs bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ania-ink-secondary mb-1">
              Elementos o gestos que te han ayudado (opcional)
            </label>
            <textarea
              rows={2}
              value={helpfulElements}
              onChange={(e) => setHelpfulElements(e.target.value)}
              placeholder="Ej. Salir a caminar 15 minutos, hablar con mi hermana, respirar..."
              className="w-full p-3 text-xs bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="inline-flex items-center gap-2 text-xs text-ania-ink-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={approvedForConsulta}
              onChange={(e) => setApprovedForConsulta(e.target.checked)}
              className="accent-ania-accent"
            />
            <span>Permitir incluir este registro si preparo mi resumen de consulta (CU3)</span>
          </label>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-semibold hover:bg-ania-accent-hover transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Guardar en Mi diario</span>
          </button>
        </div>
      </form>

      {/* Descriptive Trends Section */}
      <section className="bg-ania-lavender-bg border border-ania-lavender-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-ania-lavender-text">
              Tu semana, a tu ritmo · Tendencias descriptivas
            </h3>
            <p className="text-xs text-ania-lavender-muted mt-0.5">
              Observaciones descriptivas basadas solo en tus registros. Tú confirmas si te encajan o no.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleGenerateTrends()}
            disabled={entries.length < 2 || trendLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ania-surface border border-ania-lavender-border text-xs font-semibold text-ania-lavender-accent hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{trendLoading ? 'Observando…' : 'Observar patrones descriptivos'}</span>
          </button>
        </div>

        {entries.length < 2 && (
          <p className="text-xs text-ania-lavender-muted">
            Cuando tengas al menos 2 registros guardados, podrás pedir una observación descriptiva si te apetece.
          </p>
        )}

        {trendError && <p className="text-xs text-ania-safety-accent">{trendError}</p>}

        {trendObservation && trendObservation.validationStatus !== 'rejected' && (
          <div className="bg-ania-surface border border-ania-lavender-border rounded-xl p-4 space-y-3">
            <ul className="space-y-2 text-xs text-ania-ink leading-relaxed list-disc pl-4">
              {trendObservation.observations.map((obs, idx) => (
                <li key={idx}>{obs}</li>
              ))}
            </ul>

            {trendObservation.userNuanceNote && (
              <p className="text-xs bg-ania-surface-soft rounded-lg p-2.5 text-ania-ink-secondary">
                <strong>Tu matiz:</strong> {trendObservation.userNuanceNote}
              </p>
            )}

            <div className="pt-2 border-t border-ania-border-subtle space-y-2">
              <p className="text-xs font-medium text-ania-lavender-accent">
                ¿Te encaja esta observación?
                {trendObservation.validationStatus === 'fits' && ' (Confirmaste que te encaja)'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onSetTrendObservation({ ...trendObservation, validationStatus: 'fits' })
                  }
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    trendObservation.validationStatus === 'fits'
                      ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text'
                      : 'bg-ania-surface border-ania-border-strong text-ania-ink'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Me encaja</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSetTrendObservation({
                      ...trendObservation,
                      validationStatus: 'nuanced',
                    })
                  }
                  className="px-3 py-1.5 rounded-lg text-xs border border-ania-border-strong text-ania-ink-secondary hover:bg-ania-surface-soft"
                >
                  Matizar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSetTrendObservation({ ...trendObservation, validationStatus: 'rejected' })
                  }
                  className="px-3 py-1.5 rounded-lg text-xs border border-ania-border-strong text-ania-ink-subtle hover:bg-ania-surface-soft"
                >
                  No me representa
                </button>
              </div>

              {trendObservation.validationStatus === 'nuanced' && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={nuanceInput}
                    onChange={(e) => setNuanceInput(e.target.value)}
                    placeholder="Escribe cómo lo percibes tú..."
                    className="flex-1 px-3 py-1.5 text-xs bg-ania-surface text-ania-ink placeholder:text-ania-ink-faint border border-ania-border-strong rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onSetTrendObservation({
                        ...trendObservation,
                        userNuanceNote: nuanceInput.trim(),
                      });
                      setNuanceInput('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-ania-accent text-ania-accent-on text-xs font-medium"
                  >
                    Guardar matiz
                  </button>
                </div>
              )}
            </div>

            {trendObservation.persistentDistressNotice && (
              <div className="bg-ania-safety-bg border border-ania-safety-border rounded-xl p-3 text-xs text-ania-safety-text space-y-2">
                <p>
                  En varios registros seguidos has señalado malestar o sobrecarga alta. Si te sirve, podemos mirar juntos opciones de apoyo humano o preparar notas para comentarlo con un profesional.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('apoyo')}
                    className="px-3 py-1.5 rounded-lg bg-ania-surface border border-ania-safety-border text-ania-safety-text font-medium"
                  >
                    Ver mi red de apoyo
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('consulta')}
                    className="px-3 py-1.5 rounded-lg bg-ania-surface border border-ania-safety-border text-ania-safety-text font-medium"
                  >
                    Preparar consulta
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Past Entries History (editable & deletable) */}
      <section className="space-y-3">
        <h3 className="font-display text-base font-semibold text-ania-ink">
          Tus registros guardados ({entries.length})
        </h3>
        {entries.length === 0 ? (
          <div className="bg-ania-surface-soft border border-ania-border rounded-2xl p-6 text-center text-xs text-ania-ink-subtle">
            Aún no hay entradas en tu diario. Cuando quieras, puedes guardar la primera arriba.
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="bg-ania-surface border border-ania-border rounded-2xl p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-ania-ink-subtle tabular-nums">
                    {new Date(entry.createdAt).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    · Intensidad: {INTENSITY_LABELS[entry.intensity]} · Sobrecarga: {entry.overloadLevel} · Descanso: {entry.restQuality}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntryId(entry.id);
                        setEditSituations(entry.associatedSituations);
                      }}
                      className="p-1 text-ania-ink-subtle hover:text-ania-ink"
                      title="Corregir registro"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      className="p-1 text-ania-ink-subtle hover:text-ania-safety-accent"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {(entry.emotions.length > 0 || entry.customEmotionNote) && (
                  <p className="text-sm font-medium text-ania-heading">
                    {[...entry.emotions, entry.customEmotionNote].filter(Boolean).join(' · ')}
                  </p>
                )}

                {editingEntryId === entry.id ? (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={editSituations}
                      onChange={(e) => setEditSituations(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-ania-surface text-ania-ink border border-ania-border-strong rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateEntry(entry.id, { associatedSituations: editSituations });
                        setEditingEntryId(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-ania-accent text-ania-accent-on text-xs"
                    >
                      Guardar
                    </button>
                  </div>
                ) : (
                  <>
                    {entry.associatedSituations && (
                      <p className="text-xs text-ania-ink-secondary">
                        <strong>Situaciones relacionadas:</strong> {entry.associatedSituations}
                      </p>
                    )}
                    {entry.helpfulElements && (
                      <p className="text-xs text-ania-accent-text">
                        <strong>Qué ayudó:</strong> {entry.helpfulElements}
                      </p>
                    )}
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
