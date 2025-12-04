import React, { useMemo } from 'react';
import { Icons } from './Icons';

interface ProjectSummaryTabProps {
  content: string;
}

interface TechItem {
  layer: string;
  items: string[];
}

interface ModuleData {
  name: string;
  features: string[];
}

interface ParsedData {
  overview: string;
  techStack: TechItem[];
  modules: ModuleData[];
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^[-*•]\s*/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function cleanTechItem(item: string): string {
  return stripMarkdown(item)
    .replace(/^[\s:,]+/, '')
    .replace(/[\s:,]+$/, '')
    .trim();
}

function parseStep1Content(content: string): ParsedData {
  const result: ParsedData = {
    overview: '',
    techStack: [],
    modules: []
  };

  if (!content) return result;

  const step2Index = content.search(/##\s*STEP\s*2/i);
  const jsonIndex = content.search(/```json/i);
  let endIndex = content.length;
  if (step2Index > 0) endIndex = Math.min(endIndex, step2Index);
  if (jsonIndex > 0) endIndex = Math.min(endIndex, jsonIndex);
  const step1 = content.substring(0, endIndex);

  const overviewMatch = step1.match(/프로젝트\s*개요[:\s]*([\s\S]*?)(?=\n\s*(?:###|##|\*\s*시스템|시스템\s*아키텍처|기술\s*스택|기능\s*명세))/i);
  if (overviewMatch) {
    result.overview = stripMarkdown(overviewMatch[1]).replace(/\n+/g, ' ').trim();
  }

  const techPatterns = [
    { key: 'Frontend', pattern: /(?:프론트엔드|Frontend|FE)\s*[:\-]?\s*([^\n]+)/i },
    { key: 'Backend', pattern: /(?:백엔드|Backend|BE)\s*[:\-]?\s*([^\n]+)/i },
    { key: 'Database', pattern: /(?:데이터베이스|Database|DB)\s*[:\-]?\s*([^\n]+)/i },
    { key: 'Infra', pattern: /(?:인프라|Infrastructure|Infra|클라우드|Cloud)\s*[:\-]?\s*([^\n]+)/i },
  ];

  for (const { key, pattern } of techPatterns) {
    const match = step1.match(pattern);
    if (match) {
      const rawItems = match[1];
      const items = rawItems
        .split(/[,،、\/]/)
        .map(cleanTechItem)
        .filter(item => item.length > 0 && item.length < 50 && !item.includes('*'));
      
      if (items.length > 0) {
        result.techStack.push({ layer: key, items });
      }
    }
  }

  const moduleMatches = step1.matchAll(/\[([^\]]+)\]\s*[:\-]?\s*([^\[\n]*(?:\n(?!\s*\[)[^\[\n]*)*)/g);
  
  for (const match of moduleMatches) {
    const moduleName = stripMarkdown(match[1]);
    if (moduleName.toLowerCase().includes('mode:') || moduleName.length > 50) continue;
    
    const featureText = match[2] || '';
    const features = featureText
      .split(/[,،、\n]/)
      .map(f => stripMarkdown(f))
      .filter(f => f.length > 1 && f.length < 80);
    
    if (features.length > 0 || moduleName.length > 0) {
      result.modules.push({ 
        name: moduleName, 
        features: features.length > 0 ? features : ['핵심 기능']
      });
    }
  }

  return result;
}

export const ProjectSummaryTab: React.FC<ProjectSummaryTabProps> = ({ content }) => {
  const parsedData = useMemo(() => parseStep1Content(content), [content]);

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

  const totalFeatures = parsedData.modules.reduce((sum, m) => sum + m.features.length, 0);
  const hasModules = parsedData.modules.length > 0;
  const hasTech = parsedData.techStack.length > 0;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Metrics */}
      {hasModules && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
            <div className="text-4xl font-extralight text-slate-900 dark:text-white tracking-tight">
              {parsedData.modules.length}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 tracking-[0.2em] uppercase">
              Modules
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
            <div className="text-4xl font-extralight text-slate-900 dark:text-white tracking-tight">
              {totalFeatures}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 tracking-[0.2em] uppercase">
              Features
            </div>
          </div>
        </div>
      )}

      {/* Overview */}
      {parsedData.overview && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Overview
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {parsedData.overview}
            </p>
          </div>
        </div>
      )}

      {/* Tech Stack */}
      {hasTech && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Tech Stack
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800">
            {parsedData.techStack.map((layer, idx) => (
              <div key={idx} className="flex items-center p-4 gap-4">
                <div className="w-20 flex-shrink-0">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                    {layer.layer}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {layer.items.map((item, iIdx) => (
                    <span 
                      key={iIdx}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Architecture */}
      {hasModules && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Module Architecture
          </h3>
          
          <div className="space-y-3">
            {parsedData.modules.map((module, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {module.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                    {module.features.length} features
                  </span>
                </div>
                
                <div className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {module.features.map((feature, fIdx) => (
                      <span
                        key={fIdx}
                        className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distribution Chart */}
      {parsedData.modules.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Feature Distribution
          </h3>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5">
            <div className="space-y-3">
              {parsedData.modules.map((module, idx) => {
                const pct = totalFeatures > 0 ? Math.round((module.features.length / totalFeatures) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-28 text-xs text-slate-500 dark:text-slate-400 truncate">
                      {module.name}
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-400 dark:bg-slate-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-10 text-right text-xs font-medium text-slate-600 dark:text-slate-300">
                      {pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasModules && !hasTech && !parsedData.overview && (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="text-center">
            <Icons.Dashboard size={32} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              분석 결과를 처리하는 중...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
