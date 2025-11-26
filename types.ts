

export interface SubFeature {
  id: string;
  name: string;
  price: number; // Additional cost
  manWeeks: number; // Additional time in weeks
  isSelected: boolean;
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
  ESTIMATION = 'ESTIMATION',
  SIMILAR_CASES = 'SIMILAR_CASES',
  PRESET_COMPARISON = 'PRESET_COMPARISON',
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

export type EstimationSubTab = 'DETAIL' | 'PARTNER' | 'SCHEDULE';

export interface ProjectSnapshot {
  id: string;
  title: string;
  createdAt: string;
  userInput: string;
  modules: ModuleItem[];
  estimates?: {
    typeA?: { minCost: number; maxCost: number; duration: string };
    typeB?: { minCost: number; maxCost: number; duration: string };
    typeC?: { minCost: number; maxCost: number; duration: string };
  };
  messages: Message[];
  partnerType: PartnerType;
  currentScale: ProjectScale;
}

// Chat-driven UI Action Types
export type DashboardActionType = 
  | 'toggle_module'
  | 'toggle_feature'
  | 'update_partner_type'
  | 'update_scale'
  | 'add_module'
  | 'remove_module'
  | 'update_estimate'
  | 'no_action';

export interface DashboardAction {
  type: DashboardActionType;
  payload: Record<string, any>;
}

export interface ChatResponse {
  chatMessage: string;
  action?: DashboardAction;
}
