

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
  STEP1_PLANNING = 'STEP1_PLANNING',
  STEP2_ESTIMATION = 'STEP2_ESTIMATION',
  STEP3_WBS = 'STEP3_WBS',
  STEP4_RFP = 'STEP4_RFP',
}

export interface StepTabConfig {
  id: TabView;
  stepNumber: number;
  label: string;
  shortLabel: string;
  description: string;
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

export interface TypeEstimate {
  minCost: number;
  maxCost: number;
  duration: string;
  totalManMonths?: number;
  teamSize?: number;
}

export interface ProjectEstimates {
  typeA?: TypeEstimate;
  typeB?: TypeEstimate;
  typeC?: TypeEstimate;
}

export interface ProjectSnapshot {
  id: string;
  title: string;
  createdAt: string;
  userInput: string;
  modules: ModuleItem[];
  estimates?: ProjectEstimates;
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
