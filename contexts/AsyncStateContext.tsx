import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState {
  analysis: { status: AsyncStatus; message?: string };
  chat: { status: AsyncStatus; message?: string };
  rfp: { status: AsyncStatus; message?: string };
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'loading';
  message: string;
  duration?: number;
}

interface AsyncStateContextType {
  state: AsyncState;
  toasts: Toast[];
  setAnalysisStatus: (status: AsyncStatus, message?: string) => void;
  setChatStatus: (status: AsyncStatus, message?: string) => void;
  setRfpStatus: (status: AsyncStatus, message?: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  isAnyLoading: () => boolean;
}

const AsyncStateContext = createContext<AsyncStateContextType | undefined>(undefined);

const initialState: AsyncState = {
  analysis: { status: 'idle' },
  chat: { status: 'idle' },
  rfp: { status: 'idle' },
};

export const AsyncStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AsyncState>(initialState);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const setAnalysisStatus = useCallback((status: AsyncStatus, message?: string) => {
    setState(prev => ({ ...prev, analysis: { status, message } }));
  }, []);

  const setChatStatus = useCallback((status: AsyncStatus, message?: string) => {
    setState(prev => ({ ...prev, chat: { status, message } }));
  }, []);

  const setRfpStatus = useCallback((status: AsyncStatus, message?: string) => {
    setState(prev => ({ ...prev, rfp: { status, message } }));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 4000);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const isAnyLoading = useCallback(() => {
    return state.analysis.status === 'loading' || 
           state.chat.status === 'loading' || 
           state.rfp.status === 'loading';
  }, [state]);

  return (
    <AsyncStateContext.Provider value={{
      state,
      toasts,
      setAnalysisStatus,
      setChatStatus,
      setRfpStatus,
      addToast,
      removeToast,
      isAnyLoading,
    }}>
      {children}
    </AsyncStateContext.Provider>
  );
};

export const useAsyncState = () => {
  const context = useContext(AsyncStateContext);
  if (!context) {
    throw new Error('useAsyncState must be used within AsyncStateProvider');
  }
  return context;
};
