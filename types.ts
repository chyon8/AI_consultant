

export interface SubFeature {
  id: string;
  name: string;
  price: number; // Additional cost
  manWeeks: number; // Additional time in weeks
  isSelected: boolean;
  isNew?: boolean; // Flag for newly added features
}

export interface ModuleItem {
  id: string;
  name: string;
  description: string;
  baseCost: number; // Core framework cost
  baseManMonths: number;
  category: string;
  isSelected: boolean;
  required?: boolean;
  isNew?: boolean; // Flag for newly added modules
  subFeatures: SubFeature[];
}

export type FileAttachmentType = 'image' | 'document';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: FileAttachmentType;
  mimeType: string;
  url?: string;
  thumbnailUrl?: string;
  serverPath?: string;
}

export type FileValidationErrorCode = 
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'MAX_FILES_EXCEEDED'
  | 'DUPLICATE_FILE'
  | 'EMPTY_FILE'
  | 'UPLOAD_FAILED';

export interface FileValidationError {
  code: FileValidationErrorCode;
  message: string;
  fileName?: string;
  details?: string;
}

export interface InputSource {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  extractedText?: string;
  wordCount?: number;
  pageCount?: number;
  createdAt: Date;
}

export interface ReferencedFilesState {
  files: InputSource[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: FileAttachment[];
}

export interface ProjectState {
  title: string;
  totalCost: number;
  totalDuration: number;
  modules: ModuleItem[];
}

export interface SimilarProject {
  id: string;
  title: string;
  similarity: number;
  category: string;
  budget: number;
  duration: string;
  features: string[];
  outcome: string;
  satisfaction: number;
}

export enum TabView {
  PROJECT_SUMMARY = 'PROJECT_SUMMARY',
  ESTIMATION = 'ESTIMATION',
  EXECUTION_PLAN = 'EXECUTION_PLAN',
  RFP = 'RFP',
  MEMO = 'MEMO',
}

// Changed from MVP/STANDARD/ENTERPRISE to Partner Types
export type PartnerType = 'AGENCY' | 'STUDIO' | 'AI_NATIVE';

export interface PartnerConfig {
  type: PartnerType;
  title: string;
  description: string;
  costMultiplier: number;
  durationMultiplier: number;
  teamInfo: string;
  pros: string[];
  cons: string[];
  recommendedFor: string;
}

export type PresetType = 'MVP' | 'STANDARD' | 'ENTERPRISE';

export interface PresetDetail {
  title: string;
  description: string;
  cost: number;
  duration: string;
  features: string[];
}

export type EstimationStep = 'SCOPE' | 'RESULT' | 'REGISTER';
export type ProjectScale = 'MVP' | 'STANDARD' | 'HIGH_END';

export interface ProjectOverview {
  projectTitle: string;
  businessGoals: string;
  coreValues: string[];
  techStack: { layer: string; items: string[] }[];
}

export interface DashboardState {
  sessionId?: string; // Owner session ID for state isolation validation
  modules: ModuleItem[];
  partnerType: PartnerType;
  projectScale: ProjectScale;
  estimationStep: EstimationStep;
  projectSummaryContent?: string;
  aiInsight?: string;
  referencedFiles?: InputSource[];
  projectOverview?: ProjectOverview | null;
  summary?: ParsedSummary | null;
  rfpContent?: string; // RFP generation result
  memoContent?: string; // Session memo content
}

export type ChatActionType = 
  | 'toggle_module' 
  | 'toggle_feature' 
  | 'add_feature'
  | 'create_module'
  | 'update_scale' 
  | 'no_action';

export interface NewFeaturePayload {
  name: string;
  price: number;
  manWeeks: number;
  isNew: true;
}

export interface NewModulePayload {
  name: string;
  description: string;
  baseCost: number;
  baseManMonths: number;
  category: 'backend' | 'frontend' | 'infra' | 'etc';
  isNew: true;
  subFeatures: NewFeaturePayload[];
}

export interface ChatAction {
  type: ChatActionType;
  intent: 'command' | 'general';
  payload: {
    moduleId?: string;
    featureId?: string;
    scale?: ProjectScale;
    feature?: NewFeaturePayload;
    module?: NewModulePayload;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
  isLoading?: boolean;
  dashboardState?: DashboardState;
}

export type StageType = 'projectOverview' | 'modules' | 'estimates' | 'schedule' | 'summary';

export interface StagedResult {
  stage: StageType;
  data: any;
  completedAt: number;
}

export interface ParsedSchedule {
  totalWeeks: number;
  phases: Array<{ name: string; weeks: number; tasks: string[] }>;
  milestones: string[];
}

export interface ParsedSummary {
  keyPoints: string[];
  risks: string[];
  recommendations: string[];
}

export interface ProgressiveLoadingState {
  projectOverviewReady: boolean;
  modulesReady: boolean;
  estimatesReady: boolean;
  scheduleReady: boolean;
  summaryReady: boolean;
  schedule?: ParsedSchedule;
  summary?: ParsedSummary;
}
