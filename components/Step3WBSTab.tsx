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

  return (
    <div className="space-y-8 animate-fade-in pb-20 pt-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded">STEP 3</span>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">실행 계획 (WBS)</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Work Breakdown Structure - 통합 일정 및 마일스톤</p>
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">총 예상 기간 (AI 분석)</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{aiDuration.raw}</p>
            {durationMismatch && (
              <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">WBS 상세: {totalPhaseDuration}개월</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">적용 파트너 유형</p>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{config.title}</p>
          </div>
        </div>
        
        <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
          {phases.map((phase, index) => {
            const width = (phase.duration / totalPhaseDuration) * 100;
            const colors = [
              'bg-blue-500',
              'bg-emerald-500',
              'bg-indigo-500',
              'bg-amber-500',
              'bg-purple-500'
            ];
            return (
              <div 
                key={phase.id}
                className={`${colors[index]} transition-all`}
                style={{ width: `${width}%` }}
                title={`${phase.name}: ${formatMonths(phase.duration)}`}
              />
            );
          })}
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>착수</span>
          <span>완료</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Icons.BarChart size={20} className="text-indigo-500" />
          단계별 기간 분포
        </h4>
        <div className="space-y-3">
          {phases.map((phase, index) => {
            const maxDuration = Math.max(...phases.map(p => p.duration));
            const percent = maxDuration > 0 ? (phase.duration / maxDuration) * 100 : 0;
            const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500', 'bg-purple-500'];
            return (
              <div key={phase.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    {phase.name}
                    {phase.duration < 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">동시 진행</span>
                    )}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatMonths(phase.duration)}</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${colors[index] || 'bg-slate-500'} rounded-full transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Icons.Calendar size={20} className="text-indigo-500" />
          단계별 상세 일정
        </h4>
        
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div 
              key={phase.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-emerald-500' :
                    index === 2 ? 'bg-indigo-500' :
                    index === 3 ? 'bg-amber-500' :
                    'bg-purple-500'
                  }`}>
                    {index + 1}
                  </div>
                  {index < phases.length - 1 && (
                    <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700 mt-2" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {phase.name}
                      {phase.duration < 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded font-normal">동시 진행</span>
                      )}
                    </h5>
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {formatMonths(phase.duration)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {phase.tasks.map((task, taskIndex) => (
                      <span 
                        key={taskIndex}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm rounded-lg flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
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

      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800">
        <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
          <Icons.Lightbulb size={18} className="text-indigo-500" />
          파트너 선정 어드바이스
        </h4>
        <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
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
