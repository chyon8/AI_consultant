
import React from 'react';
import { Icons } from './Icons';
import { PRESET_DETAILS } from '../constants';
import { PresetType } from '../types';

interface PresetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: PresetType) => void;
  currentPreset: PresetType | null;
}

export const PresetSelectionModal: React.FC<PresetSelectionModalProps> = ({ isOpen, onClose, onSelect, currentPreset }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">프리셋 선택</h2>
            <p className="text-sm text-slate-500 mt-1">프로젝트 규모와 예산에 맞는 최적의 구성을 선택하세요</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <Icons.Minus size={24} className="rotate-45" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['MVP', 'STANDARD', 'ENTERPRISE'] as PresetType[]).map((type) => {
              const details = PRESET_DETAILS[type];
              const isSelected = currentPreset === type;
              const isRecommended = type === 'STANDARD';

              return (
                <div 
                  key={type}
                  className={`relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 flex flex-col ${
                    isSelected 
                      ? 'border-indigo-500 shadow-xl ring-4 ring-indigo-500/10' 
                      : 'border-transparent shadow-soft hover:border-slate-200 hover:-translate-y-1'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-indigo-200">
                      추천
                    </div>
                  )}

                  <div className="mb-6 text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 ${
                      type === 'MVP' ? 'bg-blue-50 text-blue-500' :
                      type === 'STANDARD' ? 'bg-purple-50 text-purple-500' :
                      'bg-orange-50 text-orange-500'
                    }`}>
                      {type === 'MVP' ? <Icons.Zap size={24} /> :
                       type === 'STANDARD' ? <Icons.Target size={24} /> :
                       <Icons.TrendingUp size={24} />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{details.title}</h3>
                    <p className="text-xs text-slate-400">{details.description}</p>
                  </div>

                  <div className="mb-6 text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-400">예상 비용</p>
                    <p className="text-2xl font-bold text-indigo-600">₩{(details.cost / 10000).toLocaleString()}만원</p>
                    <div className="flex justify-center items-center gap-1 text-sm font-medium text-slate-600 mt-2">
                       <Icons.Clock size={14} className="text-slate-400" />
                       {details.duration}
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 mb-8">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">포함 기능</p>
                    {details.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-green-50 text-green-500'
                        }`}>
                          <Icons.CheckMark size={10} strokeWidth={3} />
                        </div>
                        <span className="text-sm text-slate-600 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      onSelect(type);
                      onClose();
                    }}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '선택됨' : '이 구성 선택'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
