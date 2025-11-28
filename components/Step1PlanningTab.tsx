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
      case 'frontend': return <Icons.Monitor size={16} />;
      case 'backend': return <Icons.Server size={16} />;
      case 'database': return <Icons.Database size={16} />;
      case 'infra': return <Icons.Cloud size={16} />;
      default: return <Icons.Settings size={16} />;
    }
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20 pt-2">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-semibold tracking-wider uppercase rounded">Step 1</span>
        </div>
        <h3 className="text-2xl font-semibold tracking-tight text-neutral-700 dark:text-neutral-200 mb-2">프로젝트 상세 기획</h3>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">Project Planning — 기술적 분석 및 모듈 구조</p>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-8 border border-neutral-100 dark:border-neutral-800">
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-6 flex items-center gap-2 uppercase tracking-wider">
          <Icons.Target size={16} className="text-neutral-400" />
          Overview
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-neutral-100 dark:border-neutral-800">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium mb-2">Total Modules</p>
            <p className="text-3xl font-light text-neutral-700 dark:text-neutral-200">{selectedModules.length}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-neutral-100 dark:border-neutral-800">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium mb-2">Total Features</p>
            <p className="text-3xl font-light text-neutral-700 dark:text-neutral-200">
              {selectedModules.reduce((acc, m) => acc + m.subFeatures.filter(f => f.isSelected).length, 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-neutral-100 dark:border-neutral-800">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium mb-2">Categories</p>
            <p className="text-3xl font-light text-neutral-700 dark:text-neutral-200">{Object.keys(categoryGroups).length}</p>
          </div>
        </div>
      </div>

      {Object.keys(categoryGroups).length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-8">
          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-6 flex items-center gap-2 uppercase tracking-wider">
            <Icons.BarChart size={16} className="text-neutral-400" />
            Distribution
          </h4>
          <div className="space-y-5">
            {Object.entries(categoryGroups).map(([cat, mods], index) => {
              const totalModules = selectedModules.length;
              const percent = totalModules > 0 ? (mods.length / totalModules) * 100 : 0;
              const opacities = ['bg-neutral-600', 'bg-neutral-500', 'bg-neutral-400', 'bg-neutral-300', 'bg-neutral-200'];
              return (
                <div key={cat} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                      {getCategoryIcon(cat)}
                      {getCategoryLabel(cat)}
                    </span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-200">{mods.length} ({Math.round(percent)}%)</span>
                  </div>
                  <div className="h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${opacities[index % opacities.length]} dark:bg-neutral-300 rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
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
          <Icons.Layers size={16} className="text-neutral-400" />
          Specifications
        </h4>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-8">핵심 모듈 및 세부 기능 계층 구조</p>
        
        <div className="space-y-4">
          {Object.entries(categoryGroups).map(([category, catModules]) => (
            <div key={category} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 overflow-hidden">
              <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                  {getCategoryIcon(category)}
                </div>
                <span className="font-medium text-neutral-700 dark:text-neutral-200">{getCategoryLabel(category)}</span>
                <span className="ml-auto text-xs text-neutral-400 dark:text-neutral-500">{catModules.length} modules</span>
              </div>
              
              <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                {catModules.map(module => (
                  <div key={module.id} className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 bg-neutral-600 dark:bg-neutral-300">
                        <Icons.CheckMark size={12} className="text-neutral-200 dark:text-neutral-700" />
                      </div>
                      <div>
                        <h5 className="font-medium text-neutral-700 dark:text-neutral-200">{module.name}</h5>
                        <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">{module.description}</p>
                      </div>
                    </div>
                    
                    {module.subFeatures.filter(f => f.isSelected).length > 0 && (
                      <div className="ml-8 flex flex-wrap gap-2">
                        {module.subFeatures.filter(f => f.isSelected).map(feature => (
                          <span 
                            key={feature.id}
                            className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm rounded-md border border-neutral-100 dark:border-neutral-700"
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
        <div className="text-center py-16">
          <Icons.Layers size={40} className="mx-auto text-neutral-200 dark:text-neutral-800 mb-4" />
          <p className="text-neutral-400 dark:text-neutral-500">선택된 모듈이 없습니다</p>
        </div>
      )}
    </div>
  );
};
