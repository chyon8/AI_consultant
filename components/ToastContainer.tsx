import React from 'react';
import { useAsyncState, Toast } from '../contexts/AsyncStateContext';
import { Icons } from './Icons';

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  const bgColor = {
    success: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    loading: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
  }[toast.type];

  const textColor = {
    success: 'text-emerald-700 dark:text-emerald-300',
    error: 'text-red-700 dark:text-red-300',
    info: 'text-blue-700 dark:text-blue-300',
    loading: 'text-slate-700 dark:text-slate-300',
  }[toast.type];

  const iconColor = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    loading: 'text-slate-500',
  }[toast.type];

  const renderIcon = () => {
    switch (toast.type) {
      case 'success':
        return <Icons.CheckMark size={18} className={iconColor} strokeWidth={3} />;
      case 'error':
        return <Icons.Alert size={18} className={iconColor} />;
      case 'info':
        return <Icons.Help size={18} className={iconColor} />;
      case 'loading':
        return (
          <div className="animate-spin">
            <Icons.Refresh size={18} className={iconColor} />
          </div>
        );
    }
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-slide-in-right ${bgColor}`}>
      {renderIcon()}
      <span className={`text-sm font-medium ${textColor}`}>{toast.message}</span>
      {toast.type !== 'loading' && (
        <button
          onClick={onRemove}
          className="p-1 ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <Icons.Close size={14} />
        </button>
      )}
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAsyncState();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
