import type {
  AppThemeConfig,
  ThemeFontStyle,
  ThemeMode,
  ThemePresetId,
  ThemeRadiusStyle,
} from './types';

export interface ThemePresetDefinition {
  id: Exclude<ThemePresetId, 'custom'>;
  name: string;
  subtitle: string;
  isDefault?: boolean;
  config: AppThemeConfig;
}

export const DEFAULT_THEME_CONFIG: AppThemeConfig = {
  presetId: 'avena_salvia',
  mode: 'light',
  accentColor: '#2B5F4B',
  canvasColor: '#FAF7F2',
  surfaceColor: '#FFFFFF',
  userBubbleColor: '#FAECE2',
  fontStyle: 'classic',
  radiusStyle: 'soft',
};

export const THEME_PRESETS: ThemePresetDefinition[] = [
  {
    id: 'avena_salvia',
    name: 'Avena y Salvia',
    subtitle: 'Tema principal · cálido y sereno',
    isDefault: true,
    config: DEFAULT_THEME_CONFIG,
  },
  {
    id: 'brisa_marina',
    name: 'Brisa Marina',
    subtitle: 'Claro · calma costera y aire fresco',
    config: {
      presetId: 'brisa_marina',
      mode: 'light',
      accentColor: '#2A5C75',
      canvasColor: '#F3F7F9',
      surfaceColor: '#FFFFFF',
      userBubbleColor: '#E3EEF4',
      fontStyle: 'classic',
      radiusStyle: 'soft',
    },
  },
  {
    id: 'atardecer_terracota',
    name: 'Atardecer Cálido',
    subtitle: 'Claro · luz de tarde y arcilla suave',
    config: {
      presetId: 'atardecer_terracota',
      mode: 'light',
      accentColor: '#9C4D34',
      canvasColor: '#FBF5F0',
      surfaceColor: '#FFFFFF',
      userBubbleColor: '#F8E6DA',
      fontStyle: 'editorial',
      radiusStyle: 'soft',
    },
  },
  {
    id: 'jardin_lavanda',
    name: 'Jardín Lavanda',
    subtitle: 'Claro · suave, contemplativo y luminoso',
    config: {
      presetId: 'jardin_lavanda',
      mode: 'light',
      accentColor: '#5B4B8A',
      canvasColor: '#F7F5FB',
      surfaceColor: '#FFFFFF',
      userBubbleColor: '#ECE7F8',
      fontStyle: 'classic',
      radiusStyle: 'rounded',
    },
  },
  {
    id: 'noche_serena',
    name: 'Noche Serena',
    subtitle: 'Oscuro · descanso visual nocturno',
    config: {
      presetId: 'noche_serena',
      mode: 'dark',
      accentColor: '#6DB39A',
      canvasColor: '#141918',
      surfaceColor: '#1C2321',
      userBubbleColor: '#283631',
      fontStyle: 'classic',
      radiusStyle: 'soft',
    },
  },
  {
    id: 'bosque_profundo',
    name: 'Índigo Nocturno',
    subtitle: 'Oscuro · azul profundo y calma suave',
    config: {
      presetId: 'bosque_profundo',
      mode: 'dark',
      accentColor: '#8B9AE6',
      canvasColor: '#141621',
      surfaceColor: '#1D2030',
      userBubbleColor: '#2A2F47',
      fontStyle: 'modern',
      radiusStyle: 'soft',
    },
  },
];

export const ACCENT_SWATCHES = [
  { label: 'Salvia', hex: '#2B5F4B' },
  { label: 'Océano', hex: '#2A5C75' },
  { label: 'Lavanda', hex: '#5B4B8A' },
  { label: 'Terracota', hex: '#9C4D34' },
  { label: 'Oliva', hex: '#596B3D' },
  { label: 'Ciruela', hex: '#7A3E5E' },
  { label: 'Menta nocturna', hex: '#6DB39A' },
  { label: 'Índigo suave', hex: '#8B9AE6' },
];

export const LIGHT_CANVAS_SWATCHES = [
  { label: 'Avena', hex: '#FAF7F2' },
  { label: 'Brisa', hex: '#F3F7F9' },
  { label: 'Lino', hex: '#F7F4EF' },
  { label: 'Lavanda alba', hex: '#F7F5FB' },
  { label: 'Arena rosada', hex: '#FBF5F0' },
  { label: 'Blanco nube', hex: '#F8F9FA' },
];

export const DARK_CANVAS_SWATCHES = [
  { label: 'Pino noche', hex: '#141918' },
  { label: 'Índigo noche', hex: '#141621' },
  { label: 'Grafito cálido', hex: '#1A1917' },
  { label: 'Pizarra', hex: '#151921' },
  { label: 'Musgo oscuro', hex: '#151C19' },
  { label: 'Ciruela noche', hex: '#1B1620' },
];

export const LIGHT_SURFACE_SWATCHES = [
  { label: 'Blanco puro', hex: '#FFFFFF' },
  { label: 'Marfil', hex: '#FDFBF7' },
  { label: 'Hielo', hex: '#F9FCFD' },
  { label: 'Crema', hex: '#FCF9F3' },
];

export const DARK_SURFACE_SWATCHES = [
  { label: 'Bosque 2', hex: '#1C2321' },
  { label: 'Índigo 2', hex: '#1D2030' },
  { label: 'Carbón cálido', hex: '#23211E' },
  { label: 'Pizarra 2', hex: '#1E242E' },
];

export const LIGHT_BUBBLE_SWATCHES = [
  { label: 'Melocotón', hex: '#FAECE2' },
  { label: 'Salvia pálida', hex: '#E5F0EA' },
  { label: 'Cielo suave', hex: '#E3EEF4' },
  { label: 'Lavanda', hex: '#ECE7F8' },
  { label: 'Arena', hex: '#F2EBE0' },
];

export const DARK_BUBBLE_SWATCHES = [
  { label: 'Salvia noche', hex: '#283631' },
  { label: 'Índigo suave', hex: '#2A2F47' },
  { label: 'Terracota noche', hex: '#3A2B26' },
  { label: 'Pizarra suave', hex: '#28313D' },
  { label: 'Ciruela noche', hex: '#34273B' },
];

export const FONT_STYLE_OPTIONS: Array<{
  id: ThemeFontStyle;
  label: string;
  description: string;
  previewDisplay: string;
  previewBody: string;
}> = [
  {
    id: 'classic',
    label: 'Clásica serena',
    description: 'Títulos con serifa suave (Lora) y lectura limpia (DM Sans).',
    previewDisplay: '"Lora", Georgia, serif',
    previewBody: '"DM Sans", system-ui, -apple-system, sans-serif',
  },
  {
    id: 'modern',
    label: 'Moderna limpia',
    description: 'Tipografía geométrica y despejada en toda la aplicación.',
    previewDisplay: '"DM Sans", system-ui, -apple-system, sans-serif',
    previewBody: '"DM Sans", system-ui, -apple-system, sans-serif',
  },
  {
    id: 'editorial',
    label: 'Editorial cálida',
    description: 'Estilo cuaderno íntimo con serifa amable en títulos y textos.',
    previewDisplay: '"Lora", Georgia, serif',
    previewBody: '"Lora", Georgia, serif',
  },
];

export const RADIUS_STYLE_OPTIONS: Array<{
  id: ThemeRadiusStyle;
  label: string;
  description: string;
}> = [
  { id: 'crisp', label: 'Minimalista', description: 'Bordes definidos y discretos' },
  { id: 'soft', label: 'Suave', description: 'Equilibrio orgánico principal' },
  { id: 'rounded', label: 'Muy suave', description: 'Esquinas amplias y envolventes' },
];

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function normalizeHex(input: string, fallback: string): string {
  const cleaned = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) return cleaned.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(cleaned)) {
    const r = cleaned[1];
    const g = cleaned[2];
    const b = cleaned[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return fallback.toUpperCase();
}

function hexToRgb(hex: string): Rgb {
  const safe = normalizeHex(hex, '#2B5F4B');
  return {
    r: parseInt(safe.slice(1, 3), 16),
    g: parseInt(safe.slice(3, 5), 16),
    b: parseInt(safe.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (v: number) => clampByte(v).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixHex(hexA: string, hexB: string, weightB: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const t = Math.max(0, Math.min(1, weightB));
  return rgbToHex({
    r: a.r * (1 - t) + b.r * t,
    g: a.g * (1 - t) + b.g * t,
    b: a.b * (1 - t) + b.b * t,
  });
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function ensureReadableTextColor(candidate: string, background: string, minRatio = 4.5): string {
  if (getContrastRatio(candidate, background) >= minRatio) {
    return candidate;
  }
  const bgLum = relativeLuminance(background);
  const target = bgLum > 0.35 ? '#101513' : '#F4F7F5';
  let current = candidate;
  for (let step = 1; step <= 14; step += 1) {
    current = mixHex(candidate, target, step / 14);
    if (getContrastRatio(current, background) >= minRatio) {
      return current;
    }
  }
  return target;
}

export function isColorDark(hex: string): boolean {
  return relativeLuminance(hex) < 0.28;
}

export interface ResolvedThemeTokens {
  canvas: string;
  surface: string;
  surfaceSoft: string;
  surfaceMuted: string;
  surfaceHover: string;
  border: string;
  borderStrong: string;
  borderSubtle: string;
  ink: string;
  heading: string;
  inkSecondary: string;
  inkMuted: string;
  inkSubtle: string;
  inkFaint: string;
  accent: string;
  accentHover: string;
  accentText: string;
  accentOn: string;
  accentSoft: string;
  accentTint: string;
  accentBorder: string;
  userBubble: string;
  userBubbleText: string;
  userBubbleSoft: string;
  lavenderBg: string;
  lavenderBorder: string;
  lavenderText: string;
  lavenderMuted: string;
  lavenderAccent: string;
  safetyBg: string;
  safetyBorder: string;
  safetyText: string;
  safetyAccent: string;
  fontDisplay: string;
  fontBody: string;
  effectiveMode: ThemeMode;
}

function getFontPair(fontStyle: ThemeFontStyle): { fontDisplay: string; fontBody: string } {
  if (fontStyle === 'modern') {
    return {
      fontDisplay: '"DM Sans", system-ui, -apple-system, sans-serif',
      fontBody: '"DM Sans", system-ui, -apple-system, sans-serif',
    };
  }
  if (fontStyle === 'editorial') {
    return {
      fontDisplay: '"Lora", Georgia, serif',
      fontBody: '"Lora", Georgia, serif',
    };
  }
  return {
    fontDisplay: '"Lora", Georgia, serif',
    fontBody: '"DM Sans", system-ui, -apple-system, sans-serif',
  };
}

export function isExactDefaultPalette(config: AppThemeConfig): boolean {
  return (
    config.mode === 'light' &&
    normalizeHex(config.accentColor, '#2B5F4B') === '#2B5F4B' &&
    normalizeHex(config.canvasColor, '#FAF7F2') === '#FAF7F2' &&
    normalizeHex(config.surfaceColor, '#FFFFFF') === '#FFFFFF' &&
    normalizeHex(config.userBubbleColor, '#FAECE2') === '#FAECE2'
  );
}

export function resolveThemeTokens(config: AppThemeConfig): ResolvedThemeTokens {
  const fonts = getFontPair(config.fontStyle);

  // Pixel-exact preservation of the primary Avena y Salvia theme
  if (isExactDefaultPalette(config)) {
    return {
      canvas: '#FAF7F2',
      surface: '#FFFFFF',
      surfaceSoft: '#FAF7F2',
      surfaceMuted: '#F5EFE6',
      surfaceHover: '#F2EDE5',
      border: '#E7E2D8',
      borderStrong: '#D8D1C5',
      borderSubtle: '#EFEBE3',
      ink: '#232926',
      heading: '#1E332B',
      inkSecondary: '#4B524E',
      inkMuted: '#59605B',
      inkSubtle: '#6A716C',
      inkFaint: '#7A807C',
      accent: '#2B5F4B',
      accentHover: '#204A3A',
      accentText: '#1E4D3B',
      accentOn: '#FFFFFF',
      accentSoft: '#E5F0EA',
      accentTint: '#F1F6F3',
      accentBorder: '#C8DDD1',
      userBubble: '#FAECE2',
      userBubbleText: '#232926',
      userBubbleSoft: '#FAF0EA',
      lavenderBg: '#EEECF9',
      lavenderBorder: '#DBD6F3',
      lavenderText: '#2E265B',
      lavenderMuted: '#4C447A',
      lavenderAccent: '#3E3572',
      safetyBg: '#FDECE4',
      safetyBorder: '#F3CBB9',
      safetyText: '#7A2E14',
      safetyAccent: '#8D3718',
      ...fonts,
      effectiveMode: 'light',
    };
  }

  const canvas = normalizeHex(
    config.canvasColor,
    config.mode === 'dark' ? '#141918' : '#FAF7F2'
  );
  const surface = normalizeHex(
    config.surfaceColor,
    config.mode === 'dark' ? '#1C2321' : '#FFFFFF'
  );
  const accent = normalizeHex(
    config.accentColor,
    config.mode === 'dark' ? '#6DB39A' : '#2B5F4B'
  );
  const userBubble = normalizeHex(
    config.userBubbleColor,
    config.mode === 'dark' ? '#283631' : '#FAECE2'
  );

  // Detect actual visual polarity from surface luminance so custom colors never break contrast
  const darkSurface = isColorDark(surface);
  const effectiveMode: ThemeMode = darkSurface ? 'dark' : 'light';

  const ink = darkSurface ? '#EDF2EE' : '#232926';
  const heading = darkSurface
    ? mixHex('#F3F7F4', accent, 0.14)
    : ensureReadableTextColor(mixHex('#1A2622', accent, 0.22), surface, 7);
  const inkSecondary = darkSurface ? '#C8D1CC' : '#4B524E';
  const inkMuted = darkSurface ? '#A8B3AD' : '#59605B';
  const inkSubtle = darkSurface ? '#929E97' : '#6A716C';
  const inkFaint = darkSurface ? '#7E8A84' : '#7A807C';

  const surfaceSoft = darkSurface
    ? mixHex(surface, canvas, 0.45)
    : mixHex(surface, canvas, 0.72);
  const surfaceMuted = darkSurface
    ? mixHex(surface, '#FFFFFF', 0.06)
    : mixHex(canvas, '#000000', 0.035);
  const surfaceHover = darkSurface
    ? mixHex(surface, '#FFFFFF', 0.09)
    : mixHex(canvas, '#000000', 0.055);

  const border = darkSurface
    ? mixHex(surface, '#FFFFFF', 0.12)
    : mixHex(canvas, '#232926', 0.12);
  const borderStrong = darkSurface
    ? mixHex(surface, '#FFFFFF', 0.2)
    : mixHex(canvas, '#232926', 0.2);
  const borderSubtle = darkSurface
    ? mixHex(surface, '#FFFFFF', 0.08)
    : mixHex(canvas, '#232926', 0.075);

  const accentOn = getContrastRatio('#FFFFFF', accent) >= 4.5 ? '#FFFFFF' : '#111815';
  const accentHover = darkSurface
    ? mixHex(accent, '#FFFFFF', 0.12)
    : mixHex(accent, '#000000', 0.16);
  const accentText = ensureReadableTextColor(accent, surface, 4.6);
  const accentSoft = darkSurface
    ? mixHex(surface, accent, 0.22)
    : mixHex(surface, accent, 0.12);
  const accentTint = darkSurface
    ? mixHex(surface, accent, 0.13)
    : mixHex(surface, accent, 0.065);
  const accentBorder = darkSurface
    ? mixHex(surface, accent, 0.38)
    : mixHex(surface, accent, 0.28);

  const userBubbleText =
    getContrastRatio('#1C2320', userBubble) >= getContrastRatio('#F4F7F5', userBubble)
      ? '#1C2320'
      : '#F4F7F5';
  const userBubbleSoft = darkSurface
    ? mixHex(surface, userBubble, 0.55)
    : mixHex(surface, userBubble, 0.52);

  // Calming lavender & safety palettes adapted for light vs dark readability
  const lavenderBg = darkSurface ? mixHex(surface, '#6F63B5', 0.22) : '#EEECF9';
  const lavenderBorder = darkSurface ? mixHex(surface, '#9B90DC', 0.36) : '#DBD6F3';
  const lavenderText = darkSurface ? '#E6E2FA' : '#2E265B';
  const lavenderMuted = darkSurface ? '#C7BFEB' : '#4C447A';
  const lavenderAccent = darkSurface ? '#D3CBFA' : '#3E3572';

  const safetyBg = darkSurface ? mixHex(surface, '#B94E2A', 0.24) : '#FDECE4';
  const safetyBorder = darkSurface ? mixHex(surface, '#DF7A55', 0.4) : '#F3CBB9';
  const safetyText = darkSurface ? '#FBD9CA' : '#7A2E14';
  const safetyAccent = darkSurface ? '#F6B69B' : '#8D3718';

  return {
    canvas,
    surface,
    surfaceSoft,
    surfaceMuted,
    surfaceHover,
    border,
    borderStrong,
    borderSubtle,
    ink,
    heading,
    inkSecondary,
    inkMuted,
    inkSubtle,
    inkFaint,
    accent,
    accentHover,
    accentText,
    accentOn,
    accentSoft,
    accentTint,
    accentBorder,
    userBubble,
    userBubbleText,
    userBubbleSoft,
    lavenderBg,
    lavenderBorder,
    lavenderText,
    lavenderMuted,
    lavenderAccent,
    safetyBg,
    safetyBorder,
    safetyText,
    safetyAccent,
    ...fonts,
    effectiveMode,
  };
}

export function applyThemeToDocument(config: AppThemeConfig): ResolvedThemeTokens {
  const tokens = resolveThemeTokens(config);
  const root = document.documentElement;

  const entries: Array<[string, string]> = [
    ['--ania-canvas', tokens.canvas],
    ['--ania-surface', tokens.surface],
    ['--ania-surface-soft', tokens.surfaceSoft],
    ['--ania-surface-muted', tokens.surfaceMuted],
    ['--ania-surface-hover', tokens.surfaceHover],
    ['--ania-border', tokens.border],
    ['--ania-border-strong', tokens.borderStrong],
    ['--ania-border-subtle', tokens.borderSubtle],
    ['--ania-ink', tokens.ink],
    ['--ania-heading', tokens.heading],
    ['--ania-ink-secondary', tokens.inkSecondary],
    ['--ania-ink-muted', tokens.inkMuted],
    ['--ania-ink-subtle', tokens.inkSubtle],
    ['--ania-ink-faint', tokens.inkFaint],
    ['--ania-accent', tokens.accent],
    ['--ania-accent-hover', tokens.accentHover],
    ['--ania-accent-text', tokens.accentText],
    ['--ania-accent-on', tokens.accentOn],
    ['--ania-accent-soft', tokens.accentSoft],
    ['--ania-accent-tint', tokens.accentTint],
    ['--ania-accent-border', tokens.accentBorder],
    ['--ania-user-bubble', tokens.userBubble],
    ['--ania-user-bubble-text', tokens.userBubbleText],
    ['--ania-user-bubble-soft', tokens.userBubbleSoft],
    ['--ania-lavender-bg', tokens.lavenderBg],
    ['--ania-lavender-border', tokens.lavenderBorder],
    ['--ania-lavender-text', tokens.lavenderText],
    ['--ania-lavender-muted', tokens.lavenderMuted],
    ['--ania-lavender-accent', tokens.lavenderAccent],
    ['--ania-safety-bg', tokens.safetyBg],
    ['--ania-safety-border', tokens.safetyBorder],
    ['--ania-safety-text', tokens.safetyText],
    ['--ania-safety-accent', tokens.safetyAccent],
    ['--ania-font-display', tokens.fontDisplay],
    ['--ania-font-body', tokens.fontBody],
  ];

  for (const [key, value] of entries) {
    root.style.setProperty(key, value);
  }

  root.classList.toggle('dark', tokens.effectiveMode === 'dark');
  root.style.colorScheme = tokens.effectiveMode;
  root.dataset.themeRadius = config.radiusStyle;
  root.dataset.themeFont = config.fontStyle;

  return tokens;
}
