import {
  ArrowUp,
  BookmarkCheck,
  Check,
  Edit3,
  Leaf,
  Mic,
  MicOff,
  Paperclip,
  PauseCircle,
  ShieldCheck,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { postAniaJson } from '../shared/api';
import { detectRiskIndicators } from '../shared/safety';
import type {
  AppView,
  ChatMessage,
  DescriptiveSummary,
  SuggestedEmotion,
} from '../shared/types';
import { formatTimeHHMM } from '../store/useAniaStore';

interface ConversarViewProps {
  consentAccepted: boolean;
  onAcceptConsent: () => void;
  messages: ChatMessage[];
  onUpdateMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  easyRead: boolean;
  voiceReadAloud: boolean;
  currentMood: string | null;
  onAuthorizeNote: (text: string, messageId?: string) => void;
  onTriggerSafety: (reason?: string) => void;
  onNavigate: (view: AppView) => void;
  onResetConversation: (keepAuthorized: boolean) => void;
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
  appContext?: {
    recentDiarySummary: string[];
    supportNetworkNames: string[];
    consultaNotesCount: number;
  };
}

export function ConversarView({
  consentAccepted,
  onAcceptConsent,
  messages,
  onUpdateMessages,
  easyRead,
  voiceReadAloud,
  currentMood,
  onAuthorizeNote,
  onTriggerSafety,
  onNavigate,
  onResetConversation,
  externalPrompt,
  onClearExternalPrompt,
  appContext,
}: ConversarViewProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [showPauseOptions, setShowPauseOptions] = useState(false);
  const [reframeTarget, setReframeTarget] = useState<{
    messageId: string;
    index: number;
    text: string;
  } | null>(null);
  const [editingSummary, setEditingSummary] = useState<{
    messageId: string;
    draft: DescriptiveSummary;
  } | null>(null);
  const [manualNoteOpen, setManualNoteOpen] = useState(false);
  const [manualNoteText, setManualNoteText] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (externalPrompt && consentAccepted) {
      void sendMessage(externalPrompt);
      onClearExternalPrompt?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPrompt, consentAccepted]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = easyRead ? 0.9 : 1;
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceInput = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setError('El dictado por voz no está disponible en este navegador. Puedes escribir con normalidad.');
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRec as any)();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const sendMessage = async (textToSend: string, requestSummary = false) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    setError(null);
    setShowPauseOptions(false);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: formatTimeHHMM(),
    };

    const nextHistory = [...messages, userMsg];
    onUpdateMessages(() => nextHistory);
    if (textToSend === input) setInput('');

    // Client-side deterministic CU4 check
    const localSafety = detectRiskIndicators(trimmed);
    if (localSafety.triggered) {
      onTriggerSafety(localSafety.reason);
      return;
    }

    setLoading(true);
    try {
      const data = await postAniaJson(
        '/api/ania/chat',
        {
          message: trimmed,
          history: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          easyRead,
          requestSummary,
          currentMood,
          appContext: appContext
            ? { interactionMode: 'chat', ...appContext }
            : { interactionMode: 'chat' },
        },
        'Error de conexión con AnIA.'
      );

      if (data.safetyTriggered) {
        onTriggerSafety(data.safetyReason);
        return;
      }

      const suggestedEmotions: SuggestedEmotion[] = Array.isArray(data.suggestedEmotions)
        ? data.suggestedEmotions.map((label: string) => ({
            label,
            status: 'pending' as const,
          }))
        : [];

      const descriptiveSummary: DescriptiveSummary | undefined = data.descriptiveSummary
        ? {
            id: `sum-${Date.now()}`,
            userWords: data.descriptiveSummary.userWords ?? [],
            aniaOrganization: data.descriptiveSummary.aniaOrganization ?? [],
            associatedSituations: data.descriptiveSummary.associatedSituations ?? [],
            helpfulElements: data.descriptiveSummary.helpfulElements ?? [],
            validatedByUser: null,
          }
        : undefined;

      const aniaMsg: ChatMessage = {
        id: `ania-${Date.now()}`,
        role: 'ania',
        text: data.reply,
        timestamp: formatTimeHHMM(),
        suggestedEmotions,
        quickReplies: data.quickReplies ?? [],
        descriptiveSummary,
        suggestSupportOrProfessional: Boolean(data.suggestSupportOrProfessional),
      };

      onUpdateMessages((prev) => [...prev, aniaMsg]);
      if (voiceReadAloud) {
        speakText(data.reply);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No pudimos recibir respuesta ahora. Puedes intentarlo de nuevo o guardar tus notas.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmotionDecision = (
    messageId: string,
    index: number,
    status: SuggestedEmotion['status'],
    reframedText?: string
  ) => {
    onUpdateMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || !m.suggestedEmotions) return m;
        const updated = m.suggestedEmotions.map((e, i) =>
          i === index ? { ...e, status, reframedText } : e
        );
        return { ...m, suggestedEmotions: updated };
      })
    );
  };

  const handleValidateSummary = (messageId: string, accepted: boolean) => {
    onUpdateMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || !m.descriptiveSummary) return m;
        return {
          ...m,
          descriptiveSummary: {
            ...m.descriptiveSummary,
            validatedByUser: accepted,
          },
        };
      })
    );
  };

  const handleSaveEditedSummary = () => {
    if (!editingSummary) return;
    onUpdateMessages((prev) =>
      prev.map((m) => {
        if (m.id !== editingSummary.messageId) return m;
        return {
          ...m,
          descriptiveSummary: {
            ...editingSummary.draft,
            validatedByUser: true,
          },
        };
      })
    );
    setEditingSummary(null);
  };

  if (!consentAccepted) {
    return (
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex items-center justify-center">
        <div className="max-w-xl w-full bg-ania-surface-soft border border-ania-border rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ania-accent-soft text-ania-accent-text flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-ania-heading">
                Antes de empezar · Qué es y qué no es AnIA
              </h2>
              <p className="text-xs text-ania-ink-subtle">
                Consentimiento informado y control sobre tu espacio
              </p>
            </div>
          </div>

          <ul className="space-y-3 text-sm text-ania-ink leading-relaxed">
            <li className="bg-ania-surface border border-ania-border rounded-xl p-3.5">
              <strong>Acompaña y facilita, no diagnostica:</strong> AnIA no es una psicóloga virtual, no asigna trastornos ni sustituye la atención profesional.
            </li>
            <li className="bg-ania-surface border border-ania-border rounded-xl p-3.5">
              <strong>Tus palabras y datos son tuyos:</strong> Nada se comparte automáticamente con profesionales ni familiares. Tú decides qué guardar, corregir, exportar o borrar.
            </li>
            <li className="bg-ania-surface border border-ania-border rounded-xl p-3.5">
              <strong>Prioridad en seguridad humana:</strong> Si expresas una situación de posible riesgo, AnIA pausará sus funciones secundarias y te facilitará líneas de ayuda y contactos humanos.
            </li>
          </ul>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-ania-ink-subtle">
              Puedes cambiar tu memoria o borrar todo en cualquier momento.
            </span>
            <button
              type="button"
              onClick={onAcceptConsent}
              className="px-5 py-2.5 rounded-xl bg-ania-accent text-ania-accent-on text-sm font-semibold hover:bg-ania-accent-hover transition-colors"
            >
              Entiendo el alcance y quiero empezar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const lastAnia =
            !isUser && msg.id === messages.filter((m) => m.role === 'ania').slice(-1)[0]?.id;

          if (isUser) {
            return (
              <div key={msg.id} className="flex flex-col items-end">
                <div className="max-w-[85%] sm:max-w-[75%] bg-ania-user-bubble text-ania-user-bubble-text rounded-2xl rounded-br-sm px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </div>
                <div className="flex items-center gap-3 mt-1.5 px-1">
                  <button
                    type="button"
                    onClick={() => onAuthorizeNote(msg.text, msg.id)}
                    className="text-[11px] text-ania-ink-subtle hover:text-ania-accent-text underline underline-offset-2"
                  >
                    {msg.savedToConsulta
                      ? 'Guardado para mi consulta'
                      : 'Guardar mis palabras para consulta'}
                  </button>
                  <span className="text-[11px] text-ania-ink-faint tabular-nums">{msg.timestamp}</span>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-ania-accent-soft text-ania-accent-text flex items-center justify-center shrink-0 mt-0.5">
                  <Leaf className="w-4 h-4" aria-hidden="true" />
                </div>

                <div className="flex-1 space-y-3 max-w-[90%] sm:max-w-[82%]">
                  <div className="bg-ania-accent-tint text-ania-ink rounded-2xl rounded-tl-sm px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                    <div className="mt-2.5 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => speakText(msg.text)}
                        className="inline-flex items-center gap-1 text-[11px] text-ania-ink-muted hover:text-ania-accent-text"
                        title="Escuchar mensaje en voz alta"
                      >
                        <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Escuchar</span>
                      </button>
                    </div>
                  </div>

                  {/* Tentative Emotions (Hypothetical language: accept / reframe / reject) */}
                  {msg.suggestedEmotions && msg.suggestedEmotions.length > 0 && (
                    <div className="bg-ania-surface-soft border border-ania-border rounded-xl p-3.5 space-y-2">
                      <p className="text-xs text-ania-ink-muted">
                        Palabras orientativas (solo como posibilidad; tú decides si te representan):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestedEmotions.map((emo, idx) => (
                          <div
                            key={`${emo.label}-${idx}`}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs border ${
                              emo.status === 'accepted'
                                ? 'bg-ania-accent-soft border-ania-accent text-ania-accent-text'
                                : emo.status === 'reframed'
                                  ? 'bg-ania-lavender-bg border-ania-lavender-border text-ania-lavender-text'
                                  : emo.status === 'rejected'
                                    ? 'bg-ania-surface border-ania-border text-ania-ink-faint line-through'
                                    : 'bg-ania-surface border-ania-border-strong text-ania-ink'
                            }`}
                          >
                            <span>
                              {emo.status === 'reframed' && emo.reframedText
                                ? emo.reframedText
                                : emo.label}
                            </span>
                            {emo.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEmotionDecision(msg.id, idx, 'accepted')}
                                  className="p-0.5 text-ania-accent-text hover:bg-ania-accent-soft rounded"
                                  title="Sí, me representa"
                                  aria-label={`Confirmar ${emo.label}`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReframeTarget({
                                      messageId: msg.id,
                                      index: idx,
                                      text: emo.label,
                                    })
                                  }
                                  className="p-0.5 text-ania-ink-muted hover:bg-ania-surface-hover rounded"
                                  title="Reformular con mis palabras"
                                  aria-label={`Reformular ${emo.label}`}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEmotionDecision(msg.id, idx, 'rejected')}
                                  className="p-0.5 text-ania-ink-faint hover:bg-ania-surface-hover rounded"
                                  title="No me representa"
                                  aria-label={`Descartar ${emo.label}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                      {reframeTarget && reframeTarget.messageId === msg.id && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={reframeTarget.text}
                            onChange={(e) =>
                              setReframeTarget({ ...reframeTarget, text: e.target.value })
                            }
                            placeholder="¿Cómo lo describirías tú?"
                            className="flex-1 px-3 py-1.5 text-xs bg-ania-surface text-ania-ink placeholder:text-ania-ink-faint border border-ania-border-strong rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleEmotionDecision(
                                msg.id,
                                reframeTarget.index,
                                'reframed',
                                reframeTarget.text.trim()
                              );
                              setReframeTarget(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-ania-accent text-ania-accent-on text-xs font-medium"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setReframeTarget(null)}
                            className="px-2 py-1.5 text-xs text-ania-ink-subtle"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Descriptive Summary Review Card (CU1 Steps 5-6) */}
                  {msg.descriptiveSummary && (
                    <div className="bg-ania-surface border border-ania-accent-border rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-ania-accent-text">
                          Resumen descriptivo para revisar · ¿Te sientes representada/o?
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingSummary({
                              messageId: msg.id,
                              draft: structuredClone(msg.descriptiveSummary!),
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs text-ania-accent-text hover:underline"
                        >
                          <Edit3 className="w-3 h-3" aria-hidden="true" />
                          <span>Corregir o quitar</span>
                        </button>
                      </div>

                      {editingSummary?.messageId === msg.id ? (
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block font-medium text-ania-ink-secondary mb-1">
                              Tus palabras (una por línea):
                            </label>
                            <textarea
                              rows={2}
                              value={editingSummary.draft.userWords.join('\n')}
                              onChange={(e) =>
                                setEditingSummary({
                                  ...editingSummary,
                                  draft: {
                                    ...editingSummary.draft,
                                    userWords: e.target.value.split('\n').filter(Boolean),
                                  },
                                })
                              }
                              className="w-full p-2 bg-ania-surface text-ania-ink border border-ania-border-strong rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block font-medium text-ania-ink-secondary mb-1">
                              Organización descriptiva (editable):
                            </label>
                            <textarea
                              rows={2}
                              value={editingSummary.draft.aniaOrganization.join('\n')}
                              onChange={(e) =>
                                setEditingSummary({
                                  ...editingSummary,
                                  draft: {
                                    ...editingSummary.draft,
                                    aniaOrganization: e.target.value.split('\n').filter(Boolean),
                                  },
                                })
                              }
                              className="w-full p-2 bg-ania-surface text-ania-ink border border-ania-border-strong rounded-lg"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingSummary(null)}
                              className="px-3 py-1.5 rounded-lg border border-ania-border-strong text-ania-ink-muted"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEditedSummary}
                              className="px-3 py-1.5 rounded-lg bg-ania-accent text-ania-accent-on font-medium"
                            >
                              Guardar cambios
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5 text-xs">
                          {msg.descriptiveSummary.userWords.length > 0 && (
                            <div className="bg-ania-user-bubble-soft rounded-xl p-3">
                              <p className="font-semibold text-ania-ink mb-1">Tus palabras</p>
                              <ul className="list-disc pl-4 space-y-0.5 text-ania-ink-secondary">
                                {msg.descriptiveSummary.userWords.map((w, i) => (
                                  <li key={i}>{w}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {msg.descriptiveSummary.aniaOrganization.length > 0 && (
                            <div className="bg-ania-accent-tint rounded-xl p-3">
                              <p className="font-semibold text-ania-accent-text mb-1">
                                Organización propuesta por AnIA
                              </p>
                              <ul className="list-disc pl-4 space-y-0.5 text-ania-ink">
                                {msg.descriptiveSummary.aniaOrganization.map((o, i) => (
                                  <li key={i}>{o}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {msg.descriptiveSummary.associatedSituations.length > 0 && (
                            <p className="text-ania-ink-secondary">
                              <strong>Situaciones que relacionaste:</strong>{' '}
                              {msg.descriptiveSummary.associatedSituations.join(' · ')}
                            </p>
                          )}

                          {msg.descriptiveSummary.helpfulElements.length > 0 && (
                            <p className="text-ania-ink-secondary">
                              <strong>Lo que sientes que te ayudó:</strong>{' '}
                              {msg.descriptiveSummary.helpfulElements.join(' · ')}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                handleValidateSummary(msg.id, true);
                                const joined = [
                                  ...msg.descriptiveSummary!.userWords,
                                  ...msg.descriptiveSummary!.aniaOrganization,
                                ].join(' | ');
                                onAuthorizeNote(joined, msg.id);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-ania-accent text-ania-accent-on font-medium hover:bg-ania-accent-hover"
                            >
                              Sí, me representa · Guardar para consulta
                            </button>
                            <button
                              type="button"
                              onClick={() => handleValidateSummary(msg.id, false)}
                              className="px-3 py-1.5 rounded-lg border border-ania-border-strong text-ania-ink-muted hover:bg-ania-surface-soft"
                            >
                              No me encaja
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Persistent distress gentle nudge -> CU6 / Professional */}
                  {msg.suggestSupportOrProfessional && (
                    <div className="bg-ania-lavender-bg border border-ania-lavender-border rounded-xl p-3.5 text-xs text-ania-lavender-text space-y-2">
                      <p className="leading-relaxed">
                        Noto que este malestar viene pesando bastante. AnIA puede acompañarte a ordenarlo, pero hablar con alguien de confianza o con un profesional puede darte un apoyo real que la IA no sustituye.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onNavigate('apoyo')}
                          className="px-3 py-1.5 rounded-lg bg-ania-surface border border-ania-lavender-border text-ania-lavender-accent font-medium hover:opacity-90"
                        >
                          Explorar mi red de apoyo
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('consulta')}
                          className="px-3 py-1.5 rounded-lg bg-ania-surface border border-ania-lavender-border text-ania-lavender-accent font-medium hover:opacity-90"
                        >
                          Preparar notas para consulta
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Replies */}
                  {lastAnia && msg.quickReplies && msg.quickReplies.length > 0 && !loading && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr}
                          type="button"
                          onClick={() => {
                            if (qr.toLowerCase().includes('respirar')) {
                              onNavigate('calmarme');
                            } else {
                              void sendMessage(qr);
                            }
                          }}
                          className="px-4 py-2 rounded-full border border-ania-accent bg-ania-surface text-ania-accent-text text-xs font-medium hover:bg-ania-accent-tint transition-colors"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Bottom action links */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ania-ink-subtle pt-0.5">
                    <span className="tabular-nums text-[11px] text-ania-ink-faint">{msg.timestamp}</span>
                    {msg.id !== 'welcome-1' && (
                      <button
                        type="button"
                        onClick={() => onAuthorizeNote(msg.text, msg.id)}
                        className="inline-flex items-center gap-1 font-medium text-ania-accent-text underline underline-offset-2 hover:opacity-80"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {msg.savedToConsulta
                            ? 'Guardado para mi consulta'
                            : 'Guardar para hablarlo con mi psicólogo'}
                        </span>
                      </button>
                    )}
                    {lastAnia && messages.length > 2 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            void sendMessage(
                              '¿Podrías devolverme un breve resumen descriptivo de lo que he expresado hasta ahora para revisarlo?',
                              true
                            )
                          }
                          className="text-ania-ink-secondary underline underline-offset-2 hover:text-ania-ink"
                        >
                          Revisar resumen
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPauseOptions((s) => !s)}
                          className="inline-flex items-center gap-1 text-ania-ink-subtle hover:text-ania-ink"
                        >
                          <PauseCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>No quiero seguir ahora</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {showPauseOptions && (
          <div className="bg-ania-surface-soft border border-ania-border rounded-2xl p-4 space-y-2.5 text-xs">
            <p className="font-medium text-ania-ink">
              Lo respetamos por completo. No tienes que seguir hablando si no te apetece.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPauseOptions(false);
                  onResetConversation(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-ania-surface border border-ania-border-strong text-ania-ink font-medium hover:bg-ania-surface-hover"
              >
                Finalizar y conservar solo lo autorizado
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPauseOptions(false);
                  onResetConversation(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ania-surface border border-ania-safety-border text-ania-safety-accent font-medium hover:bg-ania-safety-bg"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Eliminar esta conversación</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPauseOptions(false)}
                className="px-3 py-2 text-ania-ink-subtle hover:text-ania-ink"
              >
                Cerrar aviso
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-ania-accent-soft text-ania-accent-text flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="bg-ania-accent-tint rounded-2xl px-5 py-3 text-xs text-ania-ink-muted">
              AnIA está leyendo con calma…
            </div>
          </div>
        )}

        {error && (
          <div className="bg-ania-safety-bg border border-ania-safety-border rounded-xl px-4 py-3 text-xs text-ania-safety-text flex items-center justify-between gap-2">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="font-semibold">
              Cerrar
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Optional manual note drawer above composer */}
      {manualNoteOpen && (
        <div className="px-5 sm:px-7 py-3 bg-ania-surface-soft border-t border-ania-border flex items-center gap-2">
          <input
            type="text"
            value={manualNoteText}
            onChange={(e) => setManualNoteText(e.target.value)}
            placeholder="Añadir una nota literal directamente a tus Notas para consulta..."
            className="flex-1 bg-ania-surface text-ania-ink placeholder:text-ania-ink-faint border border-ania-border-strong rounded-xl px-3.5 py-2 text-xs"
          />
          <button
            type="button"
            onClick={() => {
              if (manualNoteText.trim()) {
                onAuthorizeNote(manualNoteText.trim());
                setManualNoteText('');
                setManualNoteOpen(false);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-ania-accent text-ania-accent-on text-xs font-medium"
          >
            Guardar nota
          </button>
          <button
            type="button"
            onClick={() => setManualNoteOpen(false)}
            className="p-1.5 text-ania-ink-subtle"
            aria-label="Cerrar nota"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Composer Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
        className="px-5 sm:px-7 py-4 border-t border-ania-border bg-ania-surface flex items-center gap-2.5"
      >
        <button
          type="button"
          onClick={() => setManualNoteOpen((v) => !v)}
          className="p-2.5 rounded-full text-ania-ink-subtle hover:bg-ania-surface-soft hover:text-ania-ink transition-colors shrink-0"
          title="Añadir nota directa para tu consulta"
          aria-label="Añadir nota directa para tu consulta"
        >
          <Paperclip className="w-4 h-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`p-2.5 rounded-full transition-colors shrink-0 ${
            listening
              ? 'bg-ania-safety-bg text-ania-safety-accent'
              : 'text-ania-ink-subtle hover:bg-ania-surface-soft hover:text-ania-ink'
          }`}
          title={listening ? 'Detener dictado por voz' : 'Hablar por voz (dictado)'}
          aria-label={listening ? 'Detener dictado por voz' : 'Dictar por voz'}
        >
          {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe lo que quieras, a tu ritmo..."
          className="flex-1 bg-ania-surface-soft border border-ania-border rounded-full px-5 py-3 text-sm text-ania-ink placeholder:text-ania-ink-faint focus:bg-ania-surface transition-colors"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          aria-label="Enviar mensaje"
          className="w-11 h-11 rounded-full bg-ania-accent text-ania-accent-on flex items-center justify-center hover:bg-ania-accent-hover disabled:opacity-40 transition-colors shrink-0"
        >
          <ArrowUp className="w-5 h-5" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
