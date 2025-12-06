import React, { useState } from 'react';
import { Icons } from './Icons';
import { ChatSession } from '../types';

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  chatSessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string, sessionTitle: string) => void;
  onAbortSession?: (sessionId: string) => void;
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ 
  isCollapsed, 
  onToggle,
  chatSessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onAbortSession
}) => {
  const [isProjectExpanded, setIsProjectExpanded] = useState(true);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const sessionCount = (chatSessions || []).length;

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

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          <div className="py-2">
            <button
              onClick={onNewChat}
              className="w-full flex items-center gap-3 pl-6 pr-3 py-2 text-left text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Icons.Plus size={14} className="flex-shrink-0" />
              <span className="text-sm">새 프로젝트</span>
            </button>

            <button
              className="w-full flex items-center gap-3 pl-6 pr-3 py-2 text-left text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="프로젝트 검색"
            >
              <Icons.Search size={14} className="flex-shrink-0" />
              <span className="text-sm">검색</span>
            </button>

            <button
              className="w-full flex items-center gap-3 pl-6 pr-3 py-2 text-left text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="검수 도구"
            >
              <Icons.Tools size={14} className="flex-shrink-0" />
              <span className="text-sm">도구</span>
            </button>

            <div className="mx-3 my-2 border-t border-slate-200 dark:border-slate-700"></div>

            <div className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-indigo-600 dark:text-indigo-400">
              <Icons.External size={16} className="flex-shrink-0" />
              <span className="text-sm font-medium">외주</span>
            </div>

            <div className="mt-1">
              <button
                onClick={() => setIsProjectExpanded(!isProjectExpanded)}
                className="w-full flex items-center gap-3 pl-6 pr-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Icons.Clock size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">채팅 기록</span>
                {sessionCount > 0 && (
                  <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                    {sessionCount}
                  </span>
                )}
                <div className={`transition-transform duration-200 ${isProjectExpanded ? '' : 'rotate-180'}`}>
                  <Icons.Up size={14} className="text-slate-400" />
                </div>
              </button>

              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  isProjectExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {(chatSessions || []).map((session) => (
                  <div
                    key={session.id}
                    className={`relative group flex items-center pl-10 pr-2 py-2.5 transition-colors ${
                      activeSessionId === session.id 
                        ? 'bg-slate-100 dark:bg-slate-800' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    onMouseEnter={() => setHoveredSessionId(session.id)}
                    onMouseLeave={() => setHoveredSessionId(null)}
                  >
                    <button
                      onClick={() => onSelectSession(session.id)}
                      className="flex-1 flex flex-col items-start text-left min-w-0"
                    >
                      <span className={`text-sm truncate w-full ${
                        activeSessionId === session.id 
                          ? 'text-slate-900 dark:text-white font-medium' 
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {session.isLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <span>생성 중...</span>
                          </span>
                        ) : (
                          session.title
                        )}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatDate(session.createdAt)}
                      </span>
                    </button>
                    
                    {session.isLoading && onAbortSession ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAbortSession(session.id);
                        }}
                        className="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        중단
                      </button>
                    ) : hoveredSessionId === session.id && !session.isLoading && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id, session.title);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="삭제"
                      >
                        <Icons.Trash size={14} />
                      </button>
                    )}
                  </div>
                ))}
                
                {(!chatSessions || chatSessions.length === 0) && (
                  <div className="pl-10 pr-3 py-3 text-xs text-slate-400 dark:text-slate-500">
                    채팅 기록이 없습니다
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-2 gap-1">
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="새 프로젝트"
          >
            <Icons.Plus size={18} />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="검색"
          >
            <Icons.Search size={18} />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="검수 도구"
          >
            <Icons.Tools size={18} />
          </button>
          <div className="w-6 my-1 border-t border-slate-200 dark:border-slate-700"></div>
          <div
            className="p-2 text-indigo-600 dark:text-indigo-400"
            title="외주"
          >
            <Icons.External size={18} />
          </div>
        </div>
      )}
    </div>
  );
};
