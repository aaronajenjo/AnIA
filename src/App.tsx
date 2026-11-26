import { Menu, Palette, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import aniaLogo from './assets/images/logo.png';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { AvatarView } from './components/AvatarView';
import { CalmToolsView } from './components/CalmToolsView';
import { ConversarView } from './components/ConversarView';
import { DEMO_STEPS, DemoTutorialOverlay } from './components/DemoTutorialOverlay';
import { DiaryView } from './components/DiaryView';
import { HomeModeSelector } from './components/HomeModeSelector';
import { MessageHelperView } from './components/MessageHelperView';
import { PrivacyControlModal } from './components/PrivacyControlModal';
import { RightPanel } from './components/RightPanel';
import { SafetyProtocolView } from './components/SafetyProtocolView';
import { Sidebar } from './components/Sidebar';
import { SupportNetworkView } from './components/SupportNetworkView';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { TherapyNotesView } from './components/TherapyNotesView';
import {
  DEMO_AUTHORIZED_NOTES,
  DEMO_CHAT_TURN_1_ANIA,
  DEMO_CHAT_TURN_1_USER,
  DEMO_CHAT_TURN_2_ANIA,
  DEMO_CHAT_TURN_2_USER,
  DEMO_CONSULTA_ITEMS,
  DEMO_DIARY_ENTRIES,
  DEMO_MESSAGE_PREVIEW,
  DEMO_SAVED_DRAFTS,
  DEMO_SUPPORT_NEEDS,
  DEMO_SUPPORT_PEOPLE,
  DEMO_TREND_OBSERVATION,
  DEMO_WELCOME_MESSAGE,
  type DemoMessagePreview,
} from './shared/demoData';
import type {
  AppView,
  ChatMessage,
  ConsultaSummaryState,
  DescriptiveTrendObservation,
  DiaryEntry,
  HomeConversationMode,
  SavedMessageDraft,
  SupportNeedType,
  SupportPerson,
} from './shared/types';
import { useAniaStore } from './store/useAniaStore';

interface DemoSandboxData {
  messages: ChatMessage[];
  authorizedConversationNotes: string[];
  diaryEntries: DiaryEntry[];
  trendObservation: DescriptiveTrendObservation | null;
  draftMessages: SavedMessageDraft[];
  consultaSummary: ConsultaSummaryState;
  supportNetwork: SupportPerson[];
  selectedSupportNeeds: SupportNeedType[];
  currentMood: string | null;
  messagePreview: DemoMessagePreview | null;
}

function createEmptyDemoSandbox(): DemoSandboxData {
  return {
    messages: [DEMO_WELCOME_MESSAGE],
    authorizedConversationNotes: [],
    diaryEntries: [],
    trendObservation: null,
    draftMessages: [],
    consultaSummary: { items: [], showOnlyApproved: false },
    supportNetwork: [],
    selectedSupportNeeds: [],
    currentMood: null,
    messagePreview: null,
  };
}

const VIEW_TITLES: Record<AppView, string> = {
  conversar: 'Espacio seguro',
  diario: 'Mi diario · Seguimiento a tu ritmo',
  calmarme: 'Calmarme',
  mensaje: 'Preparar un mensaje',
  consulta: 'Notas para mi terapia',
  apoyo: 'Mi red de apoyo y recursos',
};

export default function App() {
  const store = useAniaStore();
  const { state, activeView, cu4Active } = store;

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [externalChatPrompt, setExternalChatPrompt] = useState<string | null>(null);
  const [avatarCustomizerOpen, setAvatarCustomizerOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [demoMode, setDemoMode] = useState<'idle' | 'prompt' | 'tour'>(() =>
    state.onboardingDemoSeen ? 'idle' : 'prompt'
  );
  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [demoAutoPlay, setDemoAutoPlay] = useState(false);
  const [demoLiveStatus, setDemoLiveStatus] = useState<string | null>(null);
  const [demoSandbox, setDemoSandbox] = useState<DemoSandboxData>(createEmptyDemoSandbox);

  const isDemoTour = demoMode === 'tour';
  const displayMessages = isDemoTour ? demoSandbox.messages : state.messages;
  const displayAuthorizedNotes = isDemoTour
    ? demoSandbox.authorizedConversationNotes
    : state.authorizedConversationNotes;
  const displayDiaryEntries = isDemoTour ? demoSandbox.diaryEntries : state.diaryEntries;
  const displayTrendObservation = isDemoTour
    ? demoSandbox.trendObservation
    : state.trendObservation;
  const displayDraftMessages = isDemoTour ? demoSandbox.draftMessages : state.draftMessages;
  const displayConsultaSummary = isDemoTour
    ? demoSandbox.consultaSummary
    : state.consultaSummary;
  const displaySupportNetwork = isDemoTour ? demoSandbox.supportNetwork : state.supportNetwork;
  const displaySupportNeeds = isDemoTour
    ? demoSandbox.selectedSupportNeeds
    : state.selectedSupportNeeds;
  const displayCurrentMood = isDemoTour ? demoSandbox.currentMood : state.currentMood;

  const sharedAppContext = useMemo(
    () => ({
      recentDiarySummary: displayDiaryEntries.slice(0, 4).map(
        (d) =>
          `${d.createdAt.slice(0, 10)}: emociones=[${d.emotions.join(', ')}], sobrecarga=${d.overloadLevel}, descanso=${d.restQuality}`
      ),
      supportNetworkNames: displaySupportNetwork.map((p) => `${p.name} (${p.relationship})`),
      consultaNotesCount:
        displayAuthorizedNotes.length +
        displayConsultaSummary.items.filter((i) => i.included).length,
    }),
    [
      displayDiaryEntries,
      displaySupportNetwork,
      displayAuthorizedNotes.length,
      displayConsultaSummary.items,
    ]
  );

  const handleSelectView = (view: AppView) => {
    if (cu4Active) store.exitCU4();
    store.setActiveView(view);
    setMobileNavOpen(false);
  };

  const handleQuickStartWithMood = (mood: string) => {
    if (cu4Active) store.exitCU4();
    store.setActiveView('conversar');
    if (state.homeMode === 'choose') {
      store.setState((prev) => ({ ...prev, homeMode: 'chat' }));
    }
    setExternalChatPrompt(`Ahora mismo me siento ${mood.toLowerCase()}.`);
  };

  const setHomeMode = (mode: HomeConversationMode) => {
    store.setState((prev) => ({ ...prev, homeMode: mode }));
  };

  const applyDemoStep = (index: number, keepAutoPlay = false) => {
    const safeIndex = Math.max(0, Math.min(DEMO_STEPS.length - 1, index));
    const step = DEMO_STEPS[safeIndex];
    if (!keepAutoPlay) {
      setDemoAutoPlay(false);
    }
    if (cu4Active) store.exitCU4();
    store.setActiveView(step.view);
    if (step.homeMode) {
      setHomeMode(step.homeMode);
    }
    setDemoStepIndex(safeIndex);
  };

  const handleStartDemo = (startAutoPlay = false) => {
    setMobileNavOpen(false);
    store.markOnboardingDemoSeen();
    if (!state.consentAccepted) {
      store.acceptConsent();
    }
    setDemoSandbox(createEmptyDemoSandbox());
    setDemoLiveStatus(null);
    setDemoAutoPlay(startAutoPlay);
    setDemoMode('tour');
    applyDemoStep(0, startAutoPlay);
  };

  const handleSkipDemo = () => {
    store.markOnboardingDemoSeen();
    setDemoAutoPlay(false);
    setDemoLiveStatus(null);
    setDemoMode('idle');
  };

  const handleFinishDemo = () => {
    const wasLastStep = demoStepIndex === DEMO_STEPS.length - 1;
    store.markOnboardingDemoSeen();
    setDemoAutoPlay(false);
    setDemoLiveStatus(null);
    setDemoSandbox(createEmptyDemoSandbox());
    setDemoMode('idle');
    if (wasLastStep) {
      if (cu4Active) store.exitCU4();
      store.setActiveView('conversar');
      setHomeMode('choose');
    }
  };

  const handleDemoOptionalAction = (
    action: 'avatar_customizer' | 'theme_customizer' | 'privacy_modal'
  ) => {
    setDemoAutoPlay(false);
    if (action === 'avatar_customizer') setAvatarCustomizerOpen(true);
    else if (action === 'theme_customizer') setThemeModalOpen(true);
    else if (action === 'privacy_modal') store.setPrivacyOpen(true);
  };

  // Live progressive messages & responses per demo step (never modifies real user data)
  useEffect(() => {
    if (demoMode !== 'tour') return;
    const timers: number[] = [];

    if (demoStepIndex === 0) {
      setDemoLiveStatus('Ejemplo interactivo: tus datos reales no se modifican durante la demo.');
      setDemoSandbox((prev) => ({
        ...prev,
        messages: [DEMO_WELCOME_MESSAGE],
        messagePreview: null,
      }));
    } else if (demoStepIndex === 1) {
      setDemoLiveStatus('Enviando mensaje de ejemplo al chat…');
      setDemoSandbox((prev) => ({
        ...prev,
        messages: [DEMO_WELCOME_MESSAGE],
      }));
      timers.push(
        window.setTimeout(() => {
          setDemoSandbox((prev) => ({
            ...prev,
            messages: [DEMO_WELCOME_MESSAGE, DEMO_CHAT_TURN_1_USER],
            currentMood: 'Cansancio',
          }));
          setDemoLiveStatus('AnIA está leyendo y preparando una respuesta abierta…');
        }, 300)
      );
      timers.push(
        window.setTimeout(() => {
          setDemoSandbox((prev) => ({
            ...prev,
            messages: [DEMO_WELCOME_MESSAGE, DEMO_CHAT_TURN_1_USER, DEMO_CHAT_TURN_1_ANIA],
            authorizedConversationNotes: [DEMO_AUTHORIZED_NOTES[0]],
          }));
          setDemoLiveStatus(
            'Respuesta recibida en el chat: emociones validables, resumen descriptivo y nota guardada.'
          );
        }, 1050)
      );
    } else if (demoStepIndex === 2) {
      setDemoSandbox((prev) => ({
        ...prev,
        messages: [DEMO_WELCOME_MESSAGE, DEMO_CHAT_TURN_1_USER, DEMO_CHAT_TURN_1_ANIA],
        authorizedConversationNotes: [DEMO_AUTHORIZED_NOTES[0]],
        currentMood: 'Cansancio',
      }));
      setDemoLiveStatus('Continuando la misma conversación desde el Avatar IA…');
      timers.push(
        window.setTimeout(() => {
          setDemoSandbox((prev) => ({
            ...prev,
            messages: [
              DEMO_WELCOME_MESSAGE,
              DEMO_CHAT_TURN_1_USER,
              DEMO_CHAT_TURN_1_ANIA,
              DEMO_CHAT_TURN_2_USER,
            ],
          }));
        }, 450)
      );
      timers.push(
        window.setTimeout(() => {
          setDemoSandbox((prev) => ({
            ...prev,
            messages: [
              DEMO_WELCOME_MESSAGE,
              DEMO_CHAT_TURN_1_USER,
              DEMO_CHAT_TURN_1_ANIA,
              DEMO_CHAT_TURN_2_USER,
              DEMO_CHAT_TURN_2_ANIA,
            ],
            authorizedConversationNotes: DEMO_AUTHORIZED_NOTES,
          }));
          setDemoLiveStatus(
            'El Avatar IA responde manteniendo todo el historial y el contexto del chat.'
          );
        }, 1200)
      );
    } else if (demoStepIndex === 3) {
      setDemoSandbox((prev) => ({
        ...prev,
        diaryEntries: DEMO_DIARY_ENTRIES,
        trendObservation: null,
      }));
      setDemoLiveStatus('Mostrando registros de ejemplo de esta semana en Mi diario…');
      timers.push(
        window.setTimeout(() => {
          setDemoSandbox((prev) => ({
            ...prev,
            trendObservation: DEMO_TREND_OBSERVATION,
          }));
          setDemoLiveStatus('Tendencias descriptivas generadas para que confirmes si te encajan.');
        }, 600)
      );
    } else if (demoStepIndex === 4) {
      setDemoLiveStatus(
        'Ejercicios inmediatos listos: puedes probar la respiración guiada o el anclaje 5-4-3-2-1.'
      );
    } else if (demoStepIndex === 5) {
      setDemoLiveStatus('Generando 3 propuestas de mensaje a partir de tu conversación…');
      timers.push(
        window.setTimeout(() => {
          setDemoSandbox((prev) => ({
            ...prev,
            draftMessages: DEMO_SAVED_DRAFTS,
            messagePreview: DEMO_MESSAGE_PREVIEW,
          }));
          setDemoLiveStatus(
            '3 borradores listos en pantalla (Cercano, Sereno y Directo) para editar antes de copiar.'
          );
        }, 400)
      );
    } else if (demoStepIndex === 6) {
      setDemoLiveStatus('Organizando notas autorizadas para llevar a consulta…');
      timers.push(
        window.setTimeout(() => {
          setDemoSandbox((prev) => ({
            ...prev,
            authorizedConversationNotes: DEMO_AUTHORIZED_NOTES,
            diaryEntries: DEMO_DIARY_ENTRIES,
            consultaSummary: {
              lastGeneratedAt: new Date().toISOString(),
              items: DEMO_CONSULTA_ITEMS,
              showOnlyApproved: false,
            },
          }));
          setDemoLiveStatus(
            'Resumen listo: separa tus palabras literales de la síntesis descriptiva de AnIA.'
          );
        }, 400)
      );
    } else if (demoStepIndex === 7) {
      setDemoSandbox((prev) => ({
        ...prev,
        supportNetwork: DEMO_SUPPORT_PEOPLE,
        selectedSupportNeeds: DEMO_SUPPORT_NEEDS,
      }));
      setDemoLiveStatus(
        'Red de apoyo y líneas 24h activas. Al pulsar «Finalizar», tu espacio volverá a quedar limpio.'
      );
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [demoMode, demoStepIndex]);

  // Optional auto-play ("Ver demo del tirón")
  useEffect(() => {
    if (
      demoMode !== 'tour' ||
      !demoAutoPlay ||
      avatarCustomizerOpen ||
      themeModalOpen ||
      store.privacyOpen
    ) {
      return;
    }
    if (demoStepIndex >= DEMO_STEPS.length - 1) {
      setDemoAutoPlay(false);
      return;
    }
    const delayMs = demoStepIndex === 0 || demoStepIndex === 4 ? 4600 : 6800;
    const timer = window.setTimeout(() => {
      applyDemoStep(demoStepIndex + 1, true);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [
    demoMode,
    demoAutoPlay,
    demoStepIndex,
    avatarCustomizerOpen,
    themeModalOpen,
    store.privacyOpen,
  ]);

  const trustedContacts = displaySupportNetwork.filter((p) => p.isTrustedEmergencyContact);

  return (
    <div className="min-h-screen bg-ania-canvas text-ania-ink flex flex-col lg:flex-row transition-colors">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-ania-canvas border-b border-ania-border sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="p-2 rounded-xl hover:bg-ania-surface-hover text-ania-ink"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img
            src={aniaLogo}
            alt="Logo de AnIA"
            className="w-8 h-8 object-contain shrink-0"
          />
          <span className="font-display text-lg font-semibold text-ania-heading">AnIA</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setThemeModalOpen(true)}
            className="p-2 rounded-xl hover:bg-ania-surface-hover text-ania-ink-secondary"
            aria-label="Personalizar tema"
            title="Personalizar tema"
          >
            <Palette className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => store.triggerCU4('Has abierto las líneas de ayuda humana.')}
            className="px-3 py-1.5 rounded-xl bg-ania-safety-bg border border-ania-safety-border text-xs font-semibold text-ania-safety-accent"
          >
            Ayuda 024
          </button>
        </div>
      </header>

      {/* Mobile Drawer Sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/35"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[268px] max-w-[85vw] bg-ania-canvas h-full flex flex-col overflow-y-auto">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-ania-ink-muted"
              aria-label="Cerrar menú"
            >
              <X className="w-4 h-4" />
            </button>
            <Sidebar
              activeView={activeView}
              onSelectView={handleSelectView}
              onOpenPrivacy={() => {
                setMobileNavOpen(false);
                store.setPrivacyOpen(true);
              }}
              onOpenTheme={() => {
                setMobileNavOpen(false);
                setThemeModalOpen(true);
              }}
              onOpenDemo={() => handleStartDemo(false)}
              cu4Active={cu4Active}
              consultaCount={displayConsultaSummary.items.filter((i) => i.included).length}
              memoryEnabled={state.memoryEnabled}
            />
          </div>
        </div>
      )}

      {/* Desktop Left Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          activeView={activeView}
          onSelectView={handleSelectView}
          onOpenPrivacy={() => store.setPrivacyOpen(true)}
          onOpenTheme={() => setThemeModalOpen(true)}
          onOpenDemo={() => handleStartDemo(false)}
          cu4Active={cu4Active}
          consultaCount={displayConsultaSummary.items.filter((i) => i.included).length}
          memoryEnabled={state.memoryEnabled}
        />
      </div>

      {/* Main Content + Right Panel */}
      <div
        className={`flex-1 flex flex-col xl:flex-row gap-5 min-w-0 max-w-[1440px] ${
          !cu4Active &&
          activeView === 'conversar' &&
          state.consentAccepted &&
          state.homeMode === 'avatar'
            ? 'p-2.5 sm:p-6'
            : 'p-4 sm:p-6'
        }`}
      >
        {/* Center Workspace Card */}
        <main
          className={`flex-1 bg-ania-surface border border-ania-border rounded-3xl flex flex-col overflow-hidden transition-colors ${
            !cu4Active &&
            activeView === 'conversar' &&
            state.consentAccepted &&
            state.homeMode === 'avatar'
              ? 'h-[calc(100dvh-5rem)] lg:h-auto lg:min-h-[78vh] lg:max-h-[calc(100vh-3rem)]'
              : 'min-h-[78vh] lg:max-h-[calc(100vh-3rem)]'
          }`}
        >
          {/* Card Header Bar */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-ania-border-subtle flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <img
                src={aniaLogo}
                alt=""
                aria-hidden="true"
                className="w-6 h-6 object-contain shrink-0"
              />
              <h1 className="font-display text-sm sm:text-base font-semibold text-ania-heading">
                {cu4Active ? 'Seguridad y conexión con ayuda humana' : VIEW_TITLES[activeView]}
              </h1>
              {state.easyRead && (
                <span className="text-xs text-ania-accent-text">· Lectura fácil</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Seamless Switcher between Home Chooser, Chat, and Avatar IA */}
              {!cu4Active && activeView === 'conversar' && state.consentAccepted && (
                <div
                  role="tablist"
                  aria-label="Modo de conversación"
                  className="flex items-center gap-1 p-1 bg-ania-surface-soft border border-ania-border rounded-xl text-xs"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={state.homeMode === 'choose'}
                    onClick={() => setHomeMode('choose')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      state.homeMode === 'choose'
                        ? 'bg-ania-surface text-ania-heading shadow-xs'
                        : 'text-ania-ink-subtle hover:text-ania-ink'
                    }`}
                  >
                    Inicio
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={state.homeMode === 'chat'}
                    onClick={() => setHomeMode('chat')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      state.homeMode === 'chat'
                        ? 'bg-ania-surface text-ania-heading shadow-xs'
                        : 'text-ania-ink-subtle hover:text-ania-ink'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={state.homeMode === 'avatar'}
                    onClick={() => setHomeMode('avatar')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      state.homeMode === 'avatar'
                        ? 'bg-ania-surface text-ania-heading shadow-xs'
                        : 'text-ania-ink-subtle hover:text-ania-ink'
                    }`}
                  >
                    Avatar IA
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setThemeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-ania-ink-muted hover:bg-ania-surface-soft hover:text-ania-ink transition-colors"
                title="Personalizar tema"
              >
                <Palette className="w-3.5 h-3.5 text-ania-accent-text" aria-hidden="true" />
                <span className="hidden sm:inline">Tema</span>
              </button>

              <button
                type="button"
                onClick={() => store.setPrivacyOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-ania-ink-muted hover:bg-ania-surface-soft hover:text-ania-ink transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Accesibilidad y privacidad</span>
              </button>

              {!cu4Active &&
                activeView === 'conversar' &&
                state.consentAccepted &&
                state.homeMode !== 'choose' && (
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen((v) => !v)}
                    className="text-xs font-medium text-ania-ink-muted hover:text-ania-ink whitespace-nowrap"
                  >
                    Empezar de nuevo
                  </button>
                )}
            </div>
          </div>

          {/* Confirm Reset Conversation Bar */}
          {confirmResetOpen &&
            !cu4Active &&
            activeView === 'conversar' &&
            state.homeMode !== 'choose' && (
              <div className="px-6 py-3 bg-ania-surface-soft border-b border-ania-border flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-ania-ink-secondary">
                  ¿Cómo prefieres empezar una nueva conversación?
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      store.resetConversation(true);
                      setConfirmResetOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-ania-surface border border-ania-border-strong font-medium text-ania-ink"
                  >
                    Conservar mis notas de consulta
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      store.resetConversation(false);
                      setConfirmResetOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-ania-safety-bg border border-ania-safety-border font-medium text-ania-safety-accent"
                  >
                    Borrar también notas de esta charla
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen(false)}
                    className="px-2 py-1.5 text-ania-ink-subtle"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

          {/* Active Route / Transversal CU4 Protocol */}
          {cu4Active ? (
            <SafetyProtocolView
              reason={store.cu4Reason}
              trustedContacts={trustedContacts}
              professionalRef={state.professionalRef}
              onExit={store.exitCU4}
              onOpenSupportNetwork={() => {
                store.exitCU4();
                store.setActiveView('apoyo');
              }}
            />
          ) : activeView === 'conversar' ? (
            !state.consentAccepted ? (
              <ConversarView
                consentAccepted={false}
                onAcceptConsent={store.acceptConsent}
                messages={state.messages}
                onUpdateMessages={(updater) =>
                  store.setState((prev) => ({ ...prev, messages: updater(prev.messages) }))
                }
                easyRead={state.easyRead}
                voiceReadAloud={state.voiceReadAloud}
                currentMood={state.currentMood}
                onAuthorizeNote={store.authorizeNoteForConsulta}
                onTriggerSafety={store.triggerCU4}
                onNavigate={handleSelectView}
                onResetConversation={store.resetConversation}
              />
            ) : state.homeMode === 'choose' ? (
              <HomeModeSelector
                avatarConfig={state.avatarConfig}
                messageCount={displayMessages.length}
                onSelectChat={() => setHomeMode('chat')}
                onSelectAvatar={() => setHomeMode('avatar')}
                onOpenCustomizer={() => setAvatarCustomizerOpen(true)}
              />
            ) : state.homeMode === 'avatar' ? (
              <AvatarView
                avatarConfig={state.avatarConfig}
                messages={displayMessages}
                onUpdateMessages={(updater) => {
                  if (isDemoTour) {
                    setDemoSandbox((prev) => ({ ...prev, messages: updater(prev.messages) }));
                  } else {
                    store.setState((prev) => ({ ...prev, messages: updater(prev.messages) }));
                  }
                }}
                easyRead={state.easyRead}
                currentMood={displayCurrentMood}
                appContext={sharedAppContext}
                onAuthorizeNote={store.authorizeNoteForConsulta}
                onTriggerSafety={store.triggerCU4}
                onNavigate={handleSelectView}
                onResetConversation={store.resetConversation}
                onOpenCustomizer={() => setAvatarCustomizerOpen(true)}
                externalPrompt={externalChatPrompt}
                onClearExternalPrompt={() => setExternalChatPrompt(null)}
              />
            ) : (
              <ConversarView
                consentAccepted={state.consentAccepted}
                onAcceptConsent={store.acceptConsent}
                messages={displayMessages}
                onUpdateMessages={(updater) => {
                  if (isDemoTour) {
                    setDemoSandbox((prev) => ({ ...prev, messages: updater(prev.messages) }));
                  } else {
                    store.setState((prev) => ({ ...prev, messages: updater(prev.messages) }));
                  }
                }}
                easyRead={state.easyRead}
                voiceReadAloud={state.voiceReadAloud}
                currentMood={displayCurrentMood}
                appContext={sharedAppContext}
                onAuthorizeNote={store.authorizeNoteForConsulta}
                onTriggerSafety={store.triggerCU4}
                onNavigate={handleSelectView}
                onResetConversation={store.resetConversation}
                externalPrompt={externalChatPrompt}
                onClearExternalPrompt={() => setExternalChatPrompt(null)}
              />
            )
          ) : activeView === 'diario' ? (
            <DiaryView
              entries={displayDiaryEntries}
              followUpConfig={state.followUpConfig}
              trendObservation={displayTrendObservation}
              easyRead={state.easyRead}
              onAddEntry={store.addDiaryEntry}
              onUpdateEntry={store.updateDiaryEntry}
              onDeleteEntry={store.deleteDiaryEntry}
              onUpdateConfig={(cfg) =>
                store.setState((prev) => ({ ...prev, followUpConfig: cfg }))
              }
              onSetTrendObservation={(obs) => {
                if (isDemoTour) {
                  setDemoSandbox((prev) => ({ ...prev, trendObservation: obs }));
                } else {
                  store.setState((prev) => ({ ...prev, trendObservation: obs }));
                }
              }}
              onTriggerSafety={store.triggerCU4}
              onNavigate={handleSelectView}
            />
          ) : activeView === 'calmarme' ? (
            <CalmToolsView onLogHelpfulTool={store.addDiaryEntry} />
          ) : activeView === 'mensaje' ? (
            <MessageHelperView
              key={isDemoTour ? 'demo-msg' : 'live-msg'}
              drafts={displayDraftMessages}
              easyRead={state.easyRead}
              prefilledRecipient={store.prefilledMessageRecipient}
              prefilledGoal={store.prefilledMessageGoal}
              onClearPrefill={() => {
                store.setPrefilledMessageRecipient('');
                store.setPrefilledMessageGoal(null);
              }}
              onSaveDraft={store.saveDraftMessage}
              onDeleteDraft={store.deleteDraftMessage}
              onTriggerSafety={store.triggerCU4}
              onNavigate={handleSelectView}
              demoPreview={isDemoTour ? demoSandbox.messagePreview : null}
            />
          ) : activeView === 'consulta' ? (
            <TherapyNotesView
              authorizedConversationNotes={displayAuthorizedNotes}
              diaryEntries={displayDiaryEntries}
              summaryState={displayConsultaSummary}
              easyRead={state.easyRead}
              onSetItems={store.setConsultaItems}
              onAddItem={store.addConsultaItem}
              onUpdateItem={(id, patch) => {
                if (isDemoTour) {
                  setDemoSandbox((prev) => ({
                    ...prev,
                    consultaSummary: {
                      ...prev.consultaSummary,
                      items: prev.consultaSummary.items.map((item) =>
                        item.id === id ? { ...item, ...patch } : item
                      ),
                    },
                  }));
                } else {
                  store.updateConsultaItem(id, patch);
                }
              }}
              onDeleteItem={store.deleteConsultaItem}
              onToggleShowApproved={(val) => {
                if (isDemoTour) {
                  setDemoSandbox((prev) => ({
                    ...prev,
                    consultaSummary: { ...prev.consultaSummary, showOnlyApproved: val },
                  }));
                } else {
                  store.setState((prev) => ({
                    ...prev,
                    consultaSummary: { ...prev.consultaSummary, showOnlyApproved: val },
                  }));
                }
              }}
              onClearSummary={store.clearConsultaSummary}
              onTriggerSafety={store.triggerCU4}
            />
          ) : (
            <SupportNetworkView
              people={displaySupportNetwork}
              professionalRef={state.professionalRef}
              selectedNeeds={displaySupportNeeds}
              easyRead={state.easyRead}
              onUpdateNeeds={(needs) => {
                if (isDemoTour) {
                  setDemoSandbox((prev) => ({ ...prev, selectedSupportNeeds: needs }));
                } else {
                  store.setState((prev) => ({ ...prev, selectedSupportNeeds: needs }));
                }
              }}
              onAddPerson={store.addSupportPerson}
              onUpdatePerson={store.updateSupportPerson}
              onDeletePerson={store.deleteSupportPerson}
              onSetProfessionalRef={(prof) =>
                store.setState((prev) => ({ ...prev, professionalRef: prof }))
              }
              onPrepareMessage={store.openMessageForPerson}
              onTriggerSafety={store.triggerCU4}
            />
          )}
        </main>

        {/* Right Context Panel matching screenshot */}
        <RightPanel
          currentMood={displayCurrentMood}
          onSelectMood={(mood) => store.setState((prev) => ({ ...prev, currentMood: mood }))}
          onQuickStartWithMood={handleQuickStartWithMood}
          onNavigate={handleSelectView}
          onOpenSafety={() =>
            store.triggerCU4('Has solicitado ver las líneas de ayuda y apoyo humano.')
          }
          diaryCount={displayDiaryEntries.length}
        />
      </div>

      {/* Avatar Customizer Modal */}
      <AvatarCustomizerModal
        open={avatarCustomizerOpen}
        config={state.avatarConfig}
        onChange={(next) => store.setState((prev) => ({ ...prev, avatarConfig: next }))}
        onClose={() => setAvatarCustomizerOpen(false)}
      />

      {/* Theme Customizer Modal */}
      <ThemeCustomizerModal
        open={themeModalOpen}
        config={state.themeConfig}
        onChange={(next) => store.setState((prev) => ({ ...prev, themeConfig: next }))}
        onClose={() => setThemeModalOpen(false)}
      />

      {/* Privacy, Memory & Accessibility Modal */}
      <PrivacyControlModal
        open={store.privacyOpen}
        onClose={() => store.setPrivacyOpen(false)}
        onOpenTheme={() => {
          store.setPrivacyOpen(false);
          setThemeModalOpen(true);
        }}
        memoryEnabled={state.memoryEnabled}
        onToggleMemory={(val) => store.setState((prev) => ({ ...prev, memoryEnabled: val }))}
        easyRead={state.easyRead}
        onToggleEasyRead={(val) => store.setState((prev) => ({ ...prev, easyRead: val }))}
        textScale={state.textScale}
        onChangeTextScale={(scale) => store.setState((prev) => ({ ...prev, textScale: scale }))}
        voiceReadAloud={state.voiceReadAloud}
        onToggleVoiceReadAloud={(val) =>
          store.setState((prev) => ({ ...prev, voiceReadAloud: val }))
        }
        onExportData={store.exportAllData}
        onResetConversation={store.resetConversation}
        onEraseAllData={store.eraseAllData}
        auditLog={state.auditLog}
      />

      {/* Interactive First-Visit Onboarding Demo & Guided Walkthrough */}
      <DemoTutorialOverlay
        mode={demoMode}
        stepIndex={demoStepIndex}
        autoPlay={demoAutoPlay}
        liveStatus={demoLiveStatus}
        onStartDemo={handleStartDemo}
        onSkipDemo={handleSkipDemo}
        onToggleAutoPlay={() => setDemoAutoPlay((v) => !v)}
        onStepChange={(nextIdx) => applyDemoStep(nextIdx, false)}
        onFinishDemo={handleFinishDemo}
        onTriggerOptionalAction={handleDemoOptionalAction}
      />
    </div>
  );
}
