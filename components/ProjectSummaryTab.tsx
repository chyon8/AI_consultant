import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Icons } from './Icons';

interface ProjectSummaryTabProps {
  content: string;
}

export const ProjectSummaryTab: React.FC<ProjectSummaryTabProps> = ({ content }) => {
  if (!content) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 min-h-[400px] flex items-center justify-center">
          <div className="text-center text-slate-400 dark:text-slate-500">
            <Icons.Dashboard size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">프로젝트 분석 후 요약 정보가 표시됩니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-white prose-h2:text-lg prose-h2:font-bold prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-slate-700 prose-h2:pb-2 prose-h2:mb-4 prose-h3:text-base prose-h3:font-semibold prose-ul:my-2 prose-li:my-0.5">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
