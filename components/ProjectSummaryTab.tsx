import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Icons } from './Icons';

interface ProjectSummaryTabProps {
  content: string;
}

export const ProjectSummaryTab: React.FC<ProjectSummaryTabProps> = ({ content }) => {
  const step1Content = useMemo(() => {
    if (!content) return null;
    
    const step2Index = content.search(/##\s*STEP\s*2/i);
    const jsonIndex = content.search(/```json/i);
    
    let endIndex = content.length;
    if (step2Index > 0) endIndex = Math.min(endIndex, step2Index);
    if (jsonIndex > 0) endIndex = Math.min(endIndex, jsonIndex);
    
    let extracted = content.substring(0, endIndex).trim();
    
    extracted = extracted
      .replace(/^\s*##\s*STEP\s*1[.\s]*/, '')
      .replace(/\*\s*\[Mode:[^\]]*\]\s*/g, '')
      .trim();
    
    return extracted;
  }, [content]);

  if (!content) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Icons.Dashboard size={28} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500 tracking-wide">
            프로젝트 분석 대기 중
          </p>
        </div>
      </div>
    );
  }

  if (!step1Content || step1Content.length < 50) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Icons.Dashboard size={32} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 dark:text-slate-500">
            프로젝트 상세 기획 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-medium text-slate-900 dark:text-white tracking-wide">
            프로젝트 상세 기획
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Project Planning & Architecture
          </p>
        </div>
        
        <div className="p-6">
          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none
            prose-headings:text-slate-900 dark:prose-headings:text-white 
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-100 dark:prose-h2:border-slate-800
            prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-2
            prose-ul:my-2 prose-ul:pl-4
            prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-li:my-0.5 prose-li:leading-relaxed
            prose-strong:text-slate-800 dark:prose-strong:text-slate-200 prose-strong:font-semibold
            prose-code:text-xs prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
          ">
            <ReactMarkdown>{step1Content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};
