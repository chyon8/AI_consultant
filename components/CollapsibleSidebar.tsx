import React, { useState } from 'react';
import { Icons } from './Icons';
import { ProjectSnapshot } from '../types';

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  projectHistory: ProjectSnapshot[];
  onSelectProject: (id: string) => void;
  onDeleteProject?: (id: string) => void;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ 
  isCollapsed, 
  onToggle,
  projectHistory,
  onSelectProject,
  onDeleteProject
}) => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  return (
    <div 
      className={`h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            카테고리
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-auto"
        >
          {isCollapsed ? <Icons.Right size={16} /> : <Icons.Left size={16} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="mb-1">
          <div
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-indigo-500 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? '외주' : undefined}
          >
            <Icons.External size={18} className="text-indigo-500 flex-shrink-0" />
            {!isCollapsed && (
              <span className="flex-1 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                외주
              </span>
            )}
          </div>

          {!isCollapsed && (
            <>
              <button
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                className="w-full flex items-center gap-2 pl-8 pr-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Icons.Clock size={14} className="text-slate-400 flex-shrink-0" />
                <span className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                  프로젝트 히스토리
                </span>
                <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full mr-1">
                  {projectHistory?.length || 0}
                </span>
                <div className={`transition-transform duration-200 ${isHistoryExpanded ? 'rotate-180' : ''}`}>
                  <Icons.Down size={12} className="text-slate-400" />
                </div>
              </button>

              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  isHistoryExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="overflow-y-auto max-h-[380px]">
                  {(!projectHistory || projectHistory.length === 0) ? (
                    <div className="pl-10 pr-3 py-3 text-xs text-slate-400 dark:text-slate-500">
                      아직 저장된 프로젝트가 없습니다
                    </div>
                  ) : (
                    projectHistory.map((project) => (
                      <div
                        key={project.id}
                        className="group relative flex items-center pl-10 pr-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={() => onSelectProject(project.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-600 dark:text-slate-300 truncate">
                            {project.title || '제목 없음'}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            {formatDate(project.createdAt)}
                          </div>
                        </div>
                        {onDeleteProject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(project.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                            title="삭제"
                          >
                            <Icons.Close size={12} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
