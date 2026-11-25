import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { detectRiskIndicators } from './src/shared/safety.ts';
import type {
  CommunicativeGoal,
  DiaryEntry,
} from './src/shared/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

function getAiClient(apiVersion = 'v1beta'): GoogleGenAI | null {
  const rawKey = process.env.GEMINI_API_KEY;
  const apiKey = rawKey?.trim().replace(/^["']|["']$/g, '');
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ModelCandidate {
  model: string;
  thinkingLevel?: ThinkingLevel;
  timeoutMs: number;
}

const MODEL_CASCADE: ModelCandidate[] = [
  { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW, timeoutMs: 8000 },
  { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL, timeoutMs: 8000 },
  { model: 'gemini-2.5-flash', timeoutMs: 10000 },
  { model: 'gemini-2.5-flash-lite', timeoutMs: 10000 },
];

interface ParsedApiError {
  status: number;
  code: string;
  message: string;
  upstreamDetail?: string;
}

function extractUpstreamDetail(err: unknown): {
  status: number;
  apiStatus?: string;
  detail: string;
} {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const directStatus =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: number }).status)
      : NaN;

  let detail = rawMessage;
  let apiStatus: string | undefined;
  let parsedStatus = directStatus;

  const jsonStart = rawMessage.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(rawMessage.slice(jsonStart)) as {
        error?: { code?: number; message?: string; status?: string };
      };
      if (parsed?.error) {
        if (parsed.error.message) detail = parsed.error.message;
        if (parsed.error.status) apiStatus = parsed.error.status;
        if (typeof parsed.error.code === 'number') parsedStatus = parsed.error.code;
      }
    } catch {
      // keep rawMessage
    }
  }

  return {
    status: Number.isFinite(parsedStatus) && parsedStatus >= 400 ? parsedStatus : 500,
    apiStatus,
    detail: detail.slice(0, 300),
  };
}

function parseGeminiError(err: unknown): ParsedApiError {
  const { status, apiStatus, detail } = extractUpstreamDetail(err);
  const haystack = `${status} ${apiStatus ?? ''} ${detail}`;

  if (
    status === 402 ||
    haystack.includes('prepayment credits are depleted') ||
    haystack.includes('PAYMENT_REQUIRED')
  ) {
    return {
      status: 402,
      code: 'CREDITS_DEPLETED',
      message:
        'La clave de Gemini API activa pertenece a un proyecto con créditos agotados (402). En AI Studio, revisa el proyecto/clave seleccionada en Settings > Secrets o recarga facturación en ai.studio/projects. Mientras tanto, Mi diario, Calmarme, Notas manuales, Red de apoyo y el 024 siguen funcionando.',
      upstreamDetail: detail,
    };
  }

  if (
    haystack.includes('API_KEY_INVALID') ||
    haystack.includes('API key not valid') ||
    haystack.includes('API_KEY_EXPIRED')
  ) {
    return {
      status: 400,
      code: 'API_KEY_INVALID',
      message:
        'La clave GEMINI_API_KEY no es válida o ha caducado. Revisa la clave configurada en Settings > Secrets.',
      upstreamDetail: detail,
    };
  }

  if (status === 403 || haystack.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      code: 'PERMISSION_DENIED',
      message:
        'La clave de Gemini API no tiene permisos para usar este modelo o la Generative Language API no está habilitada en ese proyecto. Revisa Settings > Secrets.',
      upstreamDetail: detail,
    };
  }

  if (status === 429 || haystack.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      code: 'RESOURCE_EXHAUSTED',
      message:
        'Se ha alcanzado el límite de solicitudes o cuota de la clave de Gemini API (429). Espera unos momentos o selecciona una clave con cuota/facturación activa en Settings > Secrets.',
      upstreamDetail: detail,
    };
  }

  if (status === 404 || haystack.includes('NOT_FOUND')) {
    return {
      status: 404,
      code: 'MODEL_NOT_FOUND',
      message:
        'El modelo de Gemini solicitado no está disponible para esta clave (404).',
      upstreamDetail: detail,
    };
  }

  if (
    status === 503 ||
    status === 504 ||
    haystack.includes('UNAVAILABLE') ||
    haystack.includes('high demand') ||
    haystack.includes('overloaded') ||
    haystack.includes('TIMEOUT')
  ) {
    return {
      status: 503,
      code: 'UNAVAILABLE',
      message:
        'Los modelos de Gemini están experimentando mucha demanda temporal en este momento (503). Vuelve a intentarlo en unos segundos.',
      upstreamDetail: detail,
    };
  }

  return {
    status,
    code: apiStatus || 'GEMINI_ERROR',
    message: 'No se pudo completar la respuesta automática en este momento.',
    upstreamDetail: detail,
  };
}

function isRetryableOrFallbackStatus(parsed: ParsedApiError): boolean {
  return (
    parsed.status === 402 ||
    parsed.status === 429 ||
    parsed.status === 404 ||
    parsed.status === 408 ||
    parsed.status === 500 ||
    parsed.status === 502 ||
    parsed.status === 503 ||
    parsed.status === 504 ||
    parsed.code === 'UNAVAILABLE' ||
    parsed.code === 'RESOURCE_EXHAUSTED' ||
    parsed.code === 'TIMEOUT'
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(`TIMEOUT after ${ms}ms`) as Error & { status?: number };
      err.status = 504;
      reject(err);
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function generateStructuredResponse(
  ai: GoogleGenAI,
  params: {
    contents: string;
    systemInstruction: string;
    responseSchema: Record<string, unknown>;
  }
) {
  let lastError: unknown;

  for (let i = 0; i < MODEL_CASCADE.length; i++) {
    const candidate = MODEL_CASCADE[i];
    try {
      const config: Record<string, unknown> = {
        systemInstruction: params.systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: params.responseSchema,
      };
      if (candidate.thinkingLevel) {
        config.thinkingConfig = { thinkingLevel: candidate.thinkingLevel };
      }

      return await withTimeout(
        ai.models.generateContent({
          model: candidate.model,
          contents: params.contents,
          config,
        }),
        candidate.timeoutMs
      );
    } catch (err) {
      lastError = err;
      const parsed = parseGeminiError(err);
      console.warn(
        `[AnIA Gemini model=${candidate.model} (${i + 1}/${MODEL_CASCADE.length})] status=${parsed.status} code=${parsed.code} detail=${parsed.upstreamDetail}`
      );

      // Stop immediately on invalid API key or permission errors
      if (!isRetryableOrFallbackStatus(parsed)) {
        throw err;
      }
    }
  }

  throw lastError;
}

const CORE_PSYCHOLOGICAL_PRINCIPLES = `
PRINCIPIO RECTOR DE AnIA:
AnIA acompaña y facilita, pero no sustituye al profesional ni toma decisiones por la persona. AnIA no es una psicóloga virtual.

REGLAS INQUEBRANTABLES:
1. NO DIAGNÓSTICO: Nunca diagnostiques trastornos, nunca des probabilidades diagnósticas, nunca interpretes clínicamente la experiencia ni generes puntuaciones o índices clínicos.
2. LENGUAJE HIPOTÉTICO: Plantea emociones y patrones siempre como posibilidades abiertas que la persona puede aceptar, rechazar o reformular (ej. "¿Puede ser que haya algo de agotamiento en lo que describes?", nunca "Estás sufriendo agotamiento emocional").
3. SIN RELACIONES CAUSALES: Nunca digas "X causa Y". Usa "situaciones o factores que relacionas con..." o "en los momentos que mencionaste...".
4. AUTONOMÍA Y NO DEPENDENCIA: La persona decide qué expresar, conservar, corregir o compartir. No fomentes dependencia afectiva hacia AnIA ni te presentes como vínculo sustitutivo de personas reales; orienta suavemente hacia redes personales o profesionales cuando sea útil.
5. SEGURIDAD TRANSVERSAL (CU4): Si detectas cualquier indicio de autolesión, ideación suicida, peligro físico, violencia o crisis grave en curso, marca safetyFlag=true y responde con claridad empática priorizando ayuda humana sin intentar gestionar la crisis como terapeuta.
6. TONO: Cálido, sereno, respetuoso, claro y sin juicios. Español natural.
`;

// CU1: Conversación de apoyo emocional y puesta en palabras
app.post('/api/ania/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      easyRead = false,
      requestSummary = false,
      currentMood,
      appContext,
    } = req.body as {
      message: string;
      history?: Array<{ role: 'user' | 'ania'; text: string }>;
      easyRead?: boolean;
      requestSummary?: boolean;
      currentMood?: string;
      appContext?: {
        interactionMode?: 'chat' | 'avatar';
        avatarName?: string;
        recentDiarySummary?: string[];
        supportNetworkNames?: string[];
        consultaNotesCount?: number;
      };
    };

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Falta el mensaje de la persona usuaria.' });
      return;
    }

    // 1. Deterministic safety gate (CU4 independent of LLM)
    const deterministicSafety = detectRiskIndicators(message);
    if (deterministicSafety.triggered) {
      res.json({
        safetyTriggered: true,
        safetyReason: deterministicSafety.reason,
        reply:
          'Gracias por contarme esto. Lo más importante ahora es tu seguridad y que no tengas que sostener esto en soledad. En este momento prefiero pausar el resto de funciones y poner a tu alcance opciones para hablar con una persona de confianza o con profesionales disponibles las 24 horas.',
        suggestedEmotions: [],
        quickReplies: [],
        suggestSupportOrProfessional: true,
      });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'El servicio de acompañamiento con IA no está disponible porque falta configurar GEMINI_API_KEY en Settings > Secrets.',
      });
      return;
    }

    const easyReadInstruction = easyRead
      ? '\nMODO LECTURA FÁCIL ACTIVO: Usa frases muy cortas (máximo 12-15 palabras por frase), vocabulario cotidiano sencillo, sin metáforas complejas, en párrafos breves y claros.'
      : '';

    const summaryInstruction = requestSummary
      ? '\nLa persona ha pedido revisar un breve resumen descriptivo de lo expresado hasta ahora. Incluye descriptiveSummary diferenciando sus palabras literales de tu organización descriptiva.'
      : '\nSolo incluye descriptiveSummary si ya hay suficiente contenido en la conversación para devolver una síntesis útil y preguntarle si se siente representada.';

    const conversationContext = history
      .slice(-10)
      .map((m) => `${m.role === 'user' ? 'Persona' : 'AnIA'}: ${m.text}`)
      .join('\n');

    const contextLines: string[] = [];
    if (appContext?.interactionMode === 'avatar') {
      contextLines.push(
        `Canal actual: conversación hablada mediante Avatar IA visual (${appContext.avatarName || 'AnIA'}). Mantén frases naturales para ser escuchadas en voz alta sin perder las reglas de acompañamiento.`
      );
    }
    if (appContext?.recentDiarySummary && appContext.recentDiarySummary.length > 0) {
      contextLines.push(
        `Registros recientes de Mi diario autorizados como contexto:\n${appContext.recentDiarySummary.join('\n')}`
      );
    }
    if (appContext?.supportNetworkNames && appContext.supportNetworkNames.length > 0) {
      contextLines.push(
        `Personas en su red personal de apoyo: ${appContext.supportNetworkNames.join(', ')}`
      );
    }
    if (typeof appContext?.consultaNotesCount === 'number' && appContext.consultaNotesCount > 0) {
      contextLines.push(
        `Notas ya guardadas para su consulta (CU3): ${appContext.consultaNotesCount}`
      );
    }

    const prompt = `
${conversationContext ? `Conversación reciente:\n${conversationContext}\n` : ''}
${currentMood ? `Estado inicial indicado por la persona: ${currentMood}\n` : ''}
${contextLines.length ? `Contexto del espacio personal de la persona:\n${contextLines.join('\n')}\n` : ''}
Mensaje actual de la persona: "${message}"
${summaryInstruction}
`;

    const response = await generateStructuredResponse(ai, {
      contents: prompt,
      systemInstruction: `${CORE_PSYCHOLOGICAL_PRINCIPLES}
${easyReadInstruction}
Estás en CU1 (Conversación de apoyo emocional y puesta en palabras).
- Responde de forma breve, empática y cercana (2 a 4 frases en párrafos cortos), haciendo preguntas abiertas suaves cuando ayude a poner palabras.
- Si la persona menciona cosas de su diario, red de apoyo o notas para su consulta, ten en cuenta el contexto compartido sin atribuirle causas clínicas ni presionar.
- Si sugieres emociones en "suggestedEmotions", preséntalas en el texto siempre como hipótesis o posibilidades abiertas ("¿Puede ser que haya algo de...?").
- Propón 2 o 3 opciones breves en "quickReplies" que respeten el ritmo de la persona (por ejemplo: "Contarte qué pasó", "Respirar juntos un minuto", "Solo quiero que me escuches").
- Si observas malestar persistente en varios turnos, activa "suggestSupportOrProfessional": true para sugerir suavemente hablar con alguien de confianza o un profesional, sin diagnosticar.`,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          safetyFlag: {
            type: Type.BOOLEAN,
            description:
              'true únicamente si hay expresiones compatibles con riesgo de autolesión, suicidio, violencia o peligro urgente.',
          },
          reply: {
            type: Type.STRING,
            description:
              'Respuesta empática con lenguaje hipotético y preguntas abiertas si corresponde.',
          },
          suggestedEmotions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              'De 0 a 3 palabras emocionales orientativas presentadas como posibilidades (ej. agotamiento, sobrecarga, tristeza, culpa, rabia, soledad).',
          },
          quickReplies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '2 o 3 respuestas rápidas suaves y respetuosas.',
          },
          suggestSupportOrProfessional: {
            type: Type.BOOLEAN,
            description:
              'true si se percibe malestar recurrente y conviene recordar opciones de red de apoyo o consulta profesional.',
          },
          descriptiveSummary: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
              userWords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Fragmentos o ideas literales expresadas por la persona.',
              },
              aniaOrganization: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  'Síntesis descriptiva neutral propuesta por AnIA para que la persona la valide o corrija.',
              },
              associatedSituations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  'Situaciones o factores que la persona ha relacionado con su malestar (nunca causas clínicas).',
              },
              helpfulElements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Elementos o estrategias que la persona menciona que le alivian o ayudan.',
              },
            },
          },
        },
        required: [
          'safetyFlag',
          'reply',
          'suggestedEmotions',
          'quickReplies',
          'suggestSupportOrProfessional',
        ],
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());

    if (parsed.safetyFlag) {
      res.json({
        safetyTriggered: true,
        safetyReason:
          'Por lo que has compartido, queremos priorizar tu bienestar y facilitarte el contacto con ayuda humana.',
        reply:
          'Gracias por compartir cómo te sientes. En este momento lo más importante es cuidarte y priorizar la ayuda humana. Quiero mostrarte líneas de apoyo disponibles las 24 horas y opciones para contactar con alguien de confianza.',
        suggestedEmotions: [],
        quickReplies: [],
        suggestSupportOrProfessional: true,
      });
      return;
    }

    res.json({
      safetyTriggered: false,
      reply: parsed.reply,
      suggestedEmotions: Array.isArray(parsed.suggestedEmotions)
        ? parsed.suggestedEmotions.slice(0, 3)
        : [],
      quickReplies: Array.isArray(parsed.quickReplies)
        ? parsed.quickReplies.slice(0, 3)
        : ['Contarte un poco más', 'Solo quiero que me escuches'],
      suggestSupportOrProfessional: Boolean(parsed.suggestSupportOrProfessional),
      descriptiveSummary: parsed.descriptiveSummary ?? null,
    });
  } catch (err) {
    const parsedErr = parseGeminiError(err);
    console.warn(
      `[AnIA /api/ania/chat] ${parsedErr.code}: ${parsedErr.upstreamDetail ?? parsedErr.message}`
    );
    res.status(parsedErr.status).json({
      error: parsedErr.message,
      errorCode: parsedErr.code,
      detail: parsedErr.upstreamDetail,
    });
  }
});

// CU2: El mensaje que no sé cómo decir
app.post('/api/ania/draft-message', async (req, res) => {
  try {
    const {
      goal,
      recipientName,
      context,
      fears,
      currentDraft,
      reformulateInstruction,
      easyRead = false,
    } = req.body as {
      goal: CommunicativeGoal;
      recipientName?: string;
      context: string;
      fears?: string;
      currentDraft?: string;
      reformulateInstruction?: string;
      easyRead?: boolean;
    };

    const combinedText = `${context ?? ''} ${fears ?? ''} ${currentDraft ?? ''} ${reformulateInstruction ?? ''}`;
    const deterministicSafety = detectRiskIndicators(combinedText);
    if (deterministicSafety.triggered) {
      res.json({
        safetyTriggered: true,
        safetyReason: deterministicSafety.reason,
        proposals: [],
      });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Falta configurar GEMINI_API_KEY en Settings > Secrets.',
      });
      return;
    }

    const goalLabels: Record<CommunicativeGoal, string> = {
      contar_como_estoy: 'Contar cómo está sin sentirse juzgada/o',
      pedir_ayuda: 'Pedir ayuda concreta o acompañamiento',
      ser_escuchado: 'Pedir ser escuchada/o sin consejos inmediatos',
      poner_limite: 'Poner un límite con respeto y claridad',
      explicar_situacion: 'Explicar una situación que le cuesta expresar',
    };

    const prompt = `
Objetivo comunicativo elegido por la persona: ${goalLabels[goal] ?? goal}
Destinatario aproximado: ${recipientName || 'Alguien de su entorno'}
Lo que quiere contar / situación: ${context}
Miedos o dificultades al decirlo: ${fears || 'No especificados'}
${currentDraft ? `Borrador actual que quiere ajustar: "${currentDraft}"` : ''}
${reformulateInstruction ? `Petición de reformulación de la persona: "${reformulateInstruction}"` : ''}
${easyRead ? 'Usa frases cortas y lenguaje muy claro (Lectura fácil).' : ''}

Genera 3 propuestas de mensaje en primera persona ("yo") con enfoques diferentes:
1. "cercano": cálido, cercano y afectivo.
2. "sereno": pausado, reflexivo y tranquilo.
3. "directo": claro, breve y respetuoso.
No decidas cuál es mejor ni hables en nombre de la persona como si fueras AnIA. Son borradores para que la persona los revise, edite y apruebe.
`;

    const response = await generateStructuredResponse(ai, {
      contents: prompt,
      systemInstruction: CORE_PSYCHOLOGICAL_PRINCIPLES,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          safetyFlag: { type: Type.BOOLEAN },
          proposals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tone: { type: Type.STRING, enum: ['cercano', 'sereno', 'directo'] },
                title: { type: Type.STRING },
                body: { type: Type.STRING },
              },
              required: ['tone', 'title', 'body'],
            },
          },
        },
        required: ['safetyFlag', 'proposals'],
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    if (parsed.safetyFlag) {
      res.json({
        safetyTriggered: true,
        safetyReason:
          'Se han detectado expresiones que requieren priorizar tu seguridad y ayuda humana antes de redactar este mensaje.',
        proposals: [],
      });
      return;
    }

    res.json({
      safetyTriggered: false,
      proposals: parsed.proposals ?? [],
    });
  } catch (err) {
    const parsedErr = parseGeminiError(err);
    console.warn(`[AnIA /api/ania/draft-message] ${parsedErr.code}: ${parsedErr.message}`);
    res.status(parsedErr.status).json({
      error: parsedErr.message,
      errorCode: parsedErr.code,
    });
  }
});

// CU3: Llegar a la consulta con las ideas claras ("Resumen personal para mi consulta")
app.post('/api/ania/consultation-summary', async (req, res) => {
  try {
    const {
      authorizedNotes = [],
      diaryEntries = [],
      extraNote = '',
      easyRead = false,
    } = req.body as {
      authorizedNotes?: string[];
      diaryEntries?: DiaryEntry[];
      extraNote?: string;
      easyRead?: boolean;
    };

    const allRawText = [
      ...authorizedNotes,
      extraNote,
      ...diaryEntries.map(
        (d) =>
          `${d.emotions.join(', ')} ${d.customEmotionNote ?? ''} ${d.associatedSituations} ${d.helpfulElements} ${d.freeNote ?? ''}`
      ),
    ].join(' ');

    const deterministicSafety = detectRiskIndicators(allRawText);
    if (deterministicSafety.triggered) {
      res.json({
        safetyTriggered: true,
        safetyReason: deterministicSafety.reason,
      });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Falta configurar GEMINI_API_KEY en Settings > Secrets.',
      });
      return;
    }

    const prompt = `
Organiza únicamente la siguiente información aportada y autorizada por la persona para su "Resumen personal para mi consulta".

Notas de conversación autorizadas:
${authorizedNotes.length ? authorizedNotes.map((n, i) => `- (${i + 1}) ${n}`).join('\n') : '(Ninguna nota de conversación guardada aún)'}

Registros autorizados de Mi diario:
${
  diaryEntries.length
    ? diaryEntries
        .map(
          (d) =>
            `- [${d.createdAt.slice(0, 10)}] Emociones: ${d.emotions.join(', ') || 'sin etiqueta'}${
              d.customEmotionNote ? ` (${d.customEmotionNote})` : ''
            }. Intensidad autopercibida: ${d.intensity}/5. Sobrecarga: ${d.overloadLevel}. Descanso: ${
              d.restQuality
            }. Situaciones relacionadas: ${d.associatedSituations || 'ninguna indicada'}. Lo que ayudó: ${
              d.helpfulElements || 'ninguno indicado'
            }.`
        )
        .join('\n')
    : '(Sin registros de diario)'
}

Nota adicional directa de la persona:
${extraNote || '(Ninguna)'}

${easyRead ? 'Redacta cada punto en formato Lectura Fácil: frases cortas y lenguaje muy directo.' : ''}

INSTRUCCIONES ESTRICTAS CU3:
- NO es un informe psicológico ni diagnóstico.
- NO añadas hipótesis clínicas, diagnósticos ni recomendaciones de tratamiento.
- NO inventes datos ni establezcas causas ("por culpa de X ocurrió Y").
- Para cada punto generado, indica "origin": "user_literal" si recoge palabras/frases directas de la persona, u "ania_organized" si es una síntesis organizativa de AnIA.
- Si falta información en alguna sección, devuelve esa lista vacía (no rellenes con suposiciones) y sugiere preguntas útiles en "preguntasParaLaConsulta".
`;

    const itemSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          origin: { type: Type.STRING, enum: ['user_literal', 'ania_organized'] },
        },
        required: ['text', 'origin'],
      },
    };

    const response = await generateStructuredResponse(ai, {
      contents: prompt,
      systemInstruction: CORE_PSYCHOLOGICAL_PRINCIPLES,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          safetyFlag: { type: Type.BOOLEAN },
          comoMeHeSentido: itemSchema,
          situacionesDificiles: itemSchema,
          cosasQueMeHanAyudado: itemSchema,
          cambiosObservados: itemSchema,
          preocupacionesYTemas: itemSchema,
          preguntasParaLaConsulta: itemSchema,
        },
        required: [
          'safetyFlag',
          'comoMeHeSentido',
          'situacionesDificiles',
          'cosasQueMeHanAyudado',
          'cambiosObservados',
          'preocupacionesYTemas',
          'preguntasParaLaConsulta',
        ],
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    if (parsed.safetyFlag) {
      res.json({
        safetyTriggered: true,
        safetyReason:
          'Al revisar tus notas hemos detectado expresiones que aconsejan priorizar la ayuda humana y los recursos de seguridad.',
      });
      return;
    }

    res.json({
      safetyTriggered: false,
      sections: parsed,
    });
  } catch (err) {
    const parsedErr = parseGeminiError(err);
    console.warn(`[AnIA /api/ania/consultation-summary] ${parsedErr.code}: ${parsedErr.message}`);
    res.status(parsedErr.status).json({
      error: parsedErr.message,
      errorCode: parsedErr.code,
    });
  }
});

// CU5: Tendencias puramente descriptivas de Mi diario
app.post('/api/ania/descriptive-trends', async (req, res) => {
  try {
    const { entries = [], easyRead = false } = req.body as {
      entries: DiaryEntry[];
      easyRead?: boolean;
    };

    if (!entries.length) {
      res.json({
        safetyTriggered: false,
        observations: ['Todavía no hay suficientes registros para observar tendencias descriptivas.'],
        persistentDistressNotice: false,
      });
      return;
    }

    const rawText = entries
      .map(
        (e) =>
          `${e.customEmotionNote ?? ''} ${e.associatedSituations} ${e.helpfulElements} ${e.freeNote ?? ''}`
      )
      .join(' ');
    const deterministicSafety = detectRiskIndicators(rawText);
    if (deterministicSafety.triggered) {
      res.json({
        safetyTriggered: true,
        safetyReason: deterministicSafety.reason,
        observations: [],
        persistentDistressNotice: true,
      });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Falta configurar GEMINI_API_KEY en Settings > Secrets.',
      });
      return;
    }

    const prompt = `
Analiza de forma PURAMENTE DESCRIPTIVA (sin diagnósticos, sin puntuaciones clínicas ni relaciones causales) estos registros autoinformados:
${entries
  .slice(0, 14)
  .map(
    (e) =>
      `- Fecha ${e.createdAt.slice(0, 10)}: emociones=[${e.emotions.join(', ')}], intensidad=${e.intensity}/5, sobrecarga=${e.overloadLevel}, descanso=${e.restQuality}, situaciones="${e.associatedSituations}", ayudó="${e.helpfulElements}"`
  )
  .join('\n')}

${easyRead ? 'Usa frases muy cortas y claras (Lectura fácil).' : ''}

Reglas CU5:
- Devuelve 2 o 3 observaciones descriptivas breves formuladas de manera tentativa para que la persona confirme si le encajan o las matice.
- Ejemplo correcto: "En varios días en los que señalaste descanso escaso también marcaste sobrecarga alta. ¿Te encaja esta observación?"
- Nunca digas "tienes ansiedad/depresión" ni "esto demuestra una patología".
- Indica "persistentDistressNotice": true únicamente si se repite malestar intenso o sobrecarga alta de manera sostenida en la mayoría de los registros recientes, para ofrecer con delicadeza hablar con un profesional o activar su red de apoyo.
`;

    const response = await generateStructuredResponse(ai, {
      contents: prompt,
      systemInstruction: CORE_PSYCHOLOGICAL_PRINCIPLES,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          safetyFlag: { type: Type.BOOLEAN },
          observations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          persistentDistressNotice: { type: Type.BOOLEAN },
        },
        required: ['safetyFlag', 'observations', 'persistentDistressNotice'],
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    if (parsed.safetyFlag) {
      res.json({
        safetyTriggered: true,
        safetyReason:
          'Detectamos expresiones que aconsejan priorizar la ayuda humana y recursos de apoyo inmediato.',
        observations: [],
        persistentDistressNotice: true,
      });
      return;
    }

    res.json({
      safetyTriggered: false,
      observations: parsed.observations ?? [],
      persistentDistressNotice: Boolean(parsed.persistentDistressNotice),
    });
  } catch (err) {
    const parsedErr = parseGeminiError(err);
    console.warn(`[AnIA /api/ania/descriptive-trends] ${parsedErr.code}: ${parsedErr.message}`);
    res.status(parsedErr.status).json({
      error: parsedErr.message,
      errorCode: parsedErr.code,
    });
  }
});

// CU6: Explorar qué tipo de apoyo necesito
app.post('/api/ania/explore-support', async (req, res) => {
  try {
    const { reflection, easyRead = false } = req.body as {
      reflection: string;
      easyRead?: boolean;
    };

    const deterministicSafety = detectRiskIndicators(reflection ?? '');
    if (deterministicSafety.triggered) {
      res.json({
        safetyTriggered: true,
        safetyReason: deterministicSafety.reason,
      });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Falta configurar GEMINI_API_KEY en Settings > Secrets.',
      });
      return;
    }

    const prompt = `
La persona dice sobre lo que está necesitando o sintiendo ahora:
"${reflection}"
${easyRead ? 'Usa Lectura Fácil (frases cortas y claras).' : ''}

Ayúdale sin decidir por ella ni indicar qué tratamiento o persona "es segura":
1. Devuelve una breve reflexión empática con 1 o 2 preguntas abiertas para aclarar qué le aliviaría hoy.
2. Sugiere entre 1 y 3 tipos posibles de ayuda de esta lista exacta: "escucha", "compania", "ayuda_practica", "compartir_responsabilidades", "descanso", "orientacion_profesional".
`;

    const response = await generateStructuredResponse(ai, {
      contents: prompt,
      systemInstruction: CORE_PSYCHOLOGICAL_PRINCIPLES,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          safetyFlag: { type: Type.BOOLEAN },
          reflectionText: { type: Type.STRING },
          suggestedNeeds: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              enum: [
                'escucha',
                'compania',
                'ayuda_practica',
                'compartir_responsabilidades',
                'descanso',
                'orientacion_profesional',
              ],
            },
          },
        },
        required: ['safetyFlag', 'reflectionText', 'suggestedNeeds'],
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    if (parsed.safetyFlag) {
      res.json({
        safetyTriggered: true,
        safetyReason:
          'Por lo que has descrito, priorizamos tu seguridad y facilitamos la conexión directa con ayuda humana.',
      });
      return;
    }

    res.json({
      safetyTriggered: false,
      reflectionText: parsed.reflectionText,
      suggestedNeeds: parsed.suggestedNeeds ?? [],
    });
  } catch (err) {
    const parsedErr = parseGeminiError(err);
    console.warn(`[AnIA /api/ania/explore-support] ${parsedErr.code}: ${parsedErr.message}`);
    res.status(parsedErr.status).json({
      error: parsedErr.message,
      errorCode: parsedErr.code,
    });
  }
});

// TTS para Avatar IA (con respaldo automático en cliente si no hay cuota/créditos)
app.post('/api/ania/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body as {
      text: string;
      voiceName?: 'Kore' | 'Zephyr' | 'Puck' | 'Charon';
    };

    if (!text || typeof text !== 'string') {
      res.status(400).json({ available: false, error: 'Falta el texto a leer.' });
      return;
    }

    const ai = getAiClient('v1beta');
    if (!ai) {
      res.json({ available: false, reason: 'NO_API_KEY' });
      return;
    }

    const safeVoice = ['Kore', 'Zephyr', 'Puck', 'Charon'].includes(voiceName)
      ? voiceName
      : 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 1200),
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: safeVoice },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      res.json({ available: false, reason: 'EMPTY_AUDIO' });
      return;
    }

    res.json({
      available: true,
      mimeType: 'audio/wav',
      audioBase64: base64Audio,
    });
  } catch (err) {
    const parsedErr = parseGeminiError(err);
    console.warn(
      `[AnIA /api/ania/tts] ${parsedErr.code}: ${parsedErr.upstreamDetail ?? parsedErr.message}`
    );
    res.json({
      available: false,
      reason: parsedErr.code,
      detail: parsedErr.upstreamDetail,
    });
  }
});

// Ensure API routes always return JSON and never fall through to SPA HTML
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Ruta de API no encontrada.' });
});

app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (req.path.startsWith('/api/')) {
      const msg = err instanceof Error ? err.message : 'Error interno del servidor.';
      res.status(400).json({ error: `Error en la solicitud: ${msg}` });
      return;
    }
    next(err);
  }
);

async function startServer() {
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AnIA server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
