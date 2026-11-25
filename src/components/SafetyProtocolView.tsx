import { ArrowLeft, Copy, HeartHandshake, Phone, ShieldAlert, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { HUMAN_HELP_RESOURCES } from '../shared/safety';
import type { ProfessionalReference, SupportPerson } from '../shared/types';

interface SafetyProtocolViewProps {
  reason: string | null;
  trustedContacts: SupportPerson[];
  professionalRef: ProfessionalReference | null;
  onExit: () => void;
  onOpenSupportNetwork: () => void;
}

export function SafetyProtocolView({
  reason,
  trustedContacts,
  professionalRef,
  onExit,
  onOpenSupportNetwork,
}: SafetyProtocolViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dismissedOption, setDismissedOption] = useState<string[]>([]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
      {/* Transparent non-judgmental safety notice */}
      <div className="bg-ania-safety-bg border border-ania-safety-border rounded-2xl p-6">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-ania-surface text-ania-safety-accent flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold text-ania-safety-text">
              Priorizamos tu seguridad y el apoyo humano
            </h2>
            <p className="text-sm leading-relaxed text-ania-safety-text">
              {reason ||
                'Cuando aparece un malestar muy intenso o una posible situación de riesgo, AnIA pausa sus resúmenes y funciones secundarias para facilitarte el contacto con personas reales y profesionales.'}
            </p>
            <p className="text-xs leading-relaxed text-ania-safety-accent">
              AnIA no sustituye una valoración clínica ni gestiona crisis de forma autónoma. Tú sigues manteniendo el control sobre a quién contactar.
            </p>
          </div>
        </div>
      </div>

      {/* Configured Trusted Contacts */}
      {!dismissedOption.includes('trusted') && (
        <section className="bg-ania-surface border border-ania-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-ania-accent-text" aria-hidden="true" />
              <h3 className="font-display text-base font-semibold text-ania-ink">
                Tu persona o contacto de confianza
              </h3>
            </div>
            {trustedContacts.length > 0 && (
              <button
                type="button"
                onClick={() => setDismissedOption((p) => [...p, 'trusted'])}
                className="text-xs text-ania-ink-subtle hover:text-ania-ink"
              >
                Ahora no esta opción
              </button>
            )}
          </div>

          {trustedContacts.length > 0 ? (
            <div className="space-y-3">
              {trustedContacts.map((person) => {
                const draftHelpText = `Hola ${person.name}, ahora mismo no estoy pasando un buen momento y necesitaría hablar o estar acompañada/o un rato. ¿Podríamos hablar?`;
                return (
                  <div
                    key={person.id}
                    className="p-4 rounded-xl bg-ania-accent-tint border border-ania-accent-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ania-heading">
                        {person.name} · <span className="font-normal text-ania-ink-secondary">{person.relationship}</span>
                      </p>
                      {person.contactNote && (
                        <p className="text-xs text-ania-ink-secondary mt-0.5 tabular-nums">
                          Contacto guardado: {person.contactNote}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {person.contactNote && /^[\d\s+()-]{6,}$/.test(person.contactNote.trim()) && (
                        <a
                          href={`tel:${person.contactNote.replace(/\s+/g, '')}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-medium hover:bg-ania-accent-hover transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Llamar</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopy(person.id, draftHelpText)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ania-surface border border-ania-accent-border text-ania-accent-text text-xs font-medium hover:bg-ania-accent-soft transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{copiedId === person.id ? 'Mensaje copiado' : 'Copiar mensaje para pedir ayuda'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-ania-surface-soft rounded-xl p-4">
              <p className="text-xs text-ania-ink-muted leading-relaxed">
                Aún no has guardado un contacto de confianza. Si lo deseas, puedes añadirlo en tu Red de apoyo (solo tú decides quién aparece aquí).
              </p>
              <button
                type="button"
                onClick={onOpenSupportNetwork}
                className="px-3.5 py-2 rounded-xl border border-ania-border-strong bg-ania-surface text-xs font-medium text-ania-ink hover:bg-ania-surface-hover whitespace-nowrap shrink-0"
              >
                Configurar contacto
              </button>
            </div>
          )}
        </section>
      )}

      {/* Professional Reference if configured */}
      {professionalRef && professionalRef.name && (
        <section className="bg-ania-surface border border-ania-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-ania-accent-text" aria-hidden="true" />
            <h3 className="font-display text-base font-semibold text-ania-ink">
              Tu profesional de referencia
            </h3>
          </div>
          <p className="text-sm text-ania-ink">
            {professionalRef.name} · <span className="text-ania-ink-muted">{professionalRef.role}</span>
          </p>
          {professionalRef.contactNote && (
            <p className="text-xs text-ania-ink-muted tabular-nums">{professionalRef.contactNote}</p>
          )}
        </section>
      )}

      {/* Human & Emergency Helplines */}
      <section className="space-y-3">
        <h3 className="font-display text-base font-semibold text-ania-ink">
          Líneas de atención humana y urgencias (España)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {HUMAN_HELP_RESOURCES.map((res) => (
            <div
              key={res.id}
              className={`rounded-2xl p-4 border flex flex-col justify-between gap-3 ${
                res.urgent
                  ? 'bg-ania-safety-bg border-ania-safety-border'
                  : 'bg-ania-surface border-ania-border'
              }`}
            >
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-ania-ink">{res.name}</p>
                <p className="text-xs text-ania-ink-subtle">{res.availability}</p>
                <p className="text-xs leading-relaxed text-ania-ink-secondary">{res.description}</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${res.phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8D3718] text-white text-xs font-semibold hover:bg-[#732B12] transition-colors tabular-nums"
                >
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Llamar al {res.phone}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-ania-ink-subtle leading-relaxed">
          Si estás fuera de España o prefieres atención presencial, acude al centro de salud u hospital de urgencias más cercano o contacta con el teléfono de emergencias local.
        </p>
      </section>

      {/* Return control */}
      <div className="pt-2 border-t border-ania-border flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ania-ink-subtle">
          Las líneas de ayuda seguirán visibles en el panel lateral siempre que las necesites.
        </p>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-ania-border-strong bg-ania-surface text-xs font-medium text-ania-ink hover:bg-ania-surface-soft transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Volver a mi espacio habitual</span>
        </button>
      </div>
    </div>
  );
}
