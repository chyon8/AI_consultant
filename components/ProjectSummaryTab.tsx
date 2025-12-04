import React, { useMemo } from 'react';
import { Icons } from './Icons';

interface ProjectSummaryTabProps {
  content: string;
}

interface ParsedSection {
  title: string;
  content: string;
}

interface ModuleData {
  name: string;
  features: string[];
}

export const ProjectSummaryTab: React.FC<ProjectSummaryTabProps> = ({ content }) => {
  const step1Content = useMemo(() => {
    if (!content) return null;
    
    const step1Match = content.match(/##\s*STEP\s*1[.\s]*프로젝트\s*상세\s*기획[^#]*(?=##\s*STEP\s*2|```json|$)/is);
    if (!step1Match) {
      const altMatch = content.match(/프로젝트\s*상세\s*기획[^#]*(?=##|```json|$)/is);
      return altMatch ? altMatch[0] : content.split('## STEP 2')[0];
    }
    return step1Match[0];
  }, [content]);

  const parsedData = useMemo(() => {
    if (!step1Content) return null;

    const sections: ParsedSection[] = [];
    const modules: ModuleData[] = [];

    const overviewMatch = step1Content.match(/프로젝트\s*개요[:\s]*([^*#]+?)(?=\*|###|##|$)/is);
    if (overviewMatch) {
      sections.push({ title: '프로젝트 개요', content: overviewMatch[1].trim() });
    }

    const techMatch = step1Content.match(/(?:시스템\s*아키텍처|기술\s*스택)[^:]*:[^*]*?([^#]+?)(?=###|##|기능\s*명세|$)/is);
    if (techMatch) {
      sections.push({ title: '기술 스택', content: techMatch[1].trim() });
    }

    const moduleRegex = /\[([^\]]+)\][:\s]*([^\[]+?)(?=\[|###|##|$)/g;
    let match;
    while ((match = moduleRegex.exec(step1Content)) !== null) {
      const moduleName = match[1].trim();
      const featureText = match[2].trim();
      const features = featureText
        .split(/[,،、]|\n/)
        .map(f => f.replace(/^[-*•]\s*/, '').trim())
        .filter(f => f.length > 0 && f.length < 100);
      
      if (features.length > 0) {
        modules.push({ name: moduleName, features });
      }
    }

    return { sections, modules };
  }, [step1Content]);

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

  const totalFeatures = parsedData?.modules.reduce((sum, m) => sum + m.features.length, 0) || 0;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Stats Overview - Minimal Data Viz */}
      {parsedData && parsedData.modules.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
            <div className="text-4xl font-extralight text-slate-900 dark:text-white tracking-tight">
              {parsedData.modules.length}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 tracking-widest uppercase">
              Modules
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
            <div className="text-4xl font-extralight text-slate-900 dark:text-white tracking-tight">
              {totalFeatures}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 tracking-widest uppercase">
              Features
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      {parsedData?.sections.map((section, idx) => (
        <div key={idx} className="space-y-3">
          <h3 className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            {section.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {section.content}
          </p>
        </div>
      ))}

      {/* Module Architecture Visualization */}
      {parsedData && parsedData.modules.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Module Architecture
          </h3>
          
          <div className="space-y-3">
            {parsedData.modules.map((module, idx) => (
              <div 
                key={idx}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:border-slate-200 dark:hover:border-slate-700"
              >
                {/* Module Header */}
                <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {module.name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {module.features.length} features
                  </span>
                </div>
                
                {/* Features - Horizontal Flow */}
                <div className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {module.features.map((feature, fIdx) => (
                      <div
                        key={fIdx}
                        className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-700/50"
                      >
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature Distribution Bar */}
                <div className="h-1 bg-slate-50 dark:bg-slate-800">
                  <div 
                    className="h-full bg-slate-200 dark:bg-slate-700 transition-all"
                    style={{ width: `${Math.min((module.features.length / 8) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Distribution Chart */}
      {parsedData && parsedData.modules.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Feature Distribution
          </h3>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5">
            <div className="space-y-3">
              {parsedData.modules.map((module, idx) => {
                const percentage = totalFeatures > 0 
                  ? Math.round((module.features.length / totalFeatures) * 100) 
                  : 0;
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-28 text-xs text-slate-500 dark:text-slate-400 truncate">
                      {module.name}
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-400 dark:bg-slate-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-12 text-right text-xs font-medium text-slate-600 dark:text-slate-300">
                      {percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Raw Content Fallback */}
      {(!parsedData || parsedData.modules.length === 0) && step1Content && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Analysis Result
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6">
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {step1Content
                .replace(/^##\s*STEP\s*1[^\n]*\n*/i, '')
                .replace(/\*\s*\[Mode:[^\]]*\]\s*/g, '')
                .trim()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
