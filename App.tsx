
import React, { useState, useRef, useEffect } from 'react';
import { INITIAL_MESSAGES, INITIAL_MODULES, PARTNER_PRESETS } from './constants';
import { Message, ModuleItem, PartnerType, EstimationStep, ProjectScale, ProjectSnapshot, DashboardAction } from './types';
import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';
import { Icons } from './components/Icons';
import { StepIndicator, StepStatus } from './components/StepIndicator';
import { CollapsibleSidebar } from './components/CollapsibleSidebar';
import { LandingView } from './components/LandingView';
import { analyzeProject, readFileContent, ParsedAnalysisResult } from './services/apiService';
import { useProjectHistory } from './hooks/useProjectHistory';
import { useAsyncState } from './contexts/AsyncStateContext';
import { ToastContainer } from './components/ToastContainer';

type AppView = 'landing' | 'detail';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [modules, setModules] = useState<ModuleItem[]>(INITIAL_MODULES);
  
  // Global async state
  const { setAnalysisStatus, addToast, state: asyncState } = useAsyncState();
  const isAnalyzing = asyncState.analysis.status === 'loading';
  
  // App View State (landing or detail)
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Partner Type State
  const [currentPartnerType, setCurrentPartnerType] = useState<PartnerType>('STUDIO');
  const multipliers = PARTNER_PRESETS[currentPartnerType];

  // Project History Hook
  const { history: projectHistory, addProject, getProject, deleteProject } = useProjectHistory();
  const [lastUserInput, setLastUserInput] = useState<string>('');

  // Estimation Step Flow State
  const [estimationStep, setEstimationStep] = useState<EstimationStep>('SCOPE');
  const [currentScale, setCurrentScale] = useState<ProjectScale>('STANDARD');

  // Estimates from AI analysis
  const [estimates, setEstimates] = useState<{
    typeA?: { minCost: number; maxCost: number; duration: string };
    typeB?: { minCost: number; maxCost: number; duration: string };
    typeC?: { minCost: number; maxCost: number; duration: string };
  } | undefined>(undefined);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Collapsible Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);

  // Apply Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const handleResize = (e: React.MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
    }
  };

  const handleToggleModule = (id: string) => {
    setModules(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, isSelected: !m.isSelected };
      }
      return m;
    }));
  };

  const handleToggleSubFeature = (moduleId: string, subId: string) => {
    setModules(prev => prev.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          subFeatures: m.subFeatures.map(s => s.id === subId ? { ...s, isSelected: !s.isSelected } : s)
        };
      }
      return m;
    }));
  };

  const applyPartnerType = (type: PartnerType) => {
    setCurrentPartnerType(type);
    
    if (type === 'AI_NATIVE') {
       setModules(prev => prev.map(m => ({
          ...m,
          subFeatures: m.subFeatures.map(s => 
             (s.name.includes('SSO') || s.name.includes('DRM') || s.name.includes('WebRTC')) 
             ? { ...s, isSelected: false } 
             : s
          )
       })));
    } else if (type === 'AGENCY') {
       setModules(prev => prev.map(m => ({
          ...m,
          isSelected: m.required ? true : m.isSelected,
          subFeatures: m.subFeatures.map(s => 
             s.name.includes('Admin') ? { ...s, isSelected: true } : s
          )
       })));
    }
  };

  const handleScaleChange = (scale: ProjectScale) => {
    setCurrentScale(scale);
    // Logic to select modules based on scale
    if (scale === 'MVP') {
        setModules(prev => prev.map(m => ({
            ...m,
            isSelected: m.required ? true : false,
            subFeatures: m.subFeatures.map(s => ({ ...s, isSelected: s.id.endsWith('1') })) // Activate only first subfeature
        })));
    } else if (scale === 'STANDARD') {
        setModules(INITIAL_MODULES); // Reset to defaults
    } else if (scale === 'HIGH_END') {
        setModules(prev => prev.map(m => ({
            ...m,
            isSelected: true,
            subFeatures: m.subFeatures.map(s => ({ ...s, isSelected: true })) // All on
        })));
    }
  };

  const handleDashboardAction = (action: DashboardAction) => {
    console.log('[App] Dashboard action received:', action);
    
    switch (action.type) {
      case 'toggle_module':
        const { moduleId } = action.payload;
        setModules(prev => prev.map(m => 
          m.id === moduleId ? { ...m, isSelected: !m.isSelected } : m
        ));
        break;
        
      case 'toggle_feature':
        const { moduleId: modId, featureId } = action.payload;
        setModules(prev => prev.map(m => {
          if (m.id === modId) {
            return {
              ...m,
              subFeatures: m.subFeatures.map(f => 
                f.id === featureId ? { ...f, isSelected: !f.isSelected } : f
              )
            };
          }
          return m;
        }));
        break;
        
      case 'update_partner_type':
        const { partnerType } = action.payload;
        if (['AGENCY', 'STUDIO', 'AI_NATIVE'].includes(partnerType)) {
          applyPartnerType(partnerType as PartnerType);
        }
        break;
        
      case 'update_scale':
        const { scale } = action.payload;
        if (['MVP', 'STANDARD', 'HIGH_END'].includes(scale)) {
          if (scale === 'MVP') {
            setModules(prev => prev.map(m => ({
              ...m,
              isSelected: m.required ? true : false,
              subFeatures: m.subFeatures.map((s, idx) => ({ ...s, isSelected: idx === 0 }))
            })));
          } else if (scale === 'HIGH_END') {
            setModules(prev => prev.map(m => ({
              ...m,
              isSelected: true,
              subFeatures: m.subFeatures.map(s => ({ ...s, isSelected: true }))
            })));
          }
          setCurrentScale(scale as ProjectScale);
        }
        break;
        
      case 'no_action':
      default:
        break;
    }
  };

  // Handle parsed analysis result
  const handleAnalysisComplete = (result: ParsedAnalysisResult | null, userInput: string) => {
    console.log('[App] handleAnalysisComplete called with:', result ? {
      projectTitle: result.projectTitle,
      modulesCount: result.modules?.length || 0,
      hasEstimates: !!result.estimates
    } : 'null');
    
    console.log('🔴 [DEBUG: Raw AI Response - App.tsx]', {
      rawResult: result,
      rawMarkdownPreview: result?.rawMarkdown?.substring(0, 300),
      rawContentPreview: result?.raw_content?.substring(0, 300)
    });
    
    if (result && result.modules && result.modules.length > 0) {
      const convertedModules: ModuleItem[] = result.modules.map(mod => ({
        id: mod.id,
        name: mod.name,
        description: mod.description,
        baseCost: mod.baseCost,
        baseManMonths: mod.baseManMonths,
        category: mod.category,
        isSelected: mod.isSelected,
        required: mod.required,
        subFeatures: mod.subFeatures.map(feat => ({
          id: feat.id,
          name: feat.name,
          price: feat.price,
          manWeeks: feat.manWeeks,
          isSelected: feat.isSelected
        }))
      }));
      console.log('[App] Setting modules:', convertedModules.length, 'items');
      setModules(convertedModules);
      
      if (result.estimates) {
        console.log('🟢 [DEBUG: Processed Dashboard Data - Before setEstimates]', {
          estimates: result.estimates,
          typeA: result.estimates.typeA,
          typeB: result.estimates.typeB,
          typeC: result.estimates.typeC
        });
        setEstimates(result.estimates);
      }
      
      console.log('🟢 [DEBUG: Processed Dashboard Data - Before Dashboard Render]', {
        modulesCount: convertedModules.length,
        modules: convertedModules.map(m => ({
          id: m.id,
          name: m.name,
          baseCost: m.baseCost,
          isSelected: m.isSelected,
          subFeaturesCount: m.subFeatures.length,
          subFeaturesTotalPrice: m.subFeatures.reduce((sum, f) => sum + (f.isSelected ? f.price : 0), 0)
        })),
        estimates: result.estimates
      });
    } else {
      console.warn('[App] No valid modules in result');
    }
  };

  const handleSelectHistoryProject = (projectId: string) => {
    const project = getProject(projectId);
    if (project) {
      setModules(project.modules);
      
      const restoredMessages = project.messages.length > 0 
        ? project.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        : [
            ...INITIAL_MESSAGES,
            {
              id: Date.now().toString(),
              role: 'model' as const,
              text: `"${project.title}" 프로젝트를 불러왔습니다.\n\n저장된 모듈 구조와 견적 정보를 확인하실 수 있습니다.`,
              timestamp: new Date(),
            }
          ];
      
      setMessages(restoredMessages);
      setCurrentPartnerType(project.partnerType);
      setCurrentScale(project.currentScale);
      setEstimates(project.estimates);
      setEstimationStep('SCOPE');
      setCurrentView('detail');
    }
  };

  // Handle initial analysis from landing page
  const handleAnalyze = async (text: string, files: File[]) => {
    setAnalysisStatus('loading', '프로젝트를 분석하고 있습니다...');
    setAnalysisError(null);
    
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text || `[${files.map(f => f.name).join(', ')}] 파일을 첨부했습니다.`,
      timestamp: new Date(),
    };
    
    // Create AI message for chat (will show after view switch)
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'model',
      text: '',
      timestamp: new Date(),
      isStreaming: false,
    };
    
    try {
      // Read file contents first (stay on landing page during analysis)
      const fileContents = await Promise.all(
        files.map(file => readFileContent(file))
      );
      
      // Call analyze API - stay on landing page, show loading there
      const parsedResult = await analyzeProject(
        text, 
        fileContents, 
        (chunk) => {
          // Don't update chat - response collected internally
        },
        handleAnalysisComplete,
        (error) => {
          setAnalysisError(error);
        }
      );
      
      // Analysis complete - now switch to detail view
      const finalMessages: Message[] = [
        ...INITIAL_MESSAGES, 
        userMsg, 
        { 
          ...aiMsg, 
          text: '프로젝트 분석이 완료되었습니다.\n\n오른쪽 대시보드에서 분석된 모듈 구조와 견적 정보를 확인하실 수 있습니다. 기능 범위를 조정하신 후 견적을 산출해보세요.' 
        }
      ];
      setMessages(finalMessages);
      
      if (parsedResult && parsedResult.modules) {
        addProject({
          title: parsedResult.projectTitle || text.slice(0, 30) + '...',
          userInput: text,
          modules: parsedResult.modules.map(mod => ({
            id: mod.id,
            name: mod.name,
            description: mod.description,
            baseCost: mod.baseCost,
            baseManMonths: mod.baseManMonths,
            category: mod.category,
            isSelected: mod.isSelected,
            required: mod.required,
            subFeatures: mod.subFeatures.map(feat => ({
              id: feat.id,
              name: feat.name,
              price: feat.price,
              manWeeks: feat.manWeeks,
              isSelected: feat.isSelected
            }))
          })),
          estimates: parsedResult.estimates,
          messages: finalMessages,
          partnerType: currentPartnerType,
          currentScale: currentScale,
        });
      }
      
      setCurrentView('detail');
      setAnalysisStatus('success');
      addToast({ type: 'success', message: '프로젝트 분석이 완료되었습니다.' });
      
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.';
      setAnalysisError(errorMessage);
      setAnalysisStatus('error', errorMessage);
      addToast({ type: 'error', message: errorMessage });
    }
  };

  // Dismiss error notification and reset state
  const dismissError = () => {
    setAnalysisError(null);
  };

  // Handle retry from error state
  const handleRetry = () => {
    setAnalysisError(null);
    setAnalysisStatus('idle');
    setCurrentView('landing');
    setMessages(INITIAL_MESSAGES);
    setModules(INITIAL_MODULES);
    setEstimationStep('SCOPE');
  };

  // Calculate step statuses based on current view and estimation step
  const getStepStatuses = (): { step1: StepStatus; step2: StepStatus; step3: StepStatus } => {
    if (currentView === 'landing') {
      return {
        step1: isAnalyzing ? 'active' : 'pending',
        step2: 'pending',
        step3: 'pending',
      };
    }

    // currentView === 'detail'
    if (estimationStep === 'SCOPE') {
      return {
        step1: 'completed',
        step2: 'active',
        step3: 'pending',
      };
    }

    if (estimationStep === 'RESULT') {
      return {
        step1: 'completed',
        step2: 'completed',
        step3: 'active',
      };
    }

    // estimationStep === 'REGISTER'
    return {
      step1: 'completed',
      step2: 'completed',
      step3: 'completed',
    };
  };

  const stepStatuses = getStepStatuses();

  return (
    <div className={`h-screen w-screen flex flex-col font-sans bg-white dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-50 transition-colors duration-300`}>
      
      {/* Global Toast Container */}
      <ToastContainer />
      
      {/* Error Notification */}
      {analysisError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-3 px-5 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl shadow-lg">
            <Icons.Alert size={18} className="text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">{analysisError}</span>
            <button 
              onClick={handleRetry}
              className="ml-2 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-lg transition-colors"
            >
              다시 시도
            </button>
            <button 
              onClick={dismissError}
              className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-200 transition-colors"
            >
              <Icons.Close size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Resizing Overlay */}
      {isResizing && (
        <div 
          className="fixed inset-0 z-[100] cursor-col-resize bg-transparent"
          onMouseMove={handleResize}
          onMouseUp={stopResizing}
          onMouseLeave={stopResizing}
        />
      )}

      {/* Minimal Header */}
      <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-30 shrink-0 relative transition-colors duration-300">
        {/* Left: Brand Only */}
        <div className="flex items-center gap-4 lg:gap-8 flex-shrink-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white hidden sm:block">Wishket Estimate</span>
          </div>
        </div>

        {/* Center: Step Indicator */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <StepIndicator 
            step1Status={stepStatuses.step1}
            step2Status={stepStatuses.step2}
            step3Status={stepStatuses.step3}
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
              </button>
              
              <button 
                onClick={() => { 
                    setModules(INITIAL_MODULES); 
                    setCurrentPartnerType('STUDIO'); 
                    setEstimationStep('SCOPE');
                    setCurrentView('landing');
                    setMessages(INITIAL_MESSAGES);
                }}
                className="p-2 text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Reset"
              >
                <Icons.Refresh size={16} />
              </button>
              <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                KM
              </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar - Always visible */}
        <CollapsibleSidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          projectHistory={projectHistory}
          onSelectProject={handleSelectHistoryProject}
          onDeleteProject={deleteProject}
        />

        {/* Conditional View Rendering */}
        {currentView === 'landing' ? (
          /* Landing View - Full width (minus sidebar) */
          <LandingView 
            onAnalyze={handleAnalyze}
            isLoading={isAnalyzing}
          />
        ) : (
          /* Detail View - Chat + Dashboard */
          <>
            <div 
              className="h-full z-20 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex-shrink-0 relative transition-all duration-500 animate-slide-in-left"
              style={{ width: sidebarWidth }}
            >
              <ChatInterface 
                messages={messages} 
                setMessages={setMessages}
                modules={modules}
                setModules={setModules}
                partnerType={currentPartnerType}
                currentScale={currentScale}
                estimates={estimates}
                onDashboardAction={handleDashboardAction}
              />
            </div>

            <div
              className={`w-1 hover:w-1.5 cursor-col-resize hover:bg-indigo-500 transition-all z-40 flex-shrink-0 relative group flex items-center justify-center -ml-[1px] ${isResizing ? 'bg-indigo-500 w-1.5' : 'bg-transparent'}`}
              onMouseDown={startResizing}
            >
               <div className={`w-0.5 h-8 rounded-full transition-colors ${isResizing ? 'bg-white' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-white'}`} />
            </div>

            <div className="flex-1 h-full bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-300 animate-fade-in">
              <Dashboard 
                modules={modules} 
                setModules={setModules}
                onToggleModule={handleToggleModule}
                onToggleSubFeature={handleToggleSubFeature}
                currentPartnerType={currentPartnerType}
                onSelectPartnerType={applyPartnerType}
                multipliers={multipliers}
                estimationStep={estimationStep}
                onStepChange={setEstimationStep}
                currentScale={currentScale}
                onScaleChange={handleScaleChange}
                estimates={estimates}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
