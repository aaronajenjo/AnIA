import type { SafetyDetectionResult } from './types.ts';

/**
 * Deterministic risk screening (CU4 Safeguard:
 * "La detección no debe depender exclusivamente de la generación libre de un LLM.")
 *
 * Note: This screen does NOT assign a clinical risk score or diagnosis.
 * It strictly detects expressions compatible with potential immediate harm or crisis
 * to prioritize human connection and safety resources.
 */
const RISK_PATTERNS: Array<{
  category: 'self_harm' | 'acute_crisis' | 'violence_danger';
  regex: RegExp;
}> = [
  {
    category: 'self_harm',
    regex:
      /\b(suicid\w*|quitarme la vida|acabar con mi vida|acabar con todo|no quiero vivir|no quiero seguir viviendo|mejor muert[oa]|ojala estuviera muert[oa]|ojalá estuviera muert[oa]|autolesi\w*|cortarme|hacerme dano|hacerme daño|matarme|tirarme por|pastillas para morir|desaparecer para siempre|kill myself|end my life|want to die|self[- ]harm)\b/i,
  },
  {
    category: 'acute_crisis',
    regex:
      /\b(no puedo mas y voy a|despedirme de todos|carta de despedida|nadie me va a echar de menos si me voy|ya tome una decision final|ya tomé una decisión final|estoy en peligro ahora|crisis grave ahora)\b/i,
  },
  {
    category: 'violence_danger',
    regex:
      /\b(me va a matar|me pega|maltrato fisico|maltrato físico|amenaza con matarme|miedo por mi vida|peligro en casa ahora|abuso sexual|me obligan)\b/i,
  },
];

function normalizeSpanish(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function detectRiskIndicators(text: string): SafetyDetectionResult {
  if (!text || typeof text !== 'string') {
    return { triggered: false };
  }

  const normalized = normalizeSpanish(text);

  for (const pattern of RISK_PATTERNS) {
    if (pattern.regex.test(text) || pattern.regex.test(normalized)) {
      return {
        triggered: true,
        matchedCategory: pattern.category,
        reason:
          'Se han identificado expresiones compatibles con una posible situación de malestar intenso o riesgo. Priorizamos tu seguridad y la conexión con ayuda humana.',
      };
    }
  }

  return { triggered: false };
}

export interface HelpLineResource {
  id: string;
  name: string;
  phone: string;
  availability: string;
  description: string;
  urgent?: boolean;
}

export const HUMAN_HELP_RESOURCES: HelpLineResource[] = [
  {
    id: 'linea-024',
    name: 'Línea 024 · Atención a la conducta suicida',
    phone: '024',
    availability: '24 horas · Todos los días · Gratuita y confidencial',
    description:
      'Atención profesional directa para personas en situación de malestar emocional intenso, ideación suicida o sus familiares y entorno.',
    urgent: true,
  },
  {
    id: 'emergencias-112',
    name: '112 · Emergencias sanitarias y urgencias',
    phone: '112',
    availability: '24 horas · Gratuita',
    description:
      'Si tú o alguien cercano está en peligro físico inmediato o necesita atención médica urgente.',
    urgent: true,
  },
  {
    id: 'esperanza',
    name: 'Teléfono de la Esperanza',
    phone: '717 003 717',
    availability: '24 horas · Apoyo en crisis',
    description:
      'Orientación y escucha telefónica gratuita ante crisis emocionales y situaciones de soledad o desbordamiento.',
  },
  {
    id: 'linea-016',
    name: '016 · Atención a víctimas de violencia de género',
    phone: '016',
    availability: '24 horas · No deja rastro en factura telefónica',
    description:
      'Asesoramiento y apoyo psicosocial gratuito si estás viviendo una situación de violencia o peligro en tu entorno cercano.',
  },
];
