import React from 'react';
import { Icons } from './Icons';
import { ChatSession } from '../types';

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  chatSessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ 
  isCollapsed, 
  onToggle,
  chatSessions,
  activeSessionId,
  onNewChat,
  onSelectSession
}) => {
  return (
    <div 
      className={`h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 px-3 py-2 w-full text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Icons.Plus size={16} />
            <span>New Chat</span>
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="New Chat"
          >
            <Icons.Plus size={18} />
          </button>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-auto"
        >
          {isCollapsed ? <Icons.Right size={16} /> : <Icons.Left size={16} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {!isCollapsed && (
          <div className="px-3 py-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              채팅 기록
            </span>
          </div>
        )}
        
        {(chatSessions || []).map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
              isCollapsed ? 'justify-center' : ''
            } ${
              activeSessionId === session.id 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
            title={isCollapsed ? session.title : undefined}
          >
            <Icons.Chat size={16} className="flex-shrink-0" />
            {!isCollapsed && (
              <span className="flex-1 text-sm truncate">
                {session.title}
              </span>
            )}
          </button>
        ))}
        
        {(!chatSessions || chatSessions.length === 0) && !isCollapsed && (
          <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
            채팅 기록이 없습니다
          </div>
        )}
      </div>
    </div>
  );
};
