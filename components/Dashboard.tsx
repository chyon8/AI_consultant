

import React, { useState, useRef } from 'react';
import { ModuleItem, TabView, PartnerType, PartnerConfig, EstimationStep, ProjectScale, InputSource, ProgressiveLoadingState } from '../types';
import { Icons } from './Icons';
import { ProjectSummaryTab } from './ProjectSummaryTab';
import { EstimationTab } from './EstimationTab';
import { ExecutionPlanTab } from './ExecutionPlanTab';
import { RFPTab } from './RFPTab';
import { ReportBuilderModal } from './ReportBuilderModal';
import { RFPModal } from './RFPModal';
import { InputSourcesBadge } from './InputSourcesBadge';
import { TabSkeleton } from './SkeletonLoader';

interface ProjectOverview {
  projectTitle: string;
  businessGoals: string;
  coreValues: string[];
  techStack: { layer: string; items: string[] }[];
}

interface DashboardProps {
  modules: ModuleItem[];
  setModules: React.Dispatch<React.SetStateAction<ModuleItem[]>>;
  onToggleModule: (id: string) => void;
  onToggleSubFeature: (moduleId: string, subFeatureId: string) => void;
  currentPartnerType: PartnerType;
  onSelectPartnerType: (type: PartnerType) => void;
  multipliers: { costMultiplier: number; durationMultiplier: number };
  estimationStep: EstimationStep;
  onStepChange: (step: EstimationStep) => void;
  currentScale: ProjectScale;
  onScaleChange: (scale: ProjectScale) => void;
  projectSummaryContent: string;
  aiInsight?: string;
  aiInsightLoading?: boolean;
  aiInsightError?: string;
  onGenerateInsight?: () => void;
  rfpModelId?: string;
  referencedFiles?: InputSource[];
  progressiveState?: ProgressiveLoadingState;
  isAnalyzing?: boolean;
  projectOverview?: ProjectOverview | null;
  summary?: { keyPoints: string[]; risks: string[]; recommendations: string[] } | null;
  rfpContent?: string;
  onRfpContentChange?: (content: string) => void;
  isRfpGenerating?: boolean;
  onRfpGenerate?: (modules: ModuleItem[], projectSummary: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  modules, 
  onToggleModule, 
  onToggleSubFeature, 
  setModules,
  currentPartnerType,
  onSelectPartnerType,
  multipliers,
  estimationStep,
  onStepChange,
  currentScale,
  onScaleChange,
  projectSummaryContent,
  aiInsight,
  aiInsightLoading = false,
  aiInsightError = '',
  onGenerateInsight,
  rfpModelId,
  referencedFiles = [],
  progressiveState,
  isAnalyzing = false,
  projectOverview = null,
  summary = null,
  rfpContent = '',
  onRfpContentChange,
  isRfpGenerating = false,
  onRfpGenerate
}) => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.ESTIMATION);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isRFPOpen, setIsRFPOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Phase 1 Action: Calculate estimate (NO routing - stay on current tab)
  const handleGenerateEstimate = () => {
    onStepChange('RESULT');
    // Scroll to top to show calculation results - NO TAB NAVIGATION
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Phase 1 → Phase 2 Navigation: Move to 수행계획 tab
  const handleNextToExecutionPlan = () => {
    setActiveTab(TabView.EXECUTION_PLAN);
    setTimeout(() => {
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Phase 2 Action: Navigate to 공고작성 tab
  const handleNextToRFP = () => {
    setActiveTab(TabView.RFP);
    setTimeout(() => {
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Navigation: Go back to previous tab
  const handlePreviousTab = () => {
    if (activeTab === TabView.RFP) {
      setActiveTab(TabView.EXECUTION_PLAN);
    } else if (activeTab === TabView.EXECUTION_PLAN) {
      setActiveTab(TabView.ESTIMATION);
    }
    setTimeout(() => {
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const tabs = [
    { id: TabView.PROJECT_SUMMARY, label: '프로젝트 요약', icon: Icons.Dashboard },
    { id: TabView.ESTIMATION, label: '견적/예산', icon: Icons.Wallet },
    { id: TabView.EXECUTION_PLAN, label: '수행계획', icon: Icons.Calendar },
    { id: TabView.RFP, label: '공고작성', icon: Icons.File },
  ];

  // Logic for Project DNA Analysis
  const selectedModules = modules.filter(m => m.isSelected);
  // Base total cost (before multiplier)
  const baseTotalCost = selectedModules.reduce((acc, m) => acc + m.baseCost + m.subFeatures.filter(s => s.isSelected).reduce((sa, s) => sa + s.price, 0), 0);
  
  // Dynamic Risk/Complexity Calculation
  let complexityScore = 1;
  if (selectedModules.some(m => m.id === 'm5' || m.id === 'm3')) complexityScore += 1;
  if (selectedModules.some(m => m.id === 'm6')) complexityScore += 1;
  if (baseTotalCost > 150000000) complexityScore += 1;

  if (currentPartnerType === 'AGENCY') complexityScore = Math.max(1, complexityScore - 1); 
  if (currentPartnerType === 'AI_NATIVE') complexityScore += 1; 

  const getRiskLabel = () => {
    if (complexityScore >= 4) return { text: 'HIGH RISK', color: 'text-amber-500 dark:text-amber-400' };
    if (complexityScore >= 2) return { text: 'MEDIUM', color: 'text-slate-500 dark:text-slate-400' };
    return { text: 'STABLE', color: 'text-emerald-500 dark:text-emerald-400' };
  };

  const risk = getRiskLabel();

  // Download Button (Secondary Action - Always Visible)
  const DownloadButton = () => (
    <button
      onClick={() => setIsReportOpen(true)}
      className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all border border-slate-200 dark:border-slate-800 shadow-lg hover:scale-105 active:scale-95"
      title="리포트 다운로드"
    >
      <Icons.Download size={22} />
    </button>
  );

  // FAB State Machine - Tab-based Navigation
  const renderFooter = () => {
    // Phase 3: [Tab: 공고작성] - Final State
    if (activeTab === TabView.RFP) {
      return (
        <div className="flex items-center gap-3 w-full">
          <DownloadButton />
          <button 
            onClick={handlePreviousTab}
            className="h-14 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Icons.Left size={18} />
            <span>이전 단계</span>
          </button>
          <button 
            disabled
            className="flex-1 h-14 bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg cursor-not-allowed opacity-70"
          >
            <Icons.CheckMark size={18} strokeWidth={3} />
            <span>공고작성완료</span>
          </button>
        </div>
      );
    }

    // Phase 2: [Tab: 수행계획] - Navigation Mode
    if (activeTab === TabView.EXECUTION_PLAN) {
      return (
        <div className="flex items-center gap-3 w-full">
          <DownloadButton />
          <button 
            onClick={handlePreviousTab}
            className="h-14 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Icons.Left size={18} />
            <span>이전 단계</span>
          </button>
          <button 
            onClick={handleNextToRFP}
            className="flex-1 h-14 bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all"
          >
            <span>다음 단계</span>
            <Icons.Right size={18} strokeWidth={3} />
          </button>
        </div>
      );
    }

    // Phase 1: [Tab: 견적/예산] - Post-Calculation State (estimationStep === 'RESULT')
    // Constraint: 산출 결과가 화면에 표시된 후에만 다음 단계로 이동 가능
    if (estimationStep === 'RESULT' && activeTab === TabView.ESTIMATION) {
      return (
        <div className="flex items-center gap-3 w-full">
          <DownloadButton />
          <button 
            onClick={() => onStepChange('SCOPE')}
            className="h-14 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Icons.Refresh size={18} />
            <span>수정하기</span>
          </button>
          <button 
            onClick={handleNextToExecutionPlan}
            className="flex-1 h-14 bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all"
          >
            <span>다음 단계</span>
            <Icons.Right size={18} strokeWidth={3} />
          </button>
        </div>
      );
    }

    // Phase 1 Initial: SCOPE Step - Show "견적 산출하기"
    return (
      <div className="flex items-center gap-3 w-full">
        <DownloadButton />
        <button 
          onClick={handleGenerateEstimate}
          className="flex-1 h-14 bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all"
        >
          <Icons.PieChart size={18} />
          <span>견적 산출하기</span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 relative transition-colors duration-300">
      {/* Top Bar: Minimal Tabs & Stats */}
      <div className="px-6 lg:px-10 pt-6 pb-2 flex flex-wrap gap-4 justify-between items-end border-b border-transparent">
         {/* Minimal Tabs */}
         <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative pb-2 text-sm whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'font-bold text-slate-900 dark:text-white' 
                      : 'font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full"></span>
                  )}
                </button>
              )
            })}
         </div>

         {/* Minimal Stats Widget */}
         <div className="hidden lg:flex items-center gap-6">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Complexity</span>
                <div className="flex gap-1 mt-1">
                   {[1,2,3,4].map(i => (
                     <div key={i} className={`w-1 h-1 rounded-full ${i <= complexityScore ? 'bg-slate-800 dark:bg-slate-200' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                   ))}
                </div>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Risk</span>
                <span className={`text-xs font-bold mt-0.5 ${risk.color}`}>{risk.text}</span>
             </div>
         </div>
      </div>

      {/* Referenced Files Badge */}
      {referencedFiles.length > 0 && (
        <div className="px-6 lg:px-10 py-2 border-b border-slate-100 dark:border-slate-800">
          <InputSourcesBadge sources={referencedFiles} />
        </div>
      )}

      {/* Content Area with Animation */}
      <div ref={contentRef} className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 pb-40 scroll-smooth"> 
        <div className="max-w-4xl mx-auto">
          <div key={activeTab} className="animate-fade-in-up">
            {activeTab === TabView.PROJECT_SUMMARY && (
              isAnalyzing && progressiveState && !progressiveState.summaryReady ? (
                <TabSkeleton type="summary" />
              ) : (
                <ProjectSummaryTab content={projectSummaryContent} aiInsight={aiInsight} aiInsightLoading={aiInsightLoading} aiInsightError={aiInsightError} summary={progressiveState?.summary || summary} onGenerateInsight={onGenerateInsight} isRfpGenerating={isRfpGenerating} />
              )
            )}
            {activeTab === TabView.ESTIMATION && (
              isAnalyzing && progressiveState && !progressiveState.modulesReady ? (
                <TabSkeleton type="estimation" />
              ) : (
                <EstimationTab 
                  modules={modules} 
                  onToggleModule={onToggleModule} 
                  onToggleSubFeature={onToggleSubFeature}
                  setModules={setModules}
                  currentPartnerType={currentPartnerType}
                  onSelectPartnerType={onSelectPartnerType}
                  estimationStep={estimationStep}
                  currentScale={currentScale}
                  onScaleChange={onScaleChange}
                  projectOverview={projectOverview}
                  isLoading={isAnalyzing && (!progressiveState || !progressiveState.modulesReady)}
                  isDisabled={isRfpGenerating}
                />
              )
            )}
            {activeTab === TabView.EXECUTION_PLAN && (
              isAnalyzing && progressiveState && !progressiveState.scheduleReady ? (
                <TabSkeleton type="schedule" />
              ) : (
                <ExecutionPlanTab
                  modules={modules}
                  currentPartnerType={currentPartnerType}
                />
              )
            )}
            {activeTab === TabView.RFP && (
              <RFPTab
                modules={modules}
                currentPartnerType={currentPartnerType}
                onGenerateRFP={() => setIsRFPOpen(true)}
                modelId={rfpModelId}
                rfpContent={rfpContent}
                onRfpContentChange={onRfpContentChange}
                isRfpGenerating={isRfpGenerating}
                onRfpGenerate={onRfpGenerate}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="absolute bottom-0 left-0 w-full z-30 pointer-events-none flex justify-center">
        {/* Gradient Mask */}
        <div className="absolute inset-0 top-auto h-32 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-950 dark:via-slate-950/90 dark:to-transparent pointer-events-none transition-colors duration-300"></div>

        <div className="relative w-full max-w-4xl px-6 lg:px-0 pb-6 pt-6 pointer-events-auto">
           {renderFooter()}
        </div>
      </div>

      <ReportBuilderModal 
         isOpen={isReportOpen} 
         onClose={() => setIsReportOpen(false)} 
         projectName="기업형 LMS 플랫폼"
         totalCost={baseTotalCost * multipliers.costMultiplier}
      />
      
      <RFPModal
         isOpen={isRFPOpen}
         onClose={() => setIsRFPOpen(false)}
         modules={modules}
         projectSummary={`총 ${selectedModules.length}개 모듈, 예상 비용 ${(baseTotalCost / 10000).toLocaleString()}만원`}
      />
    </div>
  );
};
