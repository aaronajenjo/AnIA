import { Download, Palette, Shield, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { AuditEntry, TextScale } from '../shared/types';

interface PrivacyControlModalProps {
  open: boolean;
  onClose: () => void;
  onOpenTheme?: () => void;
  memoryEnabled: boolean;
  onToggleMemory: (val: boolean) => void;
  easyRead: boolean;
  onToggleEasyRead: (val: boolean) => void;
  textScale: TextScale;
  onChangeTextScale: (scale: TextScale) => void;
  voiceReadAloud: boolean;
  onToggleVoiceReadAloud: (val: boolean) => void;
  onExportData: () => void;
  onResetConversation: (keepAuthorized: boolean) => void;
  onEraseAllData: () => void;
  auditLog: AuditEntry[];
}

export function PrivacyControlModal({
  open,
  onClose,
  onOpenTheme,
  memoryEnabled,
  onToggleMemory,
  easyRead,
  onToggleEasyRead,
  textScale,
  onChangeTextScale,
  voiceReadAloud,
  onToggleVoiceReadAloud,
  onExportData,
  onResetConversation,
  onEraseAllData,
  auditLog,
}: PrivacyControlModalProps) {
  const [confirmEraseAll, setConfirmEraseAll] = useState(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="bg-ania-surface border border-ania-border rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-ania-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-ania-accent-text" aria-hidden="true" />
            <h2 id="privacy-modal-title" className="font-display text-lg font-semibold text-ania-heading">
              Privacidad, accesibilidad y control de datos
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-ania-surface-soft text-ania-ink-muted"
            aria-label="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Memory Control */}
          <section className="space-y-3">
            <h3 className="font-display text-sm font-semibold text-ania-ink">
              Control de memoria y privacidad
            </h3>
            <label className="flex items-start justify-between gap-4 bg-ania-surface-soft border border-ania-border rounded-2xl p-4 cursor-pointer">
              <div>
                <p className="font-semibold text-ania-ink">Guardar mi espacio en este dispositivo</p>
                <p className="text-ania-ink-subtle mt-0.5 leading-relaxed">
                  Si lo desactivas, tus conversaciones y registros no se guardarán al cerrar o recargar. Nada se comparte jamás automáticamente.
                </p>
              </div>
              <input
                type="checkbox"
                checked={memoryEnabled}
                onChange={(e) => onToggleMemory(e.target.checked)}
                className="mt-1 accent-ania-accent w-4 h-4"
              />
            </label>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={onExportData}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-ania-accent text-ania-accent-on font-semibold hover:bg-ania-accent-hover transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar todos mis datos (JSON)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetConversation(true);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl border border-ania-border-strong bg-ania-surface font-medium text-ania-ink hover:bg-ania-surface-soft"
              >
                Limpiar solo el chat
              </button>
              {!confirmEraseAll ? (
                <button
                  type="button"
                  onClick={() => setConfirmEraseAll(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-ania-safety-border bg-ania-safety-bg font-medium text-ania-safety-accent"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar toda mi información</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-ania-safety-bg border border-ania-safety-border rounded-xl px-3 py-1.5">
                  <span className="text-ania-safety-text font-medium">¿Seguro? Se borrará todo:</span>
                  <button
                    type="button"
                    onClick={() => {
                      onEraseAllData();
                      setConfirmEraseAll(false);
                      onClose();
                    }}
                    className="px-3 py-1 rounded-lg bg-[#8D3718] text-white font-semibold"
                  >
                    Sí, borrar todo
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmEraseAll(false)}
                    className="px-2 py-1 text-ania-ink-muted"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Accessibility Controls */}
          <section className="space-y-3 border-t border-ania-border pt-5">
            <h3 className="font-display text-sm font-semibold text-ania-ink">
              Accesibilidad, apariencia y lectura adaptada
            </h3>

            {onOpenTheme && (
              <div className="bg-ania-surface-soft border border-ania-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ania-ink">Tema y colores de la aplicación</p>
                  <p className="text-ania-ink-subtle mt-0.5">
                    Cambia entre modo claro u oscuro, temas prediseñados o elige tus propios colores.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenTheme}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ania-surface border border-ania-border-strong font-medium text-ania-ink hover:bg-ania-surface-hover transition-colors"
                >
                  <Palette className="w-3.5 h-3.5 text-ania-accent-text" aria-hidden="true" />
                  <span>Personalizar tema</span>
                </button>
              </div>
            )}

            <label className="flex items-start justify-between gap-4 bg-ania-surface-soft border border-ania-border rounded-2xl p-4 cursor-pointer">
              <div>
                <p className="font-semibold text-ania-ink">Modo Lectura Fácil</p>
                <p className="text-ania-ink-subtle mt-0.5">
                  AnIA responderá con frases más cortas, vocabulario cotidiano sencillo y estructura más clara.
                </p>
              </div>
              <input
                type="checkbox"
                checked={easyRead}
                onChange={(e) => onToggleEasyRead(e.target.checked)}
                className="mt-1 accent-ania-accent w-4 h-4"
              />
            </label>

            <label className="flex items-start justify-between gap-4 bg-ania-surface-soft border border-ania-border rounded-2xl p-4 cursor-pointer">
              <div>
                <p className="font-semibold text-ania-ink">Lectura automática en voz alta</p>
                <p className="text-ania-ink-subtle mt-0.5">
                  Lee en voz alta cada nueva respuesta de AnIA. También puedes pulsar «Escuchar» en cualquier mensaje.
                </p>
              </div>
              <input
                type="checkbox"
                checked={voiceReadAloud}
                onChange={(e) => onToggleVoiceReadAloud(e.target.checked)}
                className="mt-1 accent-ania-accent w-4 h-4"
              />
            </label>

            <div className="bg-ania-surface-soft border border-ania-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ania-ink">Tamaño del texto</p>
                <p className="text-ania-ink-subtle">Ajusta la escala tipográfica para leer con mayor comodidad.</p>
              </div>
              <div className="flex gap-1.5">
                {(['normal', 'large', 'xlarge'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => onChangeTextScale(sz)}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      textScale === sz
                        ? 'bg-ania-accent border-ania-accent text-ania-accent-on'
                        : 'bg-ania-surface border-ania-border-strong text-ania-ink hover:bg-ania-surface-hover'
                    }`}
                  >
                    {sz === 'normal' ? 'Normal' : sz === 'large' ? 'Grande' : 'Muy grande'}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Audit / Traceability Log */}
          <section className="space-y-2 border-t border-ania-border pt-5">
            <h3 className="font-display text-sm font-semibold text-ania-ink">
              Registro de tus autorizaciones y acciones relevantes
            </h3>
            {auditLog.length === 0 ? (
              <p className="text-ania-ink-faint">Aún no se han registrado acciones.</p>
            ) : (
              <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {auditLog.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-baseline justify-between gap-3 py-1.5 border-b border-ania-border-subtle"
                  >
                    <span className="text-ania-ink">{entry.description}</span>
                    <span className="text-[11px] text-ania-ink-faint tabular-nums shrink-0">
                      {new Date(entry.timestamp).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
