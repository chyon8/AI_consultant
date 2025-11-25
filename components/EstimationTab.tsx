

import React, { useState } from 'react';
import { ModuleItem, PartnerType, EstimationStep, ProjectScale } from '../types';
import { Icons } from './Icons';
import { PartnerTypeSelector } from './PartnerTypeSelector';
import { ReverseAuctionWidget } from './ReverseAuctionWidget';
import { ScheduleSection } from './ScheduleSection';
import { ProjectScaleSelector } from './ProjectScaleSelector';

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

  // Duration Calculation
  const rawTotalMonths = modules.filter(m => m.isSelected).reduce((sum, m) => {
     const subsWeeks = m.subFeatures.filter(s => s.isSelected).reduce((acc, s) => acc + s.manWeeks, 0);
     return sum + m.baseManMonths + (subsWeeks / 4);
  }, 0);
  const finalMonths = rawTotalMonths * durationMultiplier;

  // --- UI Renders ---

  const renderAnalysisGraph = () => {
    const maxVal = totalCost;
    return (
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 mb-8 border border-slate-100 dark:border-slate-800 animate-slide-up">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
           <Icons.PieChart className="text-indigo-500" size={20} />
           견적 상세 분석 리포트
        </h3>
        <div className="flex items-center justify-between mb-2">
           <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">PARTNER TYPE: {currentPartnerType}</span>
           <span className="text-2xl font-bold text-slate-900 dark:text-white">{(totalCost / 10000).toLocaleString()}만원</span>
        </div>
        
        {/* Bar Chart */}
        <div className="h-6 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex mb-4">
           <div style={{ width: `${(devCost/totalCost)*100}%` }} className="h-full bg-indigo-500" title="개발비"></div>
           {pmCost > 0 && <div style={{ width: `${(pmCost/totalCost)*100}%` }} className="h-full bg-emerald-500" title="PM/기획"></div>}
           {qaCost > 0 && <div style={{ width: `${(qaCost/totalCost)*100}%` }} className="h-full bg-orange-500" title="QA/테스트"></div>}
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <span className="text-slate-600 dark:text-slate-300">순수 개발비 ({(devCost/10000).toLocaleString()}만)</span>
           </div>
           {pmCost > 0 && (
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-slate-600 dark:text-slate-300">PM/기획 ({(pmCost/10000).toLocaleString()}만)</span>
             </div>
           )}
           {qaCost > 0 && (
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-slate-600 dark:text-slate-300">QA/테스트 ({(qaCost/10000).toLocaleString()}만)</span>
             </div>
           )}
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
           <div>
              <p className="text-xs text-slate-400 uppercase font-bold">Estimated Duration</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{finalMonths.toFixed(1)}개월</p>
           </div>
           <div className="text-right">
              <p className="text-xs text-slate-400">파트너 특성 반영</p>
              <p className="text-sm font-medium text-indigo-500">
                {currentPartnerType === 'AGENCY' ? '안정화 기간 포함' : 
                 currentPartnerType === 'AI_NATIVE' ? 'AI 가속 적용됨' : '표준 기간'}
              </p>
           </div>
        </div>
        
        {/* Schedule Section Integration */}
        <ScheduleSection modules={modules} currentPartnerType={currentPartnerType} />
      </div>
    );
  };

  const isBlind = estimationStep === 'SCOPE';

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
      
      {/* Scale Selector: Visible ONLY in SCOPE step, replaced by PartnerType in RESULT */}
      {isBlind && (
        <ProjectScaleSelector 
          currentScale={currentScale} 
          onSelect={onScaleChange} 
        />
      )}

      {/* PARTNER TYPE SELECTOR: Visible ONLY in RESULT step */}
      {!isBlind && (
        <PartnerTypeSelector 
          currentType={currentPartnerType} 
          onSelect={onSelectPartnerType} 
        />
      )}

      {/* STEP 2: Result Analysis Graph */}
      {!isBlind && renderAnalysisGraph()}

      {/* Module List */}
      <div className="space-y-6">
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
                              ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30' 
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
        
        {/* Reverse Auction Widget - Visible in all steps except Register */}
        {estimationStep !== 'REGISTER' && <ReverseAuctionWidget totalCost={totalCost} />}
      </div>
    </div>
  );
};
