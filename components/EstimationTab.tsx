

import React, { useState, useMemo } from 'react';
import { ModuleItem, PartnerType, EstimationStep, ProjectScale, EstimationSubTab } from '../types';
import { Icons } from './Icons';
import { PartnerTypeSelector } from './PartnerTypeSelector';
import { ScheduleSection } from './ScheduleSection';
import { calculateSchedule, getMonthLabels } from '../services/scheduleEngine';

interface EstimationTabProps {
  modules: ModuleItem[];
  onToggleModule: (moduleId: string) => void;
  onToggleSubFeature: (moduleId: string, subFeatureId: string) => void;
  setModules: React.Dispatch<React.SetStateAction<ModuleItem[]>>;
  currentPartnerType: PartnerType;
  onSelectPartnerType: (type: PartnerType) => void;
  estimationStep: EstimationStep;
  currentScale: ProjectScale;
  onScaleChange: (scale: ProjectScale) => void;
}

export const EstimationTab: React.FC<EstimationTabProps> = ({ 
  modules, 
  onToggleModule, 
  onToggleSubFeature, 
  currentPartnerType,
  onSelectPartnerType,
  estimationStep,
  currentScale,
  onScaleChange
}) => {
  const [expandedIds, setExpandedIds] = useState<string[]>(modules.map(m => m.id));
  const [subTab, setSubTab] = useState<EstimationSubTab>('DETAIL');

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) 
        ? prev.filter(expandedId => expandedId !== id) 
        : [...prev, id]
    );
  };

  // --- Calculation Logic for Step 2 ---
  // Base Development Cost
  const baseDevCost = modules.filter(m => m.isSelected).reduce((acc, m) => 
    acc + m.baseCost + m.subFeatures.filter(s => s.isSelected).reduce((sa, s) => sa + s.price, 0)
  , 0);

  // Overhead Logic based on Partner Type
  let pmCost = 0;
  let qaCost = 0;
  let devCost = baseDevCost;
  let totalCost = 0;
  let durationMultiplier = 1.0;

  if (currentPartnerType === 'AGENCY') {
    // Agency: Base + 20% PM + 10% QA
    pmCost = baseDevCost * 0.2;
    qaCost = baseDevCost * 0.1;
    totalCost = devCost + pmCost + qaCost;
    durationMultiplier = 1.2;
  } else if (currentPartnerType === 'STUDIO') {
    // Studio: Base + 10% Mgmt
    pmCost = baseDevCost * 0.1;
    qaCost = 0; // Integrated in dev
    totalCost = devCost + pmCost;
    durationMultiplier = 1.0;
  } else {
    // AI Native: Discounted Dev Cost, No Overhead
    devCost = baseDevCost * 0.6; // AI Efficiency
    pmCost = 0;
    qaCost = 0;
    totalCost = devCost;
    durationMultiplier = 0.5;
  }

  const scheduleResult = useMemo(() => {
    return calculateSchedule(modules, currentPartnerType);
  }, [modules, currentPartnerType]);

  const finalMonths = scheduleResult.totalDuration;

  // --- UI Renders ---

  const renderAnalysisGraph = () => {
    const partnerLabel = currentPartnerType === 'AI_NATIVE' ? 'TYPE A' : 
                         currentPartnerType === 'STUDIO' ? 'TYPE B' : 'TYPE C';
    
    const costItems = [
      { label: '개발', value: devCost, show: true },
      { label: 'PM', value: pmCost, show: pmCost > 0 },
      { label: 'QA', value: qaCost, show: qaCost > 0 }
    ].filter(item => item.show);

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 mb-8 border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] text-slate-400 uppercase mb-2">{partnerLabel} 기준</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              {(totalCost / 10000).toLocaleString()}
              <span className="text-base font-normal text-slate-400 ml-1">만원</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium tracking-[0.15em] text-slate-400 uppercase mb-2">예상 기간</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              {finalMonths.toFixed(1)}
              <span className="text-base font-normal text-slate-400 ml-1">개월</span>
            </p>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-6">
            {costItems.map((item, idx) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{item.label}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {(item.value / 10000).toLocaleString()}만
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const isBlind = estimationStep === 'SCOPE';

  // Sub-tabs UI (visible only in RESULT step)
  const renderSubTabs = () => {
    if (isBlind) return null;
    return (
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6">
        {[
          { id: 'DETAIL' as EstimationSubTab, label: '상세 견적', icon: Icons.File },
          { id: 'SCHEDULE' as EstimationSubTab, label: '예상 일정', icon: Icons.Calendar }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all flex items-center justify-center gap-2 rounded-md ${
              subTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    );
  };

  // Render module list for detail tab (with dropdown like SCOPE step)
  const renderModuleList = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Icons.Briefcase size={20} />
        선택된 기능 명세
      </h3>
      {modules.filter(m => m.isSelected).map((module) => {
        const isExpanded = expandedIds.includes(module.id);
        const selectedSubs = module.subFeatures.filter(s => s.isSelected);
        const moduleTotalCost = module.baseCost + selectedSubs.reduce((sum, s) => sum + s.price, 0);
        
        return (
          <div 
            key={module.id} 
            className="group border rounded-xl shadow-sm transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
          >
            {/* Header Row */}
            <div 
              className="p-6 flex items-start gap-5 cursor-pointer select-none" 
              onClick={() => toggleExpand(module.id)}
            >
              <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-md bg-indigo-600 border-indigo-600 text-white flex items-center justify-center">
                <Icons.CheckMark size={14} strokeWidth={3} />
              </div>

              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-3 mb-1">
                  <h5 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    {module.name}
                  </h5>
                  {module.isNew && (
                    <span className="text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 rounded-full animate-pulse">
                      ✨ New
                    </span>
                  )}
                  {module.required && (
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                      필수 (CORE)
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed">{module.description}</p>
              </div>

              {/* Right Side Info */}
              <div className="flex flex-col items-end gap-2">
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {(moduleTotalCost/10000).toLocaleString()}만원
                </p>
                <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  <Icons.Down size={20} className="text-slate-300 dark:text-slate-600" />
                </div>
              </div>
            </div>

            {/* Expanded Area */}
            <div 
              className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="px-6 pb-6 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                <div className="grid gap-2 pl-11">
                  {module.subFeatures.map((sub) => (
                    <div 
                      key={sub.id} 
                      className={`flex items-center justify-between py-3 px-4 rounded-lg transition-all duration-200 border ${
                        sub.isSelected 
                          ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' 
                          : 'bg-white dark:bg-slate-900 border-transparent opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          sub.isSelected 
                            ? 'bg-indigo-500 border-indigo-500 text-white' 
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                        }`}>
                          {sub.isSelected && <Icons.CheckMark size={12} strokeWidth={3} />}
                        </div>
                        <span className={`text-sm font-medium ${sub.isSelected ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                          {sub.name}
                        </span>
                        {sub.isNew && (
                          <span className="text-[9px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      
                      <span className={`text-sm font-bold w-20 text-right ${sub.isSelected ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}`}>
                        +{(sub.price / 10000).toLocaleString()}만
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Sub-tab content renderers
  const renderDetailTab = () => (
    <div className="space-y-6">
      {/* Partner Type Selector */}
      <PartnerTypeSelector 
        currentType={currentPartnerType} 
        onSelect={onSelectPartnerType} 
      />
      {/* Analysis Report */}
      {renderAnalysisGraph()}
      {/* Module List */}
      {renderModuleList()}
    </div>
  );

  const renderScheduleTab = () => {
    const { rawMM, teamSize, productivityCoeff, totalDuration, totalMonths, phases, coordinationBuffer } = scheduleResult;
    const monthLabels = getMonthLabels(totalMonths);

    const phaseDurationSum = phases.reduce((sum, p) => sum + p.duration, 0);
    const isValid = Math.abs(phaseDurationSum - totalDuration) < 0.01;

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">투입 인원</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{teamSize}명</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">생산성 계수</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">×{productivityCoeff.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">총 기간</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{totalDuration.toFixed(1)}개월</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400">
              Duration = {rawMM.toFixed(1)}MM ÷ ({teamSize}명 × {productivityCoeff}) × (1 + {(coordinationBuffer * 100).toFixed(0)}% 버퍼) = <span className="font-semibold text-indigo-600 dark:text-indigo-400">{totalDuration.toFixed(2)}개월</span>
              {!isValid && <span className="text-red-500 ml-2">(검증 오류: Phase 합계 불일치)</span>}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
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

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Phase 배분 상세</h4>
          <div className="space-y-2">
            {phases.map((phase, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">{phase.phase}</span>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 dark:text-slate-500">M{phase.startMonth} ~ M{phase.endMonth}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 w-20 text-right">{phase.duration.toFixed(2)}개월</span>
                </div>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm font-semibold">
              <span className="text-slate-700 dark:text-slate-300">합계</span>
              <span className={`${isValid ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {phaseDurationSum.toFixed(2)}개월 {isValid ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (estimationStep === 'REGISTER') {
    return (
       <div className="h-full flex flex-col items-center justify-center animate-fade-in pb-20">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
             <Icons.CheckMark size={48} strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">프로젝트 등록 준비 완료</h2>
          <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-8">
             선택하신 견적 내용으로 공고 등록을 진행합니다.<br/>
             매니저 검수 전까지 내용은 언제든 수정할 수 있으니 걱정하지 마세요.
          </p>
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-200 dark:border-slate-800">
             <div className="flex justify-between mb-2">
                <span className="text-slate-500 dark:text-slate-400">총 예상 견적</span>
                <span className="font-bold text-slate-900 dark:text-white">{(totalCost/10000).toLocaleString()}만원</span>
             </div>
             <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">예상 기간</span>
                <span className="font-bold text-slate-900 dark:text-white">{finalMonths.toFixed(1)}개월</span>
             </div>
          </div>
       </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      

      {/* Sub-tabs Navigation */}
      {!isBlind && renderSubTabs()}

      {/* Sub-tab Content */}
      {!isBlind && subTab === 'DETAIL' && renderDetailTab()}
      {!isBlind && subTab === 'SCHEDULE' && renderScheduleTab()}

      {/* Module List - Only visible in SCOPE step */}
      {isBlind && <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
           <Icons.Briefcase size={20} />
           {isBlind ? '기능 범위 설계 (Scope)' : '선택된 기능 명세'}
        </h3>

        {modules.map((module) => {
           const isSelected = module.isSelected;
           const isExpanded = expandedIds.includes(module.id);
           
           return (
            <div 
              key={module.id} 
              className={`group border rounded-xl shadow-sm transition-all duration-300 overflow-hidden ${
                !isSelected 
                  ? 'bg-slate-50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 opacity-60' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
              }`}
            >
              {/* Header Row */}
              <div 
                 className="p-6 flex items-start gap-5 cursor-pointer select-none" 
                 onClick={() => toggleExpand(module.id)}
              >
                {/* Checkbox (Interactive in Step 1, Disabled in Step 2) */}
                <div
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (!isBlind) return; // Read-only in Step 2
                    if (!module.required) onToggleModule(module.id); 
                  }}
                  className={`mt-1 flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                  } ${(!isBlind || module.required) ? 'cursor-not-allowed opacity-70' : 'hover:border-indigo-400'}`}
                >
                  {isSelected && <Icons.CheckMark size={14} strokeWidth={3} />}
                </div>

                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-3 mb-1">
                    <h5 className={`text-lg font-bold tracking-tight transition-colors ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                      {module.name}
                    </h5>
                    {module.isNew && (
                      <span className="text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 rounded-full animate-pulse">
                        ✨ New
                      </span>
                    )}
                    {module.required && (
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        필수 (CORE)
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed">{module.description}</p>
                </div>

                {/* Right Side Info */}
                <div className="flex flex-col items-end gap-2">
                   {isBlind ? (
                      // Step 1: Qualitative Feedback
                      <span className={`text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400`}>
                         {module.category}
                      </span>
                   ) : (
                      // Step 2: Price Reveal
                      <p className={`text-lg font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`}>
                        {(module.baseCost/10000).toLocaleString()}만원+
                      </p>
                   )}
                   <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <Icons.Down size={20} className="text-slate-300 dark:text-slate-600" />
                   </div>
                </div>
              </div>

              {/* Expanded Area */}
              <div 
                className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                 <div className="px-6 pb-6 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="grid gap-2 pl-11">
                      {module.subFeatures.map((sub) => (
                        <div 
                          key={sub.id} 
                          className={`flex items-center justify-between py-3 px-4 rounded-lg transition-all duration-200 border ${
                            sub.isSelected 
                              ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' 
                              : 'bg-white dark:bg-slate-900 border-transparent'
                          } ${isBlind ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : ''}`}
                          onClick={(e) => {
                             if (!isBlind) return; // Read-only
                             e.stopPropagation();
                             if(module.required && sub.id.endsWith('1')) return;
                             onToggleSubFeature(module.id, sub.id);
                          }}
                        >
                           <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                sub.isSelected 
                                  ? 'bg-indigo-500 border-indigo-500 text-white' 
                                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                              } ${(!isBlind || (module.required && sub.id.endsWith('1'))) ? 'opacity-50' : ''}`}>
                                  {sub.isSelected && <Icons.CheckMark size={12} strokeWidth={3} />}
                              </div>
                              <span className={`text-sm font-medium ${sub.isSelected ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                                {sub.name}
                              </span>
                              {sub.isNew && (
                                <span className="text-[9px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 py-0.5 rounded-full">
                                  New
                                </span>
                              )}
                           </div>
                           
                           {/* Right Side: Price or Qualitative Tag */}
                           <div className="flex items-center gap-6">
                              {isBlind ? (
                                sub.price > 5000000 ? (
                                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                                    <Icons.Warning size={12}/> 고비용 예상
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">일반 기능</span>
                                )
                              ) : (
                                <span className={`text-sm font-bold w-20 text-right ${sub.isSelected ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}`}>
                                  +{(sub.price / 10000).toLocaleString()}만
                                </span>
                              )}
                           </div>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
            </div>
           )
        })}
        
      </div>}
    </div>
  );
};
