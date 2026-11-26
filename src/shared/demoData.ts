import type {
  ChatMessage,
  CommunicativeGoal,
  ConsultaItem,
  DescriptiveTrendObservation,
  DiaryEntry,
  MessageProposal,
  MessageToneKey,
  SavedMessageDraft,
  SupportNeedType,
  SupportPerson,
} from './types';

export interface DemoMessagePreview {
  goal: CommunicativeGoal;
  recipientName: string;
  context: string;
  fears: string;
  proposals: MessageProposal[];
  selectedTone: MessageToneKey;
}

const now = Date.now();
const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
const todayIso = new Date(now).toISOString();

export const DEMO_WELCOME_MESSAGE: ChatMessage = {
  id: 'demo-welcome-1',
  role: 'ania',
  text: 'Hola. Este es tu espacio seguro para expresarte a tu ritmo, sin juicios ni prisas.\n\nNo soy una psicóloga ni hago diagnósticos, pero puedo ayudarte a poner palabras a lo que sientes, ordenar ideas para tu consulta o preparar un mensaje difícil.',
  timestamp: '10:00',
  quickReplies: [
    'Contarte cómo ha ido mi día',
    'No sé muy bien qué siento hoy',
    'Solo quiero ordenar lo que tengo en la cabeza',
  ],
};

export const DEMO_CHAT_TURN_1_USER: ChatMessage = {
  id: 'demo-user-1',
  role: 'user',
  text: 'Llevo varias semanas durmiendo mal, siento mucha presión en el trabajo y me cuesta decírselo a mi pareja sin discutir.',
  timestamp: '10:01',
};

export const DEMO_CHAT_TURN_1_ANIA: ChatMessage = {
  id: 'demo-ania-1',
  role: 'ania',
  text: 'Gracias por ponerlo en palabras. Sostener varias semanas de descanso escaso y presión laboral desgasta mucho, y es comprensible que te cueste encontrar el momento de hablarlo sin sentir tensión.\n\n¿Puede ser que haya algo de agotamiento y sobrecarga en lo que describes? Si te encaja, puedes confirmar o cambiar estas palabras.',
  timestamp: '10:01',
  savedToConsulta: true,
  suggestedEmotions: [
    { label: 'agotamiento', status: 'accepted' },
    { label: 'sobrecarga', status: 'pending' },
    { label: 'presión', status: 'pending' },
  ],
  quickReplies: [
    'Sí, al final del día me bloqueo',
    'Quiero preparar un mensaje tranquilo',
    'Prefiero respirar un minuto',
  ],
  descriptiveSummary: {
    id: 'demo-sum-1',
    userWords: [
      '«Llevo varias semanas durmiendo mal»',
      '«Siento mucha presión en el trabajo y me cuesta decírselo a mi pareja sin discutir»',
    ],
    aniaOrganization: [
      'Cansancio acumulado acompañado de dificultad para abrir una conversación delicada en casa.',
    ],
    associatedSituations: ['Presión sostenida en el trabajo', 'Descanso irregular en las últimas semanas'],
    helpfulElements: ['Poner palabras en un espacio tranquilo antes de hablar con su pareja'],
    validatedByUser: true,
  },
};

export const DEMO_CHAT_TURN_2_USER: ChatMessage = {
  id: 'demo-user-2',
  role: 'user',
  text: 'Sí, sobre todo noto que al final del día me bloqueo y prefiero callarme para evitar roces.',
  timestamp: '10:02',
};

export const DEMO_CHAT_TURN_2_ANIA: ChatMessage = {
  id: 'demo-ania-2',
  role: 'ania',
  text: 'Tiene mucho sentido que aparezca ese bloqueo cuando llevas días tirando del carro con poca energía. Callarse a veces nace de querer proteger la relación, aunque por dentro te deje más sola o solo.\n\nComo comparto todo el contexto con el resto de la app, podemos registrar cómo te sientes hoy en Mi diario y preparar juntos un borrador sereno para contárselo.',
  timestamp: '10:02',
  suggestedEmotions: [
    { label: 'bloqueo', status: 'accepted' },
    { label: 'tensión', status: 'pending' },
  ],
  quickReplies: [
    'Ir a Mi diario',
    'Preparar el mensaje para mi pareja',
    'Guardar esto para mi consulta',
  ],
};

export const DEMO_AUTHORIZED_NOTES: string[] = [
  'Llevo varias semanas durmiendo mal, siento mucha presión en el trabajo y me cuesta decírselo a mi pareja sin discutir.',
  'Al final del día me bloqueo y prefiero callarme para evitar roces.',
];

export const DEMO_DIARY_ENTRIES: DiaryEntry[] = [
  {
    id: 'demo-diary-1',
    createdAt: todayIso,
    emotions: ['Agotamiento', 'Sobrecarga'],
    customEmotionNote: 'Cuesta desconectar al terminar la jornada',
    intensity: 4,
    overloadLevel: 'alta',
    restQuality: 'escaso',
    associatedSituations: 'Entregas seguidas en el trabajo y dificultad para hablarlo en casa',
    helpfulElements: 'Caminar 15 minutos sin móvil y respiración pausada',
    approvedForConsulta: true,
  },
  {
    id: 'demo-diary-2',
    createdAt: twoDaysAgo,
    emotions: ['Tensión', 'Cansancio'],
    intensity: 4,
    overloadLevel: 'alta',
    restQuality: 'escaso',
    associatedSituations: 'Jornada muy larga sin descansos',
    helpfulElements: 'Escribir unas líneas antes de dormir',
    approvedForConsulta: true,
  },
];

export const DEMO_TREND_OBSERVATION: DescriptiveTrendObservation = {
  id: 'demo-trend-1',
  generatedAt: todayIso,
  observations: [
    'En los últimos registros en los que señalaste descanso escaso también marcaste sobrecarga alta. ¿Te encaja esta observación?',
    'Mencionaste que caminar unos minutos y hacer una pausa de respiración te ayudaron a bajar un poco la tensión.',
  ],
  persistentDistressNotice: false,
  validationStatus: 'pending',
};

export const DEMO_MESSAGE_PREVIEW: DemoMessagePreview = {
  goal: 'contar_como_estoy',
  recipientName: 'Laura (mi pareja)',
  context:
    'Llevo semanas durmiendo mal por la presión del trabajo y al final del día me bloqueo. Quiero contárselo sin que suene a reproche.',
  fears: 'Que piense que estoy enfadado/a con ella o que acabemos discutiendo.',
  selectedTone: 'sereno',
  proposals: [
    {
      tone: 'cercano',
      title: 'Cercano y afectivo',
      body: 'Oye, quería contarte algo con cariño: llevo unas semanas con mucha presión en el trabajo y durmiendo regular. A veces llego tan cansado/a que me callo, pero no es nada contigo. Me vendría muy bien un ratito tranquilo contigo hoy.',
    },
    {
      tone: 'sereno',
      title: 'Sereno y pausado',
      body: 'Me gustaría compartir cómo estoy estos días para que no haya malentendidos. Estoy acumulando bastante cansancio por el trabajo y, cuando me saturo al final del día, tiendo a bloquearme. No necesito que lo soluciones, solo me ayuda que lo sepas.',
    },
    {
      tone: 'directo',
      title: 'Directo y respetuoso',
      body: 'Estos días estoy con mucha carga en el trabajo y durmiendo mal, por eso a veces me ves más callado/a. Quería decírtelo claramente para cuidar cómo hablamos hoy y evitar tensiones innecesarias.',
    },
  ],
};

export const DEMO_SAVED_DRAFTS: SavedMessageDraft[] = [
  {
    id: 'demo-draft-1',
    createdAt: todayIso,
    updatedAt: todayIso,
    recipientName: 'Laura (mi pareja)',
    goal: 'contar_como_estoy',
    context: DEMO_MESSAGE_PREVIEW.context,
    fears: DEMO_MESSAGE_PREVIEW.fears,
    selectedTone: 'sereno',
    finalText: DEMO_MESSAGE_PREVIEW.proposals[1].body,
    explicitlyApproved: true,
  },
];

export const DEMO_CONSULTA_ITEMS: ConsultaItem[] = [
  {
    id: 'demo-c1',
    section: 'comoMeHeSentido',
    text: '«Llevo varias semanas durmiendo mal y siento mucha presión en el trabajo.»',
    origin: 'user_literal',
    included: true,
  },
  {
    id: 'demo-c2',
    section: 'comoMeHeSentido',
    text: 'Sensación recurrente de agotamiento y sobrecarga al final de la jornada.',
    origin: 'ania_organized',
    included: true,
  },
  {
    id: 'demo-c3',
    section: 'situacionesDificiles',
    text: '«Al final del día me bloqueo y prefiero callarme para evitar roces con mi pareja.»',
    origin: 'user_literal',
    included: true,
  },
  {
    id: 'demo-c4',
    section: 'cosasQueMeHanAyudado',
    text: 'Caminar 15 minutos sin móvil, respiración pausada y preparar por escrito lo que quiero decir.',
    origin: 'ania_organized',
    included: true,
  },
  {
    id: 'demo-c5',
    section: 'preguntasParaLaConsulta',
    text: '¿Qué pautas prácticas puedo probar para comunicar mi saturación antes de llegar al bloqueo?',
    origin: 'ania_organized',
    included: true,
  },
];

export const DEMO_SUPPORT_PEOPLE: SupportPerson[] = [
  {
    id: 'demo-person-1',
    name: 'Laura',
    relationship: 'Pareja',
    helpTypes: ['escucha', 'compania'],
    contactNote: 'Mejor hablar con calma después de cenar',
    isTrustedEmergencyContact: true,
  },
  {
    id: 'demo-person-2',
    name: 'Carlos',
    relationship: 'Amigo cercano',
    helpTypes: ['escucha', 'descanso'],
    contactNote: 'Paseo corto entre semana',
    isTrustedEmergencyContact: false,
  },
];

export const DEMO_SUPPORT_NEEDS: SupportNeedType[] = ['escucha', 'descanso'];
