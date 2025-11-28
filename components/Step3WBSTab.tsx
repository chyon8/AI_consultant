import React from 'react';
import { ModuleItem, PartnerType, ProjectEstimates } from '../types';
import { Icons } from './Icons';
import { PARTNER_PRESETS } from '../constants';

interface Step3WBSTabProps {
  modules: ModuleItem[];
  currentPartnerType: PartnerType;
  estimates?: ProjectEstimates;
}

interface WBSPhase {
  id: string;
  name: string;
  duration: number;
  tasks: string[];
  status: 'completed' | 'in_progress' | 'pending';
}

export const Step3WBSTab: React.FC<Step3WBSTabProps> = ({ 
  modules,
  currentPartnerType,
  estimates
}) => {
  const getAIDuration = (): { value: number; raw: string } => {
    const aiEstimate = currentPartnerType === 'AGENCY' ? estimates?.typeA : 
                       currentPartnerType === 'STUDIO' ? estimates?.typeB : estimates?.typeC;
    
    if (aiEstimate?.duration) {
      const raw = aiEstimate.duration;
      const rangeMatch = raw.match(/(\d+(?:\.\d+)?)\s*[~\-]\s*(\d+(?:\.\d+)?)/);
      if (rangeMatch) {
        const avg = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
        return { value: avg, raw };
      }
      const singleMatch = raw.match(/(\d+(?:\.\d+)?)/);
      if (singleMatch) {
        return { value: parseFloat(singleMatch[1]), raw };
      }
      return { value: 6, raw };
    }
    return { value: 6, raw: '분석 중...' };
  };

  const aiDuration = getAIDuration();
  const totalProjectMonths = aiDuration.value;

  const distributeMonths = (total: number, ratios: number[]): number[] => {
    const allocated = ratios.map(r => total * r);
    const lastIdx = allocated.length - 1;
    const sumExceptLast = allocated.slice(0, lastIdx).reduce((a, b) => a + b, 0);
    allocated[lastIdx] = total - sumExceptLast;
    
    return allocated;
  };
  
  const formatMonths = (v: number): string => {
    if (Number.isInteger(v)) return `${v}개월`;
    return `${v.toFixed(1)}개월`;
  };

  const phaseRatios = [0.2, 0.15, 0.45, 0.1, 0.1];
  const distributedDurations = distributeMonths(totalProjectMonths, phaseRatios);
  
  const formatDuration = (months: number): string => {
    if (months < 1) return `${months}개월`;
    if (months % 1 === 0) return `${months}개월`;
    return `${months}개월`;
  };

  const phases: WBSPhase[] = [
    {
      id: 'analysis',
      name: '분석/설계',
      duration: distributedDurations[0],
      tasks: ['요구사항 분석', 'UI/UX 기획', '아키텍처 설계', 'DB 스키마 설계'],
      status: 'pending'
    },
    {
      id: 'design',
      name: '디자인',
      duration: distributedDurations[1],
      tasks: ['UI/UX 디자인 시안', '스타일 가이드 수립', '디자인 검수'],
      status: 'pending'
    },
    {
      id: 'development',
      name: '개발',
      duration: distributedDurations[2],
      tasks: ['프론트엔드 개발', '백엔드 API 개발', 'DB 구축', '관리자 페이지'],
      status: 'pending'
    },
    {
      id: 'testing',
      name: '테스트',
      duration: distributedDurations[3],
      tasks: ['통합 테스트', '부하 테스트', '보안 점검', '버그 수정'],
      status: 'pending'
    },
    {
      id: 'deployment',
      name: '안정화/배포',
      duration: distributedDurations[4],
      tasks: ['실운영 배포', '모니터링 설정', '초기 운영 지원'],
      status: 'pending'
    }
  ];

  const totalPhaseDuration = phases.reduce((sum, p) => sum + p.duration, 0);
  const durationMismatch = Math.abs(totalPhaseDuration - aiDuration.value) > 0.01;
  const config = PARTNER_PRESETS[currentPartnerType];

  const useWeekUnit = totalProjectMonths <= 3;
  const totalUnits = Math.max(1, useWeekUnit ? Math.round(totalProjectMonths * 4) : Math.round(totalProjectMonths));
  const unitLabel = useWeekUnit ? 'Week' : 'Month';

  interface TimelineRow {
    phase: string;
    task: string;
    schedule: boolean[];
  }

  const distributeUnits = (total: number, ratios: number[]): number[] => {
    if (ratios.length === 0) return [];
    if (ratios.length === 1) return [total];
    
    const n = ratios.length;
    const sum = ratios.reduce((a, b) => a + b, 0);
    const normalized = sum === 0 
      ? ratios.map(() => 1 / n) 
      : ratios.map(r => r / sum);
    
    const floored = normalized.map(r => Math.floor(r * total));
    const remainders = normalized.map((r, i) => ({ index: i, remainder: (r * total) - floored[i] }));
    
    let remaining = total - floored.reduce((a, b) => a + b, 0);
    remainders.sort((a, b) => b.remainder - a.remainder);
    
    const result = [...floored];
    for (let i = 0; i < remaining && i < remainders.length; i++) {
      result[remainders[i].index]++;
    }
    
    return result;
  };

  const generateTimelineData = (): TimelineRow[] => {
    const rows: TimelineRow[] = [];
    
    const phaseRatiosForDistribution = phases.map(p => p.duration);
    const phaseUnits = distributeUnits(totalUnits, phaseRatiosForDistribution);
    
    let currentUnit = 0;

    phases.forEach((phase, phaseIndex) => {
      const phaseDurationUnits = phaseUnits[phaseIndex];
      const phaseStartUnit = currentUnit;
      const phaseEndUnit = currentUnit + phaseDurationUnits;
      
      if (phase.tasks.length === 0) {
        const schedule: boolean[] = Array(totalUnits).fill(false);
        for (let i = phaseStartUnit; i < phaseEndUnit && i < totalUnits; i++) {
          schedule[i] = true;
        }
        rows.push({
          phase: phase.name,
          task: '-',
          schedule
        });
        currentUnit = phaseEndUnit;
        return;
      }
      
      const taskRatios = phase.tasks.map(() => 1);
      const taskUnits = phaseDurationUnits > 0 
        ? distributeUnits(phaseDurationUnits, taskRatios)
        : phase.tasks.map(() => 0);
      
      let taskStart = phaseStartUnit;
      phase.tasks.forEach((task, taskIndex) => {
        const taskDuration = taskUnits[taskIndex];
        const taskEnd = Math.min(taskStart + taskDuration, phaseEndUnit);
        
        const schedule: boolean[] = [];
        for (let i = 0; i < totalUnits; i++) {
          schedule.push(i >= taskStart && i < taskEnd);
        }
        
        rows.push({
          phase: taskIndex === 0 ? phase.name : '',
          task,
          schedule
        });
        
        taskStart = taskEnd;
      });
      
      currentUnit = phaseEndUnit;
    });

    return rows;
  };

  const timelineData = generateTimelineData();
  const timeHeaders = Array.from({ length: totalUnits }, (_, i) => 
    useWeekUnit ? `W${i + 1}` : `M${i + 1}`
  );

  return (
    <div className="space-y-12 animate-fade-in pb-20 pt-2">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-semibold tracking-wider uppercase rounded">Step 3</span>
        </div>
        <h3 className="text-2xl font-semibold tracking-tight text-neutral-700 dark:text-neutral-200 mb-2">실행 계획 (WBS)</h3>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">Work Breakdown Structure — 통합 일정 및 마일스톤</p>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-8 border border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium mb-2">Total Duration</p>
            <p className="text-3xl font-light text-neutral-700 dark:text-neutral-200">{aiDuration.raw}</p>
            {durationMismatch && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">WBS 상세: {totalPhaseDuration}개월</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium mb-2">Partner Type</p>
            <p className="text-lg font-medium text-neutral-600 dark:text-neutral-300">{config.title}</p>
          </div>
        </div>
        
        <div className="flex h-1 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {phases.map((phase, index) => {
            const width = (phase.duration / totalPhaseDuration) * 100;
            const opacities = [
              'bg-neutral-700 dark:bg-neutral-300',
              'bg-neutral-500 dark:bg-neutral-400',
              'bg-neutral-400 dark:bg-neutral-500',
              'bg-neutral-300 dark:bg-neutral-600',
              'bg-neutral-200 dark:bg-neutral-700'
            ];
            return (
              <div 
                key={phase.id}
                className={`${opacities[index]} transition-all`}
                style={{ width: `${width}%` }}
                title={`${phase.name}: ${formatMonths(phase.duration)}`}
              />
            );
          })}
        </div>
        
        <div className="flex justify-between mt-3 text-[10px] text-neutral-400 uppercase tracking-wider">
          <span>Start</span>
          <span>Complete</span>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-8">
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-6 flex items-center gap-2 uppercase tracking-wider">
          <Icons.BarChart size={16} className="text-neutral-400" />
          Phase Distribution
        </h4>
        <div className="space-y-5">
          {phases.map((phase, index) => {
            const maxDuration = Math.max(...phases.map(p => p.duration));
            const percent = maxDuration > 0 ? (phase.duration / maxDuration) * 100 : 0;
            const opacities = ['bg-neutral-600', 'bg-neutral-500', 'bg-neutral-400', 'bg-neutral-300', 'bg-neutral-200'];
            return (
              <div key={phase.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                    {phase.name}
                    {phase.duration < 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded uppercase tracking-wider">Parallel</span>
                    )}
                  </span>
                  <span className="font-medium text-neutral-700 dark:text-neutral-200">{formatMonths(phase.duration)}</span>
                </div>
                <div className="h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${opacities[index] || 'bg-neutral-400'} dark:bg-neutral-500 rounded-full transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-8">
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-8 flex items-center gap-2 uppercase tracking-wider">
          <Icons.Grid size={16} className="text-neutral-400" />
          Visual Timeline
        </h4>
        
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider w-24 min-w-[96px]">Phase</th>
                <th className="text-left py-3 px-4 text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider min-w-[180px]">Task</th>
                {timeHeaders.map((header, i) => (
                  <th key={i} className="text-center py-3 px-2 text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider whitespace-nowrap min-w-[48px]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timelineData.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-neutral-50 dark:border-neutral-800">
                  <td className="py-4 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400 align-top">
                    {row.phase}
                  </td>
                  <td className="py-4 px-4 text-sm text-neutral-500 dark:text-neutral-500">
                    {row.task}
                  </td>
                  {row.schedule.map((isActive, cellIndex) => (
                    <td key={cellIndex} className="py-5 px-3 text-center">
                      <div className="flex justify-center">
                        {isActive ? (
                          <div className="w-3 h-3 rounded-sm bg-neutral-600 dark:bg-neutral-400" />
                        ) : (
                          <div className="w-3 h-3 rounded-sm bg-neutral-100 dark:bg-neutral-800" />
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center gap-10 mt-10 pt-8 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
            <div className="w-3 h-3 rounded-sm bg-neutral-600 dark:bg-neutral-400" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
            <div className="w-3 h-3 rounded-sm bg-neutral-100 dark:bg-neutral-800" />
            <span>Inactive</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2 flex items-center gap-2 uppercase tracking-wider">
          <Icons.Calendar size={16} className="text-neutral-400" />
          Phase Details
        </h4>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-6">단계별 상세 일정 및 작업 항목</p>
        
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div 
              key={phase.id}
              className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center text-neutral-200 dark:text-neutral-700 font-medium text-sm bg-neutral-600 dark:bg-neutral-300">
                    {index + 1}
                  </div>
                  {index < phases.length - 1 && (
                    <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-700 mt-2" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-2">
                      {phase.name}
                      {phase.duration < 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded uppercase tracking-wider font-normal">Parallel</span>
                      )}
                    </h5>
                    <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      {formatMonths(phase.duration)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {phase.tasks.map((task, taskIndex) => (
                      <span 
                        key={taskIndex}
                        className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-sm rounded-md border border-neutral-100 dark:border-neutral-700 flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 rounded-full bg-neutral-400" />
                        {task}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-8 border border-neutral-100 dark:border-neutral-800">
        <h4 className="font-medium text-neutral-700 dark:text-neutral-200 mb-4 flex items-center gap-2">
          <Icons.Lightbulb size={16} className="text-neutral-400" />
          파트너 선정 어드바이스
        </h4>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          {currentPartnerType === 'AGENCY' && 
            '대형 에이전시는 안정성과 체계적인 프로젝트 관리가 강점입니다. 복잡한 프로젝트나 대규모 트래픽 처리가 필요한 경우 적합합니다.'
          }
          {currentPartnerType === 'STUDIO' && 
            '부티크 스튜디오는 가성비와 유연한 커뮤니케이션이 장점입니다. 중규모 프로젝트에서 효율적인 개발이 가능합니다.'
          }
          {currentPartnerType === 'AI_NATIVE' && 
            'AI 네이티브 개발은 빠른 개발 속도와 비용 효율성이 특징입니다. MVP나 프로토타입 개발에 최적화되어 있습니다.'
          }
        </p>
      </div>
    </div>
  );
};
