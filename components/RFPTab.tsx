

import React, { useState, useMemo } from 'react';
import { ModuleItem, PartnerType } from '../types';
import { Icons } from './Icons';
import { calculateSchedule } from '../services/scheduleEngine';

interface RFPTabProps {
  modules: ModuleItem[];
  currentPartnerType: PartnerType;
  onGenerateRFP?: () => void;
}

export const RFPTab: React.FC<RFPTabProps> = ({
  modules,
  currentPartnerType,
  onGenerateRFP
}) => {
  const selectedModules = modules.filter(m => m.isSelected);
  
  const baseDevCost = selectedModules.reduce((acc, m) => 
    acc + m.baseCost + m.subFeatures.filter(s => s.isSelected).reduce((sa, s) => sa + s.price, 0)
  , 0);

  let totalCost = baseDevCost;
  if (currentPartnerType === 'AGENCY') {
    totalCost = baseDevCost * 1.3;
  } else if (currentPartnerType === 'STUDIO') {
    totalCost = baseDevCost * 1.1;
  } else {
    totalCost = baseDevCost * 0.6;
  }

  const scheduleResult = useMemo(() => {
    return calculateSchedule(modules, currentPartnerType);
  }, [modules, currentPartnerType]);

  const partnerLabel = currentPartnerType === 'AI_NATIVE' ? 'TYPE A (AI Native)' : 
                       currentPartnerType === 'STUDIO' ? 'TYPE B (Studio)' : 'TYPE C (Agency)';

  const totalFeatures = selectedModules.reduce((acc, m) => 
    acc + m.subFeatures.filter(s => s.isSelected).length
  , 0);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Icons.File size={20} />
          공고 작성
        </h3>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">선택된 모듈</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedModules.length}개</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">선택된 기능</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalFeatures}개</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">예상 비용 ({partnerLabel})</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{(totalCost / 10000).toLocaleString()}만원</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">예상 기간</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{scheduleResult.totalDuration.toFixed(1)}개월</p>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">포함 모듈 요약</h4>
          <div className="space-y-2">
            {selectedModules.map(module => {
              const selectedSubs = module.subFeatures.filter(s => s.isSelected);
              return (
                <div key={module.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{module.name}</span>
                    {module.required && (
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">필수</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{selectedSubs.length}개 기능</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
          <Icons.Help size={16} />
          공고 생성 안내
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          위 내용을 기반으로 입찰 공고문을 자동 생성합니다. 프로젝트 개요, 과업 범위, 기술 스택, 일정 등이 포함됩니다.
        </p>
        <button
          onClick={onGenerateRFP}
          className="w-full py-4 bg-slate-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all"
        >
          <Icons.File size={18} />
          공고문 생성하기
        </button>
      </div>
    </div>
  );
};
