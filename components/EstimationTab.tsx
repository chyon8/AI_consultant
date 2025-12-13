

import React, { useState } from 'react';
import { ModuleItem, PartnerType, EstimationStep, ProjectScale, ParsedEstimates } from '../types';
import { Icons } from './Icons';
import { PartnerTypeSelector } from './PartnerTypeSelector';

interface ProjectOverview {
  projectTitle: string;
  businessGoals: string;
  coreValues: string[];
  techStack: { layer: string; items: string[] }[];
}

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
  projectOverview?: ProjectOverview | null;
  isLoading?: boolean;
  estimates?: ParsedEstimates;
}

export const EstimationTab: React.FC<EstimationTabProps> = ({ 
  modules, 
  onToggleModule, 
  onToggleSubFeature, 
  currentPartnerType,
  onSelectPartnerType,
  estimationStep,
  currentScale,
  onScaleChange,
  projectOverview,
  isLoading = false,
  estimates
}) => {
  const [expandedIds, setExpandedIds] = useState<string[]>(modules.map(m => m.id));
  
  // Debug: Log modules and subfeature prices
  console.log('[EstimationTab] modules prop received:', modules.map(m => ({
    name: m.name,
    subFeatures: m.subFeatures.map(sf => ({ name: sf.name, price: sf.price, manWeeks: sf.manWeeks }))
  })));

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) 
        ? prev.filter(expandedId => expandedId !== id) 
        : [...prev, id]
    );
  };

  const getCurrentEstimate = () => {
    if (!estimates) return null;
    if (currentPartnerType === 'AGENCY') return estimates.typeA;
    if (currentPartnerType === 'STUDIO') return estimates.typeB;
    return estimates.typeC;
  };

  const currentEstimate = getCurrentEstimate();

  // --- UI Renders ---

  // Skeleton component for loading state
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />
  );

  // Render project overview section
  const renderProjectOverview = () => {
    const hasData = projectOverview && (projectOverview.projectTitle || projectOverview.businessGoals || projectOverview.techStack.length > 0);
    
    if (isLoading || !hasData) {
      // Skeleton UI
      return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="w-32 h-5" />
            </div>
            <div className="space-y-3">
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-2/3 h-4" />
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Skeleton className="w-24 h-4 mb-3" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="w-16 h-6 rounded-lg" />
                <Skeleton className="w-20 h-6 rounded-lg" />
                <Skeleton className="w-14 h-6 rounded-lg" />
                <Skeleton className="w-18 h-6 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Actual data display
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-800">
        {/* Project Title & Goals */}
        {(projectOverview.projectTitle || projectOverview.businessGoals) && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Icons.Dashboard size={18} className="text-slate-400" />
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                프로젝트 개요
              </h4>
            </div>
            {projectOverview.projectTitle && (
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {projectOverview.projectTitle}
              </h3>
            )}
            {projectOverview.businessGoals && (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="font-medium text-slate-700 dark:text-slate-200">목표:</span> {projectOverview.businessGoals}
              </p>
            )}
            {projectOverview.coreValues.length > 0 && (
              <div className="mt-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">핵심 가치</span>
                <div className="flex flex-wrap gap-2">
                  {projectOverview.coreValues.map((value, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tech Stack */}
        {projectOverview.techStack.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Icons.Zap size={16} className="text-slate-400" />
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                기술 스택 제안
              </h4>
            </div>
            <div className="space-y-3">
              {projectOverview.techStack.map((layer, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 w-20 pt-1 shrink-0">
                    {layer.layer}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {layer.items.map((item, iIdx) => (
                      <span 
                        key={iIdx}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-md"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnalysisGraph = () => {
    const partnerLabel = currentPartnerType === 'AI_NATIVE' ? 'TYPE C (AI 네이티브)' : 
                         currentPartnerType === 'STUDIO' ? 'TYPE B (스튜디오)' : 'TYPE A (에이전시)';
    
    if (!currentEstimate) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 mb-8 border border-slate-200 dark:border-slate-800">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      );
    }

    const minCost = currentEstimate.minCost;
    const maxCost = currentEstimate.maxCost;
    const duration = currentEstimate.duration;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 mb-8 border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <p className="text-[10px] font-medium tracking-[0.15em] text-slate-400 uppercase mb-2">{partnerLabel}</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              {(minCost / 10000).toLocaleString()} ~ {(maxCost / 10000).toLocaleString()}
              <span className="text-base font-normal text-slate-400 ml-1">만원</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium tracking-[0.15em] text-slate-400 uppercase mb-2">예상 기간</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              {duration || '-'}
            </p>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {currentEstimate.description}
          </p>
        </div>
      </div>
    );
  };

  const isBlind = estimationStep === 'SCOPE';

  // Render module list for detail tab (with dropdown like SCOPE step)
  const renderModuleList = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Icons.Briefcase size={20} />
        선택된 기능 명세
      </h3>
      {modules.filter(m => m.isSelected && m.subFeatures.some(s => s.isSelected)).map((module) => {
        const isExpanded = expandedIds.includes(module.id);
        const selectedSubs = module.subFeatures.filter(s => s.isSelected);
        
        return (
          <div 
            key={module.id} 
            className="group border rounded-xl shadow-sm transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
          >
            {/* Header Row */}
            <div 
              className="p-6 flex items-start gap-4 cursor-pointer select-none" 
              onClick={() => toggleExpand(module.id)}
            >
              <div className="flex-1">
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
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  {selectedSubs.length}개 기능
                </span>
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
                <div className="grid gap-1">
                  {selectedSubs.map((sub) => (
                    <div 
                      key={sub.id} 
                      className="flex items-center justify-between py-2.5 px-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {sub.name}
                        </span>
                      </div>
                      {/* Right Side: Price & Duration */}
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {sub.price > 0 ? `${(sub.price / 10000).toLocaleString()}만원` : '-'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {sub.manWeeks > 0 ? `${sub.manWeeks}주` : ''}
                        </span>
                      </div>
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

  // Render detail content (견적/예산)
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
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentEstimate 
                    ? `${(currentEstimate.minCost/10000).toLocaleString()} ~ ${(currentEstimate.maxCost/10000).toLocaleString()}만원`
                    : '-'}
                </span>
             </div>
             <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">예상 기간</span>
                <span className="font-bold text-slate-900 dark:text-white">{currentEstimate?.duration || '-'}</span>
             </div>
          </div>
       </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* RESULT step: 상세 견적 content */}
      {!isBlind && renderDetailTab()}

      {/* SCOPE step: Project Overview + Module List */}
      {isBlind && <div className="space-y-6">
        {/* Project Overview Section */}
        {renderProjectOverview()}
        
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
                      ? 'bg-slate-800 dark:bg-slate-200 border-slate-800 dark:border-slate-200 text-white dark:text-slate-900' 
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                  } ${(!isBlind || module.required) ? 'cursor-not-allowed opacity-70' : 'hover:border-slate-500'}`}
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
                   <span className={`text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400`}>
                      {module.category}
                   </span>
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
                          } ${isBlind && !module.required ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : ''}`}
                          onClick={(e) => {
                             if (!isBlind) return; // Read-only
                             e.stopPropagation();
                             if(module.required) return; // 필수 모듈의 하위 기능은 변경 불가
                             onToggleSubFeature(module.id, sub.id);
                          }}
                        >
                           <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                sub.isSelected 
                                  ? 'bg-slate-700 dark:bg-slate-300 border-slate-700 dark:border-slate-300 text-white dark:text-slate-900' 
                                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                              } ${(!isBlind || module.required) ? 'opacity-50' : ''}`}>
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
                           
                           {/* Right Side: Price & Duration */}
                           <div className="flex items-center gap-4">
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {sub.price > 0 ? `${(sub.price / 10000).toLocaleString()}만원` : '-'}
                              </span>
                              <span className="text-xs text-slate-400">
                                {sub.manWeeks > 0 ? `${sub.manWeeks}주` : ''}
                              </span>
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
