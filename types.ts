

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

/** 상세 투입 인력 정보 */
export interface StaffingDetail {
  role: string;
  grade: string;
  headcount: number | string;
  duration: string;
  manMonth: number | string;
}

/** WBS Phase 정보 */
export interface WBSPhase {
  phase: string;
  task: string;
  duration: string;
  schedule: number[];
}

/** 상세 견적 타입 (확장) */
export interface TypeEstimate {
  minCost: number;
  maxCost: number;
  duration: string;
  totalManMonths?: number;
  teamSize?: number;
  analysis?: string;
  staffing?: StaffingDetail[];
  costBasis?: string;
  characteristics?: string[];
}

/** WBS 상세 정보 */
export interface WBSDetail {
  phases: WBSPhase[];
  totalDuration: string;
  timeUnit: 'week' | 'month';
  partnerAdvice?: {
    recommendedType: string;
    reason: string;
  };
}

export interface ProjectEstimates {
  typeA?: TypeEstimate;
  typeB?: TypeEstimate;
  typeC?: TypeEstimate;
  wbs?: WBSDetail;
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

// ============================================
// AI Response Visualization Types
// ============================================

/** 콘텐츠 형식 타입 */
export type ContentFormatType = 'markdown' | 'json' | 'table' | 'numeric' | 'chart' | 'mixed';

/** 시각화 컴포넌트 타입 */
export type VisualizationComponentType = 
  | 'markdown'
  | 'table'
  | 'metric_card'
  | 'bar_chart'
  | 'line_chart'
  | 'pie_chart'
  | 'timeline'
  | 'module_list'
  | 'cost_breakdown'
  | 'wbs_gantt';

/** 시각화 힌트 컴포넌트 */
export interface VisualizationComponent {
  type: VisualizationComponentType;
  title?: string;
  source: string;  // raw_content 또는 structured_payload 경로
  config?: {
    columns?: string[];
    xAxis?: string;
    yAxis?: string;
    colorScheme?: string;
    showLegend?: boolean;
    interactive?: boolean;
  };
}

/** 시각화 힌트 */
export interface VisualizationHints {
  layout: 'single' | 'two-column' | 'grid';
  primaryComponent: VisualizationComponentType;
  components: VisualizationComponent[];
}

/** Step별 구조화된 페이로드 */
export interface Step1Payload {
  projectTitle: string;
  projectSummary: string;
  techStack: string[];
  architecture: {
    overview: string;
    layers: { name: string; description: string }[];
  };
  modules: ModuleItem[];
}

export interface Step2Payload {
  estimates: ProjectEstimates;
  modules: ModuleItem[];
  costBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  comparisonTable: {
    feature: string;
    typeA: string | number;
    typeB: string | number;
    typeC: string | number;
  }[];
}

export interface Step3Payload {
  totalDuration: string;
  phases: {
    id: string;
    name: string;
    startWeek: number;
    endWeek: number;
    tasks: string[];
    deliverables: string[];
  }[];
  milestones: {
    name: string;
    week: number;
    description: string;
  }[];
  resources: {
    role: string;
    count: number;
    allocation: string;
  }[];
}

export interface Step4Payload {
  rfpDocument: string;
  sections: {
    title: string;
    content: string;
  }[];
}

export type StepPayload = Step1Payload | Step2Payload | Step3Payload | Step4Payload;

/** 통합 AI 응답 구조 */
export interface AIResponse<T extends StepPayload = StepPayload> {
  id: string;
  step: 1 | 2 | 3 | 4;
  timestamp: string;
  raw_content: string;           // AI 원본 텍스트 (변형 금지)
  format_type: ContentFormatType;
  visualization_hints: VisualizationHints;
  structured_payload: T;
  metadata?: {
    model: string;
    tokenCount?: number;
    processingTime?: number;
  };
}

/** 탭 콘텐츠 렌더러 Props */
export interface TabContentRendererProps {
  response: AIResponse;
  isLoading?: boolean;
  onDataUpdate?: (data: any) => void;
}

/** 메트릭 카드 데이터 */
export interface MetricCardData {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

/** 차트 데이터 공통 인터페이스 */
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}
