import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from './Icons';
import { ChatSession } from '../types';
import { getChatHistory } from '../services/chatHistoryService';

interface HistoryPageProps {
  chatSessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string, sessionTitle: string) => void;
  onRenameSession?: (sessionId: string, newTitle: string) => void;
  onToggleFavorite?: (sessionId: string) => void;
  onBack: () => void;
}

type SortOption = 'newest' | 'oldest' | 'name';
type FilterOption = 'all' | 'favorites';

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

const ITEMS_PER_PAGE = 10;

export const HistoryPage: React.FC<HistoryPageProps> = ({
  chatSessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [freshSessions, setFreshSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const latestSessions = getChatHistory();
    setFreshSessions(latestSessions);
  }, [chatSessions]);

  const filteredAndSortedSessions = useMemo(() => {
    const sourceData = freshSessions.length > 0 ? freshSessions : chatSessions;
    let sessions = [...sourceData];

    if (filterBy === 'favorites') {
      sessions = sessions.filter(s => s.isFavorite);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      sessions = sessions.filter(s => {
        const titleMatch = (s.customTitle || s.title).toLowerCase().includes(query);
        if (titleMatch) return true;
        const messageMatch = s.messages?.some(m => 
          m.text?.toLowerCase().includes(query)
        );
        return messageMatch;
      });
    }

    sessions.sort((a, b) => {
      const aTime = a.updatedAt || a.createdAt;
      const bTime = b.updatedAt || b.createdAt;
      if (sortBy === 'newest') return bTime - aTime;
      if (sortBy === 'oldest') return aTime - bTime;
      if (sortBy === 'name') return (a.customTitle || a.title).localeCompare(b.customTitle || b.title);
      return 0;
    });

    return sessions;
  }, [freshSessions, chatSessions, searchQuery, sortBy, filterBy]);

  const totalPages = Math.ceil(filteredAndSortedSessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedSessions, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: FilterOption) => {
    setFilterBy(value);
    setCurrentPage(1);
  };

  const handleStartEditing = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.customTitle || session.title);
  };

  const handleFinishEditing = () => {
    if (editingSessionId && editingTitle.trim() && onRenameSession) {
      onRenameSession(editingSessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEditing();
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
      setEditingTitle('');
    }
  };

  const handleSessionClick = (sessionId: string) => {
    onSelectSession(sessionId);
    onBack();
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-hidden flex flex-col">
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Icons.Left size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            채팅 기록
          </h1>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            ({chatSessions.length}개)
          </span>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="프로젝트 검색..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="name">이름순</option>
          </select>

          <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-2 text-sm transition-colors ${
                filterBy === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => handleFilterChange('favorites')}
              className={`px-3 py-2 text-sm transition-colors flex items-center gap-1 ${
                filterBy === 'favorites'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              <Icons.Star size={14} className={filterBy === 'favorites' ? 'fill-white' : ''} />
              즐겨찾기
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredAndSortedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <Icons.Clock size={48} className="mb-4 opacity-50" />
            <p className="text-lg">
              {searchQuery ? '검색 결과가 없습니다' : '채팅 기록이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 max-w-4xl mx-auto">
            {paginatedSessions.map((session) => (
              <div
                key={session.id}
                className={`group bg-white dark:bg-slate-800 rounded-lg border transition-all hover:shadow-md ${
                  activeSessionId === session.id
                    ? 'border-indigo-400 dark:border-indigo-500 ring-1 ring-indigo-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center p-4 gap-4">
                  {session.isFavorite && (
                    <Icons.Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    {editingSessionId === session.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={handleFinishEditing}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full px-2 py-1 rounded border border-indigo-400 dark:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <button
                        onClick={() => handleSessionClick(session.id)}
                        className="w-full text-left"
                      >
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {session.customTitle || session.title}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {formatDate(session.createdAt)}
                        </p>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onToggleFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(session.id);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          session.isFavorite
                            ? 'text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-yellow-500'
                        }`}
                        title={session.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
                      >
                        <Icons.Star size={16} className={session.isFavorite ? 'fill-yellow-500' : ''} />
                      </button>
                    )}
                    {onRenameSession && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditing(session);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        title="이름 변경"
                      >
                        <Icons.Pencil size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id, session.customTitle || session.title);
                      }}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="삭제"
                    >
                      <Icons.Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icons.Left size={18} />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icons.Right size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
