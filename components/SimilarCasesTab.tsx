
import React from 'react';
import { SIMILAR_PROJECTS_DATA } from '../constants';
import { Icons } from './Icons';

export const SimilarCasesTab: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in pb-20 pt-4">
      <div className="mb-6">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">유사 프로젝트 사례</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">AI가 분석한 성공적으로 완료된 유사 프로젝트들입니다.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {SIMILAR_PROJECTS_DATA.map((project) => (
          <div 
            key={project.id} 
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-float transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
               <div className="flex items-center gap-3">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{project.title}</h4>
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                     {project.similarity}% 유사
                  </span>
               </div>
               <span className="px-3 py-1 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium rounded-full">
                 {project.category}
               </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                     <Icons.TrendingUp size={20} />
                  </div>
                  <div>
                     <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-0.5">예산</p>
                     <p className="text-lg font-bold text-slate-900 dark:text-white">₩{project.budget.toLocaleString()}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 dark:text-purple-400">
                     <Icons.Clock size={20} />
                  </div>
                  <div>
                     <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-0.5">기간</p>
                     <p className="text-lg font-bold text-slate-900 dark:text-white">{project.duration}</p>
                  </div>
               </div>
            </div>

            {/* Features */}
            <div className="mb-6">
               <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">주요 기능</p>
               <div className="flex flex-wrap gap-2">
                  {project.features.map((feature, i) => (
                    <span key={i} className="text-sm text-slate-700 dark:text-slate-300 font-medium px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                       {feature}
                    </span>
                  ))}
               </div>
            </div>

            {/* Outcome Box (Green) */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-5 flex items-start gap-4">
               <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center mt-0.5 bg-white dark:bg-slate-900 shrink-0">
                  <Icons.CheckMark size={10} className="text-emerald-500" strokeWidth={4} />
               </div>
               <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">프로젝트 성과</p>
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300 leading-relaxed">
                     {project.outcome}
                  </p>
               </div>
               <div className="ml-auto flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-md shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                  <Icons.Target size={12} className="text-emerald-500 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">만족도 {project.satisfaction}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};