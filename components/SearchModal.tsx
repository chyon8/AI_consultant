import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { ChatSession } from '../types';
import { getChatHistory } from '../services/chatHistoryService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  activeSessionId: string | null;
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
};

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectSession,
  activeSessionId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const latestSessions = getChatHistory();
      setSessions(latestSessions);
      setSearchQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return sessions.filter(s => {
      const titleMatch = (s.customTitle || s.title).toLowerCase().includes(query);
      if (titleMatch) return true;
      const messageMatch = s.messages?.some(m => 
        m.text?.toLowerCase().includes(query)
      );
      return messageMatch;
    }).slice(0, 10);
  }, [sessions, searchQuery]);

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/50" />
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Icons.Search size={20} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="제목 또는 대화 내용 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-base"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <Icons.Close size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {searchQuery.trim() === '' ? (
            <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
              <Icons.Search size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">검색어를 입력하세요</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="py-2">
              {searchResults.map((session) => {
                const matchedMessage = session.messages?.find(m => 
                  m.text?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                const matchedText = matchedMessage?.text;
                
                return (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                      activeSessionId === session.id ? 'bg-slate-100 dark:bg-slate-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {session.isFavorite && (
                        <Icons.Star size={12} className="text-yellow-500 fill-yellow-500" />
                      )}
                      <span className="font-medium text-slate-900 dark:text-white truncate">
                        {session.customTitle || session.title}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                        {formatDate(session.updatedAt || session.createdAt)}
                      </span>
                    </div>
                    {matchedText && !(session.customTitle || session.title).toLowerCase().includes(searchQuery.toLowerCase()) && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {matchedText.substring(0, 80)}...
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
          <span className="mr-3">↵ 선택</span>
          <span>esc 닫기</span>
        </div>
      </div>
    </div>
  );
};
