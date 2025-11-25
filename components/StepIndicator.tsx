import React from 'react';
import { Icons } from './Icons';

export const StepIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-4 select-none">
        {/* Step 1: Completed */}
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-slate-900 dark:bg-white flex items-center justify-center rounded-sm">
                <Icons.CheckMark size={14} className="text-white dark:text-slate-900" strokeWidth={3} />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white tracking-tight">요구사항 분석</span>
        </div>

        {/* Separator */}
        <div className="w-16 h-[1px] bg-slate-200 dark:bg-slate-700"></div>

        {/* Step 2: Active */}
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-indigo-500 flex items-center justify-center text-white text-xs font-bold rounded-sm shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50">
                2
            </div>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 tracking-tight">견적/기능 조율</span>
        </div>

        {/* Separator */}
        <div className="w-16 h-[1px] bg-slate-200 dark:bg-slate-700"></div>

        {/* Step 3: Pending */}
        <div className="flex items-center gap-3">
             <div className="w-6 h-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs font-medium rounded-sm">
                3
            </div>
            <span className="text-sm font-medium text-slate-300 dark:text-slate-600 tracking-tight">공고 생성</span>
        </div>
    </div>
  );
};