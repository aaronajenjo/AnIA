export type AppView =
  | 'conversar'
  | 'diario'
  | 'calmarme'
  | 'mensaje'
  | 'consulta'
  | 'apoyo';

export type TextScale = 'normal' | 'large' | 'xlarge';

export type EmotionHypothesisStatus = 'pending' | 'accepted' | 'rejected' | 'reframed';

export interface SuggestedEmotion {
  label: string;
  status: EmotionHypothesisStatus;
  reframedText?: string;
}

export interface DescriptiveSummary {
  id: string;
  userWords: string[];
  aniaOrganization: string[];
  associatedSituations: string[];
  helpfulElements: string[];
  validatedByUser: boolean | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ania';
  text: string;
  timestamp: string;
  suggestedEmotions?: SuggestedEmotion[];
  quickReplies?: string[];
  descriptiveSummary?: DescriptiveSummary;
  suggestSupportOrProfessional?: boolean;
  savedToConsulta?: boolean;
  safetyTriggered?: boolean;
}

export type SelfPerceivedIntensity = 1 | 2 | 3 | 4 | 5;

export interface DiaryEntry {
  id: string;
  createdAt: string;
  emotions: string[];
  customEmotionNote?: string;
  intensity: SelfPerceivedIntensity;
  overloadLevel: 'baja' | 'media' | 'alta';
  restQuality: 'bueno' | 'irregular' | 'escaso';
  associatedSituations: string;
  helpfulElements: string;
  freeNote?: string;
  approvedForConsulta: boolean;
}

export type FollowUpFrequency = 'none' | 'daily' | 'every_2_3_days' | 'weekly';

export interface FollowUpConfig {
  enabled: boolean;
  frequency: FollowUpFrequency;
  preferredDay: string;
  preferredTime: string;
  trackFields: {
    emotion: boolean;
    intensity: boolean;
    overload: boolean;
    rest: boolean;
    situations: boolean;
    helpful: boolean;
  };
  lastPromptDismissedAt?: string;
}

export interface DescriptiveTrendObservation {
  id: string;
  generatedAt: string;
  observations: string[];
  persistentDistressNotice: boolean;
  validationStatus: 'pending' | 'fits' | 'nuanced' | 'rejected';
  userNuanceNote?: string;
}

export type CommunicativeGoal =
  | 'contar_como_estoy'
  | 'pedir_ayuda'
  | 'ser_escuchado'
  | 'poner_limite'
  | 'explicar_situacion';

export type MessageToneKey = 'cercano' | 'sereno' | 'directo';

export interface MessageProposal {
  tone: MessageToneKey;
  title: string;
  body: string;
}

export interface SavedMessageDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
  recipientName: string;
  goal: CommunicativeGoal;
  context: string;
  fears: string;
  selectedTone?: MessageToneKey;
  finalText: string;
  explicitlyApproved: boolean;
}

export type ConsultaSectionKey =
  | 'comoMeHeSentido'
  | 'situacionesDificiles'
  | 'cosasQueMeHanAyudado'
  | 'cambiosObservados'
  | 'preocupacionesYTemas'
  | 'preguntasParaLaConsulta';

export interface ConsultaItem {
  id: string;
  section: ConsultaSectionKey;
  text: string;
  origin: 'user_literal' | 'ania_organized';
  included: boolean;
}

export interface ConsultaSummaryState {
  lastGeneratedAt?: string;
  items: ConsultaItem[];
  showOnlyApproved: boolean;
}

export type SupportNeedType =
  | 'escucha'
  | 'compania'
  | 'ayuda_practica'
  | 'compartir_responsabilidades'
  | 'descanso'
  | 'orientacion_profesional';

export interface SupportPerson {
  id: string;
  name: string;
  relationship: string;
  helpTypes: SupportNeedType[];
  contactNote?: string;
  isTrustedEmergencyContact: boolean;
}

export interface ProfessionalReference {
  name: string;
  role: string;
  contactNote?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  category: 'consent' | 'save' | 'export' | 'delete' | 'safety' | 'privacy';
  description: string;
}

export interface SafetyDetectionResult {
  triggered: boolean;
  reason?: string;
  matchedCategory?: 'self_harm' | 'acute_crisis' | 'violence_danger' | 'llm_flag';
}

export type HomeConversationMode = 'choose' | 'chat' | 'avatar';

export type AvatarRenderMode = 'model_3d' | 'static_photo' | 'static_custom' | 'animated_lipsync';

export type StaticPhotoPreset = 'clara' | 'mateo' | 'nora';

export type AvatarSkinTone = 'porcelain' | 'warm_light' | 'olive' | 'caramel' | 'deep';
export type AvatarHairStyle = 'wavy_bob' | 'short_crop' | 'soft_bun' | 'long_smooth' | 'bald';
export type AvatarHairColor = 'espresso' | 'chestnut' | 'sand_blonde' | 'auburn' | 'silver';
export type AvatarEyeColor = 'hazel' | 'sage' | 'ocean' | 'dark_brown';
export type AvatarOutfitColor = 'sage' | 'oatmeal' | 'lavender' | 'terracotta' | 'navy';
export type AvatarBackground = 'window_light' | 'sage_studio' | 'warm_dusk' | 'evening_calm';
export type AvatarVoiceName = 'Kore' | 'Zephyr' | 'Puck' | 'Charon';

export interface AvatarConfig {
  displayName: string;
  renderMode: AvatarRenderMode;
  staticPhotoPreset: StaticPhotoPreset;
  customModelUrl?: string;
  customModelName?: string;
  animate3d?: boolean;
  model3dInitialized?: boolean;
  defaultAvatarVersion?: number;
  customMediaUrl?: string;
  customMediaKind?: 'image' | 'video';
  skinTone: AvatarSkinTone;
  hairStyle: AvatarHairStyle;
  hairColor: AvatarHairColor;
  eyeColor: AvatarEyeColor;
  glasses: boolean;
  beard: boolean;
  outfitColor: AvatarOutfitColor;
  background: AvatarBackground;
  voiceName: AvatarVoiceName;
  voiceRate: 'slow' | 'normal' | 'brisk';
  autoSpeak: boolean;
}

export type ThemeMode = 'light' | 'dark';

export type ThemePresetId =
  | 'avena_salvia'
  | 'brisa_marina'
  | 'atardecer_terracota'
  | 'jardin_lavanda'
  | 'noche_serena'
  | 'bosque_profundo'
  | 'custom';

export type ThemeFontStyle = 'classic' | 'modern' | 'editorial';

export type ThemeRadiusStyle = 'crisp' | 'soft' | 'rounded';

export interface AppThemeConfig {
  presetId: ThemePresetId;
  mode: ThemeMode;
  accentColor: string;
  canvasColor: string;
  surfaceColor: string;
  userBubbleColor: string;
  fontStyle: ThemeFontStyle;
  radiusStyle: ThemeRadiusStyle;
}

