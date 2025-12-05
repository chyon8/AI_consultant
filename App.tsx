
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { INITIAL_MESSAGES, INITIAL_MODULES, PARTNER_PRESETS } from './constants';
import { Message, ModuleItem, PartnerType, EstimationStep, ProjectScale, ChatSession, DashboardState, ChatAction, InputSource, ProgressiveLoadingState, ParsedSchedule, ParsedSummary } from './types';
import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';
import { Icons } from './components/Icons';
import { StepIndicator } from './components/StepIndicator';
import { CollapsibleSidebar } from './components/CollapsibleSidebar';
import { LandingView } from './components/LandingView';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { SettingsModal } from './components/SettingsModal';
import { AiSettingsModal } from './components/AiSettingsModal';
import { RenderGuard, useSessionValidation } from './components/RenderGuard';
import { AIModelSettings, getDefaultModelSettings } from './constants/aiConfig';
import { deleteSession } from './services/chatHistoryService';
import { 
  sessionManager, 
  SessionInstance, 
  ImmutablePrompt,
  validateBeforeRender,
  withSessionValidation
} from './services/sessionInstance';
import { 
  sessionCoupler, 
  AtomicSessionUnit,
  createIsolationGuard
} from './services/atomicSession';
import { analyzeProject, readFileAsData, uploadAndExtractFiles, FileData, ParsedAnalysisResult, UploadedFileInfo } from './services/apiService';
import { 
  sessionSandbox, 
  SessionSnapshot, 
  startAnalyzeJob, 
  fetchJobStatus, 
  fetchJobChunks,
  cancelJob as cancelServerJob,
  fetchSessionJobs,
  registerJobSession,
  getJobOwnerSession,
  unregisterJob,
  cleanupOldJobs
} from './services/sessionSandbox';
import { 
  validateModuleToggle, 
  validateFeatureToggle, 
  validateChatAction, 
  isEssentialModule,
  isEssentialFeature,
  CONSTRAINT_ERROR_MESSAGES 
} from './services/constraintValidator';
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
  
  // Abort Controller for analysis
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Current job ID for background analysis
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const jobPollingRef = useRef<NodeJS.Timeout | null>(null);
  
  // Project Summary Content (STEP 1 from Gemini analysis)
  const [projectSummaryContent, setProjectSummaryContent] = useState<string>('');
  
  // AI Insight for Project Summary
  const [aiInsight, setAiInsight] = useState<string>('');

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
  
  // [FIX] Ref to track activeSessionId for polling callbacks (avoids React closure issues)
  const activeSessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{id: string, title: string} | null>(null);

  // Settings Modal State
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // AI Settings Modal State
  const [aiSettingsModalOpen, setAiSettingsModalOpen] = useState(false);
  const [aiModelSettings, setAiModelSettings] = useState<AIModelSettings>(() => {
    const stored = localStorage.getItem('aiModelSettings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return getDefaultModelSettings();
      }
    }
    return getDefaultModelSettings();
  });

  // Referenced files state - tracks source documents used for analysis
  const [referencedFiles, setReferencedFiles] = useState<InputSource[]>([]);

  // Progressive Loading State - tracks which stages have loaded
  const [progressiveState, setProgressiveState] = useState<ProgressiveLoadingState>({
    modulesReady: false,
    estimatesReady: false,
    scheduleReady: false,
    summaryReady: false,
  });
  const processedStagesRef = useRef<Set<string>>(new Set());
  const acknowledgedStagesPerJob = useRef<Record<string, string[]>>({});

  // Session state isolation tracking - stores which session each state belongs to
  const stateOwnerSessionRef = useRef<string | null>(null);
  
  // Atomic Session Coupling - enforces 1:1 Chat+Dashboard binding
  const isolationGuardRef = useRef<ReturnType<typeof createIsolationGuard> | null>(null);
  
  // Validation: Check if current state matches the active session (ATOMIC UNIT check)
  const isStateValidForSession = useCallback((targetSessionId: string | null): boolean => {
    if (!targetSessionId) return true;
    if (!stateOwnerSessionRef.current) return true;
    
    const isValid = stateOwnerSessionRef.current === targetSessionId;
    if (!isValid) {
      console.warn(`[App] ATOMIC UNIT VIOLATION: state belongs to ${stateOwnerSessionRef.current}, but target is ${targetSessionId}`);
    }
    return isValid;
  }, []);
  
  // Atomic Session Guard - blocks cross-session operations
  const validateAtomicOperation = useCallback((operation: string): boolean => {
    if (!isolationGuardRef.current) {
      console.warn(`[App] No isolation guard for ${operation}`);
      return false;
    }
    if (!isolationGuardRef.current.canUpdateDashboard()) {
      console.error(`[App] ATOMIC BLOCK: ${operation} rejected - session mismatch`);
      return false;
    }
    return true;
  }, []);

  // Persist AI model settings to localStorage
  const handleSaveAiSettings = (settings: AIModelSettings) => {
    setAiModelSettings(settings);
    localStorage.setItem('aiModelSettings', JSON.stringify(settings));
    console.log('[App] AI model settings saved to localStorage:', settings);
  };

  // Load chat history on mount and cleanup ghost sessions
  useEffect(() => {
    // Cleanup old job registry entries
    cleanupOldJobs();
    
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
      // [STATE ISOLATION] Validate state owner before saving
      if (stateOwnerSessionRef.current && stateOwnerSessionRef.current !== activeSessionId) {
        console.warn(`[App] State owner mismatch during save: owner=${stateOwnerSessionRef.current}, active=${activeSessionId}`);
        return; // Block cross-session state save
      }
      
      const dashboardState: DashboardState = {
        sessionId: activeSessionId, // Owner ID for validation
        modules,
        partnerType: currentPartnerType,
        projectScale: currentScale,
        estimationStep,
        projectSummaryContent,
        aiInsight,
        referencedFiles
      };
      updateSessionDashboardState(activeSessionId, dashboardState);
    }
  }, [activeSessionId, currentView, modules, currentPartnerType, currentScale, estimationStep, projectSummaryContent, aiInsight, referencedFiles]);

  // Handle visibility change - check job status when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && currentJobId) {
        console.log('[App] Tab became visible, checking job status:', currentJobId);
        const jobAckStages = acknowledgedStagesPerJob.current[currentJobId] || [];
        const status = await fetchJobStatus(currentJobId, jobAckStages);
        
        if (status) {
          // [IMMUTABLE MAPPING] Get owner session from registry, NOT from mutable ref
          const ownerSessionId = getJobOwnerSession(currentJobId);
          if (!ownerSessionId) {
            console.warn('[App] Job has no registered owner session, skipping');
            return;
          }
          
          if (status.status === 'completed' && status.result) {
            console.log('[App] Job completed while tab was hidden, owner:', ownerSessionId);
            
            // Stop polling
            if (jobPollingRef.current) {
              clearInterval(jobPollingRef.current);
              jobPollingRef.current = null;
            }
            
            // Get user message from owner session's history (already committed via Prompt Logging)
            const session = getSessionById(ownerSessionId);
            const userMsg = session?.messages?.find(m => m.role === 'user') || {
              id: Date.now().toString(),
              role: 'user' as const,
              text: '프로젝트 분석 요청',
              timestamp: new Date(),
            };
            
            // [SCOPED STORAGE] Always save to OWNER session's storage (immutable)
            const { convertedModules, newMessages, dashboardState } = 
              saveResultToSessionStorage(ownerSessionId, status.result, userMsg);
            
            // [DATA LEAKAGE BLOCK] Only update UI if owner === active
            if (ownerSessionId === activeSessionId) {
              console.log('[App] Session match - updating UI after visibility change');
              setModules(convertedModules);
              setProjectSummaryContent(dashboardState.projectSummaryContent);
              setMessages(newMessages);
              setCurrentView('detail');
              
              // Generate AI insight
              const totalFeatures = convertedModules.reduce((sum, m) => sum + m.subFeatures.length, 0);
              generateAiInsight({
                projectName: status.result.projectTitle || '',
                businessGoals: '',
                coreValues: [],
                moduleCount: convertedModules.length,
                featureCount: totalFeatures
              });
            } else {
              console.log('[App] Session mismatch - UI NOT updated after visibility change');
            }
            
            // Cleanup
            unregisterJob(currentJobId);
            setCurrentJobId(null);
            setIsAnalyzing(false);
            pendingUserMsgRef.current = null;
            pendingSessionIdRef.current = null;
            
          } else if (status.status === 'failed') {
            if (jobPollingRef.current) {
              clearInterval(jobPollingRef.current);
              jobPollingRef.current = null;
            }
            
            // [DATA LEAKAGE BLOCK] Only show error if owner === active
            if (ownerSessionId === activeSessionId) {
              setAnalysisError(status.error || '분석 중 오류가 발생했습니다.');
            }
            unregisterJob(currentJobId);
            setCurrentJobId(null);
            setIsAnalyzing(false);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentJobId, activeSessionId]);

  // Handle new chat - just reset to landing view for new project
  const handleNewChat = () => {
    // [STATE ISOLATION] Reset state owner when starting fresh
    stateOwnerSessionRef.current = null;
    
    // Simply reset to landing view - a new session will be created when analysis starts
    setActiveSessionId(null);
    setMessages(INITIAL_MESSAGES);
    setModules(INITIAL_MODULES);
    setCurrentView('landing');
    setEstimationStep('SCOPE');
    setProjectSummaryContent('');
    setAiInsight('');
    setReferencedFiles([]);
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

  // Freeze current session state before switching
  const freezeCurrentSession = async () => {
    if (!activeSessionId) return;
    
    const snapshot: SessionSnapshot = {
      sessionId: activeSessionId,
      timestamp: Date.now(),
      scrollPosition: 0,
      inputText: '',
      pendingJobId: currentJobId,
      lastChunkSequence: -1,
      streamingBuffer: '',
      viewState: currentView,
      analysisInProgress: isAnalyzing
    };
    
    await sessionSandbox.freezeSession(snapshot);
    console.log(`[App] Froze session ${activeSessionId}`);
  };

  // Check for pending jobs and rehydrate
  const rehydrateSession = async (sessionId: string) => {
    const snapshot = await sessionSandbox.thawSession(sessionId);
    
    if (snapshot?.pendingJobId) {
      console.log(`[App] Found pending job ${snapshot.pendingJobId} for session ${sessionId}`);
      
      // [IMMUTABLE MAPPING] Verify this job belongs to this session
      const ownerSessionId = getJobOwnerSession(snapshot.pendingJobId);
      if (ownerSessionId && ownerSessionId !== sessionId) {
        console.warn(`[App] Job ${snapshot.pendingJobId} belongs to ${ownerSessionId}, not ${sessionId} - skipping`);
        await sessionSandbox.deleteSnapshot(sessionId);
        return;
      }
      
      const jobAckStages = acknowledgedStagesPerJob.current[snapshot.pendingJobId] || [];
      const jobStatus = await fetchJobStatus(snapshot.pendingJobId, jobAckStages);
      
      if (jobStatus) {
        if (jobStatus.status === 'completed' && jobStatus.result) {
          console.log(`[App] Job completed, applying result to session ${sessionId}`);
          
          // Get user message from session history (already committed via Prompt Logging)
          const session = getSessionById(sessionId);
          const userMsg = session?.messages?.find(m => m.role === 'user') || {
            id: Date.now().toString(),
            role: 'user' as const,
            text: snapshot.inputText || '프로젝트 분석 요청',
            timestamp: new Date(),
          };
          
          // [SCOPED STORAGE] Save to owner session's storage
          const { convertedModules, newMessages, dashboardState } = 
            saveResultToSessionStorage(sessionId, jobStatus.result, userMsg);
          
          // sessionId IS the active session (we just switched to it)
          // So we update UI in this case
          setModules(convertedModules);
          setProjectSummaryContent(dashboardState.projectSummaryContent);
          setMessages(newMessages);
          setCurrentView('detail');
          
          // Generate AI insight
          const totalFeatures = convertedModules.reduce((sum, m) => sum + m.subFeatures.length, 0);
          generateAiInsight({
            projectName: jobStatus.result.projectTitle || '',
            businessGoals: '',
            coreValues: [],
            moduleCount: convertedModules.length,
            featureCount: totalFeatures
          });
          
          // Cleanup
          unregisterJob(snapshot.pendingJobId);
          await sessionSandbox.deleteSnapshot(sessionId);
          setCurrentJobId(null);
          setIsAnalyzing(false);
          
        } else if (jobStatus.status === 'running' || jobStatus.status === 'pending') {
          console.log(`[App] Job still running, resuming polling for session ${sessionId}`);
          setCurrentJobId(snapshot.pendingJobId);
          setIsAnalyzing(true);
          // [FIX] Show Dashboard with skeleton UI instead of LandingView loading screen
          setCurrentView('detail');
          // [FIX] Reset progressiveState to show skeletons while resuming
          setProgressiveState({
            modulesReady: false,
            estimatesReady: false,
            scheduleReady: false,
            summaryReady: false,
            schedule: null,
            summary: null,
          });
          startJobPolling(snapshot.pendingJobId);
          
        } else if (jobStatus.status === 'failed') {
          setAnalysisError(jobStatus.error || '분석이 실패했습니다.');
          unregisterJob(snapshot.pendingJobId);
          await sessionSandbox.deleteSnapshot(sessionId);
          setCurrentJobId(null);
          setIsAnalyzing(false);
          
        } else if (jobStatus.status === 'cancelled') {
          unregisterJob(snapshot.pendingJobId);
          await sessionSandbox.deleteSnapshot(sessionId);
          setCurrentJobId(null);
          setIsAnalyzing(false);
        }
      }
    }
  };

  // Handle session selection - STRICT CONTEXT SWITCHING (Atomic Unit sync)
  const handleSelectSession = async (sessionId: string) => {
    console.log(`[App] STRICT CONTEXT SWITCH requested: ${activeSessionId} → ${sessionId}`);
    
    // [ATOMIC UNIT] Save current session's atomic state before switching
    if (activeSessionId && stateOwnerSessionRef.current === activeSessionId) {
      console.log(`[App] Saving atomic state for session ${activeSessionId} before switch`);
      sessionCoupler.backgroundUpdate(activeSessionId, (unit) => {
        unit.chat.messages = messages;
        unit.dashboard.modules = modules;
        unit.dashboard.partnerType = currentPartnerType;
        unit.dashboard.projectScale = currentScale;
        unit.dashboard.estimationStep = estimationStep;
        unit.dashboard.projectSummaryContent = projectSummaryContent;
        unit.dashboard.aiInsight = aiInsight;
        unit.dashboard.referencedFiles = referencedFiles;
      });
    }
    
    // Freeze current session before switching
    await freezeCurrentSession();
    
    // [FIX] Do NOT clear job polling on session switch!
    // The background job should continue polling until completion
    // Result will be saved to the correct owner session via saveResultToSessionStorage
    // Note: Polling uses ownerSessionId from job registry, not active session
    
    // [STRICT SWITCH] STEP 1: Clear ALL current state immediately
    console.log(`[App] STRICT SWITCH STEP 1: Clearing all current state`);
    setMessages(INITIAL_MESSAGES);
    setModules(INITIAL_MODULES);
    setReferencedFiles([]);
    setProjectSummaryContent('');
    setAiInsight('');
    setCurrentPartnerType('STUDIO');
    setCurrentScale('STANDARD');
    setEstimationStep('SCOPE');
    // [GL-01 FIX] Reset analyzing state to prevent Ghost Loading
    setIsAnalyzing(false);
    setCurrentJobId(null);
    // [GL-01 FIX] Reset progressive state to prevent stale skeleton display
    setProgressiveState({
      modulesReady: true, // Default to true for completed sessions
      estimatesReady: true,
      scheduleReady: true,
      summaryReady: true,
      schedule: null,
      summary: null,
    });
    
    const session = getSessionById(sessionId);
    if (session) {
      // [ATOMIC UNIT] Ensure session exists in coupler BEFORE any switch
      let atomicUnit = sessionCoupler.getUnit(sessionId);
      if (!atomicUnit) {
        // Create and populate atomic unit for legacy session
        atomicUnit = sessionCoupler.createUnit(sessionId, '', session.title || '이전 세션');
        if (atomicUnit) {
          // Populate with legacy session data
          atomicUnit.chat.messages = session.messages || INITIAL_MESSAGES;
          if (session.dashboardState) {
            atomicUnit.dashboard.modules = session.dashboardState.modules;
            atomicUnit.dashboard.partnerType = session.dashboardState.partnerType;
            atomicUnit.dashboard.projectScale = session.dashboardState.projectScale;
            atomicUnit.dashboard.estimationStep = session.dashboardState.estimationStep;
            atomicUnit.dashboard.projectSummaryContent = session.dashboardState.projectSummaryContent || '';
            atomicUnit.dashboard.aiInsight = session.dashboardState.aiInsight || '';
            atomicUnit.dashboard.referencedFiles = session.dashboardState.referencedFiles || [];
          }
          console.log(`[App] Created and populated atomic unit for legacy session: ${sessionId}`);
        }
      } else {
        // [FIX] Check if atomic unit has stale data but localStorage has different/better data
        // This can happen if job completed while on different session and atomic unit wasn't updated
        const localStorageModules = session.dashboardState?.modules;
        const atomicModules = atomicUnit.dashboard.modules;
        const localStorageMessages = session.messages;
        const atomicMessages = atomicUnit.chat.messages;
        
        // More comprehensive stale data detection:
        // 1. localStorage has more messages than atomic unit
        // 2. Different number of modules
        // 3. First module name is different (modules from different analysis)
        // 4. localStorage has AI completion message but atomic unit doesn't
        const localHasAIMessage = localStorageMessages?.some(m => m.role === 'model' && m.text.includes('분석이 완료되었습니다'));
        const atomicHasAIMessage = atomicMessages?.some(m => m.role === 'model' && m.text.includes('분석이 완료되었습니다'));
        
        const isStaleData = localStorageModules && localStorageMessages && (
          (localStorageMessages.length > atomicMessages.length) ||
          (localStorageModules.length !== atomicModules.length) ||
          (localStorageModules[0]?.name !== atomicModules[0]?.name) ||
          (localHasAIMessage && !atomicHasAIMessage) // localStorage has completion but atomic doesn't
        );
        
        if (isStaleData) {
          console.warn(`[App] STALE DATA DETECTED: Syncing atomic unit from localStorage for session ${sessionId}`);
          console.log(`[App] localStorage: ${localStorageMessages.length} msgs (hasAI: ${localHasAIMessage}), ${localStorageModules.length} modules`);
          console.log(`[App] atomic unit: ${atomicMessages.length} msgs (hasAI: ${atomicHasAIMessage}), ${atomicModules.length} modules`);
          
          // Sync from localStorage to atomic unit
          atomicUnit.chat.messages = localStorageMessages;
          atomicUnit.dashboard.modules = localStorageModules;
          if (session.dashboardState) {
            atomicUnit.dashboard.partnerType = session.dashboardState.partnerType;
            atomicUnit.dashboard.projectScale = session.dashboardState.projectScale;
            atomicUnit.dashboard.estimationStep = session.dashboardState.estimationStep;
            atomicUnit.dashboard.projectSummaryContent = session.dashboardState.projectSummaryContent || '';
            atomicUnit.dashboard.aiInsight = session.dashboardState.aiInsight || '';
            atomicUnit.dashboard.referencedFiles = session.dashboardState.referencedFiles || [];
          }
          
          // Persist the sync
          sessionCoupler.backgroundUpdate(sessionId, (unit) => {
            unit.chat.messages = atomicUnit!.chat.messages;
            unit.dashboard = { ...atomicUnit!.dashboard };
          });
          console.log(`[App] Atomic unit synced from localStorage for session ${sessionId}`);
        }
      }
      
      // [CRITICAL] Abort switch if atomic unit cannot be created
      if (!atomicUnit) {
        console.error(`[App] ATOMIC SWITCH ABORT: Cannot create unit for session ${sessionId}`);
        return;
      }
      
      // [STRICT SWITCH] STEP 2: Update all session references atomically
      console.log(`[App] STRICT SWITCH STEP 2: Updating session references to ${sessionId}`);
      stateOwnerSessionRef.current = sessionId;
      setActiveSessionId(sessionId);
      sessionSandbox.setCurrentSession(sessionId);
      sessionManager.setCurrentSession(sessionId);
      
      sessionCoupler.switchSession(sessionId);
      isolationGuardRef.current = createIsolationGuard(sessionId);
      
      // Ensure session instance exists
      const instance = sessionManager.getInstance(sessionId);
      if (!instance) {
        sessionManager.registerSession(sessionId, session.title || '이전 세션');
        console.log(`[App] Registered legacy session ${sessionId}`);
      }
      
      // [STRICT SWITCH] STEP 3: Sync ALL components from atomic unit
      // Atomic unit is ALWAYS the source of truth (already populated from localStorage if legacy)
      console.log(`[App] STRICT SWITCH STEP 3: Syncing Chat + Dashboard from atomic unit ${sessionId}`);
      
      // Sync from atomic unit data
      setMessages(atomicUnit.chat.messages);
      setModules(atomicUnit.dashboard.modules);
      setCurrentPartnerType(atomicUnit.dashboard.partnerType);
      setCurrentScale(atomicUnit.dashboard.projectScale);
      setEstimationStep(atomicUnit.dashboard.estimationStep);
      setProjectSummaryContent(atomicUnit.dashboard.projectSummaryContent);
      setAiInsight(atomicUnit.dashboard.aiInsight);
      setReferencedFiles(atomicUnit.dashboard.referencedFiles);
      
      if (atomicUnit.chat.messages.length > INITIAL_MESSAGES.length) {
        setCurrentView('detail');
      } else {
        setCurrentView('landing');
      }
      
      console.log(`[App] ATOMIC SYNC: Chat(${atomicUnit.chat.messages.length} msgs) + Dashboard(${atomicUnit.dashboard.modules.length} modules)`);
      console.log(`[App] Dashboard modules:`, atomicUnit.dashboard.modules.map(m => m.name).slice(0, 3));
      
      console.log(`[App] STRICT SWITCH COMPLETE: ${sessionId} | State owner: ${stateOwnerSessionRef.current} | Guard active: ${!!isolationGuardRef.current}`);
      
      // Rehydrate: check for pending background jobs
      await rehydrateSession(sessionId);
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
    // [ISOLATION RULE] Block if no active session or guard mismatch
    if (!validateAtomicOperation('handleToggleModule')) {
      console.error(`[App] ISOLATION BLOCK: Module toggle for ${id} rejected`);
      return;
    }
    
    const validation = validateModuleToggle(modules, id);
    if (!validation.valid) {
      console.warn(`[App] Module toggle blocked: ${validation.errorCode} - ${validation.message}`);
      return;
    }
    
    setModules(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, isSelected: !m.isSelected };
      }
      return m;
    }));
  };

  const handleToggleSubFeature = (moduleId: string, subId: string) => {
    // [ISOLATION RULE] Block if no active session or guard mismatch
    if (!validateAtomicOperation('handleToggleSubFeature')) {
      console.error(`[App] ISOLATION BLOCK: Feature toggle for ${moduleId}/${subId} rejected`);
      return;
    }
    
    const validation = validateFeatureToggle(modules, moduleId, subId);
    if (!validation.valid) {
      console.warn(`[App] Feature toggle blocked: ${validation.errorCode} - ${validation.message}`);
      return;
    }
    
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
    // [ISOLATION RULE] Block cross-session partner type changes
    if (!validateAtomicOperation('applyPartnerType')) {
      console.error(`[App] ISOLATION BLOCK: Partner type change rejected`);
      return;
    }
    
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
    // [ISOLATION RULE] Block cross-session scale changes
    if (!validateAtomicOperation('handleScaleChange')) {
      console.error(`[App] ISOLATION BLOCK: Scale change rejected`);
      return;
    }
    
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
    // [ISOLATION RULE] Block cross-session feature additions
    if (!validateAtomicOperation('handleAddFeature')) {
      console.error(`[App] ISOLATION BLOCK: Add feature rejected`);
      return;
    }
    
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
    // [ISOLATION RULE] Block cross-session module creation
    if (!validateAtomicOperation('handleCreateModule')) {
      console.error(`[App] ISOLATION BLOCK: Create module rejected`);
      return;
    }
    
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

  const handleChatAction = (action: ChatAction): { success: boolean; error?: string } => {
    // [ISOLATION RULE] Block cross-session chat actions
    if (!validateAtomicOperation('handleChatAction')) {
      console.error(`[App] ISOLATION BLOCK: Chat action rejected`);
      return { success: false, error: 'Session isolation violation' };
    }
    
    console.log('[App] Handling chat action:', action);
    
    const findModuleByIdOrName = (moduleIdOrName: string) => {
      let found = modules.find(m => m.id === moduleIdOrName);
      if (!found) {
        found = modules.find(m => m.name === moduleIdOrName || m.name.includes(moduleIdOrName) || moduleIdOrName.includes(m.name));
        if (found) {
          console.log(`[App] Module found by name fallback: "${moduleIdOrName}" -> "${found.name}" [${found.id}]`);
        }
      }
      return found;
    };

    const findFeatureByIdOrName = (module: ModuleItem, featureIdOrName: string) => {
      let found = module.subFeatures.find(f => f.id === featureIdOrName);
      if (!found) {
        found = module.subFeatures.find(f => f.name === featureIdOrName || f.name.includes(featureIdOrName) || featureIdOrName.includes(f.name));
        if (found) {
          console.log(`[App] Feature found by name fallback: "${featureIdOrName}" -> "${found.name}" [${found.id}]`);
        }
      }
      return found;
    };
    
    switch (action.type) {
      case 'toggle_module': {
        console.log('[App] toggle_module case triggered');
        if (!action.payload.moduleId) {
          return { success: false, error: '모듈 ID가 누락되었습니다.' };
        }
        const targetModule = findModuleByIdOrName(action.payload.moduleId);
        if (!targetModule) {
          console.warn(`[App] Invalid moduleId: "${action.payload.moduleId}" - not found`);
          console.log('[App] Available modules:', modules.map(m => `${m.name} [${m.id}]`));
          return { success: false, error: `"${action.payload.moduleId}" 모듈을 찾을 수 없습니다.` };
        }
        
        const validation = validateModuleToggle(modules, targetModule.id);
        if (!validation.valid) {
          console.warn(`[App] Constraint violation: ${validation.errorCode} - ${validation.message}`);
          const prefix = validation.errorCode ? CONSTRAINT_ERROR_MESSAGES[validation.errorCode] : '';
          return { success: false, error: `${prefix}\n${validation.message}` };
        }
        
        console.log('[App] Calling handleToggleModule for:', targetModule.name);
        handleToggleModule(targetModule.id);
        return { success: true };
      }
        
      case 'toggle_feature': {
        console.log('[App] toggle_feature case triggered');
        if (!action.payload.moduleId || !action.payload.featureId) {
          return { success: false, error: '모듈 ID 또는 기능 ID가 누락되었습니다.' };
        }
        const targetModule = findModuleByIdOrName(action.payload.moduleId);
        if (!targetModule) {
          console.warn(`[App] Invalid moduleId: "${action.payload.moduleId}" - not found`);
          console.log('[App] Available modules:', modules.map(m => `${m.name} [${m.id}]`));
          return { success: false, error: `"${action.payload.moduleId}" 모듈을 찾을 수 없습니다.` };
        }
        const targetFeature = findFeatureByIdOrName(targetModule, action.payload.featureId);
        if (!targetFeature) {
          console.warn(`[App] Invalid featureId: "${action.payload.featureId}" - not found in module "${targetModule.name}"`);
          console.log('[App] Available features:', targetModule.subFeatures.map(f => `${f.name} [${f.id}]`));
          return { success: false, error: `"${targetModule.name}" 모듈에서 "${action.payload.featureId}" 기능을 찾을 수 없습니다.` };
        }
        
        const validation = validateFeatureToggle(modules, targetModule.id, targetFeature.id);
        if (!validation.valid) {
          console.warn(`[App] Constraint violation: ${validation.errorCode} - ${validation.message}`);
          const prefix = validation.errorCode ? CONSTRAINT_ERROR_MESSAGES[validation.errorCode] : '';
          return { success: false, error: `${prefix}\n${validation.message}` };
        }
        
        console.log('[App] Calling handleToggleSubFeature for:', targetModule.name, '->', targetFeature.name);
        handleToggleSubFeature(targetModule.id, targetFeature.id);
        return { success: true };
      }

      case 'add_feature': {
        console.log('[App] add_feature case triggered');
        if (!action.payload.moduleId || !action.payload.feature) {
          return { success: false, error: 'add_feature에 필요한 정보가 누락되었습니다.' };
        }
        const targetModule = findModuleByIdOrName(action.payload.moduleId);
        if (!targetModule) {
          console.warn(`[App] Invalid moduleId for add_feature: "${action.payload.moduleId}"`);
          console.log('[App] Available modules:', modules.map(m => `${m.name} [${m.id}]`));
          return { success: false, error: `"${action.payload.moduleId}" 모듈을 찾을 수 없습니다.` };
        }
        handleAddFeature(targetModule.id, action.payload.feature);
        return { success: true };
      }

      case 'create_module': {
        console.log('[App] create_module case triggered');
        if (!action.payload.module) {
          return { success: false, error: 'create_module에 필요한 정보가 누락되었습니다.' };
        }
        handleCreateModule(action.payload.module);
        return { success: true };
      }
        
      case 'update_scale': {
        if (!action.payload.scale) {
          return { success: false, error: '규모 정보가 누락되었습니다.' };
        }
        const validScales = ['MVP', 'STANDARD', 'HIGH_END'];
        if (!validScales.includes(action.payload.scale)) {
          console.warn(`[App] Invalid scale: "${action.payload.scale}"`);
          return { success: false, error: `잘못된 규모 값: "${action.payload.scale}"` };
        }
        handleScaleChange(action.payload.scale);
        return { success: true };
      }
        
      case 'no_action':
      default:
        return { success: true };
    }
  };

  // Ref to store parsed project title for session naming (legacy - now using scoped storage)
  const parsedProjectTitleRef = React.useRef<string>('');
  
  // Generate AI Insight via API
  const generateAiInsight = async (params: {
    projectName: string;
    businessGoals: string;
    coreValues: string[];
    moduleCount: number;
    featureCount: number;
  }) => {
    try {
      console.log('[App] Generating AI insight for:', params.projectName, 'with model:', aiModelSettings.generateInsight);
      const response = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, modelId: aiModelSettings.generateInsight })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.insight) {
          console.log('[App] AI insight generated:', data.insight.substring(0, 100));
          setAiInsight(data.insight);
        }
      }
    } catch (error) {
      console.error('[App] Failed to generate AI insight:', error);
    }
  };

  // [SCOPED STORAGE] Save analysis result to session-specific storage AND atomic unit
  const saveResultToSessionStorage = (targetSessionId: string, result: any, userMsg: Message) => {
    console.log(`[App] Saving result to session storage: ${targetSessionId}`);
    
    // Convert modules from result
    const convertedModules: ModuleItem[] = result.modules?.map((m: any) => ({
      id: m.id,
      name: m.name,
      description: m.description || '',
      category: m.category || 'core',
      baseCost: m.baseCost || 0,
      baseManMonths: m.baseManMonths || 0,
      isSelected: m.isSelected !== false,
      required: m.required || false,
      subFeatures: m.subFeatures?.map((sf: any) => ({
        id: sf.id,
        name: sf.name,
        price: sf.price || 0,
        manWeeks: sf.manWeeks || 0,
        isSelected: sf.isSelected !== false,
      })) || []
    })) || INITIAL_MODULES;

    // Create AI response message
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: '프로젝트 분석이 완료되었습니다.\n\n오른쪽 대시보드에서 분석된 모듈 구조와 견적 정보를 확인하실 수 있습니다. 기능 범위를 조정하신 후 견적을 산출해보세요.',
      timestamp: new Date(),
    };
    
    // Build complete messages (user prompt already committed)
    const newMessages = [...INITIAL_MESSAGES, userMsg, aiMsg];
    
    // Build dashboard state for session storage
    const dashboardState: DashboardState = {
      modules: convertedModules,
      partnerType: 'STUDIO',
      projectScale: 'STANDARD',
      estimationStep: 'SCOPE',
      projectSummaryContent: result.rawMarkdown || '',
      aiInsight: '',
      referencedFiles: []
    };
    
    // Commit to session's scoped storage (localStorage)
    updateSessionMessages(targetSessionId, newMessages);
    updateSessionDashboardState(targetSessionId, dashboardState);
    
    // [CRITICAL] Also update sessionCoupler's atomic unit for consistent data
    const updateSuccess = sessionCoupler.backgroundUpdate(targetSessionId, (unit) => {
      unit.chat.messages = newMessages;
      unit.dashboard.modules = convertedModules;
      unit.dashboard.partnerType = dashboardState.partnerType;
      unit.dashboard.projectScale = dashboardState.projectScale;
      unit.dashboard.estimationStep = dashboardState.estimationStep;
      unit.dashboard.projectSummaryContent = dashboardState.projectSummaryContent;
      unit.dashboard.aiInsight = dashboardState.aiInsight;
      unit.dashboard.referencedFiles = dashboardState.referencedFiles;
    });
    
    if (!updateSuccess) {
      // [FIX] Atomic unit doesn't exist - create it and populate
      console.warn(`[App] Atomic unit not found for ${targetSessionId}, creating from localStorage...`);
      const session = getSessionById(targetSessionId);
      const title = session?.title || result.projectTitle?.substring(0, 30) || '프로젝트';
      const newUnit = sessionCoupler.createUnit(targetSessionId, userMsg.text, title);
      if (newUnit) {
        // Use backgroundUpdate to persist (createUnit already saves, but this ensures full data)
        sessionCoupler.backgroundUpdate(targetSessionId, (unit) => {
          unit.chat.messages = newMessages;
          unit.dashboard.modules = convertedModules;
          unit.dashboard.partnerType = dashboardState.partnerType;
          unit.dashboard.projectScale = dashboardState.projectScale;
          unit.dashboard.estimationStep = dashboardState.estimationStep;
          unit.dashboard.projectSummaryContent = dashboardState.projectSummaryContent;
          unit.dashboard.aiInsight = dashboardState.aiInsight;
          unit.dashboard.referencedFiles = dashboardState.referencedFiles;
        });
        console.log(`[App] Created and populated atomic unit for session ${targetSessionId}`);
      } else {
        console.error(`[App] CRITICAL: Failed to create atomic unit for ${targetSessionId}`);
      }
    } else {
      console.log(`[App] Synced atomic unit for session ${targetSessionId} with analysis result`);
    }
    
    if (result.projectTitle) {
      updateSessionTitle(targetSessionId, result.projectTitle.substring(0, 30).trim());
      // Also update atomic unit meta
      const unit = sessionCoupler.getUnit(targetSessionId);
      if (unit) {
        unit.meta.title = result.projectTitle.substring(0, 30).trim();
      }
    }
    
    // Remove loading state
    const sessions = getChatHistory().map(s => 
      s.id === targetSessionId ? { ...s, isLoading: false } : s
    );
    saveChatHistory(sessions);
    setChatSessions(sessions);
    
    // Clean up snapshot
    sessionSandbox.deleteSnapshot(targetSessionId);
    
    console.log(`[App] Result saved to session ${targetSessionId} storage`);
    
    return { convertedModules, newMessages, dashboardState };
  };

  // Start polling for job status with progressive loading support
  const startJobPolling = (jobId: string) => {
    if (jobPollingRef.current) {
      clearInterval(jobPollingRef.current);
    }
    
    console.log('[App] Starting job polling for:', jobId);
    
    // Reset progressive state for new job
    processedStagesRef.current.clear();
    // Reset acknowledged stages for this job (in-place mutation to preserve reference)
    if (acknowledgedStagesPerJob.current[jobId]) {
      acknowledgedStagesPerJob.current[jobId].length = 0;
    } else {
      acknowledgedStagesPerJob.current[jobId] = [];
    }
    setProgressiveState({
      modulesReady: false,
      estimatesReady: false,
      scheduleReady: false,
      summaryReady: false,
    });
    
    jobPollingRef.current = setInterval(async () => {
      const jobAckStages = acknowledgedStagesPerJob.current[jobId] || [];
      const status = await fetchJobStatus(jobId, jobAckStages);
      if (!status) return;
      
      // [IMMUTABLE MAPPING] Get owner session from registry, NOT from mutable ref
      const ownerSessionId = getJobOwnerSession(jobId);
      if (!ownerSessionId) {
        console.warn('[App] Job has no registered owner, stopping poll:', jobId);
        clearInterval(jobPollingRef.current!);
        jobPollingRef.current = null;
        setCurrentJobId(null);
        setIsAnalyzing(false);
        return;
      }
      
      // [FIX] Get currently active session from REF (not state) to avoid closure issues
      const activeSession = activeSessionIdRef.current;
      
      // [PROGRESSIVE LOADING] Process staged results as they arrive
      if (status.stagedResults && status.stagedResults.length > 0 && ownerSessionId === activeSession) {
        for (const staged of status.stagedResults) {
          const stageKey = `${jobId}:${staged.stage}`;
          if (processedStagesRef.current.has(stageKey)) continue;
          
          console.log(`[App] Processing staged result: ${staged.stage}`);
          processedStagesRef.current.add(stageKey);
          
          switch (staged.stage) {
            case 'modules': {
              const { projectTitle, modules: parsedModules } = staged.data;
              const convertedModules = parsedModules.map((m: any) => ({
                id: m.id || `mod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: m.name,
                description: m.description || '',
                baseCost: m.baseCost || 0,
                baseManMonths: m.baseManMonths || 0,
                category: m.category || 'etc',
                isSelected: m.isSelected !== false,
                required: m.required || false,
                subFeatures: (m.subFeatures || []).map((f: any) => ({
                  id: f.id || `feat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  name: f.name,
                  price: f.price || 0,
                  manWeeks: f.manWeeks || 0,
                  isSelected: f.isSelected !== false,
                })),
              }));
              
              setModules(convertedModules);
              setProgressiveState(prev => ({ ...prev, modulesReady: true }));
              
              if (projectTitle) {
                updateSessionTitle(ownerSessionId, projectTitle.substring(0, 30).trim());
              }
              console.log(`[App] PROGRESSIVE: Modules loaded (${convertedModules.length} modules)`);
              break;
            }
            case 'estimates': {
              setProgressiveState(prev => ({ ...prev, estimatesReady: true }));
              console.log('[App] PROGRESSIVE: Estimates loaded');
              break;
            }
            case 'schedule': {
              const schedule = staged.data.schedule || staged.data;
              setProgressiveState(prev => ({ 
                ...prev, 
                scheduleReady: true,
                schedule: {
                  totalWeeks: schedule.totalWeeks || 0,
                  phases: schedule.phases || [],
                  milestones: schedule.milestones || [],
                }
              }));
              console.log('[App] PROGRESSIVE: Schedule loaded');
              break;
            }
            case 'summary': {
              const summary = staged.data.summary || staged.data;
              setProgressiveState(prev => ({ 
                ...prev, 
                summaryReady: true,
                summary: {
                  keyPoints: summary.keyPoints || [],
                  risks: summary.risks || [],
                  recommendations: summary.recommendations || [],
                }
              }));
              console.log('[App] PROGRESSIVE: Summary loaded');
              break;
            }
          }
          
          // [ACK] Add processed stage to acknowledged list to prevent re-processing
          if (!acknowledgedStagesPerJob.current[jobId]) {
            acknowledgedStagesPerJob.current[jobId] = [];
          }
          if (!acknowledgedStagesPerJob.current[jobId].includes(staged.stage)) {
            acknowledgedStagesPerJob.current[jobId].push(staged.stage);
            console.log(`[App] ACK: Stage ${staged.stage} added to job ${jobId} acknowledged list: [${acknowledgedStagesPerJob.current[jobId].join(', ')}]`);
          }
        }
      }
      
      if (status.status === 'completed') {
        clearInterval(jobPollingRef.current!);
        jobPollingRef.current = null;
        
        console.log('[App] Job completed:', jobId, 'Owner:', ownerSessionId, 'Active:', activeSession);
        
        if (status.result) {
          // Get user message from owner session's history (already committed via Prompt Logging)
          const session = getSessionById(ownerSessionId);
          const userMsg = session?.messages?.find(m => m.role === 'user') || {
            id: Date.now().toString(),
            role: 'user' as const,
            text: '프로젝트 분석 요청',
            timestamp: new Date(),
          };
          
          // [SCOPED STORAGE] Always save to OWNER session's storage (immutable)
          const { convertedModules, newMessages, dashboardState } = 
            saveResultToSessionStorage(ownerSessionId, status.result, userMsg);
          
          // [DATA LEAKAGE BLOCK] Only update UI if owner === active
          if (ownerSessionId === activeSession) {
            console.log('[App] Session match - updating UI');
            setModules(convertedModules);
            setProjectSummaryContent(dashboardState.projectSummaryContent);
            setMessages(newMessages);
            setCurrentView('detail');
            
            // Mark all stages as complete
            setProgressiveState({
              modulesReady: true,
              estimatesReady: true,
              scheduleReady: true,
              summaryReady: true,
              schedule: status.result.schedule,
              summary: status.result.summary,
            });
            
            // Generate AI insight for current view
            const totalFeatures = convertedModules.reduce((sum, m) => sum + m.subFeatures.length, 0);
            generateAiInsight({
              projectName: status.result.projectTitle || '',
              businessGoals: '',
              coreValues: [],
              moduleCount: convertedModules.length,
              featureCount: totalFeatures
            });
          } else {
            console.log('[App] Session mismatch - UI NOT updated (data saved to storage only)');
          }
        }
        
        // Cleanup
        unregisterJob(jobId);
        delete acknowledgedStagesPerJob.current[jobId]; // Clean up job-specific ack data
        setCurrentJobId(null);
        setIsAnalyzing(false);
        pendingUserMsgRef.current = null;
        pendingSessionIdRef.current = null;
        
      } else if (status.status === 'failed') {
        clearInterval(jobPollingRef.current!);
        jobPollingRef.current = null;
        
        // [DATA LEAKAGE BLOCK] Only show error if owner === active
        if (ownerSessionId === activeSession) {
          setAnalysisError(status.error || '분석 중 오류가 발생했습니다.');
        }
        
        // Remove failed session from storage
        const sessions = getChatHistory().filter(s => s.id !== ownerSessionId);
        saveChatHistory(sessions);
        setChatSessions(sessions);
        
        // Only change active session if we were viewing the failed one
        if (ownerSessionId === activeSession && sessions.length > 0) {
          setActiveSessionId(sessions[0].id);
        }
        
        // Cleanup
        unregisterJob(jobId);
        delete acknowledgedStagesPerJob.current[jobId]; // Clean up job-specific ack data
        setCurrentJobId(null);
        setIsAnalyzing(false);
        pendingUserMsgRef.current = null;
        pendingSessionIdRef.current = null;
        
      } else if (status.status === 'cancelled') {
        clearInterval(jobPollingRef.current!);
        jobPollingRef.current = null;
        unregisterJob(jobId);
        delete acknowledgedStagesPerJob.current[jobId]; // Clean up job-specific ack data
        setCurrentJobId(null);
        setIsAnalyzing(false);
        pendingUserMsgRef.current = null;
        pendingSessionIdRef.current = null;
      }
    }, 1000);
  };

  // Pending user message for job completion
  const pendingUserMsgRef = useRef<Message | null>(null);
  const pendingSessionIdRef = useRef<string | null>(null);

  // Handle abort analysis
  const handleAbortAnalysis = async () => {
    console.log('[App] Aborting analysis, jobId:', currentJobId);
    
    // Cancel server-side job and unregister from registry
    if (currentJobId) {
      await cancelServerJob(currentJobId);
      unregisterJob(currentJobId);
      // [PC-01 FIX] Clean up job-specific acknowledgement data
      delete acknowledgedStagesPerJob.current[currentJobId];
      setCurrentJobId(null);
    }
    
    // [PC-01 FIX] Reset progressive state on abort
    setProgressiveState({
      modulesReady: true,
      estimatesReady: true,
      scheduleReady: true,
      summaryReady: true,
      schedule: null,
      summary: null,
    });
    
    // Stop polling
    if (jobPollingRef.current) {
      clearInterval(jobPollingRef.current);
      jobPollingRef.current = null;
    }
    
    // Remove the pending session
    const sessionToRemove = pendingSessionIdRef.current;
    if (sessionToRemove) {
      const sessions = getChatHistory().filter(s => s.id !== sessionToRemove);
      saveChatHistory(sessions);
      setChatSessions(sessions);
      if (sessions.length > 0) {
        setActiveSessionId(sessions[0].id);
      } else {
        setActiveSessionId(null);
      }
      
      // Clean up snapshot
      await sessionSandbox.deleteSnapshot(sessionToRemove);
    }
    
    // Clear refs
    pendingUserMsgRef.current = null;
    pendingSessionIdRef.current = null;
    setIsAnalyzing(false);
    
    console.log('[App] Analysis aborted');
  };

  // Handle initial analysis from landing page - using Job-based background processing
  const handleAnalyze = async (text: string, files: File[]) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setReferencedFiles([]);
    
    // Always create a NEW session for each analysis (add to history, don't overwrite)
    const newSession = createNewSession();
    newSession.isLoading = true;
    const currentSessionId = newSession.id;
    
    // [ATOMIC UNIT] Create coupled Chat+Dashboard unit
    const sessionTitle = text?.substring(0, 20) || '새 프로젝트';
    const atomicUnit = sessionCoupler.createUnit(currentSessionId, text || '', sessionTitle);
    sessionCoupler.switchSession(currentSessionId);
    isolationGuardRef.current = createIsolationGuard(currentSessionId);
    console.log(`[App] ATOMIC UNIT CREATED: ${currentSessionId} (Chat+Dashboard coupled)`);
    
    // [MULTI-INSTANCE] Register session with instance manager using the SAME ID
    sessionManager.registerSession(currentSessionId, sessionTitle);
    console.log(`[App] Registered session instance: ${currentSessionId}`);
    
    // [PROMPT BINDING] Bind immutable prompt to session - cannot be changed later
    const boundPrompt = sessionManager.bindPrompt(currentSessionId, text, files);
    if (boundPrompt) {
      console.log(`[App] Bound immutable prompt to session ${currentSessionId}:`, {
        text: boundPrompt.text.substring(0, 50) + (boundPrompt.text.length > 50 ? '...' : ''),
        files: boundPrompt.files.length,
        timestamp: boundPrompt.timestamp
      });
    }
    
    // [STATE ISOLATION] Mark state ownership for this session
    stateOwnerSessionRef.current = currentSessionId;
    
    // [PROMPT LOGGING] Immediately commit user prompt to session's chat history
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text || `[${files.map(f => f.name).join(', ')}] 파일을 첨부했습니다.`,
      timestamp: new Date(),
    };
    
    // Commit user prompt as permanent log in session history
    newSession.messages = [...INITIAL_MESSAGES, userMsg];
    
    // [ATOMIC SYNC] Also update atomic unit with initial messages
    sessionCoupler.backgroundUpdate(currentSessionId, (unit) => {
      unit.chat.messages = newSession.messages;
    });
    
    const updatedSessions = [newSession, ...chatSessions];
    saveChatHistory(updatedSessions);
    setChatSessions(updatedSessions);
    setActiveSessionId(currentSessionId);
    setMessages(newSession.messages); // Sync UI with committed history
    
    pendingSessionIdRef.current = currentSessionId;
    sessionSandbox.setCurrentSession(currentSessionId);
    sessionManager.setCurrentSession(currentSessionId);
    
    // Store user message ref for job completion (backup only)
    pendingUserMsgRef.current = userMsg;
    
    try {
      let fileDataList: FileData[] = [];
      
      // Upload files and extract text server-side (stay on landing page during analysis)
      if (files.length > 0) {
        console.log('[App] Uploading and extracting files server-side...');
        const { uploadResponse, fileDataList: extractedData } = await uploadAndExtractFiles(files);
        
        if (!uploadResponse.success) {
          throw new Error(uploadResponse.error?.message || '파일 업로드에 실패했습니다.');
        }
        
        fileDataList = extractedData;
        
        // Track referenced files for badge display
        if (uploadResponse.files) {
          const inputSources: InputSource[] = uploadResponse.files.map(f => ({
            id: f.id,
            filename: f.filename,
            originalName: f.originalName,
            mimeType: f.mimeType,
            extractedText: f.extraction?.text,
            wordCount: f.extraction?.wordCount,
            pageCount: f.extraction?.pageCount,
            createdAt: new Date()
          }));
          setReferencedFiles(inputSources);
          console.log('[App] Referenced files tracked:', inputSources.map(s => s.originalName));
        }
      }
      
      // Start background job instead of direct SSE
      console.log('[App] Starting background analysis job for session:', currentSessionId);
      const jobResult = await startAnalyzeJob(
        currentSessionId,
        text,
        fileDataList,
        aiModelSettings.analyzeProject
      );
      
      if (!jobResult) {
        throw new Error('분석 작업을 시작할 수 없습니다.');
      }
      
      console.log('[App] Job started:', jobResult.jobId);
      setCurrentJobId(jobResult.jobId);
      
      // [IMMUTABLE MAPPING] Register job→session in persistent registry
      registerJobSession(jobResult.jobId, currentSessionId);
      
      // Freeze session state with job info
      const snapshot: SessionSnapshot = {
        sessionId: currentSessionId,
        timestamp: Date.now(),
        scrollPosition: 0,
        inputText: text,
        pendingJobId: jobResult.jobId,
        lastChunkSequence: -1,
        streamingBuffer: '',
        viewState: 'landing',
        analysisInProgress: true
      };
      await sessionSandbox.freezeSession(snapshot);
      
      // Start polling for job completion
      startJobPolling(jobResult.jobId);

      // Save initial session title (will be updated when analysis completes)
      if (text) {
        updateSessionTitle(currentSessionId, text.substring(0, 20).trim() + '...');
      }
      
      // [IMMEDIATE SKELETON] Switch to detail view immediately with all skeletons showing
      // Progressive loading will replace skeletons with real content as data arrives
      setProgressiveState({
        modulesReady: false,
        estimatesReady: false,
        scheduleReady: false,
        summaryReady: false,
        schedule: null,
        summary: null,
      });
      setCurrentView('detail');
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.';
      setAnalysisError(errorMessage);
      
      // Remove failed ghost session
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
      
      setIsAnalyzing(false);
      setCurrentJobId(null);
    }
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
    setReferencedFiles([]);
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
                onClick={() => setSettingsModalOpen(true)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Settings"
              >
                <Icons.Settings size={20} />
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
            onAbort={handleAbortAnalysis}
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
                modelSettings={{
                  classifyUserIntent: aiModelSettings.classifyUserIntent,
                  streamChatResponse: aiModelSettings.streamChatResponse
                }}
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
                projectSummaryContent={projectSummaryContent}
                aiInsight={aiInsight}
                rfpModelId={aiModelSettings.generateRFP}
                referencedFiles={referencedFiles}
                progressiveState={progressiveState}
                isAnalyzing={isAnalyzing}
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onOpenAiSettings={() => setAiSettingsModalOpen(true)}
      />

      {/* AI Settings Modal */}
      <AiSettingsModal
        isOpen={aiSettingsModalOpen}
        onClose={() => setAiSettingsModalOpen(false)}
        onSave={handleSaveAiSettings}
        currentSettings={aiModelSettings}
      />
    </div>
  );
};

export default App;
