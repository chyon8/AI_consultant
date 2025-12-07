import { ChatSession, Message, DashboardState } from '../types';

const STORAGE_KEY = 'chat_history_storage';

export const getChatHistory = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveChatHistory = (sessions: ChatSession[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save chat history:', e);
  }
};

export const createNewSession = (): ChatSession => {
  return {
    id: Date.now().toString(),
    title: 'New Chat',
    createdAt: Date.now(),
    messages: []
  };
};

export const updateSessionTitle = (sessionId: string, firstMessage: string): void => {
  const sessions = getChatHistory();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  if (sessionIndex !== -1) {
    sessions[sessionIndex].title = firstMessage.substring(0, 20).trim() || 'New Chat';
    saveChatHistory(sessions);
  }
};

export const updateSessionMessages = (sessionId: string, messages: Message[]): void => {
  const sessions = getChatHistory();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  if (sessionIndex !== -1) {
    sessions[sessionIndex].messages = messages;
    saveChatHistory(sessions);
  }
};

export const addSession = (session: ChatSession): void => {
  const sessions = getChatHistory();
  sessions.unshift(session);
  saveChatHistory(sessions);
};

export const getSessionById = (sessionId: string): ChatSession | undefined => {
  const sessions = getChatHistory();
  return sessions.find(s => s.id === sessionId);
};

export const deleteSession = (sessionId: string): void => {
  const sessions = getChatHistory();
  const filtered = sessions.filter(s => s.id !== sessionId);
  saveChatHistory(filtered);
};

export const updateSessionDashboardState = (sessionId: string, dashboardState: DashboardState): void => {
  const sessions = getChatHistory();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  if (sessionIndex !== -1) {
    sessions[sessionIndex].dashboardState = JSON.parse(JSON.stringify(dashboardState));
    saveChatHistory(sessions);
  }
};

export const updateSessionCustomTitle = (sessionId: string, customTitle: string): void => {
  const sessions = getChatHistory();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  if (sessionIndex !== -1) {
    sessions[sessionIndex].customTitle = customTitle;
    saveChatHistory(sessions);
  }
};

export const toggleSessionFavorite = (sessionId: string): boolean => {
  const sessions = getChatHistory();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  if (sessionIndex !== -1) {
    const newFavorite = !sessions[sessionIndex].isFavorite;
    sessions[sessionIndex].isFavorite = newFavorite;
    saveChatHistory(sessions);
    return newFavorite;
  }
  return false;
};
