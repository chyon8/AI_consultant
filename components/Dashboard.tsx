import React, { useState, useRef, useEffect } from 'react';
import { ModuleItem, TabView, PartnerType, EstimationStep, ProjectScale, StepTabConfig, ProjectEstimates } from '../types';
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
  estimates?: ProjectEstimates;
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
  estimates
}) => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.STEP1_PLANNING);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const expectedTab = getTabForEstimationStep(estimationStep);
    const currentEstimationStep = getEstimationStepForTab(activeTab);
    
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

  const selectedModules = modules.filter(m => m.isSelected);
  const baseTotalCost = selectedModules.reduce((acc, m) => acc + m.baseCost + m.subFeatures.filter(s => s.isSelected).reduce((sa, s) => sa + s.price, 0), 0);
  
  let complexityScore = 1;
  if (selectedModules.some(m => m.id === 'm5' || m.id === 'm3')) complexityScore += 1;
  if (selectedModules.some(m => m.id === 'm6')) complexityScore += 1;
  if (baseTotalCost > 150000000) complexityScore += 1;

  if (currentPartnerType === 'AGENCY') complexityScore = Math.max(1, complexityScore - 1); 
  if (currentPartnerType === 'AI_NATIVE') complexityScore += 1; 

  const getRiskLabel = () => {
    if (complexityScore >= 4) return { text: 'HIGH', color: 'text-neutral-700 dark:text-neutral-300' };
    if (complexityScore >= 2) return { text: 'MEDIUM', color: 'text-neutral-500 dark:text-neutral-400' };
    return { text: 'STABLE', color: 'text-neutral-400 dark:text-neutral-500' };
  };

  const risk = getRiskLabel();

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

  const renderFooter = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    const isFirstStep = currentIndex === 0;
    const isLastStep = currentIndex === tabs.length - 1;

    return (
      <div className="flex items-center gap-4 w-full">
        {!isFirstStep && (
          <button
            onClick={handlePrevStep}
            className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Icons.Left size={16} />
            <span>이전</span>
          </button>
        )}

        <button
          onClick={() => setIsReportOpen(true)}
          className="w-12 h-12 flex items-center justify-center bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-md transition-colors border border-neutral-200 dark:border-neutral-800"
          title="리포트 다운로드"
        >
          <Icons.Download size={18} />
        </button>

        {!isLastStep ? (
          <button 
            onClick={handleNextStep}
            className="flex-1 h-12 bg-neutral-700 dark:bg-neutral-300 hover:bg-neutral-600 dark:hover:bg-neutral-200 text-neutral-200 dark:text-neutral-700 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span>다음 단계로</span>
            <Icons.Right size={16} />
          </button>
        ) : (
          <button 
            className="flex-1 h-12 bg-neutral-700 dark:bg-neutral-300 hover:bg-neutral-600 dark:hover:bg-neutral-200 text-neutral-200 dark:text-neutral-700 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Icons.CheckMark size={16} />
            <span>프로젝트 등록 완료</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 relative transition-colors duration-300">
      <div className="px-8 lg:px-12 pt-8 pb-6 border-b border-neutral-100 dark:border-neutral-900">
         <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-full">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex items-center gap-3 px-6 py-4 whitespace-nowrap transition-all duration-200 group border-b-2 ${
                    isActive
                      ? 'border-neutral-600 dark:border-neutral-300' 
                      : 'border-transparent hover:border-neutral-200 dark:hover:border-neutral-800'
                  }`}
                >
                  <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-neutral-600 dark:bg-neutral-300 text-neutral-200 dark:text-neutral-700' 
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700'
                  }`}>
                    {tab.stepNumber}
                  </span>
                  <div className="text-left">
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      isActive ? 'text-neutral-700 dark:text-neutral-200' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'
                    }`}>{tab.label}</p>
                  </div>
                </button>
              )
            })}
         </div>

         <div className="hidden lg:flex items-center gap-10 mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-900">
             <div className="flex flex-col">
                <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-600 uppercase tracking-widest mb-2">Complexity</span>
                <div className="flex gap-1.5">
                   {[1,2,3,4].map(i => (
                     <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= complexityScore ? 'bg-neutral-800 dark:bg-neutral-200' : 'bg-neutral-200 dark:bg-neutral-800'}`}></div>
                   ))}
                </div>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-600 uppercase tracking-widest mb-2">Risk Level</span>
                <span className={`text-xs font-semibold tracking-wide ${risk.color}`}>{risk.text}</span>
             </div>
             <div className="flex flex-col ml-auto">
                <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-600 uppercase tracking-widest mb-2">Selected</span>
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">{selectedModules.length} Modules</span>
             </div>
         </div>
      </div>

      <div ref={contentRef} className="flex-1 overflow-y-auto px-8 lg:px-12 py-10 pb-40 scroll-smooth"> 
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
                estimates={estimates}
              />
            )}
            {activeTab === TabView.STEP3_WBS && (
              <Step3WBSTab
                modules={modules}
                currentPartnerType={currentPartnerType}
                estimates={estimates}
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

      <div className="absolute bottom-0 left-0 w-full z-30 pointer-events-none flex justify-center">
        <div className="absolute inset-0 top-auto h-32 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-neutral-950 dark:via-neutral-950/95 dark:to-transparent pointer-events-none transition-colors duration-300"></div>

        <div className="relative w-full max-w-4xl px-8 lg:px-0 pb-8 pt-6 pointer-events-auto">
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
