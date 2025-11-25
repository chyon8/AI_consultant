
import React from 'react';
import { ModuleItem } from '../types';
import { Icons } from './Icons';

interface ScheduleTabProps {
  modules: ModuleItem[];
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ modules }) => {
  const activeModules = modules.filter(m => m.isSelected);
  
  // Calculate total duration for progress bar
  const totalDuration = activeModules.reduce((acc, m) => acc + m.baseManMonths, 0) + 1.5; // +1.5 for planning
  const progressPercent = 35; // Mock progress

  return (
    <div className="space-y-6 animate-fade-in pb-20 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">프로젝트 일정</h3>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
           <Icons.Calendar size={16} className="text-indigo-500" />
           <span className="text-sm font-medium text-slate-600">총 기간: <strong>{Math.ceil(totalDuration * 4.3)}주</strong> (약 {totalDuration.toFixed(1)}개월)</span>
        </div>
      </div>

      <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
        
        {/* Phase 1: Planning (Completed) */}
        <div className="relative pl-8">
           {/* Timeline Node */}
           <div className="absolute -left-[11px] top-0 w-6 h-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center">
              <Icons.CheckMark size={12} className="text-emerald-500" strokeWidth={3} />
           </div>

           <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                 <h4 className="text-lg font-bold text-slate-900">프로젝트 기획 및 설계</h4>
                 <span className="text-sm font-bold text-emerald-600">2주 (완료)</span>
              </div>
              <ul className="space-y-3">
                 {['요구사항 분석 및 정리', '시스템 아키텍처 설계', '데이터베이스 스키마 설계', 'UI/UX 디자인'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                       {item}
                    </li>
                 ))}
              </ul>
           </div>
        </div>

        {/* Phase 2: Development (Active) */}
        <div className="relative pl-8">
           {/* Timeline Node */}
           <div className="absolute -left-[11px] top-0 w-6 h-6 rounded-full bg-white border-4 border-indigo-100 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
           </div>

           <div className="bg-white border-2 border-indigo-500 rounded-2xl p-6 shadow-float">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">핵심 기능 개발</h4>
                    <p className="text-sm text-slate-500">현재 사용자 관리 및 기본 모듈 개발이 진행 중입니다.</p>
                 </div>
                 <span className="text-sm font-bold text-indigo-600">{Math.ceil(totalDuration * 4.3) - 2}주 소요 예정</span>
              </div>

              {/* Active Modules List */}
              <div className="space-y-4 mb-8">
                 {activeModules.slice(0, 4).map((m) => (
                    <div key={m.id} className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                       <span className="text-sm font-medium text-slate-700">{m.name} 개발</span>
                    </div>
                 ))}
                 {activeModules.length > 4 && (
                    <p className="text-xs text-slate-400 pl-5">+ 그 외 {activeModules.length - 4}개 모듈 진행 예정</p>
                 )}
              </div>

              {/* Progress Bar */}
              <div className="pt-4 border-t border-slate-100">
                 <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-slate-400">Current Progress</span>
                    <span className="text-lg font-bold text-indigo-600">{progressPercent}%</span>
                 </div>
                 <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Phase 3: Testing & Launch (Pending) */}
        <div className="relative pl-8 opacity-50">
           <div className="absolute -left-[9px] top-0 w-5 h-5 rounded-full bg-white border-2 border-slate-300" />
           <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-slate-900 mb-2">QA 및 런칭</h4>
              <p className="text-sm text-slate-500">통합 테스트, 버그 수정, 스토어 배포</p>
           </div>
        </div>

      </div>
    </div>
  );
};