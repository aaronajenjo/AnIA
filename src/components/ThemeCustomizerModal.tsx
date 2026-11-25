import { Check, Moon, Palette, RotateCcw, Sun, Type, X } from 'lucide-react';
import aniaLogo from '../assets/images/logo.png';
import {
  ACCENT_SWATCHES,
  DARK_BUBBLE_SWATCHES,
  DARK_CANVAS_SWATCHES,
  DARK_SURFACE_SWATCHES,
  DEFAULT_THEME_CONFIG,
  FONT_STYLE_OPTIONS,
  LIGHT_BUBBLE_SWATCHES,
  LIGHT_CANVAS_SWATCHES,
  LIGHT_SURFACE_SWATCHES,
  RADIUS_STYLE_OPTIONS,
  THEME_PRESETS,
  isExactDefaultPalette,
  resolveThemeTokens,
} from '../shared/themes';
import type { AppThemeConfig, ThemeMode } from '../shared/types';

interface ThemeCustomizerModalProps {
  open: boolean;
  config: AppThemeConfig;
  onChange: (next: AppThemeConfig) => void;
  onClose: () => void;
}

interface ColorControlRowProps {
  label: string;
  helper: string;
  value: string;
  swatches: Array<{ label: string; hex: string }>;
  onChange: (hex: string) => void;
}

function ColorControlRow({ label, helper, value, swatches, onChange }: ColorControlRowProps) {
  return (
    <div className="bg-ania-surface-soft border border-ania-border rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ania-heading">{label}</p>
          <p className="text-xs text-ania-ink-subtle">{helper}</p>
        </div>
        <label className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-ania-surface border border-ania-border-strong cursor-pointer shrink-0">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="w-6 h-6 rounded-md border-0 bg-transparent cursor-pointer p-0"
            aria-label={`Elegir ${label.toLowerCase()}`}
          />
          <span className="text-xs font-mono text-ania-ink-secondary uppercase">{value}</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {swatches.map((swatch) => {
          const active = value.toUpperCase() === swatch.hex.toUpperCase();
          return (
            <button
              key={swatch.hex}
              type="button"
              onClick={() => onChange(swatch.hex)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-colors ${
                active
                  ? 'border-ania-accent bg-ania-accent-soft text-ania-accent-text font-medium'
                  : 'border-ania-border bg-ania-surface text-ania-ink-secondary hover:border-ania-border-strong'
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                style={{ backgroundColor: swatch.hex }}
                aria-hidden="true"
              />
              {swatch.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ThemeCustomizerModal({
  open,
  config,
  onChange,
  onClose,
}: ThemeCustomizerModalProps) {
  if (!open) return null;

  const previewTokens = resolveThemeTokens(config);
  const isDefault =
    isExactDefaultPalette(config) &&
    config.fontStyle === DEFAULT_THEME_CONFIG.fontStyle &&
    config.radiusStyle === DEFAULT_THEME_CONFIG.radiusStyle;

  const handleModeChange = (nextMode: ThemeMode) => {
    if (nextMode === config.mode) return;
    if (nextMode === 'dark') {
      onChange({
        ...config,
        presetId: 'custom',
        mode: 'dark',
        canvasColor: '#141918',
        surfaceColor: '#1C2321',
        userBubbleColor: '#283631',
        accentColor:
          config.accentColor.toUpperCase() === '#2B5F4B' ? '#6DB39A' : config.accentColor,
      });
    } else {
      onChange({
        ...config,
        presetId: 'custom',
        mode: 'light',
        canvasColor: '#FAF7F2',
        surfaceColor: '#FFFFFF',
        userBubbleColor: '#FAECE2',
        accentColor:
          config.accentColor.toUpperCase() === '#6DB39A' ? '#2B5F4B' : config.accentColor,
      });
    }
  };

  const patchCustom = (patch: Partial<AppThemeConfig>) => {
    onChange({
      ...config,
      ...patch,
      presetId: 'custom',
    });
  };

  const canvasSwatches =
    config.mode === 'dark' ? DARK_CANVAS_SWATCHES : LIGHT_CANVAS_SWATCHES;
  const surfaceSwatches =
    config.mode === 'dark' ? DARK_SURFACE_SWATCHES : LIGHT_SURFACE_SWATCHES;
  const bubbleSwatches =
    config.mode === 'dark' ? DARK_BUBBLE_SWATCHES : LIGHT_BUBBLE_SWATCHES;

  const previewCardRadius =
    config.radiusStyle === 'crisp'
      ? '0.625rem'
      : config.radiusStyle === 'rounded'
        ? '1.5rem'
        : '1rem';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-customizer-title"
    >
      <div className="bg-ania-surface border border-ania-border rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ania-border-subtle flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-ania-accent-soft text-ania-accent-text flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="theme-customizer-title"
                className="font-display text-lg font-semibold text-ania-heading"
              >
                Personalizar apariencia y tema
              </h2>
              <p className="text-xs text-ania-ink-subtle">
                Avena y Salvia es el tema principal, pero puedes adaptar colores, modo y estilo a tu gusto.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-ania-ink-muted hover:bg-ania-surface-hover transition-colors"
            aria-label="Cerrar personalización de tema"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Live Interactive Preview */}
          <section aria-label="Vista previa del tema">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ania-ink-subtle">
                Vista previa en vivo
              </p>
              <span className="text-xs text-ania-ink-subtle">
                {config.presetId === 'custom'
                  ? 'Estilo personalizado'
                  : THEME_PRESETS.find((p) => p.id === config.presetId)?.name ?? 'Avena y Salvia'}
              </span>
            </div>

            <div
              className="p-4 border transition-colors"
              style={{
                backgroundColor: previewTokens.canvas,
                borderColor: previewTokens.border,
                borderRadius: previewCardRadius,
                fontFamily: previewTokens.fontBody,
              }}
            >
              <div
                className="p-4 border space-y-3"
                style={{
                  backgroundColor: previewTokens.surface,
                  borderColor: previewTokens.border,
                  borderRadius: previewCardRadius,
                }}
              >
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b" style={{ borderColor: previewTokens.borderSubtle }}>
                  <div className="flex items-center gap-2">
                    <img
                      src={aniaLogo}
                      alt=""
                      aria-hidden="true"
                      className="w-7 h-7 object-contain shrink-0"
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: previewTokens.heading,
                        fontFamily: previewTokens.fontDisplay,
                      }}
                    >
                      AnIA · Espacio seguro
                    </span>
                  </div>
                  <span
                    className="px-2.5 py-1 text-[11px] font-medium"
                    style={{
                      backgroundColor: previewTokens.accent,
                      color: previewTokens.accentOn,
                      borderRadius: config.radiusStyle === 'crisp' ? '0.375rem' : '0.625rem',
                    }}
                  >
                    Acción principal
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div
                    className="px-3.5 py-2.5 border leading-relaxed"
                    style={{
                      backgroundColor: previewTokens.surfaceSoft,
                      borderColor: previewTokens.border,
                      color: previewTokens.ink,
                      borderRadius: previewCardRadius,
                    }}
                  >
                    Estoy aquí contigo. Puedes ir a tu ritmo y elegir cómo prefieres sentir este espacio.
                  </div>
                  <div
                    className="px-3.5 py-2.5 leading-relaxed"
                    style={{
                      backgroundColor: previewTokens.userBubble,
                      color: previewTokens.userBubbleText,
                      borderRadius: previewCardRadius,
                    }}
                  >
                    Hoy me ayuda tener unos colores suaves que me transmitan calma al escribir.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 1. Curated Presets */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ania-heading">Temas prediseñados</h3>
              <span className="text-xs text-ania-ink-subtle">Elige una base o personalízala abajo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {THEME_PRESETS.map((preset) => {
                const isSelected = config.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onChange({ ...preset.config })}
                    className={`text-left p-3.5 rounded-2xl border transition-colors flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-ania-accent bg-ania-accent-tint'
                        : 'border-ania-border bg-ania-surface hover:border-ania-border-strong hover:bg-ania-surface-soft'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-ania-heading flex items-center gap-1.5">
                          <span>{preset.name}</span>
                          {preset.isDefault && (
                            <span className="text-[11px] font-medium text-ania-accent-text">
                              · Principal
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-ania-ink-subtle mt-0.5 leading-snug">
                          {preset.subtitle}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-ania-accent text-ania-accent-on flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" aria-hidden="true" />
                        </span>
                      )}
                    </div>

                    {/* Palette Strip */}
                    <div className="flex items-center gap-1.5">
                      {[
                        preset.config.canvasColor,
                        preset.config.surfaceColor,
                        preset.config.accentColor,
                        preset.config.userBubbleColor,
                      ].map((hex, i) => (
                        <span
                          key={`${preset.id}-${i}`}
                          className="h-4 flex-1 rounded-md border border-black/10"
                          style={{ backgroundColor: hex }}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Free Customization */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ania-heading">Personalización libre</h3>
              <div
                className="inline-flex items-center gap-1 p-1 rounded-xl bg-ania-surface-soft border border-ania-border text-xs"
                role="group"
                aria-label="Modo de luminosidad"
              >
                <button
                  type="button"
                  onClick={() => handleModeChange('light')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    config.mode === 'light'
                      ? 'bg-ania-surface text-ania-heading shadow-xs'
                      : 'text-ania-ink-subtle hover:text-ania-ink'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                  Claro
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('dark')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    config.mode === 'dark'
                      ? 'bg-ania-surface text-ania-heading shadow-xs'
                      : 'text-ania-ink-subtle hover:text-ania-ink'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                  Oscuro
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ColorControlRow
                label="Color de acento"
                helper="Botones principales, iconos activos y destacados."
                value={config.accentColor}
                swatches={ACCENT_SWATCHES}
                onChange={(hex) => patchCustom({ accentColor: hex })}
              />
              <ColorControlRow
                label="Fondo general"
                helper="El lienzo exterior de la barra lateral y los márgenes."
                value={config.canvasColor}
                swatches={canvasSwatches}
                onChange={(hex) => patchCustom({ canvasColor: hex })}
              />
              <ColorControlRow
                label="Tarjetas y paneles"
                helper="Superficie principal de conversación, diario y notas."
                value={config.surfaceColor}
                swatches={surfaceSwatches}
                onChange={(hex) => patchCustom({ surfaceColor: hex })}
              />
              <ColorControlRow
                label="Tus mensajes"
                helper="Color de las burbujas donde aparecen tus palabras."
                value={config.userBubbleColor}
                swatches={bubbleSwatches}
                onChange={(hex) => patchCustom({ userBubbleColor: hex })}
              />
            </div>
          </section>

          {/* 3. Typography & Corner Style */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Type className="w-4 h-4 text-ania-accent-text" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-ania-heading">Estilo tipográfico</h3>
              </div>
              <div className="space-y-2">
                {FONT_STYLE_OPTIONS.map((opt) => {
                  const active = config.fontStyle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChange({ ...config, fontStyle: opt.id })}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors ${
                        active
                          ? 'border-ania-accent bg-ania-accent-tint'
                          : 'border-ania-border bg-ania-surface hover:bg-ania-surface-soft'
                      }`}
                    >
                      <p
                        className="text-sm font-semibold text-ania-heading"
                        style={{ fontFamily: opt.previewDisplay }}
                      >
                        {opt.label}
                      </p>
                      <p
                        className="text-xs text-ania-ink-subtle mt-0.5"
                        style={{ fontFamily: opt.previewBody }}
                      >
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-ania-heading">Redondeado de tarjetas</h3>
              <div className="space-y-2">
                {RADIUS_STYLE_OPTIONS.map((opt) => {
                  const active = config.radiusStyle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChange({ ...config, radiusStyle: opt.id })}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                        active
                          ? 'border-ania-accent bg-ania-accent-tint'
                          : 'border-ania-border bg-ania-surface hover:bg-ania-surface-soft'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-ania-heading">{opt.label}</p>
                        <p className="text-xs text-ania-ink-subtle mt-0.5">{opt.description}</p>
                      </div>
                      <span
                        className="w-8 h-6 border-2 border-ania-accent-border bg-ania-accent-soft shrink-0"
                        style={{
                          borderRadius:
                            opt.id === 'crisp'
                              ? '4px'
                              : opt.id === 'rounded'
                                ? '14px'
                                : '9px',
                        }}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ania-border-subtle bg-ania-surface-soft flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_THEME_CONFIG })}
            disabled={isDefault}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-ania-border-strong bg-ania-surface text-xs font-medium text-ania-ink-secondary hover:bg-ania-surface-hover disabled:opacity-45 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Restaurar tema principal (Avena y Salvia)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-ania-accent hover:bg-ania-accent-hover text-ania-accent-on text-sm font-medium transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
