

import React, { useState } from 'react';
import { ModuleItem, TabView, PartnerType, PartnerConfig, EstimationStep, ProjectScale } from '../types';
import { Icons } from './Icons';
import { EstimationTab } from './EstimationTab';
import { SimilarCasesTab } from './SimilarCasesTab';
import { PresetSelectionTab } from './PresetSelectionTab';
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
  const [activeTab, setActiveTab] = useState<TabView>(TabView.ESTIMATION);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const tabs = [
    { id: TabView.ESTIMATION, label: '견적/예산' },
    { id: TabView.PRESET_COMPARISON, label: '파트너 유형' },
    { id: TabView.SIMILAR_CASES, label: '유사 사례' },
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

  // Footer Button Logic
  const renderFooter = () => {
    if (estimationStep === 'REGISTER') {
        return (
            <button 
                className="w-full max-w-md h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all"
                disabled
            >
                <Icons.CheckMark size={18} strokeWidth={3} />
                <span>등록이 완료되었습니다</span>
            </button>
        );
    }

    if (estimationStep === 'RESULT') {
        return (
           <div className="flex gap-4 w-full">
              <button 
                  onClick={() => onStepChange('SCOPE')}
                  className="flex-1 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                  <Icons.Refresh size={18} />
                  <span>기능/옵션 수정하기</span>
              </button>
              <button 
                  onClick={() => onStepChange('REGISTER')}
                  className="flex-[2] h-14 bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all"
              >
                  <span>이 내용으로 공고 등록</span>
                  <Icons.CheckMark size={18} strokeWidth={3} />
              </button>
           </div>
        );
    }

    // Default: SCOPE Step
    return (
        <div className="flex items-center gap-3 w-full">
            <button
                onClick={() => setIsReportOpen(true)}
                className="w-14 h-14 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl transition-all border border-slate-200 dark:border-slate-800 shadow-float hover:scale-105 active:scale-95 backdrop-blur-md"
                title="리포트 다운로드"
            >
                <Icons.Download size={22} />
            </button>

            <button 
                onClick={() => onStepChange('RESULT')}
                className="flex-1 h-14 bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 dark:shadow-black/20 hover:shadow-slate-900/30 transition-all transform hover:-translate-y-1 active:translate-y-0"
            >
                <Icons.PieChart size={18} />
                <span>견적 산출하기 (Generate Estimate)</span>
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

      {/* Content Area with Animation */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 pb-40 scroll-smooth"> 
        <div className="max-w-4xl mx-auto">
          <div key={activeTab} className="animate-fade-in-up">
            {activeTab === TabView.ESTIMATION && (
              <EstimationTab 
                modules={modules} 
                onToggleModule={onToggleModule} 
                onToggleSubFeature={onToggleSubFeature}
                setModules={setModules}
                multipliers={multipliers}
                currentPartnerType={currentPartnerType}
                onSelectPartnerType={onSelectPartnerType}
                estimationStep={estimationStep}
                currentScale={currentScale}
                onScaleChange={onScaleChange}
              />
            )}
            {activeTab === TabView.PRESET_COMPARISON && (
              <PresetSelectionTab
                currentPartnerType={currentPartnerType}
                onSelect={onSelectPartnerType}
              />
            )}
            {activeTab === TabView.SIMILAR_CASES && (
              <SimilarCasesTab />
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
