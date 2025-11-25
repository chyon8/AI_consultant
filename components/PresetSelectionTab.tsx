
import React from 'react';
import { Icons } from './Icons';
import { PARTNER_PRESETS } from '../constants';
import { PartnerType } from '../types';

interface PresetSelectionTabProps {
  onSelect: (type: PartnerType) => void;
  currentPartnerType: PartnerType;
}

export const PresetSelectionTab: React.FC<PresetSelectionTabProps> = ({ onSelect, currentPartnerType }) => {
  return (
    <div className="space-y-8 animate-fade-in pb-20 pt-4">
      <div className="mb-6">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">파트너 유형 선택</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">같은 기능이라도 수행 파트너에 따라 견적과 기간이 달라집니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(['AGENCY', 'STUDIO', 'AI_NATIVE'] as PartnerType[]).map((type, index) => {
          const config = PARTNER_PRESETS[type];
          const isSelected = currentPartnerType === type;

          return (
            <div 
              key={type}
              className={`relative bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 transition-all duration-300 flex flex-col opacity-0 animate-slide-up ${
                isSelected 
                  ? 'border-indigo-500 shadow-xl ring-4 ring-indigo-500/10 dark:ring-indigo-900/30' 
                  : 'border-slate-100 dark:border-slate-800 shadow-soft hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-1'
              }`}
              style={{ 
                animationDelay: `${index * 200}ms`,
                animationFillMode: 'forwards'
              }}
            >
              <div className="mb-6 mt-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border shadow-sm ${
                  type === 'AGENCY' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400' :
                  type === 'STUDIO' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400' :
                  'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {type === 'AGENCY' ? <Icons.Briefcase size={28} /> :
                   type === 'STUDIO' ? <Icons.Handshake size={28} /> :
                   <Icons.Sparkles size={28} />}
                </div>
                
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white">{config.title}</h3>
                   {type === 'AI_NATIVE' && (
                     <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-full border border-indigo-200 dark:border-indigo-700">
                        BEST VALUE
                     </span>
                   )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{config.description}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">견적 계수</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">x{config.costMultiplier}</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">기간 계수</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">x{config.durationMultiplier}</p>
                 </div>
              </div>

              {/* Team Info */}
              <div className="flex items-center gap-2 mb-6 text-sm text-slate-700 dark:text-slate-300">
                 <Icons.Users size={16} className="text-slate-400" />
                 <span className="font-medium">{config.teamInfo}</span>
              </div>

              {/* Pros */}
              <div className="flex-1 space-y-2 mb-8">
                {config.pros.map((pro, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Icons.CheckMark size={14} className="text-emerald-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{pro}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onSelect(type)}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                  isSelected 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 hover:bg-indigo-700' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {isSelected ? '현재 선택됨' : '이 파트너 선택'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
