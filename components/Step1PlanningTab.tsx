import React from 'react';
import { ModuleItem } from '../types';
import { Icons } from './Icons';

interface Step1PlanningTabProps {
  modules: ModuleItem[];
  projectTitle?: string;
}

export const Step1PlanningTab: React.FC<Step1PlanningTabProps> = ({ 
  modules,
  projectTitle = '프로젝트'
}) => {
  const selectedModules = modules.filter(m => m.isSelected);
  
  const categoryGroups = selectedModules.reduce((acc, module) => {
    const cat = module.category || 'etc';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(module);
    return acc;
  }, {} as Record<string, ModuleItem[]>);

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      frontend: '프론트엔드',
      backend: '백엔드',
      database: '데이터베이스',
      infra: '인프라',
      etc: '기타'
    };
    return labels[cat] || cat;
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'frontend': return <Icons.Monitor size={18} />;
      case 'backend': return <Icons.Server size={18} />;
      case 'database': return <Icons.Database size={18} />;
      case 'infra': return <Icons.Cloud size={18} />;
      default: return <Icons.Settings size={18} />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 pt-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded">STEP 1</span>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">프로젝트 상세 기획</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Project Planning - 기술적 분석 및 모듈 구조</p>
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Icons.Target size={20} className="text-indigo-500" />
          프로젝트 개요
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">총 모듈 수</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedModules.length}개</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">총 기능 수</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {selectedModules.reduce((acc, m) => acc + m.subFeatures.filter(f => f.isSelected).length, 0)}개
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">카테고리</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{Object.keys(categoryGroups).length}개</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Icons.Layers size={20} className="text-indigo-500" />
          기능 명세 (Functional Specifications)
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">핵심 모듈 &gt; 세부 기능 계층 구조</p>
        
        <div className="space-y-4">
          {Object.entries(categoryGroups).map(([category, catModules]) => (
            <div key={category} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  {getCategoryIcon(category)}
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{getCategoryLabel(category)}</span>
                <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{catModules.length}개 모듈</span>
              </div>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {catModules.map(module => (
                  <div key={module.id} className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icons.CheckMark size={14} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white">[{module.name}]</h5>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{module.description}</p>
                      </div>
                    </div>
                    
                    {module.subFeatures.filter(f => f.isSelected).length > 0 && (
                      <div className="ml-9 flex flex-wrap gap-2">
                        {module.subFeatures.filter(f => f.isSelected).map(feature => (
                          <span 
                            key={feature.id}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-lg"
                          >
                            {feature.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedModules.length === 0 && (
        <div className="text-center py-12">
          <Icons.Layers size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">선택된 모듈이 없습니다</p>
        </div>
      )}
    </div>
  );
};
