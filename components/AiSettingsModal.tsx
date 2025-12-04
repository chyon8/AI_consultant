import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { 
  AI_AVAILABLE_MODELS, 
  AI_FUNCTION_MAP, 
  AIModelSettings,
  getDefaultModelSettings 
} from '../constants/aiConfig';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AIModelSettings) => void;
  currentSettings?: AIModelSettings;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings
}) => {
  const [settings, setSettings] = useState<AIModelSettings>(
    currentSettings || getDefaultModelSettings()
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    } else {
      setSettings(getDefaultModelSettings());
    }
    setHasChanges(false);
  }, [currentSettings, isOpen]);

  const handleModelChange = (functionName: string, modelId: string) => {
    setSettings(prev => ({
      ...prev,
      [functionName]: modelId
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(settings);
    console.log('[AI Settings] Saved settings:', settings);
    onClose();
  };

  const handleReset = () => {
    const defaults = getDefaultModelSettings();
    setSettings(defaults);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <Icons.Sparkles size={18} className="text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI 모델 설정</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">기능별 AI 모델을 설정합니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Icons.Close size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {AI_FUNCTION_MAP.map((func) => (
            <div 
              key={func.functionName}
              className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                      {func.functionName}()
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {func.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 dark:text-slate-500">
                    <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">
                      {func.file}
                    </span>
                    <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">
                      {func.promptVar}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <select
                    value={settings[func.functionName] || func.defaultModel}
                    onChange={(e) => handleModelChange(func.functionName, e.target.value)}
                    className="w-48 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all cursor-pointer"
                  >
                    {AI_AVAILABLE_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            기본값으로 초기화
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors ${
                hasChanges 
                  ? 'bg-indigo-500 hover:bg-indigo-600' 
                  : 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed'
              }`}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
