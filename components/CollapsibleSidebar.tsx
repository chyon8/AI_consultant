import React from 'react';
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
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return '오늘';
    } else if (days === 1) {
      return '어제';
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const thisWeek: ChatSession[] = [];
    const older: ChatSession[] = [];
    
    if (!sessions || sessions.length === 0) {
      return { today, yesterday, thisWeek, older };
    }
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.createdAt);
      if (sessionDate >= todayStart) {
        today.push(session);
      } else if (sessionDate >= yesterdayStart) {
        yesterday.push(session);
      } else if (sessionDate >= weekStart) {
        thisWeek.push(session);
      } else {
        older.push(session);
      }
    });
    
    return { today, yesterday, thisWeek, older };
  };

  const grouped = groupSessionsByDate(safeSessions);

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    
    return (
      <div
        key={session.id}
        onClick={() => onSelectSession(session.id)}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
          isActive 
            ? 'bg-slate-100 dark:bg-slate-800' 
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        {session.isLoading ? (
          <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 rounded-full animate-spin flex-shrink-0" />
        ) : (
          <Icons.Chat size={16} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
        )}
        
        {!isCollapsed && (
          <>
            <span className={`flex-1 text-sm truncate ${
              isActive 
                ? 'text-slate-900 dark:text-white font-medium' 
                : 'text-slate-600 dark:text-slate-300'
            }`}>
              {session.isLoading ? '로딩 중...' : (session.title || '새 채팅')}
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
          </>
        )}
      </div>
    );
  };

  const renderGroup = (title: string, items: ChatSession[]) => {
    if (items.length === 0) return null;
    
    return (
      <div className="mb-4">
        {!isCollapsed && (
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {title}
          </div>
        )}
        <div className="space-y-1">
          {items.map(renderSessionItem)}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {!isCollapsed && (
          <button
            onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 dark:bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors"
          >
            <Icons.Plus size={16} />
            <span>새 채팅</span>
          </button>
        )}
        <button
          onClick={isCollapsed ? onNewChat : onToggle}
          className={`p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ${isCollapsed ? '' : ''}`}
          title={isCollapsed ? "새 채팅" : "사이드바 접기"}
        >
          {isCollapsed ? <Icons.Plus size={18} /> : <Icons.Left size={16} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2">
        {safeSessions.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 ${isCollapsed ? 'px-1' : 'px-4'}`}>
            {!isCollapsed && (
              <>
                <Icons.Chat size={32} className="mb-2 opacity-50" />
                <p className="text-xs text-center">채팅 기록이 없습니다.<br/>새 채팅을 시작해보세요.</p>
              </>
            )}
          </div>
        ) : (
          <>
            {renderGroup('오늘', grouped.today)}
            {renderGroup('어제', grouped.yesterday)}
            {renderGroup('이번 주', grouped.thisWeek)}
            {renderGroup('이전', grouped.older)}
          </>
        )}
      </div>

      {isCollapsed && (
        <div className="p-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onToggle}
            className="w-full p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center"
            title="사이드바 펼치기"
          >
            <Icons.Right size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
