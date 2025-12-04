import React from 'react';
import { Icons } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAiSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAiSettings
}) => {
  if (!isOpen) return null;

  const handleOpenAiSettings = () => {
    onClose();
    onOpenAiSettings();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">설정</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Icons.Close size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <button
            onClick={handleOpenAiSettings}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <Icons.Sparkles size={20} className="text-indigo-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white">AI 모델 설정</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">기능별 AI 모델을 변경합니다</p>
              </div>
            </div>
            <Icons.Right size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </button>

          <div className="flex items-center gap-3 p-4 text-slate-400">
            <Icons.Help size={20} />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">버전 정보</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Wishket Estimate v1.0.0</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
