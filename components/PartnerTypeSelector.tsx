
import React from 'react';
import { PartnerType } from '../types';
import { PARTNER_PRESETS } from '../constants';

interface PartnerTypeSelectorProps {
  currentType: PartnerType;
  onSelect: (type: PartnerType) => void;
}

export const PartnerTypeSelector: React.FC<PartnerTypeSelectorProps> = ({ currentType, onSelect }) => {
  const typeLabels: Record<PartnerType, { label: string; subtitle: string }> = {
    AI_NATIVE: { label: 'Type A', subtitle: 'AI 네이티브' },
    STUDIO: { label: 'Type B', subtitle: '스튜디오' },
    AGENCY: { label: 'Type C', subtitle: '전문 개발사' }
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
              <div className="flex items-baseline justify-between mb-3">
                <span className={`text-[10px] font-medium tracking-[0.2em] uppercase ${
                  isSelected ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {label}
                </span>
                <div className="flex gap-2">
                  <span className={`text-[10px] font-mono ${
                    isSelected ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    ×{config.costMultiplier}
                  </span>
                  <span className={`text-[10px] font-mono ${
                    isSelected ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {config.durationMultiplier}mo
                  </span>
                </div>
              </div>

              <h3 className={`text-base font-semibold mb-2 ${
                isSelected ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'
              }`}>
                {subtitle}
              </h3>

              <p className={`text-xs leading-relaxed ${
                isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {descriptions[type]}
              </p>

              {isSelected && (
                <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
