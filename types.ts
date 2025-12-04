

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

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
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

export interface DashboardState {
  modules: ModuleItem[];
  partnerType: PartnerType;
  projectScale: ProjectScale;
  estimationStep: EstimationStep;
  projectSummaryContent?: string;
  aiInsight?: string;
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

// Theme System
export type ThemeType = 'cyberpunk' | 'lavender' | 'ocean' | 'sunset';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  bgLight: string;
  bgDark: string;
  name: string;
  emoji: string;
}
