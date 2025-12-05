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

export interface ParsedEstimates {
  typeA: { minCost: number; maxCost: number; duration: string };
  typeB: { minCost: number; maxCost: number; duration: string };
  typeC: { minCost: number; maxCost: number; duration: string };
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

export interface ParsedAnalysisResult {
  projectTitle: string;
  modules: ParsedModule[];
  estimates: ParsedEstimates;
  schedule?: ParsedSchedule;
  summary?: ParsedSummary;
  rawMarkdown: string;
}

export type StageType = 'modules' | 'estimates' | 'schedule' | 'summary';

export interface StagedParseResult {
  stage: StageType;
  data: any;
  rawMarkdown: string;
}

const STAGE_MARKERS = {
  modules: '<!-- STAGE_MODULES_COMPLETE -->',
  estimates: '<!-- STAGE_ESTIMATES_COMPLETE -->',
  schedule: '<!-- STAGE_SCHEDULE_COMPLETE -->',
  summary: '<!-- STAGE_SUMMARY_COMPLETE -->'
};

export interface StageDetectionResult {
  stage: StageType;
  data: any;
  markerPosition: number;
}

export function detectCompletedStages(accumulatedText: string, alreadyDetected: Set<StageType>): StageDetectionResult | null {
  const stages: StageType[] = ['modules', 'estimates', 'schedule', 'summary'];
  
  for (const stage of stages) {
    if (alreadyDetected.has(stage)) continue;
    
    const marker = STAGE_MARKERS[stage];
    const markerPos = accumulatedText.indexOf(marker);
    
    if (markerPos !== -1) {
      const jsonTag = `\`\`\`json:${stage}`;
      const jsonMatch = accumulatedText.match(new RegExp(`\`\`\`json:${stage}\\s*([\\s\\S]*?)\`\`\``, 'm'));
      
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1].trim());
          console.log(`[Parser] Stage ${stage} complete, parsed data:`, Object.keys(data));
          return { stage, data, markerPosition: markerPos };
        } catch (e) {
          console.error(`[Parser] Failed to parse ${stage} JSON:`, e);
        }
      }
    }
  }
  
  return null;
}

export function parseModulesStage(data: any): { projectTitle: string; modules: ParsedModule[] } {
  return {
    projectTitle: data.projectTitle || '프로젝트',
    modules: data.modules || []
  };
}

export function parseEstimatesStage(data: any): ParsedEstimates {
  const estimates = data.estimates || data;
  return {
    typeA: estimates.typeA || { minCost: 0, maxCost: 0, duration: '미정' },
    typeB: estimates.typeB || { minCost: 0, maxCost: 0, duration: '미정' },
    typeC: estimates.typeC || { minCost: 0, maxCost: 0, duration: '미정' }
  };
}

export function parseScheduleStage(data: any): ParsedSchedule {
  const schedule = data.schedule || data;
  return {
    totalWeeks: schedule.totalWeeks || 0,
    phases: schedule.phases || [],
    milestones: schedule.milestones || []
  };
}

export function parseSummaryStage(data: any): ParsedSummary {
  const summary = data.summary || data;
  return {
    keyPoints: summary.keyPoints || [],
    risks: summary.risks || [],
    recommendations: summary.recommendations || []
  };
}

export function parseAnalysisResponse(fullResponse: string): ParsedAnalysisResult | null {
  try {
    const modulesMatch = fullResponse.match(/```json:modules\s*([\s\S]*?)```/);
    const estimatesMatch = fullResponse.match(/```json:estimates\s*([\s\S]*?)```/);
    const scheduleMatch = fullResponse.match(/```json:schedule\s*([\s\S]*?)```/);
    const summaryMatch = fullResponse.match(/```json:summary\s*([\s\S]*?)```/);
    
    if (!modulesMatch) {
      const alternativeMatch = fullResponse.match(/```json\s*([\s\S]*?)```/);
      if (!alternativeMatch) {
        console.error('No JSON block found in response');
        return null;
      }
      
      const jsonData = JSON.parse(alternativeMatch[1].trim());
      const rawMarkdown = fullResponse.replace(/```json[\s\S]*?```/g, '').trim();
      
      return {
        projectTitle: jsonData.projectTitle || '프로젝트',
        modules: jsonData.modules || [],
        estimates: jsonData.estimates || {
          typeA: { minCost: 0, maxCost: 0, duration: '미정' },
          typeB: { minCost: 0, maxCost: 0, duration: '미정' },
          typeC: { minCost: 0, maxCost: 0, duration: '미정' }
        },
        rawMarkdown
      };
    }
    
    const modulesData = JSON.parse(modulesMatch[1].trim());
    const estimatesData = estimatesMatch ? JSON.parse(estimatesMatch[1].trim()) : null;
    const scheduleData = scheduleMatch ? JSON.parse(scheduleMatch[1].trim()) : null;
    const summaryData = summaryMatch ? JSON.parse(summaryMatch[1].trim()) : null;
    
    const rawMarkdown = fullResponse
      .replace(/```json:modules[\s\S]*?```/g, '')
      .replace(/```json:estimates[\s\S]*?```/g, '')
      .replace(/```json:schedule[\s\S]*?```/g, '')
      .replace(/```json:summary[\s\S]*?```/g, '')
      .replace(/<!-- STAGE_\w+_COMPLETE -->/g, '')
      .trim();
    
    return {
      projectTitle: modulesData.projectTitle || '프로젝트',
      modules: modulesData.modules || [],
      estimates: estimatesData ? parseEstimatesStage(estimatesData) : {
        typeA: { minCost: 0, maxCost: 0, duration: '미정' },
        typeB: { minCost: 0, maxCost: 0, duration: '미정' },
        typeC: { minCost: 0, maxCost: 0, duration: '미정' }
      },
      schedule: scheduleData ? parseScheduleStage(scheduleData) : undefined,
      summary: summaryData ? parseSummaryStage(summaryData) : undefined,
      rawMarkdown
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
