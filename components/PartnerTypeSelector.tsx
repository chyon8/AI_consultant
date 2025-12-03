
import React from 'react';
import { Icons } from './Icons';
import { PartnerType } from '../types';
import { PARTNER_PRESETS } from '../constants';

interface PartnerTypeSelectorProps {
  currentType: PartnerType;
  onSelect: (type: PartnerType) => void;
}

export const PartnerTypeSelector: React.FC<PartnerTypeSelectorProps> = ({ currentType, onSelect }) => {
  const explanation = {
    AGENCY: {
      reason: "전담 PM, PL, QA 팀이 투입되어 인건비와 관리 비용이 높습니다.",
      detail: "체계적인 문서화와 하자보수 기간을 보장하므로 리스크 비용이 포함됩니다."
    },
    STUDIO: {
      reason: "핵심 개발자와 기획자가 겸업하여 불필요한 커뮤니케이션 비용을 줄였습니다.",
      detail: "가장 합리적인 표준 단가로, 실속있는 개발이 가능합니다."
    },
    AI_NATIVE: {
      reason: "AI 코딩 도구와 자동화를 통해 단순 반복 작업을 제거하여 공수를 획기적으로 줄였습니다.",
      detail: "전통적인 개발 방식 대비 2배 이상의 생산성을 냅니다."
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 mb-8 transition-all animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Icons.Users size={16} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">파트너 유형 변경 (시뮬레이션)</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500">누구와 일하느냐에 따라 견적이 달라집니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(['AI_NATIVE', 'STUDIO', 'AGENCY'] as PartnerType[]).map((type) => {
          const isSelected = currentType === type;
          const config = PARTNER_PRESETS[type];
          
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 flex flex-col gap-2 ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-indigo-500">
                  <Icons.CheckMark size={16} strokeWidth={3} />
                </div>
              )}
              <div className="flex items-center gap-2">
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    type === 'AGENCY' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' :
                    type === 'STUDIO' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' :
                    'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                 }`}>
                    {type === 'AGENCY' ? <Icons.Briefcase size={16} /> : 
                     type === 'STUDIO' ? <Icons.Handshake size={16} /> : 
                     <Icons.Sparkles size={16} />}
                 </div>
                 <span className={`font-bold text-sm ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    {config.title}
                 </span>
              </div>
              
              <div className="flex gap-2 mt-1">
                 <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isSelected ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
                    비용 x{config.costMultiplier}
                 </span>
                 <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isSelected ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
                    기간 x{config.durationMultiplier}
                 </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation Box */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg p-4 flex items-start gap-3">
         <div className="mt-0.5 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Icons.Help size={18} />
         </div>
         <div>
            <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-1">
               왜 가격 차이가 나나요?
            </p>
            <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">
               <span className="font-semibold text-indigo-700 dark:text-indigo-200">{PARTNER_PRESETS[currentType].title}: </span>
               {explanation[currentType].reason}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
               💡 {explanation[currentType].detail}
            </p>
         </div>
      </div>
    </div>
  );
};
