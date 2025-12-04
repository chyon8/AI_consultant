import React, { useState, useRef } from 'react';
import { Icons } from './Icons';

interface LandingViewProps {
  onAnalyze: (text: string, files: File[]) => void;
  isLoading: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({ onAnalyze, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!inputText.trim() && attachedFiles.length === 0) return;
    onAnalyze(inputText, attachedFiles);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-300 px-6">
        <div className="text-center">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-8 shadow-xl animate-pulse"
            style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}
          >
            <Icons.Bot size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            프로젝트를 분석하고 있습니다
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 mb-8">
            AI가 모듈 구조, 견적, 일정을 분석 중입니다...
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--theme-primary)', animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--theme-primary)', animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--theme-primary)', animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-300 px-6">
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-xl"
            style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}
          >
            <Icons.Bot size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
            프로젝트 견적 AI 컨설턴트
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            프로젝트 내용을 입력하시면 AI가 기능 범위, 상세 견적, 
            일정을 분석하고 공고문까지 작성해드립니다.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-2 shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-100 dark:border-slate-800 transition-colors">
          {attachedFiles.length > 0 && (
            <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-sm border border-slate-200 dark:border-slate-700"
                >
                  <Icons.FileText size={14} className="text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Icons.Close size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3 p-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
              title="파일 첨부"
            >
              <Icons.Attach size={22} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.pdf,.doc,.docx,.md"
              onChange={handleFileSelect}
              className="hidden"
            />

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="프로젝트 요구사항을 입력하거나 파일을 첨부해주세요..."
              className="flex-1 py-3 px-2 bg-transparent resize-none text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none min-h-[52px] max-h-[200px]"
              rows={1}
              disabled={isLoading}
            />

            <button
              onClick={handleSubmit}
              disabled={isLoading || (!inputText.trim() && attachedFiles.length === 0)}
              className={`p-3 rounded-xl transition-all ${
                inputText.trim() || attachedFiles.length > 0
                  ? 'text-white shadow-lg'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
              }`}
              style={inputText.trim() || attachedFiles.length > 0 ? { backgroundColor: 'var(--theme-primary)' } : {}}
            >
              {isLoading ? (
                <Icons.Refresh size={22} className="animate-spin" />
              ) : (
                <Icons.Send size={22} />
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {['LMS 플랫폼', '이커머스 앱', 'IoT 대시보드', 'SaaS MVP'].map((example) => (
            <button
              key={example}
              onClick={() => setInputText(`${example} 개발 프로젝트를 진행하려고 합니다.`)}
              className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
