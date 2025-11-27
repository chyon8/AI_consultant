import React, { useState, useEffect } from 'react';
import { ModuleItem } from '../types';
import { Icons } from './Icons';
import { generateRFP } from '../services/apiService';
import { useAsyncState } from '../contexts/AsyncStateContext';

interface RFPModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: ModuleItem[];
  projectSummary: string;
}

export const RFPModal: React.FC<RFPModalProps> = ({
  isOpen,
  onClose,
  modules,
  projectSummary
}) => {
  const [rfpContent, setRfpContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setRfpStatus, addToast } = useAsyncState();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setRfpContent('');
    setRfpStatus('loading', '공고문을 생성하고 있습니다...');

    try {
      await generateRFP(
        modules.filter(m => m.isSelected),
        projectSummary,
        (chunk) => {
          setRfpContent(prev => prev + chunk);
        },
        (err) => {
          setError(err);
          setRfpStatus('error', err);
          addToast({ type: 'error', message: err });
        }
      );
      setRfpStatus('success');
      addToast({ type: 'success', message: '공고문이 생성되었습니다.' });
    } catch (err) {
      setError('공고문 생성 중 오류가 발생했습니다.');
      setRfpStatus('error');
      addToast({ type: 'error', message: '공고문 생성 중 오류가 발생했습니다.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rfpContent);
  };

  useEffect(() => {
    if (isOpen && !rfpContent && !isGenerating) {
      handleGenerate();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Icons.File size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">입찰 공고문</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">AI 생성 공고문</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {rfpContent && !isGenerating && (
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <Icons.Copy size={16} />
                복사
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
            >
              <Icons.Close size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Icons.Close size={32} className="text-red-500" />
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-black dark:hover:bg-slate-200 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : isGenerating && !rfpContent ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Icons.Refresh size={32} className="text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-500 dark:text-slate-400">공고문을 생성하고 있습니다...</p>
            </div>
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 whitespace-pre-wrap font-mono text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {rfpContent}
                {isGenerating && (
                  <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1" />
                )}
              </div>
            </div>
          )}
        </div>

        {rfpContent && !isGenerating && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              onClick={handleGenerate}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <Icons.Refresh size={16} />
              다시 생성
            </button>
            <button
              onClick={handleCopy}
              className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-black dark:hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <Icons.Copy size={16} />
              클립보드에 복사
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
