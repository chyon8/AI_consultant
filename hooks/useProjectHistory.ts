import { useState, useEffect, useCallback } from 'react';
import { ProjectSnapshot } from '../types';

const STORAGE_KEY = 'wishket_project_history';
const MAX_HISTORY_ITEMS = 20;

export function useProjectHistory() {
  const [history, setHistory] = useState<ProjectSnapshot[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      } catch (e) {
        console.error('Failed to parse project history:', e);
        setHistory([]);
      }
    }
  }, []);

  const saveToStorage = useCallback((items: ProjectSnapshot[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save project history:', e);
    }
  }, []);

  const addProject = useCallback((snapshot: Omit<ProjectSnapshot, 'id' | 'createdAt'>) => {
    const newProject: ProjectSnapshot = {
      ...snapshot,
      id: `proj_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setHistory(prev => {
      const updated = [newProject, ...prev].slice(0, MAX_HISTORY_ITEMS);
      saveToStorage(updated);
      return updated;
    });

    return newProject.id;
  }, [saveToStorage]);

  const getProject = useCallback((id: string): ProjectSnapshot | undefined => {
    return history.find(p => p.id === id);
  }, [history]);

  const deleteProject = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    history,
    addProject,
    getProject,
    deleteProject,
    clearHistory,
  };
}
