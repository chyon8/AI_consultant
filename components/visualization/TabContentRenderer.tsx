import React from 'react';
import { 
  AIResponse, 
  VisualizationComponent, 
  VisualizationComponentType,
  Step1Payload,
  Step2Payload,
  Step3Payload,
  Step4Payload,
  MetricCardData,
} from '../../types';
import { MetricCardGrid } from './MetricCard';
import { BarChartComponent, PieChartComponent, ComparisonBarChart } from './Charts';
import { DataTable } from './DataTable';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Timeline, GanttChart } from './Timeline';
import { Loader2, FileText, BarChart3, Layout, Clock } from 'lucide-react';

interface TabContentRendererProps {
  response?: AIResponse;
  isLoading?: boolean;
  step: 1 | 2 | 3 | 4;
  fallbackContent?: React.ReactNode;
}

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

const formatCurrency = (value: number): string => {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만`;
  }
  return value.toLocaleString();
};

export const TabContentRenderer: React.FC<TabContentRendererProps> = ({
  response,
  isLoading,
  step,
  fallbackContent,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400">AI 분석 중...</p>
      </div>
    );
  }

  if (!response) {
    return fallbackContent || (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500 dark:text-slate-400">데이터가 없습니다</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          프로젝트를 분석하면 결과가 표시됩니다
        </p>
      </div>
    );
  }

  const { visualization_hints, structured_payload, raw_content, format_type } = response;

  if (format_type === 'markdown' && raw_content) {
    return <MarkdownRenderer content={raw_content} />;
  }

  const layout = visualization_hints?.layout || 'single';
  const components = visualization_hints?.components || [];

  if (components.length === 0) {
    return renderStepContent(step, structured_payload, raw_content);
  }

  if (layout === 'two-column') {
    const leftComponents = components.filter((_, i) => i % 2 === 0);
    const rightComponents = components.filter((_, i) => i % 2 === 1);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {leftComponents.map((comp, index) => (
            <div key={index}>
              {renderComponent(comp, structured_payload, raw_content)}
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {rightComponents.map((comp, index) => (
            <div key={index}>
              {renderComponent(comp, structured_payload, raw_content)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((comp, index) => (
          <div key={index}>
            {renderComponent(comp, structured_payload, raw_content)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {components.map((comp, index) => (
        <div key={index}>
          {renderComponent(comp, structured_payload, raw_content)}
        </div>
      ))}
    </div>
  );
};

function renderComponent(
  comp: VisualizationComponent,
  payload: any,
  rawContent: string
): React.ReactNode {
  const data = comp.source === 'raw_content' 
    ? rawContent 
    : getNestedValue(payload, comp.source.replace('structured_payload.', ''));

  switch (comp.type) {
    case 'markdown':
      return <MarkdownRenderer content={data || ''} />;

    case 'metric_card':
      if (Array.isArray(data)) {
        return <MetricCardGrid metrics={data as MetricCardData[]} />;
      }
      return null;

    case 'bar_chart':
      return (
        <BarChartComponent
          data={data || []}
          title={comp.title}
          xAxisKey={comp.config?.xAxis}
          barKeys={comp.config?.yAxis ? [comp.config.yAxis] : undefined}
          showLegend={comp.config?.showLegend}
          formatValue={formatCurrency}
        />
      );

    case 'pie_chart':
      return (
        <PieChartComponent
          data={data || []}
          title={comp.title}
          showLegend={comp.config?.showLegend}
        />
      );

    case 'table':
      const columns = comp.config?.columns?.map(col => ({
        key: col,
        header: col,
        sortable: true,
      })) || [];
      return (
        <DataTable
          data={data || []}
          columns={columns}
          title={comp.title}
          searchable
        />
      );

    case 'timeline':
      return (
        <Timeline
          items={data || []}
          title={comp.title}
        />
      );

    case 'wbs_gantt':
      return (
        <GanttChart
          phases={data || []}
          totalWeeks={24}
          title={comp.title}
        />
      );

    default:
      return <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>;
  }
}

function renderStepContent(step: number, payload: any, rawContent: string): React.ReactNode {
  switch (step) {
    case 1:
      return <Step1Content payload={payload as Step1Payload} rawContent={rawContent} />;
    case 2:
      return <Step2Content payload={payload as Step2Payload} rawContent={rawContent} />;
    case 3:
      return <Step3Content payload={payload as Step3Payload} rawContent={rawContent} />;
    case 4:
      return <Step4Content payload={payload as Step4Payload} rawContent={rawContent} />;
    default:
      return <MarkdownRenderer content={rawContent} />;
  }
}

const Step1Content: React.FC<{ payload: Step1Payload; rawContent: string }> = ({ payload, rawContent }) => {
  if (!payload) {
    return <MarkdownRenderer content={rawContent} />;
  }

  const metrics: MetricCardData[] = [
    { label: '모듈 수', value: payload.modules?.length || 0, unit: '개', icon: 'layers', color: 'blue' },
    { label: '기술 스택', value: payload.techStack?.length || 0, unit: '개', icon: 'package', color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {payload.projectTitle || '프로젝트 분석'}
        </h2>
        {payload.projectSummary && (
          <p className="text-slate-600 dark:text-slate-300">{payload.projectSummary}</p>
        )}
      </div>

      <MetricCardGrid metrics={metrics} columns={2} />

      {payload.architecture && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-500" />
            아키텍처 개요
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">{payload.architecture.overview}</p>
          {payload.architecture.layers && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {payload.architecture.layers.map((layer, index) => (
                <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{layer.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{layer.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {payload.techStack && payload.techStack.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">기술 스택</h3>
          <div className="flex flex-wrap gap-2">
            {payload.techStack.map((tech, index) => (
              <span 
                key={index}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Step2Content: React.FC<{ payload: Step2Payload; rawContent: string }> = ({ payload, rawContent }) => {
  if (!payload) {
    return <MarkdownRenderer content={rawContent} />;
  }

  const { estimates, costBreakdown, comparisonTable } = payload;

  const comparisonData = estimates ? [
    { 
      label: '예상 비용', 
      typeA: estimates.typeA?.minCost || 0,
      typeB: estimates.typeB?.minCost || 0, 
      typeC: estimates.typeC?.minCost || 0 
    },
  ] : [];

  return (
    <div className="space-y-6">
      {estimates && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['A', 'B', 'C'].map((type) => {
            const estimate = estimates[`type${type}` as keyof typeof estimates];
            if (!estimate) return null;
            const colors = type === 'A' ? 'indigo' : type === 'B' ? 'emerald' : 'amber';
            return (
              <div 
                key={type}
                className={`p-5 rounded-xl border-2 border-${colors}-200 dark:border-${colors}-800 bg-${colors}-50/50 dark:bg-${colors}-900/20`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold bg-${colors}-500 text-white`}>
                    TYPE {type}
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(estimate.minCost)}원
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  ~ {formatCurrency(estimate.maxCost)}원
                </p>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Clock className="w-4 h-4" />
                    {estimate.duration}
                  </div>
                  {estimate.totalManMonths && (
                    <p className="text-xs text-slate-400 mt-1">
                      총 {estimate.totalManMonths} M/M · {estimate.teamSize}명 투입
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {comparisonData.length > 0 && (
        <ComparisonBarChart
          data={comparisonData}
          title="유형별 비용 비교"
          formatValue={formatCurrency}
        />
      )}

      {costBreakdown && costBreakdown.length > 0 && (
        <PieChartComponent
          data={costBreakdown.map(item => ({ name: item.category, value: item.amount }))}
          title="비용 구성"
        />
      )}

      {comparisonTable && comparisonTable.length > 0 && (
        <DataTable
          data={comparisonTable}
          columns={[
            { key: 'feature', header: '항목', sortable: true },
            { key: 'typeA', header: 'TYPE A', align: 'right' },
            { key: 'typeB', header: 'TYPE B', align: 'right' },
            { key: 'typeC', header: 'TYPE C', align: 'right' },
          ]}
          title="유형별 상세 비교"
          searchable
        />
      )}
    </div>
  );
};

const Step3Content: React.FC<{ payload: Step3Payload; rawContent: string }> = ({ payload, rawContent }) => {
  if (!payload) {
    return <MarkdownRenderer content={rawContent} />;
  }

  const { phases, milestones, resources, totalDuration } = payload;

  const metrics: MetricCardData[] = [
    { label: '총 기간', value: totalDuration || '-', icon: 'clock', color: 'blue' },
    { label: '단계 수', value: phases?.length || 0, unit: '개', icon: 'layers', color: 'green' },
    { label: '마일스톤', value: milestones?.length || 0, unit: '개', icon: 'package', color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      <MetricCardGrid metrics={metrics} columns={3} />

      {phases && phases.length > 0 && (
        <GanttChart
          phases={phases}
          totalWeeks={Math.max(...phases.map(p => p.endWeek), 24)}
          title="프로젝트 일정"
          description="단계별 개발 일정 (주 단위)"
        />
      )}

      {milestones && milestones.length > 0 && (
        <Timeline
          items={milestones.map((m, i) => ({
            id: String(i),
            title: m.name,
            description: m.description,
            date: `Week ${m.week}`,
            status: i === 0 ? 'current' : 'upcoming',
          }))}
          title="마일스톤"
          orientation="horizontal"
        />
      )}

      {resources && resources.length > 0 && (
        <DataTable
          data={resources}
          columns={[
            { key: 'role', header: '역할', sortable: true },
            { key: 'count', header: '인원', align: 'center' },
            { key: 'allocation', header: '투입 기간' },
          ]}
          title="투입 리소스"
        />
      )}
    </div>
  );
};

const Step4Content: React.FC<{ payload: Step4Payload; rawContent: string }> = ({ payload, rawContent }) => {
  if (!payload?.rfpDocument && !rawContent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500 dark:text-slate-400">공고문이 생성되지 않았습니다</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          공고문 생성 버튼을 클릭하여 RFP를 생성하세요
        </p>
      </div>
    );
  }

  const content = payload?.rfpDocument || rawContent;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">입찰 공고문</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">AI가 생성한 RFP 문서</p>
        </div>
      </div>
      <MarkdownRenderer content={content} />
    </div>
  );
};

export default TabContentRenderer;
