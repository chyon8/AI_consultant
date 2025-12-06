import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, ModuleItem, PartnerType, ProjectScale, EstimationStep, InputSource } from '../types';
import { INITIAL_MESSAGES, INITIAL_MODULES } from '../constants';
import { 
  sessionCoupler, 
  AtomicSessionUnit, 
  createIsolationGuard 
} from '../services/atomicSession';

export interface AtomicSessionState {
  sessionId: string | null;
  messages: Message[];
  modules: ModuleItem[];
  partnerType: PartnerType;
  projectScale: ProjectScale;
  estimationStep: EstimationStep;
  projectSummaryContent: string;
  aiInsight: string;
  referencedFiles: InputSource[];
  isLoading: boolean;
  isStreaming: boolean;
  title: string;
}

export interface AtomicSessionActions {
  createSession: (prompt: string, title?: string) => string;
  switchSession: (sessionId: string) => boolean;
  deleteSession: (sessionId: string) => void;
  updateMessages: (messages: Message[]) => void;
  updateModules: (modules: ModuleItem[]) => void;
  updatePartnerType: (type: PartnerType) => void;
  updateProjectScale: (scale: ProjectScale) => void;
  updateEstimationStep: (step: EstimationStep) => void;
  updateProjectSummary: (content: string) => void;
  updateAiInsight: (insight: string) => void;
  updateReferencedFiles: (files: InputSource[]) => void;
  updateLoading: (loading: boolean) => void;
  updateStreaming: (streaming: boolean) => void;
  updateTitle: (title: string) => void;
  backgroundUpdateSession: (sessionId: string, updater: (unit: AtomicSessionUnit) => void) => boolean;
  resetToLanding: () => void;
}

const INITIAL_STATE: AtomicSessionState = {
  sessionId: null,
  messages: INITIAL_MESSAGES,
  modules: INITIAL_MODULES,
  partnerType: 'STUDIO',
  projectScale: 'STANDARD',
  estimationStep: 'SCOPE',
  projectSummaryContent: '',
  aiInsight: '',
  referencedFiles: [],
  isLoading: false,
  isStreaming: false,
  title: ''
};

export function useAtomicSession(): [AtomicSessionState, AtomicSessionActions, AtomicSessionUnit[]] {
  const [state, setState] = useState<AtomicSessionState>(INITIAL_STATE);
  const guardRef = useRef<ReturnType<typeof createIsolationGuard> | null>(null);
  const [allSessions, setAllSessions] = useState<AtomicSessionUnit[]>([]);

  useEffect(() => {
    const units = sessionCoupler.getAllUnits();
    setAllSessions(units);
    
    const currentId = sessionCoupler.getCurrentSessionId();
    if (currentId) {
      const unit = sessionCoupler.getUnit(currentId);
      if (unit) {
        syncStateFromUnit(unit);
        guardRef.current = createIsolationGuard(currentId);
      }
    }
  }, []);

  const syncStateFromUnit = useCallback((unit: AtomicSessionUnit) => {
    console.log(`[useAtomicSession] SYNC: Loading atomic unit ${unit.sessionId}`);
    
    const cleanedMessages = unit.chat.messages.map(msg => {
      if (msg.isStreaming) {
        console.log(`[useAtomicSession] Cleaning orphan streaming message: ${msg.id}`);
        const interruptedText = msg.text 
          ? `${msg.text}\n\n_(응답이 중단되었습니다)_`
          : '_(응답이 중단되었습니다)_';
        return { ...msg, text: interruptedText, isStreaming: false };
      }
      return msg;
    });
    
    setState({
      sessionId: unit.sessionId,
      messages: cleanedMessages,
      modules: unit.dashboard.modules,
      partnerType: unit.dashboard.partnerType,
      projectScale: unit.dashboard.projectScale,
      estimationStep: unit.dashboard.estimationStep,
      projectSummaryContent: unit.dashboard.projectSummaryContent,
      aiInsight: unit.dashboard.aiInsight,
      referencedFiles: unit.dashboard.referencedFiles,
      isLoading: false,
      isStreaming: false,
      title: unit.meta.title
    });
  }, []);

  const validateAndUpdate = useCallback(<K extends keyof AtomicSessionState>(
    key: K,
    value: AtomicSessionState[K],
    operation: string
  ): boolean => {
    if (!state.sessionId) {
      console.warn(`[useAtomicSession] No active session for ${operation}`);
      return false;
    }

    if (!guardRef.current?.canUpdateDashboard()) {
      console.error(`[useAtomicSession] BLOCKED: ${operation} - session mismatch`);
      return false;
    }

    setState(prev => ({ ...prev, [key]: value }));
    return true;
  }, [state.sessionId]);

  const createSession = useCallback((prompt: string, title: string = '새 프로젝트'): string => {
    const sessionId = Date.now().toString();
    const unit = sessionCoupler.createUnit(sessionId, prompt, title);
    
    sessionCoupler.switchSession(sessionId);
    guardRef.current = createIsolationGuard(sessionId);
    
    syncStateFromUnit(unit);
    setAllSessions(sessionCoupler.getAllUnits());
    
    console.log(`[useAtomicSession] Created and switched to session: ${sessionId}`);
    return sessionId;
  }, [syncStateFromUnit]);

  const switchSession = useCallback((sessionId: string): boolean => {
    console.log(`[useAtomicSession] Switch requested: ${state.sessionId} → ${sessionId}`);
    
    if (state.sessionId) {
      sessionCoupler.updateChat(state.sessionId, () => ({
        messages: state.messages,
        isStreaming: state.isStreaming
      }));
      sessionCoupler.updateDashboard(state.sessionId, () => ({
        modules: state.modules,
        partnerType: state.partnerType,
        projectScale: state.projectScale,
        estimationStep: state.estimationStep,
        projectSummaryContent: state.projectSummaryContent,
        aiInsight: state.aiInsight,
        referencedFiles: state.referencedFiles
      }));
    }

    setState(INITIAL_STATE);

    const unit = sessionCoupler.switchSession(sessionId);
    if (!unit) {
      console.error(`[useAtomicSession] Switch failed: ${sessionId}`);
      return false;
    }

    guardRef.current = createIsolationGuard(sessionId);
    syncStateFromUnit(unit);
    
    console.log(`[useAtomicSession] STRICT SWITCH complete to ${sessionId}`);
    return true;
  }, [state, syncStateFromUnit]);

  const deleteSession = useCallback((sessionId: string) => {
    sessionCoupler.deleteUnit(sessionId);
    setAllSessions(sessionCoupler.getAllUnits());
    
    if (state.sessionId === sessionId) {
      const remaining = sessionCoupler.getAllUnits();
      if (remaining.length > 0) {
        switchSession(remaining[0].sessionId);
      } else {
        guardRef.current = null;
        setState(INITIAL_STATE);
      }
    }
  }, [state.sessionId, switchSession]);

  const updateMessages = useCallback((messages: Message[]) => {
    if (!state.sessionId || !guardRef.current?.canUpdateChat()) {
      console.warn('[useAtomicSession] updateMessages blocked');
      return;
    }
    
    setState(prev => ({ ...prev, messages }));
    sessionCoupler.updateChat(state.sessionId, () => ({ messages }));
  }, [state.sessionId]);

  const updateModules = useCallback((modules: ModuleItem[]) => {
    if (!validateAndUpdate('modules', modules, 'updateModules')) return;
    sessionCoupler.updateDashboard(state.sessionId!, () => ({ modules }));
  }, [state.sessionId, validateAndUpdate]);

  const updatePartnerType = useCallback((partnerType: PartnerType) => {
    if (!validateAndUpdate('partnerType', partnerType, 'updatePartnerType')) return;
    sessionCoupler.updateDashboard(state.sessionId!, () => ({ partnerType }));
  }, [state.sessionId, validateAndUpdate]);

  const updateProjectScale = useCallback((projectScale: ProjectScale) => {
    if (!validateAndUpdate('projectScale', projectScale, 'updateProjectScale')) return;
    sessionCoupler.updateDashboard(state.sessionId!, () => ({ projectScale }));
  }, [state.sessionId, validateAndUpdate]);

  const updateEstimationStep = useCallback((estimationStep: EstimationStep) => {
    if (!validateAndUpdate('estimationStep', estimationStep, 'updateEstimationStep')) return;
    sessionCoupler.updateDashboard(state.sessionId!, () => ({ estimationStep }));
  }, [state.sessionId, validateAndUpdate]);

  const updateProjectSummary = useCallback((projectSummaryContent: string) => {
    if (!validateAndUpdate('projectSummaryContent', projectSummaryContent, 'updateProjectSummary')) return;
    sessionCoupler.updateDashboard(state.sessionId!, () => ({ projectSummaryContent }));
  }, [state.sessionId, validateAndUpdate]);

  const updateAiInsight = useCallback((aiInsight: string) => {
    if (!validateAndUpdate('aiInsight', aiInsight, 'updateAiInsight')) return;
    sessionCoupler.updateDashboard(state.sessionId!, () => ({ aiInsight }));
  }, [state.sessionId, validateAndUpdate]);

  const updateReferencedFiles = useCallback((referencedFiles: InputSource[]) => {
    if (!validateAndUpdate('referencedFiles', referencedFiles, 'updateReferencedFiles')) return;
    sessionCoupler.updateDashboard(state.sessionId!, () => ({ referencedFiles }));
  }, [state.sessionId, validateAndUpdate]);

  const updateLoading = useCallback((isLoading: boolean) => {
    if (!state.sessionId) return;
    setState(prev => ({ ...prev, isLoading }));
    sessionCoupler.updateMeta(state.sessionId, { isLoading });
  }, [state.sessionId]);

  const updateStreaming = useCallback((isStreaming: boolean) => {
    if (!state.sessionId || !guardRef.current?.canUpdateChat()) return;
    setState(prev => ({ ...prev, isStreaming }));
    sessionCoupler.updateChat(state.sessionId, () => ({ isStreaming }));
  }, [state.sessionId]);

  const updateTitle = useCallback((title: string) => {
    if (!state.sessionId) return;
    setState(prev => ({ ...prev, title }));
    sessionCoupler.updateMeta(state.sessionId, { title });
    setAllSessions(sessionCoupler.getAllUnits());
  }, [state.sessionId]);

  const backgroundUpdateSession = useCallback((
    sessionId: string,
    updater: (unit: AtomicSessionUnit) => void
  ): boolean => {
    const success = sessionCoupler.backgroundUpdate(sessionId, updater);
    
    if (success && sessionId === state.sessionId) {
      const unit = sessionCoupler.getUnit(sessionId);
      if (unit) {
        syncStateFromUnit(unit);
      }
    }
    
    setAllSessions(sessionCoupler.getAllUnits());
    return success;
  }, [state.sessionId, syncStateFromUnit]);

  const resetToLanding = useCallback(() => {
    sessionCoupler.clearCurrentSession();
    guardRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const actions: AtomicSessionActions = {
    createSession,
    switchSession,
    deleteSession,
    updateMessages,
    updateModules,
    updatePartnerType,
    updateProjectScale,
    updateEstimationStep,
    updateProjectSummary,
    updateAiInsight,
    updateReferencedFiles,
    updateLoading,
    updateStreaming,
    updateTitle,
    backgroundUpdateSession,
    resetToLanding
  };

  return [state, actions, allSessions];
}
