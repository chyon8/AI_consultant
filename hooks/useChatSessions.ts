import { useState, useEffect, useCallback } from 'react';
import { ChatSession, Message, ModuleItem } from '../types';
import { INITIAL_MESSAGES, INITIAL_MODULES } from '../constants';

const STORAGE_KEY = 'wishket_chat_sessions';

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const sessionsWithDates = parsed.map((s: ChatSession) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          messages: s.messages.map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
        setSessions(sessionsWithDates);
      } catch (e) {
        console.error('Failed to parse sessions from localStorage:', e);
      }
    }
  }, []);

  const saveToStorage = useCallback((sessionsToSave: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsToSave));
    } catch (e) {
      console.error('Failed to save sessions to localStorage:', e);
    }
  }, []);

  const createNewSession = useCallback((): ChatSession => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: '',
      createdAt: new Date(),
      messages: INITIAL_MESSAGES.map(m => ({ ...m })),
      modules: INITIAL_MODULES.map(m => ({ 
        ...m, 
        subFeatures: m.subFeatures.map(s => ({ ...s })) 
      })),
      isLoading: true,
    };
    
    setSessions(prev => {
      const updated = [newSession, ...prev];
      saveToStorage(updated);
      return updated;
    });
    
    setActiveSessionId(newSession.id);
    return newSession;
  }, [saveToStorage]);

  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    setSessions(prev => {
      const updated = prev.map(s => 
        s.id === sessionId ? { ...s, title, isLoading: false } : s
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const updateSessionMessages = useCallback((sessionId: string, messages: Message[]) => {
    setSessions(prev => {
      const updated = prev.map(s => 
        s.id === sessionId ? { ...s, messages } : s
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const updateSessionModules = useCallback((sessionId: string, modules: ModuleItem[]) => {
    setSessions(prev => {
      const updated = prev.map(s => 
        s.id === sessionId ? { ...s, modules } : s
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const updateSession = useCallback((sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev => {
      const updated = prev.map(s => 
        s.id === sessionId ? { ...s, ...updates } : s
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      saveToStorage(updated);
      return updated;
    });
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  }, [activeSessionId, saveToStorage]);

  const getActiveSession = useCallback((): ChatSession | null => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  const setSessionLoading = useCallback((sessionId: string, isLoading: boolean) => {
    setSessions(prev => {
      const updated = prev.map(s => 
        s.id === sessionId ? { ...s, isLoading } : s
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const generateTitleFromMessage = useCallback((message: string): string => {
    const trimmed = message.trim();
    if (trimmed.length <= 30) return trimmed;
    return trimmed.substring(0, 30) + '...';
  }, []);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
    updateSessionTitle,
    updateSessionMessages,
    updateSessionModules,
    updateSession,
    deleteSession,
    getActiveSession,
    setSessionLoading,
    generateTitleFromMessage,
  };
};
