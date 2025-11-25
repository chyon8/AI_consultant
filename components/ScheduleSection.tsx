
import React from 'react';
import { ModuleItem, PartnerType } from '../types';
import { Icons } from './Icons';
import { PARTNER_PRESETS } from '../constants';

interface ScheduleSectionProps {
  modules: ModuleItem[];
  currentPartnerType: PartnerType;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({ modules, currentPartnerType }) => {
  const activeModules = modules.filter(m => m.isSelected);
  const durationMultiplier = PARTNER_PRESETS[currentPartnerType].durationMultiplier;
  
  // Calculate base duration
  const baseDuration = activeModules.reduce((acc, m) => acc + m.baseManMonths, 0);
  
  // Apply multiplier to total
  const totalDuration = (baseDuration + 1.5) * durationMultiplier;
  
  // Dynamic phase durations based on partner type
  let planningDuration = 2; // weeks
  let qaDurationText = "2주 (예정)";
  
  if (currentPartnerType === 'AGENCY') {
      planningDuration = 4; // Agency takes longer planning
      qaDurationText = "4주 (통합 테스트 포함)";
  } else if (currentPartnerType === 'AI_NATIVE') {
      planningDuration = 1; // Fast planning
      qaDurationText = "1주 (빠른 배포)";
  }

  const progressPercent = 35;

  return (
    <div className="space-y-6 animate-fade-in mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Icons.Calendar size={20} />
            예상 프로젝트 일정
        </h3>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
           <span className="text-sm font-medium text-slate-600 dark:text-slate-300">총 예상 기간: <strong className="text-indigo-600 dark:text-indigo-400">{Math.ceil(totalDuration * 4.3)}주</strong> (약 {totalDuration.toFixed(1)}개월)</span>
        </div>
      </div>

      <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-8">
        
        {/* Phase 1: Planning */}
        <div className="relative pl-8">
           <div className="absolute -left-[11px] top-0 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 flex items-center justify-center">
              <Icons.CheckMark size={12} className="text-emerald-500" strokeWidth={3} />
           </div>

           <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                 <h4 className="text-lg font-bold text-slate-900 dark:text-white">프로젝트 기획 및 설계</h4>
                 <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{planningDuration}주 (예상)</span>
              </div>
              <ul className="space-y-3">
                 {['요구사항 분석', '아키텍처 설계', 'UI/UX 디자인'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                       {item}
                    </li>
                 ))}
              </ul>
           </div>
        </div>

        {/* Phase 2: Development */}
        <div className="relative pl-8">
           <div className="absolute -left-[11px] top-0 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-4 border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
           </div>

           <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500 dark:border-indigo-600 rounded-2xl p-6 shadow-float">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        핵심 기능 개발 
                        {currentPartnerType === 'AI_NATIVE' && <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">AI 가속</span>}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">선택하신 모듈의 개발이 진행됩니다.</p>
                 </div>
                 <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{Math.ceil(totalDuration * 4.3) - planningDuration - (currentPartnerType === 'AGENCY' ? 4 : 2)}주 소요</span>
              </div>

              <div className="space-y-4 mb-8">
                 {activeModules.slice(0, 4).map((m) => (
                    <div key={m.id} className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                       <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.name}</span>
                    </div>
                 ))}
                 {activeModules.length > 4 && (
                    <p className="text-xs text-slate-400 pl-5">+ 그 외 {activeModules.length - 4}개 모듈</p>
                 )}
              </div>
           </div>
        </div>

        {/* Phase 3: Testing & Launch */}
        <div className="relative pl-8 opacity-60">
           <div className="absolute -left-[9px] top-0 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600" />
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">QA 및 안정화</h4>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{qaDurationText}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">통합 테스트, 버그 수정, 스토어 배포</p>
           </div>
        </div>

      </div>
    </div>
  );
};
