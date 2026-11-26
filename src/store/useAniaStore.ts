import { useEffect, useState } from 'react';
import defaultAvatarGlbUrl from '../assets/lmmfdolj.glb?url';
import { applyThemeToDocument, DEFAULT_THEME_CONFIG } from '../shared/themes';
import type {
  AppThemeConfig,
  AppView,
  AuditEntry,
  AvatarConfig,
  ChatMessage,
  CommunicativeGoal,
  ConsultaItem,
  ConsultaSectionKey,
  ConsultaSummaryState,
  DescriptiveTrendObservation,
  DiaryEntry,
  FollowUpConfig,
  HomeConversationMode,
  ProfessionalReference,
  SavedMessageDraft,
  SupportNeedType,
  SupportPerson,
  TextScale,
} from '../shared/types';

export interface AniaPersistedState {
  consentAccepted: boolean;
  consentAcceptedAt?: string;
  onboardingDemoSeen: boolean;
  homeMode: HomeConversationMode;
  avatarConfig: AvatarConfig;
  themeConfig: AppThemeConfig;
  memoryEnabled: boolean;
  easyRead: boolean;
  textScale: TextScale;
  voiceReadAloud: boolean;
  currentMood: string | null;
  messages: ChatMessage[];
  authorizedConversationNotes: string[];
  diaryEntries: DiaryEntry[];
  followUpConfig: FollowUpConfig;
  trendObservation: DescriptiveTrendObservation | null;
  draftMessages: SavedMessageDraft[];
  consultaSummary: ConsultaSummaryState;
  supportNetwork: SupportPerson[];
  professionalRef: ProfessionalReference | null;
  selectedSupportNeeds: SupportNeedType[];
  auditLog: AuditEntry[];
}

const STORAGE_KEY = 'ania_personal_space_v1';

function createInitialMessages(): ChatMessage[] {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return [
    {
      id: 'welcome-1',
      role: 'ania',
      text: 'Hola. Este es tu espacio seguro para expresarte a tu ritmo, sin juicios ni prisas.\n\nNo soy una psicóloga ni hago diagnósticos, pero puedo ayudarte a poner palabras a lo que sientes, ordenar ideas para tu consulta o preparar un mensaje difícil.',
      timestamp: timeStr,
      quickReplies: [
        'Contarte cómo ha ido mi día',
        'No sé muy bien qué siento hoy',
        'Solo quiero ordenar lo que tengo en la cabeza',
      ],
    },
  ];
}

export const DEFAULT_GLB_MODEL_URL = defaultAvatarGlbUrl;
const CURRENT_AVATAR_VERSION = 3;

const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  displayName: 'AnIA',
  renderMode: 'model_3d',
  staticPhotoPreset: 'clara',
  customModelUrl: DEFAULT_GLB_MODEL_URL,
  customModelName: 'lmmfdolj.glb',
  animate3d: true,
  model3dInitialized: true,
  defaultAvatarVersion: CURRENT_AVATAR_VERSION,
  skinTone: 'warm_light',
  hairStyle: 'wavy_bob',
  hairColor: 'chestnut',
  eyeColor: 'hazel',
  glasses: false,
  beard: false,
  outfitColor: 'sage',
  background: 'window_light',
  voiceName: 'Kore',
  voiceRate: 'normal',
  autoSpeak: true,
};

const DEFAULT_STATE: AniaPersistedState = {
  consentAccepted: false,
  onboardingDemoSeen: false,
  homeMode: 'choose',
  avatarConfig: DEFAULT_AVATAR_CONFIG,
  themeConfig: DEFAULT_THEME_CONFIG,
  memoryEnabled: true,
  easyRead: false,
  textScale: 'normal',
  voiceReadAloud: false,
  currentMood: null,
  messages: createInitialMessages(),
  authorizedConversationNotes: [],
  diaryEntries: [],
  followUpConfig: {
    enabled: false,
    frequency: 'none',
    preferredDay: 'domingo',
    preferredTime: '20:00',
    trackFields: {
      emotion: true,
      intensity: true,
      overload: true,
      rest: true,
      situations: true,
      helpful: true,
    },
  },
  trendObservation: null,
  draftMessages: [],
  consultaSummary: {
    items: [],
    showOnlyApproved: false,
  },
  supportNetwork: [],
  professionalRef: null,
  selectedSupportNeeds: [],
  auditLog: [],
};

function loadInitialState(): AniaPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AniaPersistedState>;
    const savedAvatar = parsed.avatarConfig;
    const shouldActivateAddedGlb = savedAvatar?.defaultAvatarVersion !== CURRENT_AVATAR_VERSION;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      avatarConfig: {
        ...DEFAULT_AVATAR_CONFIG,
        ...(savedAvatar ?? {}),
        ...(shouldActivateAddedGlb
          ? {
              renderMode: 'model_3d' as const,
              customModelUrl: DEFAULT_GLB_MODEL_URL,
              customModelName: 'lmmfdolj.glb',
              animate3d: true,
              model3dInitialized: true,
              defaultAvatarVersion: CURRENT_AVATAR_VERSION,
            }
          : {}),
      },
      themeConfig: {
        ...DEFAULT_THEME_CONFIG,
        ...(parsed.themeConfig ?? {}),
      },
      followUpConfig: {
        ...DEFAULT_STATE.followUpConfig,
        ...(parsed.followUpConfig ?? {}),
        trackFields: {
          ...DEFAULT_STATE.followUpConfig.trackFields,
          ...(parsed.followUpConfig?.trackFields ?? {}),
        },
      },
      consultaSummary: {
        ...DEFAULT_STATE.consultaSummary,
        ...(parsed.consultaSummary ?? {}),
      },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function formatTimeHHMM(date = new Date()): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function useAniaStore() {
  const [state, setState] = useState<AniaPersistedState>(loadInitialState);
  const [activeView, setActiveView] = useState<AppView>('conversar');
  const [cu4Active, setCu4Active] = useState(false);
  const [cu4Reason, setCu4Reason] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [prefilledMessageRecipient, setPrefilledMessageRecipient] = useState<string>('');
  const [prefilledMessageGoal, setPrefilledMessageGoal] = useState<CommunicativeGoal | null>(null);

  useEffect(() => {
    try {
      if (state.memoryEnabled) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } else {
        // When memory is paused, preserve settings & explicit consent only without storing conversation/diary additions
        const minimal: AniaPersistedState = {
          ...DEFAULT_STATE,
          consentAccepted: state.consentAccepted,
          consentAcceptedAt: state.consentAcceptedAt,
          onboardingDemoSeen: state.onboardingDemoSeen,
          themeConfig: state.themeConfig,
          memoryEnabled: false,
          easyRead: state.easyRead,
          textScale: state.textScale,
          voiceReadAloud: state.voiceReadAloud,
          auditLog: state.auditLog,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
      }
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [state]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('text-scale-large', 'text-scale-xlarge');
    if (state.textScale === 'large') html.classList.add('text-scale-large');
    if (state.textScale === 'xlarge') html.classList.add('text-scale-xlarge');
  }, [state.textScale]);

  useEffect(() => {
    applyThemeToDocument(state.themeConfig);
  }, [state.themeConfig]);

  const appendAudit = (
    category: AuditEntry['category'],
    description: string,
    prevLog: AuditEntry[]
  ): AuditEntry[] => [
    {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      category,
      description,
    },
    ...prevLog.slice(0, 49),
  ];

  const acceptConsent = () => {
    setState((prev) => ({
      ...prev,
      consentAccepted: true,
      consentAcceptedAt: new Date().toISOString(),
      auditLog: appendAudit(
        'consent',
        'Has aceptado las condiciones de privacidad y alcance de AnIA.',
        prev.auditLog
      ),
    }));
  };

  const markOnboardingDemoSeen = () => {
    setState((prev) =>
      prev.onboardingDemoSeen ? prev : { ...prev, onboardingDemoSeen: true }
    );
  };

  const triggerCU4 = (reason?: string) => {
    setCu4Reason(
      reason ??
        'Priorizamos tu bienestar y el contacto con ayuda humana. Puedes elegir una opción o ver líneas disponibles.'
    );
    setCu4Active(true);
    setState((prev) => ({
      ...prev,
      auditLog: appendAudit(
        'safety',
        'Protocolo CU4 (Seguridad y conexión con ayuda humana) activado.',
        prev.auditLog
      ),
    }));
  };

  const exitCU4 = () => {
    setCu4Active(false);
    setCu4Reason(null);
  };

  const resetConversation = (keepAuthorizedNotes: boolean) => {
    setState((prev) => ({
      ...prev,
      messages: createInitialMessages(),
      authorizedConversationNotes: keepAuthorizedNotes ? prev.authorizedConversationNotes : [],
      auditLog: appendAudit(
        'delete',
        keepAuthorizedNotes
          ? 'Conversación reiniciada conservando notas autorizadas.'
          : 'Conversación y notas temporales eliminadas por tu decisión.',
        prev.auditLog
      ),
    }));
  };

  const authorizeNoteForConsulta = (text: string, messageId?: string) => {
    setState((prev) => {
      const alreadyExists = prev.authorizedConversationNotes.includes(text);
      const nextNotes = alreadyExists
        ? prev.authorizedConversationNotes
        : [...prev.authorizedConversationNotes, text];
      const nextMessages = messageId
        ? prev.messages.map((m) => (m.id === messageId ? { ...m, savedToConsulta: true } : m))
        : prev.messages;
      return {
        ...prev,
        authorizedConversationNotes: nextNotes,
        messages: nextMessages,
        auditLog: appendAudit(
          'save',
          'Has guardado un fragmento autorizado para tus notas de consulta (CU3).',
          prev.auditLog
        ),
      };
    });
  };

  const addDiaryEntry = (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => {
    const newEntry: DiaryEntry = {
      ...entry,
      id: `diary-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      diaryEntries: [newEntry, ...prev.diaryEntries],
      auditLog: appendAudit('save', 'Nuevo registro guardado en Mi diario (CU5).', prev.auditLog),
    }));
    return newEntry;
  };

  const updateDiaryEntry = (id: string, patch: Partial<DiaryEntry>) => {
    setState((prev) => ({
      ...prev,
      diaryEntries: prev.diaryEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  };

  const deleteDiaryEntry = (id: string) => {
    setState((prev) => ({
      ...prev,
      diaryEntries: prev.diaryEntries.filter((e) => e.id !== id),
      auditLog: appendAudit('delete', 'Has eliminado un registro de Mi diario.', prev.auditLog),
    }));
  };

  const saveDraftMessage = (
    draft: Omit<SavedMessageDraft, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date().toISOString();
    const newDraft: SavedMessageDraft = {
      ...draft,
      id: `draft-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setState((prev) => ({
      ...prev,
      draftMessages: [newDraft, ...prev.draftMessages],
      auditLog: appendAudit(
        'save',
        'Has guardado un borrador privado de mensaje (CU2).',
        prev.auditLog
      ),
    }));
  };

  const deleteDraftMessage = (id: string) => {
    setState((prev) => ({
      ...prev,
      draftMessages: prev.draftMessages.filter((d) => d.id !== id),
      auditLog: appendAudit('delete', 'Has eliminado un borrador de mensaje.', prev.auditLog),
    }));
  };

  const setConsultaItems = (items: ConsultaItem[]) => {
    setState((prev) => ({
      ...prev,
      consultaSummary: {
        ...prev.consultaSummary,
        lastGeneratedAt: new Date().toISOString(),
        items,
      },
      auditLog: appendAudit(
        'save',
        'Resumen personal para mi consulta (CU3) organizado y listo para tu revisión.',
        prev.auditLog
      ),
    }));
  };

  const addConsultaItem = (
    section: ConsultaSectionKey,
    text: string,
    origin: 'user_literal' | 'ania_organized' = 'user_literal'
  ) => {
    const item: ConsultaItem = {
      id: `citem-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      section,
      text,
      origin,
      included: true,
    };
    setState((prev) => ({
      ...prev,
      consultaSummary: {
        ...prev.consultaSummary,
        items: [...prev.consultaSummary.items, item],
      },
    }));
  };

  const updateConsultaItem = (id: string, patch: Partial<ConsultaItem>) => {
    setState((prev) => ({
      ...prev,
      consultaSummary: {
        ...prev.consultaSummary,
        items: prev.consultaSummary.items.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      },
    }));
  };

  const deleteConsultaItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      consultaSummary: {
        ...prev.consultaSummary,
        items: prev.consultaSummary.items.filter((i) => i.id !== id),
      },
    }));
  };

  const clearConsultaSummary = () => {
    setState((prev) => ({
      ...prev,
      consultaSummary: { items: [], showOnlyApproved: false },
      auditLog: appendAudit(
        'delete',
        'Resumen personal para consulta eliminado tras tu revisión.',
        prev.auditLog
      ),
    }));
  };

  const addSupportPerson = (person: Omit<SupportPerson, 'id'>) => {
    const newPerson: SupportPerson = {
      ...person,
      id: `person-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      supportNetwork: [...prev.supportNetwork, newPerson],
      auditLog: appendAudit(
        'save',
        `Has añadido a "${person.name}" a tu red personal de apoyo (CU6).`,
        prev.auditLog
      ),
    }));
  };

  const updateSupportPerson = (id: string, patch: Partial<SupportPerson>) => {
    setState((prev) => ({
      ...prev,
      supportNetwork: prev.supportNetwork.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };

  const deleteSupportPerson = (id: string) => {
    setState((prev) => ({
      ...prev,
      supportNetwork: prev.supportNetwork.filter((p) => p.id !== id),
    }));
  };

  const exportAllData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: 'Exportación personal de AnIA. Tus datos son exclusivamente tuyos.',
      ...state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AnIA-mis-datos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setState((prev) => ({
      ...prev,
      auditLog: appendAudit('export', 'Has exportado todos tus datos personales.', prev.auditLog),
    }));
  };

  const eraseAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      ...DEFAULT_STATE,
      auditLog: [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: 'delete',
          description: 'Todos tus datos locales han sido borrados.',
        },
      ],
    });
    setCu4Active(false);
    setActiveView('conversar');
  };

  const openMessageForPerson = (personName: string, goal: CommunicativeGoal = 'pedir_ayuda') => {
    setPrefilledMessageRecipient(personName);
    setPrefilledMessageGoal(goal);
    setActiveView('mensaje');
  };

  return {
    state,
    setState,
    activeView,
    setActiveView,
    cu4Active,
    cu4Reason,
    triggerCU4,
    exitCU4,
    privacyOpen,
    setPrivacyOpen,
    prefilledMessageRecipient,
    prefilledMessageGoal,
    setPrefilledMessageRecipient,
    setPrefilledMessageGoal,
    openMessageForPerson,
    acceptConsent,
    markOnboardingDemoSeen,
    resetConversation,
    authorizeNoteForConsulta,
    addDiaryEntry,
    updateDiaryEntry,
    deleteDiaryEntry,
    saveDraftMessage,
    deleteDraftMessage,
    setConsultaItems,
    addConsultaItem,
    updateConsultaItem,
    deleteConsultaItem,
    clearConsultaSummary,
    addSupportPerson,
    updateSupportPerson,
    deleteSupportPerson,
    exportAllData,
    eraseAllData,
  };
}
