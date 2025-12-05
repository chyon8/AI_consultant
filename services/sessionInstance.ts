import { Message, ModuleItem, PartnerType, ProjectScale, EstimationStep, DashboardState, InputSource } from '../types';
import { INITIAL_MESSAGES, INITIAL_MODULES } from '../constants';

export interface ImmutablePrompt {
  readonly text: string;
  readonly files: ReadonlyArray<{ name: string; type: string; size: number }>;
  readonly timestamp: number;
  readonly sessionId: string;
}

export interface SessionState {
  messages: Message[];
  modules: ModuleItem[];
  partnerType: PartnerType;
  projectScale: ProjectScale;
  estimationStep: EstimationStep;
  projectSummaryContent: string;
  aiInsight: string;
  referencedFiles: InputSource[];
  currentView: 'landing' | 'detail';
  isAnalyzing: boolean;
  pendingJobId: string | null;
}

export interface SessionInstance {
  readonly id: string;
  readonly namespace: symbol;
  readonly createdAt: number;
  readonly initialPrompt: ImmutablePrompt | null;
  title: string;
  state: SessionState;
  isLoading: boolean;
}

const SESSION_INSTANCES_KEY = 'wishket_session_instances';
const PROMPT_BINDINGS_KEY = 'wishket_prompt_bindings';

class SessionInstanceManager {
  private instances: Map<string, SessionInstance> = new Map();
  private namespaces: Map<string, symbol> = new Map();
  private promptBindings: Map<string, ImmutablePrompt> = new Map();
  private currentSessionId: string | null = null;
  private validationEnabled: boolean = true;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(SESSION_INSTANCES_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        for (const [id, instance] of Object.entries(data)) {
          const inst = instance as SessionInstance;
          const namespace = Symbol(`session_${id}`);
          this.namespaces.set(id, namespace);
          this.instances.set(id, {
            ...inst,
            namespace,
            initialPrompt: this.getImmutablePrompt(id)
          });
        }
      }
      
      const prompts = localStorage.getItem(PROMPT_BINDINGS_KEY);
      if (prompts) {
        const data = JSON.parse(prompts);
        for (const [id, prompt] of Object.entries(data)) {
          this.promptBindings.set(id, Object.freeze(prompt as ImmutablePrompt));
        }
      }
    } catch (e) {
      console.error('[SessionInstanceManager] Failed to load from storage:', e);
    }
  }

  private saveToStorage(): void {
    try {
      const data: Record<string, Omit<SessionInstance, 'namespace'>> = {};
      for (const [id, instance] of this.instances) {
        const { namespace, ...rest } = instance;
        data[id] = rest;
      }
      localStorage.setItem(SESSION_INSTANCES_KEY, JSON.stringify(data));
      
      const prompts: Record<string, ImmutablePrompt> = {};
      for (const [id, prompt] of this.promptBindings) {
        prompts[id] = prompt;
      }
      localStorage.setItem(PROMPT_BINDINGS_KEY, JSON.stringify(prompts));
    } catch (e) {
      console.error('[SessionInstanceManager] Failed to save to storage:', e);
    }
  }

  createInstance(title: string = '새 프로젝트'): SessionInstance {
    const id = Date.now().toString();
    return this.registerSession(id, title);
  }

  registerSession(sessionId: string, title: string = '새 프로젝트'): SessionInstance {
    if (this.instances.has(sessionId)) {
      console.log(`[SessionInstanceManager] Session ${sessionId} already registered`);
      return this.instances.get(sessionId)!;
    }
    
    const namespace = Symbol(`session_${sessionId}`);
    
    const instance: SessionInstance = Object.seal({
      id: sessionId,
      namespace,
      createdAt: Date.now(),
      initialPrompt: null,
      title,
      state: this.createDefaultState(),
      isLoading: false
    });
    
    this.namespaces.set(sessionId, namespace);
    this.instances.set(sessionId, instance);
    this.saveToStorage();
    
    console.log(`[SessionInstanceManager] Registered session ${sessionId} with namespace ${namespace.toString()}`);
    return instance;
  }

  private createDefaultState(): SessionState {
    return {
      messages: [...INITIAL_MESSAGES],
      modules: JSON.parse(JSON.stringify(INITIAL_MODULES)),
      partnerType: 'STUDIO',
      projectScale: 'STANDARD',
      estimationStep: 'SCOPE',
      projectSummaryContent: '',
      aiInsight: '',
      referencedFiles: [],
      currentView: 'landing',
      isAnalyzing: false,
      pendingJobId: null
    };
  }

  bindPrompt(sessionId: string, text: string, files: File[]): ImmutablePrompt {
    if (this.promptBindings.has(sessionId)) {
      console.warn(`[SessionInstanceManager] Prompt already bound to session ${sessionId}, cannot rebind`);
      return this.promptBindings.get(sessionId)!;
    }
    
    const prompt: ImmutablePrompt = Object.freeze({
      text,
      files: Object.freeze(files.map(f => Object.freeze({ name: f.name, type: f.type, size: f.size }))),
      timestamp: Date.now(),
      sessionId
    });
    
    this.promptBindings.set(sessionId, prompt);
    
    const instance = this.instances.get(sessionId);
    if (instance) {
      (instance as any).initialPrompt = prompt;
    }
    
    this.saveToStorage();
    console.log(`[SessionInstanceManager] Bound immutable prompt to session ${sessionId}`);
    return prompt;
  }

  getImmutablePrompt(sessionId: string): ImmutablePrompt | null {
    return this.promptBindings.get(sessionId) || null;
  }

  getInstance(sessionId: string): SessionInstance | null {
    return this.instances.get(sessionId) || null;
  }

  getNamespace(sessionId: string): symbol | null {
    return this.namespaces.get(sessionId) || null;
  }

  validateSessionMatch(sessionId: string, dataSessionId: string): boolean {
    if (!this.validationEnabled) return true;
    
    const match = sessionId === dataSessionId;
    if (!match) {
      console.error(`[SessionInstanceManager] VALIDATION FAILED: Expected ${sessionId}, got ${dataSessionId}`);
    }
    return match;
  }

  validateNamespace(sessionId: string, namespace: symbol): boolean {
    if (!this.validationEnabled) return true;
    
    const expectedNamespace = this.namespaces.get(sessionId);
    const match = expectedNamespace === namespace;
    if (!match) {
      console.error(`[SessionInstanceManager] NAMESPACE VALIDATION FAILED for session ${sessionId}`);
    }
    return match;
  }

  updateState(
    sessionId: string, 
    updater: (state: SessionState) => Partial<SessionState>
  ): boolean {
    const instance = this.instances.get(sessionId);
    if (!instance) {
      console.error(`[SessionInstanceManager] Cannot update state: session ${sessionId} not found`);
      return false;
    }
    
    if (this.currentSessionId && sessionId !== this.currentSessionId) {
      console.log(`[SessionInstanceManager] Background update for session ${sessionId} (current: ${this.currentSessionId})`);
    }
    
    const updates = updater(instance.state);
    instance.state = { ...instance.state, ...updates };
    
    this.saveToStorage();
    return true;
  }

  getState(sessionId: string): SessionState | null {
    const instance = this.instances.get(sessionId);
    return instance?.state || null;
  }

  setCurrentSession(sessionId: string | null): void {
    const prev = this.currentSessionId;
    this.currentSessionId = sessionId;
    console.log(`[SessionInstanceManager] Session switch: ${prev} → ${sessionId}`);
  }

  getCurrentSession(): string | null {
    return this.currentSessionId;
  }

  deleteInstance(sessionId: string): boolean {
    const deleted = this.instances.delete(sessionId);
    this.namespaces.delete(sessionId);
    this.promptBindings.delete(sessionId);
    
    if (deleted) {
      this.saveToStorage();
      console.log(`[SessionInstanceManager] Deleted instance ${sessionId}`);
    }
    return deleted;
  }

  getAllInstances(): SessionInstance[] {
    return Array.from(this.instances.values());
  }

  getAllIds(): string[] {
    return Array.from(this.instances.keys());
  }
}

export const sessionManager = new SessionInstanceManager();

export function createValidatedStateAccessor<T>(
  sessionId: string,
  getter: (state: SessionState) => T
): (() => T | null) {
  const namespace = sessionManager.getNamespace(sessionId);
  if (!namespace) return () => null;
  
  return () => {
    const currentSession = sessionManager.getCurrentSession();
    if (currentSession !== sessionId) {
      console.warn(`[ValidatedAccessor] Access denied: current=${currentSession}, requested=${sessionId}`);
      return null;
    }
    
    const state = sessionManager.getState(sessionId);
    if (!state) return null;
    
    return getter(state);
  };
}

export function withSessionValidation<T>(
  targetSessionId: string,
  activeSessionId: string | null,
  data: T,
  fallback: T
): T {
  if (!sessionManager.validateSessionMatch(targetSessionId, activeSessionId || '')) {
    console.log(`[withSessionValidation] Returning fallback due to session mismatch`);
    return fallback;
  }
  return data;
}

export interface RenderValidation {
  isValid: boolean;
  reason?: string;
  expectedSessionId: string;
  actualSessionId: string | null;
}

export function validateBeforeRender(
  targetSessionId: string,
  dataSessionId: string | null
): RenderValidation {
  const isValid = targetSessionId === dataSessionId;
  
  return {
    isValid,
    reason: isValid ? undefined : 'Session ID mismatch - rendering blocked',
    expectedSessionId: targetSessionId,
    actualSessionId: dataSessionId
  };
}
