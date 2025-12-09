import React from 'react';
import { InputSource, FileProcessingMethod } from '../types';
import { Icons } from './Icons';

interface InputSourcesBadgeProps {
  sources: InputSource[];
  className?: string;
}

export const InputSourcesBadge: React.FC<InputSourcesBadgeProps> = ({ sources, className = '' }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return <Icons.FileText size={14} className="text-red-500" />;
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <Icons.FileText size={14} className="text-blue-500" />;
    }
    if (mimeType.startsWith('image/')) {
      return <Icons.Image size={14} className="text-green-500" />;
    }
    return <Icons.FileText size={14} className="text-slate-400" />;
  };

  const getProcessingMethodBadge = (method?: FileProcessingMethod) => {
    if (!method) return null;
    
    const config: Record<FileProcessingMethod, { label: string; className: string }> = {
      'parser': { label: 'Parser', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
      'inline': { label: 'Inline', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
      'gemini': { label: 'Gemini', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' }
    };
    
    const badge = config[method];
    if (!badge) return null;
    
    return (
      <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const displaySources = sources.slice(0, 3);
  const remainingCount = sources.length - 3;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        기반 문서:
      </span>
      {displaySources.map((source) => (
        <div
          key={source.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-full"
          title={`${source.originalName}${source.wordCount ? ` (${source.wordCount.toLocaleString()}단어)` : ''}${source.processingMethod ? ` [${source.processingMethod}]` : ''}`}
        >
          {getFileIcon(source.mimeType)}
          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 max-w-[120px] truncate">
            {source.originalName}
          </span>
          {getProcessingMethodBadge(source.processingMethod)}
          {source.wordCount && (
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400">
              {source.wordCount > 1000 
                ? `${Math.round(source.wordCount / 1000)}k` 
                : source.wordCount}
            </span>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          +{remainingCount}개
        </span>
      )}
    </div>
  );
};
