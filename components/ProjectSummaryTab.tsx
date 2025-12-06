import React, { useMemo } from 'react';
import { Icons } from './Icons';

interface SummaryData {
  keyPoints: string[];
  risks: string[];
  recommendations: string[];
}

interface AIInsightData {
  project_title: string;
  dashboard: {
    is_new_build: string;
    difficulty: string;
    difficulty_reason: string;
    work_scope: string[];
    category: string;
  };
  current_status: {
    status: string;
    history: string;
  };
  gap_analysis: Array<{
    category: string;
    as_is: string;
    to_be: string;
  }>;
  technical_scope: {
    required_tech: string;
    suggested_stack: string;
    resources_done: string;
    resources_todo: string;
  };
  checkpoints: string[];
  so_what: {
    who: string;
    why: string;
    where: string;
    what: string;
    how: string;
    when: string;
    one_line_conclusion: string;
  };
}

interface ProjectSummaryTabProps {
  content: string;
  aiInsight?: string;
  aiInsightLoading?: boolean;
  aiInsightError?: string;
  summary?: SummaryData | null;
  onGenerateInsight?: () => void;
}

const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded" style={{ width: `${85 - i * 15}%` }} />
    ))}
  </div>
);

const DashboardBadge: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = "blue" }) => {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    green: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    amber: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    red: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  };

  return (
    <div className={`inline-flex flex-col px-4 py-2.5 rounded-xl border shadow-sm ${colorClasses[color]}`}>
      <span className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
};

const AIAssistantSection: React.FC<{ 
  insight?: string; 
  loading?: boolean; 
  error?: string;
  onRegenerate?: () => void;
}> = ({ insight, loading, error, onRegenerate }) => {
  const { parsedInsight, parseError } = useMemo<{ parsedInsight: AIInsightData | null; parseError: string | null }>(() => {
    if (!insight) return { parsedInsight: null, parseError: null };
    try {
      let jsonStr = insight.trim();
      const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(jsonStr);
      const normalized: AIInsightData = {
        project_title: parsed.project_title || '프로젝트',
        dashboard: {
          is_new_build: parsed.dashboard?.is_new_build || '-',
          difficulty: parsed.dashboard?.difficulty || '-',
          difficulty_reason: parsed.dashboard?.difficulty_reason || '',
          work_scope: parsed.dashboard?.work_scope || [],
          category: parsed.dashboard?.category || '-',
        },
        current_status: {
          status: parsed.current_status?.status || '-',
          history: parsed.current_status?.history || '',
        },
        gap_analysis: parsed.gap_analysis || [],
        technical_scope: {
          required_tech: parsed.technical_scope?.required_tech || '',
          suggested_stack: parsed.technical_scope?.suggested_stack || '',
          resources_done: parsed.technical_scope?.resources_done || '',
          resources_todo: parsed.technical_scope?.resources_todo || '',
        },
        checkpoints: parsed.checkpoints || [],
        so_what: {
          who: parsed.so_what?.who || '-',
          why: parsed.so_what?.why || '-',
          where: parsed.so_what?.where || '-',
          what: parsed.so_what?.what || '-',
          how: parsed.so_what?.how || '-',
          when: parsed.so_what?.when || '-',
          one_line_conclusion: parsed.so_what?.one_line_conclusion || '-',
        },
      };
      return { parsedInsight: normalized, parseError: null };
    } catch (e) {
      console.error('Failed to parse AI insight JSON:', e);
      return { parsedInsight: null, parseError: 'AI 응답 형식을 파싱하는데 실패했습니다. 다시 시도해주세요.' };
    }
  }, [insight]);

  const displayError = error || parseError;

  if (displayError) {
    return (
      <div className="mb-8">
        <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase mb-3">
          AI 어시스턴트
        </h3>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Icons.Alert size={18} />
            <span className="text-sm font-medium">분석 오류</span>
          </div>
          <p className="mt-2 text-sm text-red-500 dark:text-red-400">{displayError}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mb-8">
        <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase mb-3">
          AI 어시스턴트
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#534CEC' }}>
              <Icons.Zap size={16} className="text-white" />
            </div>
            <div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded mt-1 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    );
  }

  if (!parsedInsight) {
    return null;
  }

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === '상') return 'red';
    if (difficulty === '중') return 'amber';
    return 'green';
  };

  return (
    <div className="mb-8">
      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-4">
        AI 어시스턴트
      </h3>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#534CEC' }}>
                <Icons.Zap size={22} className="text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {parsedInsight.project_title}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">프로젝트 브리핑</p>
              </div>
            </div>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Icons.Refresh size={13} />
                <span>재생성</span>
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            <DashboardBadge 
              label="신규 여부" 
              value={parsedInsight.dashboard.is_new_build === 'O' ? '신규 구축' : '유지보수'} 
              color={parsedInsight.dashboard.is_new_build === 'O' ? 'green' : 'blue'} 
            />
            <DashboardBadge 
              label="난이도" 
              value={parsedInsight.dashboard.difficulty} 
              color={getDifficultyColor(parsedInsight.dashboard.difficulty)} 
            />
            <DashboardBadge 
              label="범위" 
              value={parsedInsight.dashboard.work_scope.join(', ')} 
              color="blue" 
            />
            <DashboardBadge 
              label="카테고리" 
              value={parsedInsight.dashboard.category} 
              color="blue" 
            />
          </div>
          {parsedInsight.dashboard.difficulty_reason && (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
              <span className="font-medium">난이도 근거:</span> {parsedInsight.dashboard.difficulty_reason}
            </p>
          )}
        </div>

        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Icons.File size={16} className="text-slate-500 dark:text-slate-400" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">현재 상태</span>
          </div>
          <div className="space-y-3 pl-10">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{parsedInsight.current_status.status}</p>
            {parsedInsight.current_status.history && (
              <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                <span className="font-medium">히스토리:</span> {parsedInsight.current_status.history}
              </p>
            )}
          </div>
        </div>

        {parsedInsight.gap_analysis && parsedInsight.gap_analysis.length > 0 && (
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <Icons.ArrowRight size={16} className="text-emerald-500 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Gap 분석</span>
            </div>
            <div className="overflow-x-auto pl-10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="pb-3 pr-4 font-bold">영역</th>
                    <th className="pb-3 pr-4 font-bold">As-Is (현재)</th>
                    <th className="pb-3 font-bold">To-Be (목표)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedInsight.gap_analysis.map((gap, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{gap.category}</td>
                      <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{gap.as_is}</td>
                      <td className="py-3 text-emerald-600 dark:text-emerald-400 font-medium">{gap.to_be}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Icons.Settings size={16} className="text-blue-500 dark:text-blue-400" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">기술 범위</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pl-10">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">필수 기술</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{parsedInsight.technical_scope.required_tech || '-'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">제안 스택</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{parsedInsight.technical_scope.suggested_stack || '-'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">준비된 자원</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{parsedInsight.technical_scope.resources_done || '-'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">개발할 자원</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{parsedInsight.technical_scope.resources_todo || '-'}</p>
            </div>
          </div>
        </div>

        {parsedInsight.checkpoints && parsedInsight.checkpoints.length > 0 && (
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <Icons.Alert size={16} className="text-amber-500 dark:text-amber-400" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">확인 필요 사항</span>
            </div>
            <ul className="space-y-3 pl-10">
              {parsedInsight.checkpoints.map((checkpoint, idx) => (
                <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                  <span className="leading-relaxed pt-0.5">{checkpoint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-sky-900/20">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#534CEC' }}>
              <Icons.Zap size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">So What?</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-5 pl-10">
            <div className="bg-white/70 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-1 uppercase tracking-wide">누가</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{parsedInsight.so_what.who}</p>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-1 uppercase tracking-wide">왜</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{parsedInsight.so_what.why}</p>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-1 uppercase tracking-wide">어디서</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{parsedInsight.so_what.where}</p>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-1 uppercase tracking-wide">무엇을</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{parsedInsight.so_what.what}</p>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-1 uppercase tracking-wide">어떻게</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{parsedInsight.so_what.how}</p>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-1 uppercase tracking-wide">언제</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{parsedInsight.so_what.when}</p>
            </div>
          </div>
          <div className="ml-10 p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-sm">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 leading-relaxed">
              {parsedInsight.so_what.one_line_conclusion}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectSummaryTab: React.FC<ProjectSummaryTabProps> = ({ 
  aiInsight, 
  aiInsightLoading, 
  aiInsightError, 
  summary,
  onGenerateInsight
}) => {
  if (!summary && !aiInsight && !aiInsightLoading) {
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

  const hasSummary = summary && (summary.keyPoints.length > 0 || summary.risks.length > 0 || summary.recommendations.length > 0);

  const showGenerateButton = !aiInsight && !aiInsightLoading && !aiInsightError && onGenerateInsight;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {showGenerateButton ? (
        <div className="mb-8">
          <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase mb-3">
            AI 어시스턴트
          </h3>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#534CEC' }}>
                <Icons.Zap size={20} className="text-white" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  AI 프로젝트 브리핑
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">프로젝트 분석 결과를 기반으로 상세 인사이트를 생성합니다</p>
              </div>
            </div>
            <button
              onClick={onGenerateInsight}
              className="w-full px-4 py-3 text-white font-medium rounded-lg transition-opacity hover:opacity-90 flex items-center justify-center"
              style={{ backgroundColor: '#534CEC' }}
            >
              AI 어시스턴트 생성
            </button>
          </div>
        </div>
      ) : (aiInsight || aiInsightLoading || aiInsightError) && (
        <AIAssistantSection 
          insight={aiInsight} 
          loading={aiInsightLoading} 
          error={aiInsightError}
          onRegenerate={onGenerateInsight}
        />
      )}

      {hasSummary && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            프로젝트 요약
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
            {summary.keyPoints.length > 0 && (
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icons.Check size={16} className="text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">핵심 포인트</span>
                </div>
                <ul className="space-y-2">
                  {summary.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {summary.risks.length > 0 && (
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icons.Alert size={16} className="text-amber-500" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">리스크</span>
                </div>
                <ul className="space-y-2">
                  {summary.risks.map((risk, idx) => (
                    <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {summary.recommendations.length > 0 && (
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icons.Zap size={16} className="text-blue-500" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">권장사항</span>
                </div>
                <ul className="space-y-2">
                  {summary.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
