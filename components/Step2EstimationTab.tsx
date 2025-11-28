import React, { useState } from 'react';
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

  const getTypeEstimate = (type: PartnerType) => {
    const aiEstimate = type === 'AGENCY' ? estimates?.typeA : 
                       type === 'STUDIO' ? estimates?.typeB : estimates?.typeC;
    
    if (aiEstimate && (aiEstimate.minCost > 0 || aiEstimate.maxCost > 0)) {
      return {
        minCost: aiEstimate.minCost,
        maxCost: aiEstimate.maxCost,
        duration: aiEstimate.duration || '미정',
        totalManMonths: aiEstimate.totalManMonths || 0,
        teamSize: aiEstimate.teamSize || 0,
        hasData: true
      };
    }
    
    return {
      minCost: 0,
      maxCost: 0,
      duration: '데이터 준비 중',
      totalManMonths: 0,
      teamSize: 0,
      hasData: false
    };
  };

  const typeAEstimate = getTypeEstimate('AGENCY');
  const typeBEstimate = getTypeEstimate('STUDIO');
  const typeCEstimate = getTypeEstimate('AI_NATIVE');

  const formatCost = (cost: number, hasData: boolean) => {
    if (!hasData) return '-';
    if (cost >= 100000000) {
      return `${(cost / 100000000).toFixed(1)}억`;
    }
    if (cost >= 10000) {
      return `${(cost / 10000).toLocaleString()}만`;
    }
    return `${cost.toLocaleString()}`;
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20 pt-2">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-semibold tracking-wider uppercase rounded">Step 2</span>
        </div>
        <h3 className="text-2xl font-semibold tracking-tight text-neutral-700 dark:text-neutral-200 mb-2">유형별 비교 견적</h3>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">Detailed Estimation — 파트너 유형별 상세 산출 근거</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(['AGENCY', 'STUDIO', 'AI_NATIVE'] as PartnerType[]).map((type) => {
          const config = PARTNER_PRESETS[type];
          const estimate = type === 'AGENCY' ? typeAEstimate : type === 'STUDIO' ? typeBEstimate : typeCEstimate;
          const isSelected = currentPartnerType === type;
          const typeLabel = type === 'AGENCY' ? 'TYPE A' : type === 'STUDIO' ? 'TYPE B' : 'TYPE C';

          return (
            <button
              key={type}
              onClick={() => onSelectPartnerType(type)}
              className={`text-left p-8 rounded-lg border transition-all duration-200 ${
                isSelected 
                  ? 'border-neutral-600 dark:border-neutral-300 bg-white dark:bg-neutral-900' 
                  : 'border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-200 dark:hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 tracking-wider">
                  {typeLabel}
                </span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-neutral-600 dark:bg-neutral-300 flex items-center justify-center">
                    <Icons.CheckMark size={12} className="text-neutral-200 dark:text-neutral-700" />
                  </div>
                )}
              </div>
              
              <h4 className="font-medium text-neutral-700 dark:text-neutral-200 mb-1">{config.title}</h4>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-6 line-clamp-2">{config.description}</p>
              
              <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-400 uppercase tracking-wider">예상 견적</span>
                  <span className="font-medium text-neutral-700 dark:text-neutral-200">
                    {estimate.hasData 
                      ? `${formatCost(estimate.minCost, true)} ~ ${formatCost(estimate.maxCost, true)}원`
                      : '데이터 준비 중'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-400 uppercase tracking-wider">총 공수</span>
                  <span className="font-medium text-neutral-500 dark:text-neutral-400">
                    {estimate.hasData ? `${estimate.totalManMonths} M/M` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-400 uppercase tracking-wider">프로젝트 기간</span>
                  <span className="font-medium text-neutral-600 dark:text-neutral-300">{estimate.duration}</span>
                </div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 text-right pt-2">
                  {estimate.hasData ? `${estimate.teamSize}명 병렬 투입 기준` : '-'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {estimates && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-8">
          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-6 flex items-center gap-2 uppercase tracking-wider">
            <Icons.BarChart size={16} className="text-neutral-400" />
            Cost Comparison
          </h4>
          <div className="space-y-5">
            {[
              { label: 'TYPE A — 에이전시', estimate: typeAEstimate, opacity: 'bg-neutral-600 dark:bg-neutral-300' },
              { label: 'TYPE B — 스튜디오', estimate: typeBEstimate, opacity: 'bg-neutral-400 dark:bg-neutral-500' },
              { label: 'TYPE C — AI 네이티브', estimate: typeCEstimate, opacity: 'bg-neutral-300 dark:bg-neutral-600' }
            ].map(({ label, estimate, opacity }) => {
              const maxCostAll = Math.max(typeAEstimate.maxCost, typeBEstimate.maxCost, typeCEstimate.maxCost);
              const widthPercent = maxCostAll > 0 ? (estimate.maxCost / maxCostAll) * 100 : 0;
              return (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-200">
                      {estimate.hasData 
                        ? `${formatCost(estimate.minCost, true)} ~ ${formatCost(estimate.maxCost, true)}원`
                        : '데이터 준비 중'}
                    </span>
                  </div>
                  <div className="h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${opacity} rounded-full transition-all duration-500`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2 flex items-center gap-2 uppercase tracking-wider">
          <Icons.Settings size={16} className="text-neutral-400" />
          Module Breakdown
        </h4>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-6">모듈별 상세 비용 내역</p>
        
        <div className="space-y-3">
          {modules.map(module => {
            const isExpanded = expandedIds.includes(module.id);
            const moduleCost = module.baseCost + module.subFeatures.filter(s => s.isSelected).reduce((acc, s) => acc + s.price, 0);
            
            return (
              <div 
                key={module.id}
                className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                  module.isSelected 
                    ? 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900' 
                    : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 opacity-50'
                }`}
              >
                <div 
                  className="p-5 flex items-center gap-4 cursor-pointer"
                  onClick={() => toggleExpand(module.id)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleModule(module.id); }}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
                      module.isSelected 
                        ? 'bg-neutral-600 dark:bg-neutral-300 border-neutral-600 dark:border-neutral-300 text-neutral-200 dark:text-neutral-700' 
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {module.isSelected && <Icons.CheckMark size={10} />}
                  </button>
                  
                  <div className="flex-1">
                    <span className="font-medium text-neutral-700 dark:text-neutral-200">{module.name}</span>
                    {module.required && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded uppercase tracking-wider">Required</span>
                    )}
                  </div>
                  
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    {(moduleCost / 10000).toLocaleString()}만원
                  </span>
                  
                  <Icons.ChevronDown 
                    size={16} 
                    className={`text-neutral-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
                
                {isExpanded && module.isSelected && (
                  <div className="px-5 pb-5 space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                    <div className="flex items-center justify-between text-sm py-2 px-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-md">
                      <span className="text-neutral-400 dark:text-neutral-500">기본 구축비 (Core Framework)</span>
                      <span className="font-medium text-neutral-600 dark:text-neutral-300">{(module.baseCost / 10000).toLocaleString()}만원</span>
                    </div>
                    
                    {module.subFeatures.map(feature => (
                      <div 
                        key={feature.id}
                        className="flex items-center justify-between text-sm py-2 px-4"
                      >
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={feature.isSelected}
                            onChange={() => onToggleSubFeature(module.id, feature.id)}
                            className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 focus:ring-neutral-500 bg-white dark:bg-neutral-800"
                          />
                          <span className={feature.isSelected ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-500'}>
                            {feature.name}
                          </span>
                        </label>
                        <span className={`font-medium ${feature.isSelected ? 'text-neutral-600 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-500'}`}>
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
