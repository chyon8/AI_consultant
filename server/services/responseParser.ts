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

export interface EstimateBreakdown {
  planning: number;
  design: number;
  development: number;
}

export interface EstimateTypeData {
  minCost: number;
  maxCost: number;
  duration: string;
  breakdown?: EstimateBreakdown;
}

export interface ParsedEstimates {
  typeA: EstimateTypeData;
  typeB: EstimateTypeData;
  typeC: EstimateTypeData;
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

export interface ParsedProjectOverview {
  projectTitle: string;
  businessGoals: string;
  coreValues: string[];
  techStack: { layer: string; items: string[] }[];
}

export interface ParsedAnalysisResult {
  projectTitle: string;
  modules: ParsedModule[];
  estimates: ParsedEstimates;
  schedule?: ParsedSchedule;
  summary?: ParsedSummary;
  projectOverview?: ParsedProjectOverview;
  rawMarkdown: string;
}

export type StageType = 'projectOverview' | 'modules' | 'estimates' | 'schedule' | 'summary';

export interface StagedParseResult {
  stage: StageType;
  data: any;
  rawMarkdown: string;
}

const STAGE_MARKERS = {
  projectOverview: '<!-- STAGE_PROJECT_OVERVIEW_COMPLETE -->',
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
  const stages: StageType[] = ['projectOverview', 'modules', 'estimates', 'schedule', 'summary'];
  
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
          console.log(`[Parser] ========== Stage ${stage} COMPLETE ==========`);
          console.log(`[Parser] Raw JSON:`, JSON.stringify(data, null, 2));
          
          if (stage === 'modules' && data.modules) {
            console.log(`[Parser] MODULES DETAIL:`);
            data.modules.forEach((mod: any, i: number) => {
              console.log(`  [Module ${i+1}] ${mod.name}: baseCost=${mod.baseCost}, baseManMonths=${mod.baseManMonths}`);
              if (mod.subFeatures) {
                mod.subFeatures.forEach((sf: any) => {
                  console.log(`    - ${sf.name}: price=${sf.price}, manWeeks=${sf.manWeeks}`);
                });
              }
            });
          }
          
          if (stage === 'estimates' && data.estimates) {
            console.log(`[Parser] ESTIMATES DETAIL:`);
            console.log(`  TypeA: ${data.estimates.typeA?.minCost} ~ ${data.estimates.typeA?.maxCost}, ${data.estimates.typeA?.duration}`);
            console.log(`  TypeB: ${data.estimates.typeB?.minCost} ~ ${data.estimates.typeB?.maxCost}, ${data.estimates.typeB?.duration}`);
            console.log(`  TypeC: ${data.estimates.typeC?.minCost} ~ ${data.estimates.typeC?.maxCost}, ${data.estimates.typeC?.duration}`);
          }
          
          return { stage, data, markerPosition: markerPos };
        } catch (e) {
          console.error(`[Parser] Failed to parse ${stage} JSON:`, e);
          console.error(`[Parser] Raw match:`, jsonMatch[1]);
        }
      }
    }
  }
  
  return null;
}

export function parseProjectOverviewStage(data: any): ParsedProjectOverview {
  const overview = data.projectOverview || data;
  return {
    projectTitle: overview.projectTitle || '프로젝트',
    businessGoals: overview.businessGoals || '',
    coreValues: overview.coreValues || [],
    techStack: overview.techStack || []
  };
}

export function parseModulesStage(data: any): { projectTitle: string; modules: ParsedModule[] } {
  return {
    projectTitle: data.projectTitle || '프로젝트',
    modules: data.modules || []
  };
}

export function parseEstimatesStage(data: any): ParsedEstimates {
  const estimates = data.estimates || data;
  
  const parseTypeData = (typeData: any): EstimateTypeData => ({
    minCost: typeData?.minCost || 0,
    maxCost: typeData?.maxCost || 0,
    duration: typeData?.duration || '미정',
    breakdown: typeData?.breakdown ? {
      planning: typeData.breakdown.planning || 0,
      design: typeData.breakdown.design || 0,
      development: typeData.breakdown.development || 0
    } : undefined
  });
  
  return {
    typeA: parseTypeData(estimates.typeA),
    typeB: parseTypeData(estimates.typeB),
    typeC: parseTypeData(estimates.typeC)
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
    const projectOverviewMatch = fullResponse.match(/```json:projectOverview\s*([\s\S]*?)```/);
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
    
    const projectOverviewData = projectOverviewMatch ? JSON.parse(projectOverviewMatch[1].trim()) : null;
    const modulesData = JSON.parse(modulesMatch[1].trim());
    const estimatesData = estimatesMatch ? JSON.parse(estimatesMatch[1].trim()) : null;
    const scheduleData = scheduleMatch ? JSON.parse(scheduleMatch[1].trim()) : null;
    const summaryData = summaryMatch ? JSON.parse(summaryMatch[1].trim()) : null;
    
    const rawMarkdown = fullResponse
      .replace(/```json:projectOverview[\s\S]*?```/g, '')
      .replace(/```json:modules[\s\S]*?```/g, '')
      .replace(/```json:estimates[\s\S]*?```/g, '')
      .replace(/```json:schedule[\s\S]*?```/g, '')
      .replace(/```json:summary[\s\S]*?```/g, '')
      .replace(/<!-- STAGE_\w+_COMPLETE -->/g, '')
      .trim();
    
    // Get project title from projectOverview first, fall back to modulesData
    const projectTitle = projectOverviewData 
      ? parseProjectOverviewStage(projectOverviewData).projectTitle 
      : (modulesData.projectTitle || '프로젝트');
    
    return {
      projectTitle,
      modules: modulesData.modules || [],
      estimates: estimatesData ? parseEstimatesStage(estimatesData) : {
        typeA: { minCost: 0, maxCost: 0, duration: '미정' },
        typeB: { minCost: 0, maxCost: 0, duration: '미정' },
        typeC: { minCost: 0, maxCost: 0, duration: '미정' }
      },
      schedule: scheduleData ? parseScheduleStage(scheduleData) : undefined,
      summary: summaryData ? parseSummaryStage(summaryData) : undefined,
      projectOverview: projectOverviewData ? parseProjectOverviewStage(projectOverviewData) : undefined,
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
