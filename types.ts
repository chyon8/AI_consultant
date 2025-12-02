

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

export interface DashboardState {
  modules: ModuleItem[];
  partnerType: PartnerType;
  projectScale: ProjectScale;
  estimationStep: EstimationStep;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
  isLoading?: boolean;
  dashboardState?: DashboardState;
}
