import {
  HeartHandshake,
  MessageSquareHeart,
  Phone,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { postAniaJson } from '../shared/api';
import { detectRiskIndicators, HUMAN_HELP_RESOURCES } from '../shared/safety';
import type {
  CommunicativeGoal,
  ProfessionalReference,
  SupportNeedType,
  SupportPerson,
} from '../shared/types';

interface SupportNetworkViewProps {
  people: SupportPerson[];
  professionalRef: ProfessionalReference | null;
  selectedNeeds: SupportNeedType[];
  easyRead: boolean;
  onUpdateNeeds: (needs: SupportNeedType[]) => void;
  onAddPerson: (person: Omit<SupportPerson, 'id'>) => void;
  onUpdatePerson: (id: string, patch: Partial<SupportPerson>) => void;
  onDeletePerson: (id: string) => void;
  onSetProfessionalRef: (prof: ProfessionalReference | null) => void;
  onPrepareMessage: (recipientName: string, goal?: CommunicativeGoal) => void;
  onTriggerSafety: (reason?: string) => void;
}

const NEED_OPTIONS: Array<{ id: SupportNeedType; label: string; desc: string }> = [
  { id: 'escucha', label: 'Escucha', desc: 'Alguien que me oiga sin juzgar ni presionar' },
  { id: 'compania', label: 'Compañía', desc: 'No estar sola/o un rato o dar un paseo' },
  { id: 'ayuda_practica', label: 'Ayuda práctica', desc: 'Echar una mano con recados, comida o gestiones' },
  {
    id: 'compartir_responsabilidades',
    label: 'Compartir responsabilidades',
    desc: 'Relevarme un rato en cuidados o tareas diarias',
  },
  { id: 'descanso', label: 'Descanso', desc: 'Poder parar y recuperar fuerzas' },
  {
    id: 'orientacion_profesional',
    label: 'Orientación profesional',
    desc: 'Pedir cita en atención primaria o psicología',
  },
];

export function SupportNetworkView({
  people,
  professionalRef,
  selectedNeeds,
  easyRead,
  onUpdateNeeds,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
  onSetProfessionalRef,
  onPrepareMessage,
  onTriggerSafety,
}: SupportNetworkViewProps) {
  const [dontKnowOpen, setDontKnowOpen] = useState(false);
  const [exploreInput, setExploreInput] = useState('');
  const [exploreReply, setExploreReply] = useState<string | null>(null);
  const [exploreError, setExploreError] = useState<string | null>(null);
  const [exploreLoading, setExploreLoading] = useState(false);

  const [noOneMode, setNoOneMode] = useState(false);

  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newHelpTypes, setNewHelpTypes] = useState<SupportNeedType[]>(['escucha']);
  const [newTrustedEmergency, setNewTrustedEmergency] = useState(false);

  const [profName, setProfName] = useState(professionalRef?.name ?? '');
  const [profRole, setProfRole] = useState(professionalRef?.role ?? '');
  const [profContact, setProfContact] = useState(professionalRef?.contactNote ?? '');
  const [profSaved, setProfSaved] = useState(false);

  const toggleNeed = (need: SupportNeedType) => {
    const next = selectedNeeds.includes(need)
      ? selectedNeeds.filter((n) => n !== need)
      : [...selectedNeeds, need];
    onUpdateNeeds(next);
  };

  const handleExploreSupport = async () => {
    if (!exploreInput.trim()) return;
    const localSafety = detectRiskIndicators(exploreInput);
    if (localSafety.triggered) {
      onTriggerSafety(localSafety.reason);
      return;
    }

    setExploreLoading(true);
    setExploreError(null);
    try {
      const data = await postAniaJson(
        '/api/ania/explore-support',
        { reflection: exploreInput, easyRead },
        'No se pudo completar la exploración ahora.'
      );
      if (data.safetyTriggered) {
        onTriggerSafety(data.safetyReason);
        return;
      }
      setExploreReply(data.reflectionText ?? null);
      if (Array.isArray(data.suggestedNeeds)) {
        const merged = Array.from(new Set([...selectedNeeds, ...data.suggestedNeeds]));
        onUpdateNeeds(merged);
      }
    } catch (err) {
      setExploreError(err instanceof Error ? err.message : 'Error al explorar opciones.');
    } finally {
      setExploreLoading(false);
    }
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddPerson({
      name: newName.trim(),
      relationship: newRelation.trim() || 'Persona cercana',
      helpTypes: newHelpTypes.length ? newHelpTypes : ['escucha'],
      contactNote: newContact.trim() || undefined,
      isTrustedEmergencyContact: newTrustedEmergency,
    });
    setNewName('');
    setNewRelation('');
    setNewContact('');
    setNewTrustedEmergency(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
      {/* Intro */}
      <div className="bg-ania-surface-soft border border-ania-border rounded-2xl p-5 space-y-1.5">
        <h2 className="font-display text-lg font-semibold text-ania-ink">
          Identificación y activación de mi red de apoyo
        </h2>
        <p className="text-xs text-ania-ink-subtle leading-relaxed">
          AnIA te ayuda a pensar qué apoyo te aliviaría y a quién podrías pedirlo, pero nunca decide quién es una persona segura ni contacta con nadie por ti.
        </p>
      </div>

      {/* Step 1: What kind of help would be useful? */}
      <section className="bg-ania-surface border border-ania-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-ania-ink">
            1. ¿Qué tipo de ayuda te vendría bien ahora?
          </h3>
          <button
            type="button"
            onClick={() => setDontKnowOpen((v) => !v)}
            className="text-xs font-medium text-ania-accent-text underline underline-offset-2"
          >
            No lo sé aún, ayúdame a explorarlo
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {NEED_OPTIONS.map((opt) => {
            const active = selectedNeeds.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleNeed(opt.id)}
                className={`text-left p-3.5 rounded-xl border transition-colors ${
                  active
                    ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text'
                    : 'bg-ania-surface-soft border-ania-border text-ania-ink hover:bg-ania-surface-hover'
                }`}
              >
                <p className="text-xs font-semibold">{opt.label}</p>
                <p className="text-[11px] text-ania-ink-muted mt-0.5">{opt.desc}</p>
              </button>
            );
          })}
        </div>

        {dontKnowOpen && (
          <div className="bg-ania-accent-tint border border-ania-accent-border rounded-xl p-4 space-y-3">
            <p className="text-xs text-ania-heading">
              Cuéntame brevemente qué te está pesando más hoy y exploramos juntos qué tipo de alivio podría encajar contigo:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={exploreInput}
                onChange={(e) => setExploreInput(e.target.value)}
                placeholder="Ej. Siento que no llego a todo con el cuidado en casa y me da apuro pedir nada..."
                className="flex-1 bg-ania-surface text-ania-ink placeholder:text-ania-ink-faint border border-ania-accent-border rounded-xl px-3.5 py-2 text-xs"
              />
              <button
                type="button"
                disabled={!exploreInput.trim() || exploreLoading}
                onClick={() => void handleExploreSupport()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-semibold disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{exploreLoading ? 'Pensando…' : 'Explorar'}</span>
              </button>
            </div>
            {exploreError && (
              <p className="text-xs text-ania-safety-accent bg-ania-safety-bg rounded-xl p-3 border border-ania-safety-border">
                {exploreError}
              </p>
            )}
            {exploreReply && (
              <p className="text-xs text-ania-ink bg-ania-surface rounded-xl p-3 border border-ania-accent-border leading-relaxed">
                {exploreReply}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Step 2: Personal Support Network + Bridge to CU2 */}
      <section className="bg-ania-surface border border-ania-border rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-ania-ink">
              2. Tu red personal de apoyo
            </h3>
            <p className="text-xs text-ania-ink-subtle">
              Personas con las que podrías sentirte cómoda/o compartiendo una necesidad, organizadas solo según lo que tú indiques.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNoOneMode((v) => !v)}
            className="text-xs text-ania-ink-muted underline underline-offset-2 hover:text-ania-ink"
          >
            {noOneMode ? 'Ocultar recursos comunitarios' : 'No tengo a nadie a quien recurrir ahora'}
          </button>
        </div>

        {/* Alternative Flow: No personal contact available */}
        {noOneMode && (
          <div className="bg-ania-lavender-bg border border-ania-lavender-border rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <HeartHandshake className="w-4 h-4 text-ania-lavender-accent mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-ania-lavender-text">
                  Es completamente comprensible sentir que ahora no hay alguien cercano disponible.
                </p>
                <p className="text-xs text-ania-lavender-muted leading-relaxed">
                  No estás obligada/o a sostenerlo todo por tu cuenta. Existen recursos sociales, sanitarios y comunitarios gratuitos pensados precisamente para acompañar cuando falta red cercana:
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {HUMAN_HELP_RESOURCES.map((r) => (
                <div key={r.id} className="bg-ania-surface rounded-xl p-3 border border-ania-lavender-border space-y-1">
                  <p className="text-xs font-semibold text-ania-ink">{r.name}</p>
                  <p className="text-[11px] text-ania-ink-muted">{r.description}</p>
                  <a
                    href={`tel:${r.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ania-lavender-accent pt-1 tabular-nums"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Llamar al {r.phone}</span>
                  </a>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ania-lavender-muted">
              También puedes pedir cita con tu médico de Atención Primaria o Trabajador/a Social de tu centro de salud para recibir orientación comunitaria y grupos de apoyo.
            </p>
          </div>
        )}

        {/* Saved Support People */}
        {people.length > 0 && (
          <div className="space-y-3">
            {people.map((person) => (
              <div
                key={person.id}
                className="bg-ania-surface-soft border border-ania-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ania-ink">{person.name}</p>
                    <span className="text-xs text-ania-ink-subtle">· {person.relationship}</span>
                    {person.isTrustedEmergencyContact && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ania-safety-accent">
                        <ShieldAlert className="w-3 h-3" />
                        Contacto de confianza en CU4
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ania-ink-secondary">
                    Tipo de apoyo:{' '}
                    {person.helpTypes
                      .map((t) => NEED_OPTIONS.find((n) => n.id === t)?.label ?? t)
                      .join(', ')}
                    {person.contactNote ? ` · ${person.contactNote}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPrepareMessage(person.name, 'pedir_ayuda')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-medium hover:bg-ania-accent-hover"
                  >
                    <MessageSquareHeart className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Preparar qué decirle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePerson(person.id, {
                        isTrustedEmergencyContact: !person.isTrustedEmergencyContact,
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-ania-surface border border-ania-border-strong text-[11px] font-medium text-ania-ink-secondary"
                  >
                    {person.isTrustedEmergencyContact ? 'Quitar de CU4' : 'Marcar para CU4'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePerson(person.id)}
                    className="p-2 text-ania-ink-subtle hover:text-ania-safety-accent"
                    title="Eliminar contacto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Person Form */}
        <form
          onSubmit={handleAddPerson}
          className="border-t border-ania-border pt-4 space-y-3 text-xs"
        >
          <p className="font-semibold text-ania-ink flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-ania-accent-text" aria-hidden="true" />
            <span>Añadir persona a mi red (opcional)</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre o apodo"
              className="px-3 py-2 bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
            />
            <input
              type="text"
              value={newRelation}
              onChange={(e) => setNewRelation(e.target.value)}
              placeholder="Relación (ej. hermana, amiga)"
              className="px-3 py-2 bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
            />
            <input
              type="text"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              placeholder="Teléfono o nota (opcional)"
              className="px-3 py-2 bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-ania-ink-muted">¿En qué podría ayudarte?</span>
            {NEED_OPTIONS.map((opt) => {
              const checked = newHelpTypes.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setNewHelpTypes((prev) =>
                      prev.includes(opt.id) ? prev.filter((x) => x !== opt.id) : [...prev, opt.id]
                    )
                  }
                  className={`px-2.5 py-1 rounded-lg border ${
                    checked
                      ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text'
                      : 'bg-ania-surface border-ania-border-strong text-ania-ink-muted'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-ania-ink-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={newTrustedEmergency}
                onChange={(e) => setNewTrustedEmergency(e.target.checked)}
                className="accent-ania-accent"
              />
              <span>Mostrar como contacto de confianza si se activa el protocolo de seguridad (CU4)</span>
            </label>
            <button
              type="submit"
              disabled={!newName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ania-accent text-ania-accent-on font-semibold disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir a mi red</span>
            </button>
          </div>
        </form>
      </section>

      {/* Step 3: Optional Professional Reference */}
      <section className="bg-ania-surface border border-ania-border rounded-2xl p-5 space-y-3 text-xs">
        <h3 className="font-display text-base font-semibold text-ania-ink">
          Tu profesional de referencia (opcional)
        </h3>
        <p className="text-ania-ink-subtle">
          Si ya cuentas con psicóloga/o, médico de familia u otro profesional, puedes guardarlo aquí para tenerlo a mano en momentos difíciles.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            type="text"
            value={profName}
            onChange={(e) => setProfName(e.target.value)}
            placeholder="Nombre del profesional o centro"
            className="px-3 py-2 bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
          />
          <input
            type="text"
            value={profRole}
            onChange={(e) => setProfRole(e.target.value)}
            placeholder="Especialidad (ej. Psicología, Centro de Salud)"
            className="px-3 py-2 bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
          />
          <input
            type="text"
            value={profContact}
            onChange={(e) => setProfContact(e.target.value)}
            placeholder="Teléfono o cómo pedir cita"
            className="px-3 py-2 bg-ania-surface-soft text-ania-ink placeholder:text-ania-ink-faint border border-ania-border rounded-xl"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              onSetProfessionalRef(
                profName.trim()
                  ? { name: profName.trim(), role: profRole.trim() || 'Profesional', contactNote: profContact.trim() }
                  : null
              );
              setProfSaved(true);
              setTimeout(() => setProfSaved(false), 2200);
            }}
            className="px-4 py-2 rounded-xl border border-ania-accent-border bg-ania-accent-tint text-ania-accent-text font-semibold"
          >
            {profSaved ? 'Guardado' : 'Guardar referencia'}
          </button>
        </div>
      </section>
    </div>
  );
}
