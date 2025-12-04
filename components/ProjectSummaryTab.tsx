import React, { useMemo } from 'react';
import { Icons } from './Icons';

interface ProjectSummaryTabProps {
  content: string;
}

interface ParsedOverview {
  title: string;
  description: string;
  goals: string[];
}

interface ArchitectureItem {
  layer: string;
  items: string[];
}

interface ModuleData {
  name: string;
  features: string[];
}

interface ParsedData {
  overview: ParsedOverview | null;
  architecture: ArchitectureItem[];
  modules: ModuleData[];
}

function parseStep1Content(content: string): ParsedData {
  const result: ParsedData = {
    overview: null,
    architecture: [],
    modules: []
  };

  if (!content) return result;

  const step2Index = content.search(/##\s*STEP\s*2/i);
  const jsonIndex = content.search(/```json/i);
  let endIndex = content.length;
  if (step2Index > 0) endIndex = Math.min(endIndex, step2Index);
  if (jsonIndex > 0) endIndex = Math.min(endIndex, jsonIndex);
  const step1 = content.substring(0, endIndex);

  const overviewMatch = step1.match(/프로젝트\s*개요[:\s]*([\s\S]*?)(?=###|##|시스템|기술|기능\s*명세|$)/i);
  if (overviewMatch) {
    const overviewText = overviewMatch[1].trim();
    const lines = overviewText.split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(l => l.length > 0);
    const titleMatch = step1.match(/프로젝트[:\s]*["']?([^"'\n]+)["']?/i);
    result.overview = {
      title: titleMatch ? titleMatch[1].trim() : '',
      description: lines[0] || '',
      goals: lines.slice(1).filter(l => l.length > 5 && l.length < 200)
    };
  }

  const archMatch = step1.match(/(?:시스템\s*아키텍처|기술\s*스택)[^:]*[:\s]*([\s\S]*?)(?=###|##|기능\s*명세|\[|$)/i);
  if (archMatch) {
    const archText = archMatch[1];
    
    const feMatch = archText.match(/(?:프론트엔드|Frontend|FE)[:\s]*([^\n]+)/i);
    if (feMatch) {
      result.architecture.push({
        layer: 'Frontend',
        items: feMatch[1].split(/[,،、/]/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 50)
      });
    }
    
    const beMatch = archText.match(/(?:백엔드|Backend|BE)[:\s]*([^\n]+)/i);
    if (beMatch) {
      result.architecture.push({
        layer: 'Backend',
        items: beMatch[1].split(/[,،、/]/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 50)
      });
    }
    
    const dbMatch = archText.match(/(?:데이터베이스|Database|DB)[:\s]*([^\n]+)/i);
    if (dbMatch) {
      result.architecture.push({
        layer: 'Database',
        items: dbMatch[1].split(/[,،、/]/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 50)
      });
    }
    
    const infraMatch = archText.match(/(?:인프라|Infra|클라우드|Cloud)[:\s]*([^\n]+)/i);
    if (infraMatch) {
      result.architecture.push({
        layer: 'Infra',
        items: infraMatch[1].split(/[,،、/]/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 50)
      });
    }
  }

  const moduleRegex = /\[([^\]]+)\][:\s]*([^\[]*?)(?=\[|###|##|STEP|```|$)/gi;
  let match;
  while ((match = moduleRegex.exec(step1)) !== null) {
    const moduleName = match[1].trim();
    if (moduleName.toLowerCase().includes('mode:')) continue;
    
    const featureText = match[2].trim();
    const features = featureText
      .split(/[,،、\n]/)
      .map(f => f.replace(/^[-*•]\s*/, '').trim())
      .filter(f => f.length > 1 && f.length < 80);
    
    if (features.length > 0) {
      result.modules.push({ name: moduleName, features });
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
  const hasData = parsedData.modules.length > 0 || parsedData.architecture.length > 0 || parsedData.overview;

  if (!hasData) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Icons.Dashboard size={32} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 dark:text-slate-500">
            분석 결과를 처리하는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Metrics Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50">
          <div className="text-3xl font-extralight text-slate-900 dark:text-white tracking-tight">
            {parsedData.modules.length}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 tracking-[0.15em] uppercase">
            Modules
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50">
          <div className="text-3xl font-extralight text-slate-900 dark:text-white tracking-tight">
            {totalFeatures}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 tracking-[0.15em] uppercase">
            Features
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50">
          <div className="text-3xl font-extralight text-slate-900 dark:text-white tracking-tight">
            {parsedData.architecture.length}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 tracking-[0.15em] uppercase">
            Layers
          </div>
        </div>
      </div>

      {/* Project Overview */}
      {parsedData.overview && parsedData.overview.description && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Overview
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {parsedData.overview.description}
            </p>
            {parsedData.overview.goals.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {parsedData.overview.goals.slice(0, 5).map((goal, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-full"
                  >
                    {goal.length > 40 ? goal.substring(0, 40) + '...' : goal}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Architecture Stack */}
      {parsedData.architecture.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Tech Stack
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {parsedData.architecture.map((layer, idx) => (
                <div key={idx} className="flex items-start p-4 gap-4">
                  <div className="w-20 flex-shrink-0">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                      {layer.layer}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {layer.items.map((item, iIdx) => (
                      <span 
                        key={iIdx}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Module Architecture */}
      {parsedData.modules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Module Architecture
          </h3>
          
          <div className="relative">
            {/* Vertical Spine */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700" />
            
            <div className="space-y-4 pl-12">
              {parsedData.modules.map((module, idx) => (
                <div key={idx} className="relative">
                  {/* Node Connector */}
                  <div className="absolute -left-7 top-4 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-900" />
                  <div className="absolute -left-12 top-[18px] w-5 h-px bg-slate-200 dark:bg-slate-700" />
                  
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                    {/* Module Header */}
                    <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {module.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 tracking-wider">
                        {module.features.length} FEATURES
                      </span>
                    </div>
                    
                    {/* Features Grid */}
                    <div className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {module.features.map((feature, fIdx) => (
                          <span
                            key={fIdx}
                            className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-100 dark:border-slate-700/50"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feature Distribution */}
      {parsedData.modules.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Feature Distribution
          </h3>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5">
            <div className="space-y-3">
              {parsedData.modules.map((module, idx) => {
                const percentage = totalFeatures > 0 
                  ? Math.round((module.features.length / totalFeatures) * 100) 
                  : 0;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-slate-500 dark:text-slate-400 truncate">
                      {module.name}
                    </div>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-400 dark:bg-slate-500 rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-10 text-right text-xs font-medium text-slate-600 dark:text-slate-300">
                      {percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
