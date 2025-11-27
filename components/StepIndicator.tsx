import React from 'react';
import { Icons } from './Icons';

export type StepStatus = 'pending' | 'active' | 'completed';

interface StepIndicatorProps {
  step1Status?: StepStatus;
  step2Status?: StepStatus;
  step3Status?: StepStatus;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  step1Status = 'pending',
  step2Status = 'pending',
  step3Status = 'pending',
}) => {
  const renderStep = (stepNum: number, label: string, status: StepStatus) => {
    const isCompleted = status === 'completed';
    const isActive = status === 'active';
    const isPending = status === 'pending';

    return (
      <div className="flex items-center gap-3">
        {isCompleted ? (
          <div className="w-6 h-6 bg-slate-900 dark:bg-white flex items-center justify-center rounded-sm">
            <Icons.CheckMark size={14} className="text-white dark:text-slate-900" strokeWidth={3} />
          </div>
        ) : isActive ? (
          <div className="w-6 h-6 bg-indigo-500 flex items-center justify-center text-white text-xs font-bold rounded-sm shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50">
            {stepNum}
          </div>
        ) : (
          <div className="w-6 h-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs font-medium rounded-sm">
            {stepNum}
          </div>
        )}
        <span className={`text-sm font-medium tracking-tight ${
          isCompleted ? 'text-slate-900 dark:text-white' :
          isActive ? 'text-indigo-600 dark:text-indigo-400' :
          'text-slate-300 dark:text-slate-600'
        }`}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center gap-4 select-none">
      {renderStep(1, '요구사항 분석', step1Status)}
      <div className="w-16 h-[1px] bg-slate-200 dark:bg-slate-700"></div>
      {renderStep(2, '견적/기능 조율', step2Status)}
      <div className="w-16 h-[1px] bg-slate-200 dark:bg-slate-700"></div>
      {renderStep(3, '공고 생성', step3Status)}
    </div>
  );
};