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
    <div className={`inline-flex flex-col px-3 py-2 rounded-lg border ${colorClasses[color]}`}>
      <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
};

const AIAssistantSection: React.FC<{ 
  insight?: string; 
  loading?: boolean; 
  error?: string;
}> = ({ insight, loading, error }) => {
  const { parsedInsight, parseError } = useMemo<{ parsedInsight: AIInsightData | null; parseError: string | null }>(() => {
    if (!insight) return { parsedInsight: null, parseError: null };
    try {
      let jsonStr = insight.trim();
      const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      return { parsedInsight: JSON.parse(jsonStr), parseError: null };
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
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
      <h3 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase mb-3">
        AI 어시스턴트
      </h3>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Icons.Zap size={20} className="text-white" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {parsedInsight.project_title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">프로젝트 브리핑</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
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
              color="purple" 
            />
            <DashboardBadge 
              label="카테고리" 
              value={parsedInsight.dashboard.category} 
              color="blue" 
            />
          </div>
          {parsedInsight.dashboard.difficulty_reason && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic">
              * 난이도 근거: {parsedInsight.dashboard.difficulty_reason}
            </p>
          )}
        </div>

        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Icons.File size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">현재 상태</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-700 dark:text-slate-300">{parsedInsight.current_status.status}</p>
            {parsedInsight.current_status.history && (
              <p className="text-xs text-slate-500 dark:text-slate-400">히스토리: {parsedInsight.current_status.history}</p>
            )}
          </div>
        </div>

        {parsedInsight.gap_analysis && parsedInsight.gap_analysis.length > 0 && (
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Icons.ArrowRight size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Gap 분석</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 pr-4">영역</th>
                    <th className="pb-2 pr-4">As-Is</th>
                    <th className="pb-2">To-Be</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedInsight.gap_analysis.map((gap, idx) => (
                    <tr key={idx}>
                      <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">{gap.category}</td>
                      <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{gap.as_is}</td>
                      <td className="py-2 text-emerald-600 dark:text-emerald-400">{gap.to_be}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Icons.Settings size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">기술 범위</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">필수 기술</p>
              <p className="text-slate-700 dark:text-slate-300">{parsedInsight.technical_scope.required_tech || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">제안 스택</p>
              <p className="text-slate-700 dark:text-slate-300">{parsedInsight.technical_scope.suggested_stack || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">준비된 자원</p>
              <p className="text-slate-700 dark:text-slate-300">{parsedInsight.technical_scope.resources_done || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">개발할 자원</p>
              <p className="text-slate-700 dark:text-slate-300">{parsedInsight.technical_scope.resources_todo || '-'}</p>
            </div>
          </div>
        </div>

        {parsedInsight.checkpoints && parsedInsight.checkpoints.length > 0 && (
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Icons.Alert size={16} className="text-amber-500" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">확인 필요 사항</span>
            </div>
            <ul className="space-y-2">
              {parsedInsight.checkpoints.map((checkpoint, idx) => (
                <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 font-bold">{idx + 1}.</span>
                  <span>{checkpoint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-5 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
          <div className="flex items-center gap-2 mb-3">
            <Icons.Zap size={16} className="text-violet-500" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">So What?</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">누가</p>
              <p className="text-slate-700 dark:text-slate-300">{parsedInsight.so_what.who}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">왜</p>
              <p className="text-slate-700 dark:text-slate-300">{parsedInsight.so_what.why}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">어디서</p>
              <p className="text-slate-700 dark:text-slate-300">{parsedInsight.so_what.where}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">무엇을</p>
              <p className="text-slate-700 dark:text-slate-300">{parsedInsight.so_what.what}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">어떻게</p>
              <p className="text-slate-700 dark:text-slate-300">{parsedInsight.so_what.how}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">언제</p>
              <p className="text-slate-700 dark:text-slate-300">{parsedInsight.so_what.when}</p>
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-violet-200 dark:border-violet-800">
            <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
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
  summary 
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

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <AIAssistantSection 
        insight={aiInsight} 
        loading={aiInsightLoading} 
        error={aiInsightError} 
      />

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
