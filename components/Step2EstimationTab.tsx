import React, { useState, useMemo } from 'react';
import { ModuleItem, PartnerType, ProjectScale, ProjectEstimates } from '../types';
import { Icons } from './Icons';
import { PARTNER_PRESETS } from '../constants';

interface Step2EstimationTabProps {
  modules: ModuleItem[];
  onToggleModule: (moduleId: string) => void;
  onToggleSubFeature: (moduleId: string, subFeatureId: string) => void;
  currentPartnerType: PartnerType;
  onSelectPartnerType: (type: PartnerType) => void;
  currentScale: ProjectScale;
  onScaleChange: (scale: ProjectScale) => void;
  estimates?: ProjectEstimates;
}

const DEFAULT_TEAM_SIZE: Record<PartnerType, number> = {
  AGENCY: 7,
  STUDIO: 5,
  AI_NATIVE: 3
};

export const Step2EstimationTab: React.FC<Step2EstimationTabProps> = ({ 
  modules, 
  onToggleModule, 
  onToggleSubFeature, 
  currentPartnerType,
  onSelectPartnerType,
  currentScale,
  onScaleChange,
  estimates
}) => {
  const [expandedIds, setExpandedIds] = useState<string[]>(modules.map(m => m.id));

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) 
        ? prev.filter(expandedId => expandedId !== id) 
        : [...prev, id]
    );
  };

  const totalManMonths = useMemo(() => {
    return modules.filter(m => m.isSelected).reduce((sum, m) => {
      return sum + m.baseManMonths + m.subFeatures.filter(s => s.isSelected).reduce((sa, s) => sa + (s.manWeeks / 4), 0);
    }, 0);
  }, [modules]);

  const totalPossibleManMonths = useMemo(() => {
    return modules.reduce((sum, m) => {
      return sum + m.baseManMonths + m.subFeatures.reduce((sa, s) => sa + (s.manWeeks / 4), 0);
    }, 0);
  }, [modules]);

  const selectionRatio = totalPossibleManMonths > 0 ? totalManMonths / totalPossibleManMonths : 1;

  const baseDevCost = modules.filter(m => m.isSelected).reduce((acc, m) => 
    acc + m.baseCost + m.subFeatures.filter(s => s.isSelected).reduce((sa, s) => sa + s.price, 0)
  , 0);

  const getTypeEstimate = (type: PartnerType) => {
    const aiEstimate = type === 'AGENCY' ? estimates?.typeA : 
                       type === 'STUDIO' ? estimates?.typeB : estimates?.typeC;
    
    if (aiEstimate) {
      const teamSize = aiEstimate.teamSize || DEFAULT_TEAM_SIZE[type];
      const aiTotalMM = aiEstimate.totalManMonths || totalManMonths;
      
      const adjustedMM = aiTotalMM * selectionRatio;
      const parallelDuration = Math.ceil(adjustedMM / teamSize);
      
      const costRatio = selectionRatio;
      const adjustedMinCost = Math.round(aiEstimate.minCost * costRatio);
      const adjustedMaxCost = Math.round(aiEstimate.maxCost * costRatio);
      
      return {
        minCost: adjustedMinCost,
        maxCost: adjustedMaxCost,
        duration: `${parallelDuration}개월`,
        totalManMonths: Math.round(adjustedMM * 10) / 10,
        teamSize: teamSize
      };
    }
    
    const teamSize = DEFAULT_TEAM_SIZE[type];
    let costMultiplier = type === 'AGENCY' ? 1.3 : type === 'STUDIO' ? 1.1 : 0.6;
    
    const cost = baseDevCost * costMultiplier;
    const parallelDuration = Math.ceil(totalManMonths / teamSize);
    
    return {
      minCost: Math.round(cost * 0.9),
      maxCost: Math.round(cost * 1.1),
      duration: `${Math.max(1, parallelDuration)}개월`,
      totalManMonths: Math.round(totalManMonths * 10) / 10,
      teamSize: teamSize
    };
  };

  const typeAEstimate = getTypeEstimate('AGENCY');
  const typeBEstimate = getTypeEstimate('STUDIO');
  const typeCEstimate = getTypeEstimate('AI_NATIVE');

  const formatCost = (cost: number) => {
    if (cost >= 100000000) {
      return `${(cost / 100000000).toFixed(1)}억`;
    }
    return `${(cost / 10000).toLocaleString()}만`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 pt-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded">STEP 2</span>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">유형별 비교 견적</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Detailed Estimation - 파트너 유형별 상세 산출 근거</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(['AGENCY', 'STUDIO', 'AI_NATIVE'] as PartnerType[]).map((type) => {
          const config = PARTNER_PRESETS[type];
          const estimate = type === 'AGENCY' ? typeAEstimate : type === 'STUDIO' ? typeBEstimate : typeCEstimate;
          const isSelected = currentPartnerType === type;
          const typeLabel = type === 'AGENCY' ? 'TYPE A' : type === 'STUDIO' ? 'TYPE B' : 'TYPE C';

          return (
            <button
              key={type}
              onClick={() => onSelectPartnerType(type)}
              className={`text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
                isSelected 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg ring-4 ring-indigo-500/10' 
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  type === 'AGENCY' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                  type === 'STUDIO' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                }`}>
                  {typeLabel}
                </span>
                {isSelected && (
                  <Icons.CheckMark size={18} className="text-indigo-500" />
                )}
              </div>
              
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">{config.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{config.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">예상 견적</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCost(estimate.minCost)} ~ {formatCost(estimate.maxCost)}원
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">총 공수</span>
                  <span className="font-medium text-slate-500 dark:text-slate-400">{estimate.totalManMonths} M/M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">프로젝트 기간</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{estimate.duration}</span>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right">
                  {estimate.teamSize}명 병렬 투입 기준
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Icons.Settings size={20} className="text-indigo-500" />
          모듈별 상세 비용
        </h4>
        
        <div className="space-y-3">
          {modules.map(module => {
            const isExpanded = expandedIds.includes(module.id);
            const moduleCost = module.baseCost + module.subFeatures.filter(s => s.isSelected).reduce((acc, s) => acc + s.price, 0);
            
            return (
              <div 
                key={module.id}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  module.isSelected 
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900' 
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60'
                }`}
              >
                <div 
                  className="p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => toggleExpand(module.id)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleModule(module.id); }}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                      module.isSelected 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    {module.isSelected && <Icons.CheckMark size={12} />}
                  </button>
                  
                  <div className="flex-1">
                    <span className="font-medium text-slate-900 dark:text-white">{module.name}</span>
                    {module.required && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">필수</span>
                    )}
                  </div>
                  
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {(moduleCost / 10000).toLocaleString()}만원
                  </span>
                  
                  <Icons.ChevronDown 
                    size={18} 
                    className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
                
                {isExpanded && module.isSelected && (
                  <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center justify-between text-sm py-1 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-500 dark:text-slate-400">기본 구축비 (Core Framework)</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{(module.baseCost / 10000).toLocaleString()}만원</span>
                    </div>
                    
                    {module.subFeatures.map(feature => (
                      <div 
                        key={feature.id}
                        className="flex items-center justify-between text-sm py-1 px-3"
                      >
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={feature.isSelected}
                            onChange={() => onToggleSubFeature(module.id, feature.id)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-500 focus:ring-indigo-500"
                          />
                          <span className={feature.isSelected ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>
                            {feature.name}
                          </span>
                        </label>
                        <span className={`font-medium ${feature.isSelected ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                          +{(feature.price / 10000).toLocaleString()}만원
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
