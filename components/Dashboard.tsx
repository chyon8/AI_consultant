import React, { useState, useRef, useEffect } from 'react';
import { ModuleItem, TabView, PartnerType, EstimationStep, ProjectScale, StepTabConfig } from '../types';
import { Icons } from './Icons';
import { Step1PlanningTab } from './Step1PlanningTab';
import { Step2EstimationTab } from './Step2EstimationTab';
import { Step3WBSTab } from './Step3WBSTab';
import { Step4RFPTab } from './Step4RFPTab';
import { ReportBuilderModal } from './ReportBuilderModal';

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
  onScaleChange
}) => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.STEP1_PLANNING);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Map TabView to EstimationStep
  const getEstimationStepForTab = (tab: TabView): 'SCOPE' | 'RESULT' | 'REGISTER' => {
    switch (tab) {
      case TabView.STEP1_PLANNING:
      case TabView.STEP2_ESTIMATION:
        return 'SCOPE';
      case TabView.STEP3_WBS:
        return 'RESULT';
      case TabView.STEP4_RFP:
        return 'REGISTER';
      default:
        return 'SCOPE';
    }
  };

  // Map EstimationStep to TabView (inverse mapping for external updates)
  const getTabForEstimationStep = (step: EstimationStep): TabView => {
    switch (step) {
      case 'SCOPE':
        return TabView.STEP1_PLANNING;
      case 'RESULT':
        return TabView.STEP3_WBS;
      case 'REGISTER':
        return TabView.STEP4_RFP;
      default:
        return TabView.STEP1_PLANNING;
    }
  };

  // Sync activeTab when estimationStep changes externally (e.g., chat-driven)
  useEffect(() => {
    const expectedTab = getTabForEstimationStep(estimationStep);
    const currentEstimationStep = getEstimationStepForTab(activeTab);
    
    // Only update if the estimationStep changed externally (not from our own tab change)
    if (currentEstimationStep !== estimationStep) {
      setActiveTab(expectedTab);
    }
  }, [estimationStep]);

  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab);
    onStepChange(getEstimationStepForTab(tab));
    setTimeout(() => {
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const tabs: StepTabConfig[] = [
    { id: TabView.STEP1_PLANNING, stepNumber: 1, label: '프로젝트 기획', shortLabel: 'STEP 1', description: 'Project Planning' },
    { id: TabView.STEP2_ESTIMATION, stepNumber: 2, label: '비교 견적', shortLabel: 'STEP 2', description: 'Estimation' },
    { id: TabView.STEP3_WBS, stepNumber: 3, label: '실행 계획', shortLabel: 'STEP 3', description: 'WBS' },
    { id: TabView.STEP4_RFP, stepNumber: 4, label: '공고문', shortLabel: 'STEP 4', description: 'RFP' },
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

  // Navigate to next/previous step (uses handleTabChange which syncs estimationStep)
  const handleNextStep = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      handleTabChange(tabs[currentIndex + 1].id);
    }
  };

  const handlePrevStep = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) {
      handleTabChange(tabs[currentIndex - 1].id);
    }
  };

  // Footer Button Logic - Navigate through steps with workflow sync
  const renderFooter = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    const isFirstStep = currentIndex === 0;
    const isLastStep = currentIndex === tabs.length - 1;

    return (
      <div className="flex items-center gap-3 w-full">
        {!isFirstStep && (
          <button
            onClick={handlePrevStep}
            className="h-14 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Icons.Left size={18} />
            <span>이전</span>
          </button>
        )}

        <button
          onClick={() => setIsReportOpen(true)}
          className="w-14 h-14 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl transition-all border border-slate-200 dark:border-slate-800 shadow-float hover:scale-105 active:scale-95 backdrop-blur-md"
          title="리포트 다운로드"
        >
          <Icons.Download size={22} />
        </button>

        {!isLastStep ? (
          <button 
            onClick={handleNextStep}
            className="flex-1 h-14 bg-slate-900 dark:bg-indigo-500 hover:bg-black dark:hover:bg-indigo-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 dark:shadow-indigo-900/30 hover:shadow-slate-900/30 transition-all transform hover:-translate-y-1 active:translate-y-0"
          >
            <span>다음 단계로</span>
            <Icons.Right size={18} />
          </button>
        ) : (
          <button 
            className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all"
          >
            <Icons.CheckMark size={18} />
            <span>프로젝트 등록 완료</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 relative transition-colors duration-300">
      {/* Top Bar: Step-based Tabs */}
      <div className="px-6 lg:px-10 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
         {/* Step Tabs */}
         <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const stepColors = [
                'bg-indigo-500',
                'bg-emerald-500',
                'bg-purple-500',
                'bg-amber-500'
              ];
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                    isActive ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900' : `${stepColors[index]} text-white`
                  }`}>
                    {tab.stepNumber}
                  </span>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${isActive ? '' : ''}`}>{tab.label}</p>
                    <p className={`text-[10px] ${isActive ? 'text-white/70 dark:text-slate-900/70' : 'text-slate-400 dark:text-slate-500'}`}>{tab.description}</p>
                  </div>
                </button>
              )
            })}
         </div>

         {/* Minimal Stats Widget */}
         <div className="hidden lg:flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
             <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Complexity</span>
                <div className="flex gap-1 mt-1">
                   {[1,2,3,4].map(i => (
                     <div key={i} className={`w-2 h-2 rounded-full ${i <= complexityScore ? 'bg-slate-800 dark:bg-slate-200' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                   ))}
                </div>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Risk</span>
                <span className={`text-xs font-bold mt-0.5 ${risk.color}`}>{risk.text}</span>
             </div>
             <div className="flex flex-col ml-auto">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Modules</span>
                <span className="text-xs font-bold mt-0.5 text-slate-900 dark:text-white">{selectedModules.length}개 선택</span>
             </div>
         </div>
      </div>

      {/* Content Area with Animation */}
      <div ref={contentRef} className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 pb-40 scroll-smooth"> 
        <div className="max-w-4xl mx-auto">
          <div key={activeTab} className="animate-fade-in-up">
            {activeTab === TabView.STEP1_PLANNING && (
              <Step1PlanningTab 
                modules={modules} 
              />
            )}
            {activeTab === TabView.STEP2_ESTIMATION && (
              <Step2EstimationTab 
                modules={modules} 
                onToggleModule={onToggleModule} 
                onToggleSubFeature={onToggleSubFeature}
                currentPartnerType={currentPartnerType}
                onSelectPartnerType={onSelectPartnerType}
                currentScale={currentScale}
                onScaleChange={onScaleChange}
              />
            )}
            {activeTab === TabView.STEP3_WBS && (
              <Step3WBSTab
                modules={modules}
                currentPartnerType={currentPartnerType}
              />
            )}
            {activeTab === TabView.STEP4_RFP && (
              <Step4RFPTab
                modules={modules}
                projectSummary={`총 ${selectedModules.length}개 모듈, 예상 비용 ${(baseTotalCost / 10000).toLocaleString()}만원`}
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
    </div>
  );
};
