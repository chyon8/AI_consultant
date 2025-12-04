import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Icons } from './Icons';

interface ProjectSummaryTabProps {
  content: string;
  aiInsight?: string;
}

interface ProjectInfo {
  name: string;
  goals: string;
  coreValues: string[];
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
  projectInfo: ProjectInfo | null;
  overview: string;
  techStack: TechItem[];
  modules: ModuleData[];
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\*\s+/gm, '')
    .replace(/\*([^*\s][^*]*[^*\s])\*/g, '$1')
    .replace(/\*([^*\s])\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^[-•]\s*/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function cleanTechItem(item: string): string {
  return stripMarkdown(item)
    .replace(/^[\s:,]+/, '')
    .replace(/[\s:,]+$/, '')
    .replace(/^\*+\s*/, '')
    .trim();
}

function parseStep1Content(content: string): ParsedData {
  const result: ParsedData = {
    projectInfo: null,
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

  const nameMatch = step1.match(/프로젝트\s*(?:명|이름)[:\s]*["']?([^"'\n]+?)["']?(?:\n|$)/i) ||
                    step1.match(/프로젝트[:\s]*["']?([^"'\n]+?)["']?(?:\n|비즈니스|목표|$)/i);
  
  const goalsMatch = step1.match(/(?:비즈니스\s*)?목표[:\s]*([^\n]+)/i) ||
                     step1.match(/목적[:\s]*([^\n]+)/i);
  
  const coreValuesMatch = step1.match(/핵심\s*(?:가치|기능|요소)[:\s]*([^\n]+)/i) ||
                          step1.match(/주요\s*(?:가치|기능|특징)[:\s]*([^\n]+)/i);

  if (nameMatch || goalsMatch || coreValuesMatch) {
    result.projectInfo = {
      name: nameMatch ? stripMarkdown(nameMatch[1]).trim() : '',
      goals: goalsMatch ? stripMarkdown(goalsMatch[1]).trim() : '',
      coreValues: coreValuesMatch 
        ? coreValuesMatch[1].split(/[,،、]/).map(v => stripMarkdown(v).trim()).filter(v => v.length > 0)
        : []
    };
  }

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
        .filter(item => item.length > 0 && item.length < 50 && !item.match(/^\*+$/));
      
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

export const ProjectSummaryTab: React.FC<ProjectSummaryTabProps> = ({ content, aiInsight }) => {
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
  const hasProjectInfo = parsedData.projectInfo && (parsedData.projectInfo.name || parsedData.projectInfo.goals);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* AI Assistant Section */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          AI Assistant
        </h3>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Icons.Bot size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              프로젝트 인사이트
            </span>
          </div>
          <div className="px-5 py-5 prose prose-sm dark:prose-invert max-w-none
            prose-headings:text-slate-800 dark:prose-headings:text-slate-100
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-slate-700
            prose-h3:text-sm prose-h3:mt-5 prose-h3:mb-2
            prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-2
            prose-ul:my-2 prose-ul:space-y-1
            prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-li:leading-relaxed prose-li:my-0
            prose-strong:text-slate-800 dark:prose-strong:text-slate-100 prose-strong:font-semibold
            prose-hr:my-4 prose-hr:border-slate-200 dark:prose-hr:border-slate-700
          ">
            {aiInsight ? (
              <ReactMarkdown
                components={{
                  h2: ({children}) => <h2 className="flex items-center gap-2"><span className="w-1 h-4 bg-emerald-500 rounded-full" />{children}</h2>,
                  h3: ({children}) => <h3 className="text-emerald-600 dark:text-emerald-400">{children}</h3>,
                  li: ({children}) => <li className="relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-slate-300 dark:before:bg-slate-600 before:rounded-full">{children}</li>,
                }}
              >
                {aiInsight}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                본 프로젝트는 <span className="font-medium text-slate-700 dark:text-slate-200">B2C 이커머스</span> 도메인에 속하며, 모바일 우선 전략이 핵심입니다. 
                총 <span className="font-medium text-slate-700 dark:text-slate-200">{parsedData.modules.length}개 모듈</span>과 <span className="font-medium text-slate-700 dark:text-slate-200">{totalFeatures}개 기능</span>으로 구성되어 있으며, 
                결제 시스템과 사용자 경험 최적화가 프로젝트 성공의 핵심 요소입니다. 
                예상 개발 기간은 파트너 유형에 따라 4~6개월로 산정됩니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Project Info Card */}
      {hasProjectInfo && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Project
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Project Name */}
            {parsedData.projectInfo?.name && (
              <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-800/50">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-1">
                  프로젝트명
                </div>
                <div className="text-lg font-medium text-slate-900 dark:text-white">
                  {parsedData.projectInfo.name}
                </div>
              </div>
            )}
            
            {/* Business Goals */}
            {parsedData.projectInfo?.goals && (
              <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-800/50">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-1">
                  비즈니스 목표
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {parsedData.projectInfo.goals}
                </div>
              </div>
            )}
            
            {/* Core Values */}
            {parsedData.projectInfo?.coreValues && parsedData.projectInfo.coreValues.length > 0 && (
              <div className="px-5 py-4">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-3">
                  핵심 가치
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsedData.projectInfo.coreValues.map((value, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
      {!hasModules && !hasTech && !parsedData.overview && !hasProjectInfo && (
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
