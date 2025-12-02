import React, { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_MESSAGES, INITIAL_MODULES, PARTNER_PRESETS } from './constants';
import { Message, ModuleItem, PartnerType, EstimationStep, ProjectScale, ChatSession } from './types';
import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';
import { Icons } from './components/Icons';
import { StepIndicator } from './components/StepIndicator';
import { CollapsibleSidebar } from './components/CollapsibleSidebar';
import { LandingView } from './components/LandingView';
import { analyzeProject, readFileContent, ParsedAnalysisResult } from './services/apiService';
import { useChatSessions } from './hooks/useChatSessions';

type AppView = 'landing' | 'detail';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [modules, setModules] = useState<ModuleItem[]>(INITIAL_MODULES);
  
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
    updateSessionTitle,
    updateSessionMessages,
    updateSessionModules,
    updateSession,
    deleteSession,
    getActiveSession,
    setSessionLoading,
    generateTitleFromMessage,
  } = useChatSessions();

  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentPartnerType, setCurrentPartnerType] = useState<PartnerType>('STUDIO');
  const multipliers = PARTNER_PRESETS[currentPartnerType];
  const [estimationStep, setEstimationStep] = useState<EstimationStep>('SCOPE');
  const [currentScale, setCurrentScale] = useState<ProjectScale>('STANDARD');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  
  const latestModulesRef = useRef<ModuleItem[]>(INITIAL_MODULES);
  const pendingSessionIdRef = useRef<string | null>(null);

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
    if (scale === 'MVP') {
        setModules(prev => prev.map(m => ({
            ...m,
            isSelected: m.required ? true : false,
            subFeatures: m.subFeatures.map(s => ({ ...s, isSelected: s.id.endsWith('1') }))
        })));
    } else if (scale === 'STANDARD') {
        setModules(INITIAL_MODULES);
    } else if (scale === 'HIGH_END') {
        setModules(prev => prev.map(m => ({
            ...m,
            isSelected: true,
            subFeatures: m.subFeatures.map(s => ({ ...s, isSelected: true }))
        })));
    }
  };

  const handleAnalysisComplete = (result: ParsedAnalysisResult | null) => {
    console.log('[App] handleAnalysisComplete called with:', result ? {
      projectTitle: result.projectTitle,
      modulesCount: result.modules?.length || 0,
      hasEstimates: !!result.estimates
    } : 'null');
    
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
      latestModulesRef.current = convertedModules;
    } else {
      console.warn('[App] No valid modules in result');
      latestModulesRef.current = [...INITIAL_MODULES];
    }
  };

  const handleNewChat = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
    setModules(INITIAL_MODULES);
    setCurrentView('landing');
    setEstimationStep('SCOPE');
    setCurrentPartnerType('STUDIO');
    setActiveSessionId(null);
    setAnalysisError(null);
  }, [setActiveSessionId]);

  const handleSelectSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setMessages(session.messages);
      setModules(session.modules);
      setCurrentView('detail');
      setAnalysisError(null);
    }
  }, [sessions, setActiveSessionId]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    deleteSession(sessionId);
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  }, [deleteSession, activeSessionId, handleNewChat]);

  const handleAnalyze = async (text: string, files: File[]) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    latestModulesRef.current = [...INITIAL_MODULES];
    
    const newSession = createNewSession();
    const sessionId = newSession.id;
    pendingSessionIdRef.current = sessionId;
    
    const title = generateTitleFromMessage(text || files.map(f => f.name).join(', '));
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text || `[${files.map(f => f.name).join(', ')}] 파일을 첨부했습니다.`,
      timestamp: new Date(),
    };
    
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'model',
      text: '',
      timestamp: new Date(),
      isStreaming: false,
    };
    
    try {
      const fileContents = await Promise.all(
        files.map(file => readFileContent(file))
      );
      
      let analysisError: string | null = null;
      
      const parsedResult = await analyzeProject(
        text, 
        fileContents, 
        (chunk) => {},
        handleAnalysisComplete,
        (error) => {
          analysisError = error;
        }
      );
      
      if (analysisError) {
        throw new Error(analysisError);
      }
      
      const finalMessages: Message[] = [
        ...INITIAL_MESSAGES.map(m => ({ ...m })), 
        userMsg, 
        { 
          ...aiMsg, 
          text: '프로젝트 분석이 완료되었습니다.\n\n오른쪽 대시보드에서 분석된 모듈 구조와 견적 정보를 확인하실 수 있습니다. 기능 범위를 조정하신 후 견적을 산출해보세요.' 
        }
      ];
      
      setMessages(finalMessages);
      
      updateSession(sessionId, {
        title: title,
        messages: finalMessages,
        modules: latestModulesRef.current,
        isLoading: false,
      });
      
      setCurrentView('detail');
      
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.';
      setAnalysisError(errorMessage);
      
      deleteSession(sessionId);
    }
    
    pendingSessionIdRef.current = null;
    setIsAnalyzing(false);
  };

  const dismissError = () => {
    setAnalysisError(null);
  };

  const handleRetry = () => {
    setAnalysisError(null);
    handleNewChat();
  };

  return (
    <div className={`h-screen w-screen flex flex-col font-sans bg-white dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-50 transition-colors duration-300`}>
      
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

      {isResizing && (
        <div 
          className="fixed inset-0 z-[100] cursor-col-resize bg-transparent"
          onMouseMove={handleResize}
          onMouseUp={stopResizing}
          onMouseLeave={stopResizing}
        />
      )}

      <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-30 shrink-0 relative transition-colors duration-300">
        <div className="flex items-center gap-4 lg:gap-8 flex-shrink-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white hidden sm:block">Wishket Estimate</span>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <StepIndicator />
        </div>

        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
              </button>
              
              <button 
                onClick={handleNewChat}
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

      <main className="flex-1 flex overflow-hidden">
        <CollapsibleSidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
        />

        {currentView === 'landing' ? (
          <LandingView 
            onAnalyze={handleAnalyze}
            isLoading={isAnalyzing}
          />
        ) : (
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
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
