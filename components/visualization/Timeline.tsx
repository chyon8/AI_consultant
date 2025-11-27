import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  status?: 'completed' | 'current' | 'upcoming';
  icon?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  title?: string;
  description?: string;
  orientation?: 'vertical' | 'horizontal';
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  title,
  description,
  orientation = 'vertical',
}) => {
  if (orientation === 'horizontal') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        {(title || description) && (
          <div className="mb-6">
            {title && (
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            )}
          </div>
        )}
        <div className="relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className="flex justify-between relative">
            {items.map((item, index) => {
              const StatusIcon = item.status === 'completed' ? CheckCircle : item.status === 'current' ? Clock : Circle;
              const iconColor = item.status === 'completed' 
                ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' 
                : item.status === 'current' 
                  ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                  : 'text-slate-400 bg-slate-100 dark:bg-slate-800';
              
              return (
                <div key={item.id} className="flex flex-col items-center" style={{ flex: 1 }}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor} z-10`}>
                    {item.icon || <StatusIcon className="w-4 h-4" />}
                  </div>
                  <div className="mt-3 text-center px-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</p>
                    {item.date && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.date}</p>
                    )}
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-6">
          {items.map((item) => {
            const StatusIcon = item.status === 'completed' ? CheckCircle : item.status === 'current' ? Clock : Circle;
            const iconColor = item.status === 'completed' 
              ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' 
              : item.status === 'current' 
                ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' 
                : 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
            
            return (
              <div key={item.id} className="relative flex gap-4 pl-10">
                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${iconColor}`}>
                  {item.icon || <StatusIcon className="w-4 h-4" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</h4>
                    {item.date && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                        {item.date}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface GanttPhase {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
  tasks?: string[];
  color?: string;
}

interface GanttChartProps {
  phases: GanttPhase[];
  totalWeeks: number;
  title?: string;
  description?: string;
}

const phaseColors = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-purple-500',
  'bg-cyan-500',
];

export const GanttChart: React.FC<GanttChartProps> = ({
  phases,
  totalWeeks,
  title,
  description,
}) => {
  const weekLabels = Array.from({ length: totalWeeks }, (_, i) => `W${i + 1}`);
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
          )}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
            <div className="w-32 flex-shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
              단계
            </div>
            <div className="flex-1 flex">
              {weekLabels.map((week) => (
                <div 
                  key={week} 
                  className="flex-1 text-center text-xs text-slate-400 dark:text-slate-500"
                  style={{ minWidth: 40 }}
                >
                  {week}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {phases.map((phase, index) => {
              const barStart = ((phase.startWeek - 1) / totalWeeks) * 100;
              const barWidth = ((phase.endWeek - phase.startWeek + 1) / totalWeeks) * 100;
              const colorClass = phase.color || phaseColors[index % phaseColors.length];
              
              return (
                <div key={phase.id} className="flex items-center group">
                  <div className="w-32 flex-shrink-0 pr-3">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {phase.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {phase.endWeek - phase.startWeek + 1}주
                    </p>
                  </div>
                  <div className="flex-1 relative h-10">
                    <div className="absolute inset-0 flex">
                      {weekLabels.map((_, i) => (
                        <div 
                          key={i} 
                          className="flex-1 border-l border-slate-100 dark:border-slate-800 first:border-l-0"
                          style={{ minWidth: 40 }}
                        />
                      ))}
                    </div>
                    <div
                      className={`absolute top-1 h-8 ${colorClass} rounded-md shadow-sm transition-all group-hover:shadow-md cursor-pointer`}
                      style={{ left: `${barStart}%`, width: `${barWidth}%` }}
                      title={phase.tasks?.join('\n')}
                    >
                      <div className="h-full flex items-center justify-center px-2">
                        <span className="text-xs text-white font-medium truncate">
                          {phase.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default { Timeline, GanttChart };
