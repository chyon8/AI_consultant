import { PartnerType, ModuleItem } from '../types';

export interface PartnerConfig {
  teamSize: number;
  productivityCoeff: number;
  coordinationBuffer: number;
  phaseWeights: {
    analysis: number;
    design: number;
    frontend: number;
    backend: number;
    dbIntegration: number;
    qa: number;
  };
}

export interface PhaseSchedule {
  phase: string;
  duration: number;
  startMonth: number;
  endMonth: number;
  tasks: {
    name: string;
    months: number[];
  }[];
}

export interface ScheduleResult {
  rawMM: number;
  teamSize: number;
  productivityCoeff: number;
  coordinationBuffer: number;
  totalDuration: number;
  totalMonths: number;
  phases: PhaseSchedule[];
}

const PARTNER_CONFIGS: Record<PartnerType, PartnerConfig> = {
  AGENCY: {
    teamSize: 6,
    productivityCoeff: 0.9,
    coordinationBuffer: 0.10,
    phaseWeights: {
      analysis: 0.15,
      design: 0.10,
      frontend: 0.25,
      backend: 0.25,
      dbIntegration: 0.10,
      qa: 0.15
    }
  },
  STUDIO: {
    teamSize: 4,
    productivityCoeff: 1.0,
    coordinationBuffer: 0.05,
    phaseWeights: {
      analysis: 0.15,
      design: 0.10,
      frontend: 0.25,
      backend: 0.25,
      dbIntegration: 0.10,
      qa: 0.15
    }
  },
  AI_NATIVE: {
    teamSize: 2,
    productivityCoeff: 1.3,
    coordinationBuffer: 0.0,
    phaseWeights: {
      analysis: 0.15,
      design: 0.10,
      frontend: 0.25,
      backend: 0.25,
      dbIntegration: 0.10,
      qa: 0.15
    }
  }
};

const PHASE_TASKS: Record<string, string[]> = {
  analysis: ['분석/설계'],
  design: ['디자인'],
  frontend: ['프론트엔드개발'],
  backend: ['백엔드개발'],
  dbIntegration: ['DB연동 및 테스트'],
  qa: ['통합테스트', '버그수정 및 최적화']
};

const PHASE_NAMES: Record<string, string> = {
  analysis: '분석/설계',
  design: '디자인',
  frontend: '프론트엔드개발',
  backend: '백엔드개발',
  dbIntegration: 'DB연동 및 테스트',
  qa: 'QA/배포'
};

export function calculateTotalMM(modules: ModuleItem[]): number {
  return modules
    .filter(m => m.isSelected)
    .reduce((total, module) => {
      const baseMM = module.baseManMonths;
      const subMM = module.subFeatures
        .filter(s => s.isSelected)
        .reduce((sum, sub) => sum + (sub.manWeeks / 4), 0);
      return total + baseMM + subMM;
    }, 0);
}

export function calculateSchedule(
  modules: ModuleItem[],
  partnerType: PartnerType
): ScheduleResult {
  const config = PARTNER_CONFIGS[partnerType];
  const rawMM = calculateTotalMM(modules);
  
  const effectiveMM = rawMM / (config.teamSize * config.productivityCoeff);
  const totalDuration = effectiveMM * (1 + config.coordinationBuffer);
  const totalMonths = Math.ceil(totalDuration);
  
  const phases = distributePhases(totalDuration, totalMonths, config);
  
  const phaseDurationSum = phases.reduce((sum, p) => sum + p.duration, 0);
  if (Math.abs(phaseDurationSum - totalDuration) > 0.01) {
    const diff = totalDuration - phaseDurationSum;
    phases[phases.length - 1].duration += diff;
  }
  
  return {
    rawMM,
    teamSize: config.teamSize,
    productivityCoeff: config.productivityCoeff,
    coordinationBuffer: config.coordinationBuffer,
    totalDuration,
    totalMonths,
    phases
  };
}

function distributePhases(
  totalDuration: number,
  totalMonths: number,
  config: PartnerConfig
): PhaseSchedule[] {
  const phaseKeys = ['analysis', 'design', 'frontend', 'backend', 'dbIntegration', 'qa'] as const;
  const phases: PhaseSchedule[] = [];
  let currentMonth = 1;
  
  phaseKeys.forEach((key) => {
    const weight = config.phaseWeights[key];
    const phaseDuration = totalDuration * weight;
    const startMonth = currentMonth;
    const endMonth = Math.min(
      Math.ceil(startMonth + phaseDuration - 0.01),
      totalMonths
    );
    
    const months: number[] = [];
    for (let m = startMonth; m <= endMonth; m++) {
      months.push(m);
    }
    
    const tasks = PHASE_TASKS[key].map((taskName, idx) => {
      const taskCount = PHASE_TASKS[key].length;
      const taskDuration = phaseDuration / taskCount;
      const taskStartMonth = Math.ceil(startMonth + (idx * taskDuration));
      const taskEndMonth = Math.min(
        Math.ceil(startMonth + ((idx + 1) * taskDuration)),
        totalMonths
      );
      
      const taskMonths: number[] = [];
      for (let m = taskStartMonth; m <= taskEndMonth; m++) {
        if (m >= 1 && m <= totalMonths) {
          taskMonths.push(m);
        }
      }
      
      if (taskMonths.length === 0 && months.length > 0) {
        taskMonths.push(months[Math.min(idx, months.length - 1)]);
      }
      
      return {
        name: taskName,
        months: taskMonths
      };
    });
    
    phases.push({
      phase: PHASE_NAMES[key],
      duration: phaseDuration,
      startMonth,
      endMonth,
      tasks
    });
    
    currentMonth = endMonth;
  });
  
  return phases;
}

export function getMonthLabels(totalMonths: number): string[] {
  const labels: string[] = [];
  for (let i = 1; i <= totalMonths; i++) {
    labels.push(`M${i}`);
  }
  return labels;
}
