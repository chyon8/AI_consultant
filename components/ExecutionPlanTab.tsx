

import React, { useMemo } from 'react';
import { ModuleItem, PartnerType, ParsedEstimates } from '../types';
import { Icons } from './Icons';
import { calculateSchedule, calculateScheduleWithTargetDuration, getMonthLabels } from '../services/scheduleEngine';

interface ExecutionPlanTabProps {
  modules: ModuleItem[];
  currentPartnerType: PartnerType;
  estimates?: ParsedEstimates;
}

export const ExecutionPlanTab: React.FC<ExecutionPlanTabProps> = ({
  modules,
  currentPartnerType,
  estimates
}) => {
  const aiDuration = useMemo(() => {
    if (!estimates) return null;
    const durationStr = currentPartnerType === 'AI_NATIVE' ? estimates.typeA.duration :
                        currentPartnerType === 'STUDIO' ? estimates.typeB.duration :
                        estimates.typeC.duration;
    const match = durationStr?.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }, [estimates, currentPartnerType]);

  const usingAiDuration = aiDuration !== null;

  const scheduleResult = useMemo(() => {
    if (usingAiDuration && aiDuration) {
      return calculateScheduleWithTargetDuration(modules, currentPartnerType, aiDuration);
    }
    return calculateSchedule(modules, currentPartnerType);
  }, [modules, currentPartnerType, usingAiDuration, aiDuration]);

  const { rawMM, teamSize, productivityCoeff, totalDuration, totalMonths, phases, coordinationBuffer } = scheduleResult;
  const monthLabels = getMonthLabels(totalMonths);

  const phaseDurationSum = phases.reduce((sum, p) => sum + p.duration, 0);
  const isValid = Math.abs(phaseDurationSum - totalDuration) < 0.01;

  const partnerLabel = currentPartnerType === 'AI_NATIVE' ? 'TYPE A' : 
                       currentPartnerType === 'STUDIO' ? 'TYPE B' : 'TYPE C';

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] text-slate-400 uppercase mb-2">수행계획 ({partnerLabel} 기준)</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              {totalDuration.toFixed(1)}
              <span className="text-base font-normal text-slate-400 ml-1">개월</span>
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">투입 인원</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{teamSize}명</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">생산성 계수</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">×{productivityCoeff.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400">
            {usingAiDuration ? (
              <>AI 분석 기반 예상 기간 = <span className="font-semibold text-indigo-600 dark:text-indigo-400">{totalDuration.toFixed(1)}개월</span></>
            ) : (
              <>Duration = {rawMM.toFixed(1)}MM ÷ ({teamSize}명 × {productivityCoeff}) × (1 + {(coordinationBuffer * 100).toFixed(0)}% 버퍼) = <span className="font-semibold text-indigo-600 dark:text-indigo-400">{totalDuration.toFixed(2)}개월</span></>
            )}
            {!isValid && !usingAiDuration && <span className="text-red-500 ml-2">(검증 오류: Phase 합계 불일치)</span>}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icons.Calendar size={20} />
            WBS 일정표
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left py-4 px-6 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider w-28">Phase</th>
                <th className="text-left py-4 px-6 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Task</th>
                {monthLabels.map(m => (
                  <th key={m} className="text-center py-4 px-4 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider w-14">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {phases.map((phaseGroup, phaseIdx) => (
                phaseGroup.tasks.map((task, taskIdx) => (
                  <tr 
                    key={`${phaseIdx}-${taskIdx}`} 
                    className="border-b border-slate-50 dark:border-slate-800/50 last:border-b-0"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {taskIdx === 0 ? phaseGroup.phase : ''}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                      {task.name}
                    </td>
                    {Array.from({ length: totalMonths }, (_, i) => i + 1).map(month => (
                      <td key={month} className="py-4 px-4 text-center">
                        <div className="flex justify-center">
                          <div 
                            className={`w-3 h-3 rounded-sm transition-colors ${
                              task.months.includes(month)
                                ? 'bg-slate-700 dark:bg-slate-300'
                                : 'bg-slate-100 dark:bg-slate-800'
                            }`}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
          <Icons.Briefcase size={16} />
          Phase 배분 상세
        </h4>
        <div className="space-y-3">
          {phases.map((phase, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">{phase.phase}</span>
              <div className="flex items-center gap-4">
                <span className="text-slate-500 dark:text-slate-500">M{phase.startMonth} ~ M{phase.endMonth}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 w-20 text-right">{phase.duration.toFixed(2)}개월</span>
              </div>
            </div>
          ))}
          <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm font-semibold">
            <span className="text-slate-700 dark:text-slate-300">합계</span>
            <span className={`${usingAiDuration ? 'text-slate-700 dark:text-slate-300' : (isValid ? 'text-green-600 dark:text-green-400' : 'text-red-500')}`}>
              {phaseDurationSum.toFixed(2)}개월 {!usingAiDuration && (isValid ? '✓' : '✗')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
