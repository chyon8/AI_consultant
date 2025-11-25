import React from 'react';
import { Icons } from './Icons';

export const StepIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-4 select-none">
        {/* Step 1: Completed */}
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-slate-900 flex items-center justify-center rounded-sm">
                <Icons.CheckMark size={14} className="text-white" strokeWidth={3} />
            </div>
            <span className="text-sm font-medium text-slate-900 tracking-tight">요구사항 분석</span>
        </div>

        {/* Separator */}
        <div className="w-16 h-[1px] bg-slate-200"></div>

        {/* Step 2: Active */}
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-indigo-500 flex items-center justify-center text-white text-xs font-bold rounded-sm shadow-sm shadow-indigo-200">
                2
            </div>
            <span className="text-sm font-medium text-indigo-600 tracking-tight">견적/기능 조율</span>
        </div>

        {/* Separator */}
        <div className="w-16 h-[1px] bg-slate-200"></div>

        {/* Step 3: Pending */}
        <div className="flex items-center gap-3">
             <div className="w-6 h-6 border border-slate-200 bg-white flex items-center justify-center text-slate-300 text-xs font-medium rounded-sm">
                3
            </div>
            <span className="text-sm font-medium text-slate-300 tracking-tight">공고 생성</span>
        </div>
    </div>
  );
};