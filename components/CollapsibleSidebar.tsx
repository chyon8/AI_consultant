import React, { useState } from 'react';
import { Icons } from './Icons';
import { ChatSession } from '../types';

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ 
  isCollapsed, 
  onToggle,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) => {
  const safeSessions = sessions || [];
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  
  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    
    return (
      <div
        key={session.id}
        onClick={() => onSelectSession(session.id)}
        className={`group relative cursor-pointer transition-all duration-200 py-3 px-4 border-b border-slate-100 dark:border-slate-800 ${
          isActive 
            ? 'bg-slate-50 dark:bg-slate-800/50' 
            : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
        }`}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className={`text-sm ${
              isActive 
                ? 'text-slate-900 dark:text-white font-medium' 
                : 'text-slate-700 dark:text-slate-200'
            }`}>
              {session.isLoading ? '로딩 중...' : (session.title || '새 프로젝트')}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
              title="삭제"
            >
              <Icons.Close size={14} />
            </button>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {formatDateTime(session.createdAt)}
          </span>
        </div>
        {session.isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-14' : 'w-60'
      }`}
    >
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            카테고리
          </span>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title={isCollapsed ? "펼치기" : "접기"}
          >
            {isCollapsed ? <Icons.Right size={16} /> : <Icons.Left size={16} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-3 py-2">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Icons.External size={16} className="text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">새 채팅</span>
          </button>
        </div>
      )}

      {isCollapsed && (
        <div className="px-2 py-2">
          <button
            onClick={onNewChat}
            className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center"
            title="새 채팅"
          >
            <Icons.External size={16} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
              className="w-full flex items-center gap-2 px-4 py-3 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <Icons.External size={16} />
              <span className="text-sm font-medium">외주</span>
            </button>
            
            {isProjectsExpanded && (
              <div className="pb-2">
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Icons.Clock size={14} className="text-slate-400 dark:text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">프로젝트</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {safeSessions.length > 0 && (
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
                        {safeSessions.length}
                      </span>
                    )}
                    <Icons.Up size={14} className="text-slate-400 dark:text-slate-500" />
                  </div>
                </div>

                {safeSessions.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      프로젝트가 없습니다.
                    </p>
                  </div>
                ) : (
                  <div>
                    {safeSessions.map(renderSessionItem)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isCollapsed && safeSessions.length > 0 && (
          <div className="px-2 py-2 space-y-1">
            {safeSessions.slice(0, 5).map(session => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full p-2 rounded-lg transition-colors flex items-center justify-center ${
                  session.id === activeSessionId
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={session.title || '새 프로젝트'}
              >
                <Icons.File size={16} className="text-slate-400 dark:text-slate-500" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
