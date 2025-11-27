export interface ParsedSubFeature {
  id: string;
  name: string;
  price: number;
  manWeeks: number;
  isSelected: boolean;
}

export interface ParsedModule {
  id: string;
  name: string;
  description: string;
  category: string;
  baseCost: number;
  baseManMonths: number;
  isSelected: boolean;
  required?: boolean;
  subFeatures: ParsedSubFeature[];
}

export interface ParsedTypeEstimate {
  minCost: number;
  maxCost: number;
  duration: string;
  totalManMonths?: number;
  teamSize?: number;
}

export interface ParsedEstimates {
  typeA: ParsedTypeEstimate;
  typeB: ParsedTypeEstimate;
  typeC: ParsedTypeEstimate;
}

export interface VisualizationComponent {
  type: string;
  title?: string;
  source: string;
  config?: Record<string, any>;
}

export interface VisualizationHints {
  layout: 'single' | 'two-column' | 'grid';
  primaryComponent: string;
  components: VisualizationComponent[];
}

export interface ParsedAnalysisResult {
  projectTitle: string;
  modules: ParsedModule[];
  estimates: ParsedEstimates;
  rawMarkdown: string;
  raw_content: string;
  format_type: 'markdown' | 'json' | 'mixed';
  visualization_hints: VisualizationHints;
}

interface VisualizationData {
  modules?: any[];
  estimates?: any;
  projectTitle?: string;
}

function generateVisualizationHints(step: number = 1, data?: VisualizationData): VisualizationHints {
  const hints: Record<number, VisualizationHints> = {
    1: {
      layout: 'two-column',
      primaryComponent: 'markdown',
      components: [
        { type: 'markdown', title: '프로젝트 개요', source: 'rawMarkdown' },
        { type: 'metric_card', title: '핵심 지표', source: 'modules' },
        { type: 'module_list', title: '모듈 구조', source: 'modules' }
      ]
    },
    2: {
      layout: 'grid',
      primaryComponent: 'metric_card',
      components: [
        { type: 'metric_card', title: '견적 요약', source: 'estimates' },
        { type: 'bar_chart', title: '유형별 비용 비교', source: 'estimates' },
        { type: 'table', title: '상세 비교', source: 'modules' }
      ]
    },
    3: {
      layout: 'single',
      primaryComponent: 'wbs_gantt',
      components: [
        { type: 'metric_card', title: '일정 요약', source: 'estimates' },
        { type: 'wbs_gantt', title: 'WBS 일정표', source: 'modules' },
        { type: 'timeline', title: '마일스톤', source: 'modules' }
      ]
    },
    4: {
      layout: 'single',
      primaryComponent: 'markdown',
      components: [
        { type: 'markdown', title: '입찰 공고문', source: 'raw_content' }
      ]
    }
  };
  return hints[step] || hints[1];
}

export function parseAnalysisResponse(fullResponse: string): ParsedAnalysisResult | null {
  try {
    const jsonMatch = fullResponse.match(/```json:modules\s*([\s\S]*?)```/);
    
    const defaultEstimate = { minCost: 0, maxCost: 0, duration: '미정', totalManMonths: 0, teamSize: 0 };
    
    if (!jsonMatch) {
      const alternativeMatch = fullResponse.match(/```json\s*([\s\S]*?)```/);
      if (!alternativeMatch) {
        console.error('No JSON block found in response');
        return null;
      }
      
      const jsonData = JSON.parse(alternativeMatch[1].trim());
      const rawMarkdown = fullResponse.replace(/```json\s*[\s\S]*?```/, '').trim();
      
      const modules = jsonData.modules || [];
      const estimates = {
        typeA: { ...defaultEstimate, ...(jsonData.estimates?.typeA || {}) },
        typeB: { ...defaultEstimate, ...(jsonData.estimates?.typeB || {}) },
        typeC: { ...defaultEstimate, ...(jsonData.estimates?.typeC || {}) }
      };
      
      return {
        projectTitle: jsonData.projectTitle || '프로젝트',
        modules,
        estimates,
        rawMarkdown,
        raw_content: fullResponse,
        format_type: 'mixed',
        visualization_hints: generateVisualizationHints(1, {
          modules,
          estimates,
          projectTitle: jsonData.projectTitle
        })
      };
    }
    
    const jsonData = JSON.parse(jsonMatch[1].trim());
    const rawMarkdown = fullResponse.replace(/```json:modules\s*[\s\S]*?```/, '').trim();
    
    const modules = jsonData.modules || [];
    const estimates = {
      typeA: { ...defaultEstimate, ...(jsonData.estimates?.typeA || {}) },
      typeB: { ...defaultEstimate, ...(jsonData.estimates?.typeB || {}) },
      typeC: { ...defaultEstimate, ...(jsonData.estimates?.typeC || {}) }
    };
    
    return {
      projectTitle: jsonData.projectTitle || '프로젝트',
      modules,
      estimates,
      rawMarkdown,
      raw_content: fullResponse,
      format_type: 'mixed',
      visualization_hints: generateVisualizationHints(1, {
        modules,
        estimates,
        projectTitle: jsonData.projectTitle
      })
    };
  } catch (error) {
    console.error('Failed to parse analysis response:', error);
    return null;
  }
}

export function extractJsonFromStream(accumulatedText: string): { json: any; found: boolean } {
  try {
    const jsonMatch = accumulatedText.match(/```json:modules\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return { json: JSON.parse(jsonMatch[1].trim()), found: true };
    }
    
    const alternativeMatch = accumulatedText.match(/```json\s*([\s\S]*?)```/);
    if (alternativeMatch) {
      return { json: JSON.parse(alternativeMatch[1].trim()), found: true };
    }
    
    return { json: null, found: false };
  } catch {
    return { json: null, found: false };
  }
}
