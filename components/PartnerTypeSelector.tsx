
import React from 'react';
import { PartnerType } from '../types';
import { PARTNER_PRESETS } from '../constants';

interface PartnerTypeSelectorProps {
  currentType: PartnerType;
  onSelect: (type: PartnerType) => void;
}

export const PartnerTypeSelector: React.FC<PartnerTypeSelectorProps> = ({ currentType, onSelect }) => {
  const typeLabels: Record<PartnerType, { label: string; subtitle: string }> = {
    AI_NATIVE: { label: 'TYPE A', subtitle: 'AI 네이티브' },
    STUDIO: { label: 'TYPE B', subtitle: '스튜디오' },
    AGENCY: { label: 'TYPE C', subtitle: '전문 개발사' }
  };

  const descriptions: Record<PartnerType, string> = {
    AI_NATIVE: 'AI 도구와 자동화로 비용 60% 절감, 개발 속도 2배',
    STUDIO: '합리적인 비용과 빠른 커뮤니케이션의 균형',
    AGENCY: '체계적 프로세스와 하자보수 보장, 리스크 최소화'
  };

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['AI_NATIVE', 'STUDIO', 'AGENCY'] as PartnerType[]).map((type) => {
          const isSelected = currentType === type;
          const config = PARTNER_PRESETS[type];
          const { label, subtitle } = typeLabels[type];
          
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`group relative p-5 text-left transition-all duration-200 border rounded-xl ${
                isSelected
                  ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-medium tracking-wide px-2 py-1 rounded-md ${
                  isSelected 
                    ? 'bg-slate-700 dark:bg-slate-200 text-slate-300 dark:text-slate-600' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {label}
                </span>
                <span className={`text-[11px] font-mono ${
                  isSelected ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  ×{config.costMultiplier}  {config.durationMultiplier}mo
                </span>
              </div>

              <h3 className={`text-base font-bold mb-2 ${
                isSelected ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'
              }`}>
                {subtitle}
              </h3>

              <p className={`text-xs leading-relaxed ${
                isSelected ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {descriptions[type]}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
