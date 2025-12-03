
import React, { useState, useRef, useEffect } from 'react';
import { INITIAL_MESSAGES, INITIAL_MODULES, PARTNER_PRESETS } from './constants';
import { Message, ModuleItem, PartnerType, EstimationStep, ProjectScale, ChatSession, DashboardState, ChatAction } from './types';
import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';
import { Icons } from './components/Icons';
import { StepIndicator } from './components/StepIndicator';
import { CollapsibleSidebar } from './components/CollapsibleSidebar';
import { LandingView } from './components/LandingView';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { deleteSession } from './services/chatHistoryService';
import { analyzeProject, readFileContent, ParsedAnalysisResult } from './services/apiService';
import { 
  getChatHistory, 
  saveChatHistory, 
  createNewSession, 
  updateSessionMessages, 
  updateSessionTitle,
  getSessionById,
  updateSessionDashboardState
} from './services/chatHistoryService';

type AppView = 'landing' | 'detail';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [modules, setModules] = useState<ModuleItem[]>(INITIAL_MODULES);
  
  // App View State (landing or detail)
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Partner Type State
  const [currentPartnerType, setCurrentPartnerType] = useState<PartnerType>('STUDIO');
  const multipliers = PARTNER_PRESETS[currentPartnerType];

  // Estimation Step Flow State
  const [estimationStep, setEstimationStep] = useState<EstimationStep>('SCOPE');
  const [currentScale, setCurrentScale] = useState<ProjectScale>('STANDARD');

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Collapsible Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Chat Session State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{id: string, title: string} | null>(null);

  // Load chat history on mount and cleanup ghost sessions
  useEffect(() => {
    const stored = getChatHistory();
    // Remove ghost sessions (empty sessions that have no messages)
    const cleaned = stored.filter(s => s.messages && s.messages.length > 0);
    if (cleaned.length !== stored.length) {
      saveChatHistory(cleaned);
    }
    setChatSessions(cleaned);
    if (cleaned.length > 0) {
      setActiveSessionId(cleaned[0].id);
    }
  }, []);

  // Sync messages to localStorage when they change (debounced)
  const messagesRef = React.useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (activeSessionId && currentView === 'detail' && messagesRef.current.length > INITIAL_MESSAGES.length) {
      updateSessionMessages(activeSessionId, messagesRef.current);
    }
  }, [activeSessionId, currentView]);

  // Sync dashboard state to localStorage whenever modules or settings change
  useEffect(() => {
    if (activeSessionId && currentView === 'detail') {
      const dashboardState: DashboardState = {
        modules,
        partnerType: currentPartnerType,
        projectScale: currentScale,
        estimationStep
      };
      updateSessionDashboardState(activeSessionId, dashboardState);
    }
  }, [activeSessionId, currentView, modules, currentPartnerType, currentScale, estimationStep]);

  // Handle new chat - just reset to landing view for new project
  const handleNewChat = () => {
    // Simply reset to landing view - a new session will be created when analysis starts
    setActiveSessionId(null);
    setMessages(INITIAL_MESSAGES);
    setModules(INITIAL_MODULES);
    setCurrentView('landing');
    setEstimationStep('SCOPE');
  };

  // Handle delete session - show confirmation modal
  const handleDeleteSessionClick = (sessionId: string, sessionTitle: string) => {
    setSessionToDelete({ id: sessionId, title: sessionTitle });
    setDeleteModalOpen(true);
  };

  // Confirm delete session
  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      deleteSession(sessionToDelete.id);
      const updated = getChatHistory();
      setChatSessions(updated);
      
      // If deleted session was active, switch to another or reset
      if (activeSessionId === sessionToDelete.id) {
        if (updated.length > 0) {
          handleSelectSession(updated[0].id);
        } else {
          setActiveSessionId(null);
          setMessages(INITIAL_MESSAGES);
          setModules(INITIAL_MODULES);
          setCurrentView('landing');
        }
      }
    }
    setDeleteModalOpen(false);
    setSessionToDelete(null);
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setSessionToDelete(null);
  };

  // Handle session selection - restore both messages AND dashboard state
  const handleSelectSession = (sessionId: string) => {
    const session = getSessionById(sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      if (session.messages.length > 0) {
        setMessages(session.messages);
        
        // Restore dashboard state if available
        if (session.dashboardState) {
          setModules(session.dashboardState.modules);
          setCurrentPartnerType(session.dashboardState.partnerType);
          setCurrentScale(session.dashboardState.projectScale);
          setEstimationStep(session.dashboardState.estimationStep);
        } else {
          // Legacy session without dashboard state - reset to defaults
          setModules(INITIAL_MODULES);
          setCurrentPartnerType('STUDIO');
          setCurrentScale('STANDARD');
          setEstimationStep('SCOPE');
        }
        
        setCurrentView('detail');
      } else {
        setMessages(INITIAL_MESSAGES);
        setModules(INITIAL_MODULES);
        setCurrentView('landing');
      }
    }
  };

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
    console.log('[App] applyPartnerType called with:', type);
    setCurrentPartnerType(type);
    console.log('[App] Partner type updated to:', type);
    
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
    console.log('[App] handleScaleChange called with:', scale);
    setCurrentScale(scale);
    if (scale === 'MVP') {
        console.log('[App] Applying MVP scale - disabling optional modules');
        setModules(prev => {
            const updated = prev.map(m => ({
                ...m,
                isSelected: m.required ? true : false,
                subFeatures: m.subFeatures.map(s => ({ ...s, isSelected: s.id.endsWith('1') }))
            }));
            console.log('[App] MVP modules updated:', updated.filter(m => m.isSelected).length, 'active');
            return updated;
        });
    } else if (scale === 'STANDARD') {
        console.log('[App] Applying STANDARD scale - reset to initial');
        setModules(INITIAL_MODULES);
    } else if (scale === 'HIGH_END') {
        console.log('[App] Applying HIGH_END scale - enabling all modules');
        setModules(prev => {
            const updated = prev.map(m => ({
                ...m,
                isSelected: true,
                subFeatures: m.subFeatures.map(s => ({ ...s, isSelected: true }))
            }));
            console.log('[App] HIGH_END modules updated:', updated.length, 'all active');
            return updated;
        });
    }
  };

  const generateFeatureId = (moduleId: string, featureName: string): string => {
    const sanitized = featureName.toLowerCase().replace(/[^a-z0-9가-힣]/g, '_').slice(0, 20);
    return `${moduleId}_${sanitized}_${Date.now()}`;
  };

  const generateModuleId = (moduleName: string): string => {
    const sanitized = moduleName.toLowerCase().replace(/[^a-z0-9가-힣]/g, '_').slice(0, 20);
    return `module_${sanitized}_${Date.now()}`;
  };

  const handleAddFeature = (moduleId: string, feature: { name: string; price: number; manWeeks: number; isNew: true }) => {
    console.log('[App] Adding new feature to module:', moduleId, feature);
    setModules(prev => prev.map(m => {
      if (m.id === moduleId) {
        const newFeature = {
          id: generateFeatureId(moduleId, feature.name),
          name: feature.name,
          price: feature.price,
          manWeeks: feature.manWeeks,
          isSelected: true,
          isNew: true
        };
        console.log('[App] New feature created:', newFeature);
        return {
          ...m,
          isSelected: true,
          subFeatures: [...m.subFeatures, newFeature]
        };
      }
      return m;
    }));
  };

  const handleCreateModule = (moduleData: { 
    name: string; 
    description: string; 
    baseCost: number; 
    baseManMonths: number; 
    category: string; 
    isNew: true;
    subFeatures: { name: string; price: number; manWeeks: number; isNew: true }[] 
  }) => {
    console.log('[App] Creating new module:', moduleData);
    const newModuleId = generateModuleId(moduleData.name);
    const newModule: ModuleItem = {
      id: newModuleId,
      name: moduleData.name,
      description: moduleData.description,
      baseCost: moduleData.baseCost,
      baseManMonths: moduleData.baseManMonths,
      category: moduleData.category,
      isSelected: true,
      isNew: true,
      subFeatures: moduleData.subFeatures.map((f, idx) => ({
        id: `${newModuleId}_feature_${idx + 1}`,
        name: f.name,
        price: f.price,
        manWeeks: f.manWeeks,
        isSelected: true,
        isNew: true
      }))
    };
    console.log('[App] New module created:', newModule);
    setModules(prev => [...prev, newModule]);
  };

  const handleChatAction = (action: ChatAction) => {
    console.log('[App] Handling chat action:', action);
    
    switch (action.type) {
      case 'toggle_module':
        console.log('[App] toggle_module case triggered');
        if (action.payload.moduleId) {
          const targetModule = modules.find(m => m.id === action.payload.moduleId);
          if (!targetModule) {
            console.warn(`[App] Invalid moduleId: "${action.payload.moduleId}" - not found in current modules`);
            console.log('[App] Available moduleIds:', modules.map(m => m.id));
            return;
          }
          if (targetModule.required && targetModule.isSelected) {
            console.warn(`[App] Cannot disable required module: "${targetModule.name}"`);
            return;
          }
          console.log('[App] Calling handleToggleModule for:', targetModule.name);
          handleToggleModule(action.payload.moduleId);
        }
        break;
        
      case 'toggle_feature':
        console.log('[App] toggle_feature case triggered');
        if (action.payload.moduleId && action.payload.featureId) {
          const targetModule = modules.find(m => m.id === action.payload.moduleId);
          if (!targetModule) {
            console.warn(`[App] Invalid moduleId: "${action.payload.moduleId}" - not found`);
            console.log('[App] Available moduleIds:', modules.map(m => m.id));
            return;
          }
          const targetFeature = targetModule.subFeatures.find(f => f.id === action.payload.featureId);
          if (!targetFeature) {
            console.warn(`[App] Invalid featureId: "${action.payload.featureId}" - not found in module "${targetModule.name}"`);
            console.log('[App] Available featureIds:', targetModule.subFeatures.map(f => f.id));
            return;
          }
          handleToggleSubFeature(action.payload.moduleId, action.payload.featureId);
        }
        break;

      case 'add_feature':
        console.log('[App] add_feature case triggered');
        if (action.payload.moduleId && action.payload.feature) {
          const targetModule = modules.find(m => m.id === action.payload.moduleId);
          if (!targetModule) {
            console.warn(`[App] Invalid moduleId for add_feature: "${action.payload.moduleId}"`);
            console.log('[App] Available moduleIds:', modules.map(m => m.id));
            return;
          }
          handleAddFeature(action.payload.moduleId, action.payload.feature);
        } else {
          console.warn('[App] add_feature requires moduleId and feature payload');
        }
        break;

      case 'create_module':
        console.log('[App] create_module case triggered');
        if (action.payload.module) {
          handleCreateModule(action.payload.module);
        } else {
          console.warn('[App] create_module requires module payload');
        }
        break;
        
      case 'update_scale':
        if (action.payload.scale) {
          const validScales = ['MVP', 'STANDARD', 'HIGH_END'];
          if (!validScales.includes(action.payload.scale)) {
            console.warn(`[App] Invalid scale: "${action.payload.scale}"`);
            return;
          }
          handleScaleChange(action.payload.scale);
        }
        break;
        
      case 'no_action':
      default:
        break;
    }
  };

  // Handle parsed analysis result
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
    } else {
      console.warn('[App] No valid modules in result');
    }
  };

  // Handle initial analysis from landing page
  const handleAnalyze = async (text: string, files: File[]) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    // Always create a NEW session for each analysis (add to history, don't overwrite)
    const newSession = createNewSession();
    newSession.isLoading = true;
    const updatedSessions = [newSession, ...chatSessions];
    saveChatHistory(updatedSessions);
    setChatSessions(updatedSessions);
    setActiveSessionId(newSession.id);
    const currentSessionId = newSession.id;
    
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
      const newMessages = [
        ...INITIAL_MESSAGES, 
        userMsg, 
        { 
          ...aiMsg, 
          text: '프로젝트 분석이 완료되었습니다.\n\n오른쪽 대시보드에서 분석된 모듈 구조와 견적 정보를 확인하실 수 있습니다. 기능 범위를 조정하신 후 견적을 산출해보세요.' 
        }
      ];
      setMessages(newMessages);
      setCurrentView('detail');

      // Save session with first message as title
      if (currentSessionId) {
        const title = text ? text.substring(0, 20).trim() : 'New Chat';
        updateSessionTitle(currentSessionId, title);
        updateSessionMessages(currentSessionId, newMessages);
        // Remove loading state
        const sessions = getChatHistory().map(s => ({ ...s, isLoading: false }));
        saveChatHistory(sessions);
        setChatSessions(sessions);
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.';
      setAnalysisError(errorMessage);
      
      // Rule 3: Remove failed ghost session
      if (currentSessionId) {
        const sessions = getChatHistory().filter(s => {
          if (s.id === currentSessionId && (!s.messages || s.messages.length === 0)) {
            return false; // Remove empty failed session
          }
          return true;
        });
        saveChatHistory(sessions);
        setChatSessions(sessions);
        if (sessions.length > 0) {
          setActiveSessionId(sessions[0].id);
        } else {
          setActiveSessionId(null);
        }
      }
    }
    
    setIsAnalyzing(false);
  };

  // Dismiss error notification and reset state
  const dismissError = () => {
    setAnalysisError(null);
  };

  // Handle retry from error state
  const handleRetry = () => {
    setAnalysisError(null);
    setCurrentView('landing');
    setMessages(INITIAL_MESSAGES);
    setModules(INITIAL_MODULES);
    setEstimationStep('SCOPE');
  };

  return (
    <div className={`h-screen w-screen flex flex-col font-sans bg-white dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-50 transition-colors duration-300`}>
      
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
          <StepIndicator />
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
          chatSessions={chatSessions}
          activeSessionId={activeSessionId}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSessionClick}
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
                onChatAction={handleChatAction}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        sessionTitle={sessionToDelete?.title || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default App;
