
import React from 'react';
import { Icons } from './Icons';
import { ProjectScale } from '../types';

interface ProjectScaleSelectorProps {
  currentScale: ProjectScale;
  onSelect: (scale: ProjectScale) => void;
}

export const ProjectScaleSelector: React.FC<ProjectScaleSelectorProps> = ({ currentScale, onSelect }) => {
  const scales: { id: ProjectScale; title: string; desc: string; icon: React.ReactNode }[] = [
    { 
      id: 'MVP', 
      title: 'MVP (최소 기능)', 
      desc: '핵심 가치 검증용', 
      icon: <Icons.Zap size={20} /> 
    },
    { 
      id: 'STANDARD', 
      title: 'Standard (표준)', 
      desc: '안정적 서비스 운영', 
      icon: <Icons.Target size={20} /> 
    },
    { 
      id: 'HIGH_END', 
      title: 'High-End (기업형)', 
      desc: '대규모/고성능', 
      icon: <Icons.TrendingUp size={20} /> 
    }
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 mb-8 transition-all">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Icons.Briefcase size={16} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">프로젝트 규모 설정</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500">예산 대신 원하는 프로젝트의 규모를 선택하세요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scales.map((scale) => {
          const isSelected = currentScale === scale.id;
          return (
            <button
              key={scale.id}
              onClick={() => onSelect(scale.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 text-indigo-500">
                  <Icons.CheckMark size={16} strokeWidth={3} />
                </div>
              )}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                isSelected 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                  : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
              }`}>
                {scale.icon}
              </div>
              <h5 className={`font-bold text-sm mb-1 ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                {scale.title}
              </h5>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {scale.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
