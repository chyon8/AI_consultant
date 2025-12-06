import { Message, ModuleItem, PartnerType, ProjectScale, EstimationStep, DashboardState, InputSource, ProjectOverview } from '../types';
import { INITIAL_MESSAGES, INITIAL_MODULES } from '../constants';

export interface AtomicSessionUnit {
  readonly sessionId: string;
  readonly createdAt: number;
  readonly boundPrompt: string;
  chat: {
    messages: Message[];
    isStreaming: boolean;
    pendingJobId: string | null;
  };
  dashboard: {
    modules: ModuleItem[];
    partnerType: PartnerType;
    projectScale: ProjectScale;
    estimationStep: EstimationStep;
    projectSummaryContent: string;
    aiInsight: string;
    referencedFiles: InputSource[];
    projectOverview?: ProjectOverview | null;
  };
  meta: {
    title: string;
    isLoading: boolean;
    lastModified: number;
  };
}

export interface SessionSnapshot {
  sessionId: string;
  unit: AtomicSessionUnit;
  timestamp: number;
}

const ATOMIC_SESSIONS_KEY = 'wishket_atomic_sessions';
const CURRENT_SESSION_KEY = 'wishket_current_session';

class SessionCoupler {
  private units: Map<string, AtomicSessionUnit> = new Map();
  private currentSessionId: string | null = null;
  private lockFlag: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(ATOMIC_SESSIONS_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Record<string, AtomicSessionUnit>;
        for (const [id, unit] of Object.entries(data)) {
          this.units.set(id, unit);
        }
        console.log(`[SessionCoupler] Loaded ${this.units.size} atomic units from storage`);
      }
      
      const currentId = localStorage.getItem(CURRENT_SESSION_KEY);
      if (currentId && this.units.has(currentId)) {
        this.currentSessionId = currentId;
      }
    } catch (e) {
      console.error('[SessionCoupler] Failed to load from storage:', e);
    }
  }

  private saveToStorage(): void {
    try {
      const data: Record<string, AtomicSessionUnit> = {};
      for (const [id, unit] of this.units) {
        data[id] = unit;
      }
      localStorage.setItem(ATOMIC_SESSIONS_KEY, JSON.stringify(data));
      
      if (this.currentSessionId) {
        localStorage.setItem(CURRENT_SESSION_KEY, this.currentSessionId);
      }
    } catch (e) {
      console.error('[SessionCoupler] Failed to save to storage:', e);
    }
  }

  createUnit(sessionId: string, boundPrompt: string, title: string = '새 프로젝트'): AtomicSessionUnit {
    if (this.units.has(sessionId)) {
      console.warn(`[SessionCoupler] Unit ${sessionId} already exists, returning existing`);
      return this.units.get(sessionId)!;
    }

    const unit: AtomicSessionUnit = {
      sessionId,
      createdAt: Date.now(),
      boundPrompt,
      chat: {
        messages: [...INITIAL_MESSAGES],
        isStreaming: false,
        pendingJobId: null
      },
      dashboard: {
        modules: JSON.parse(JSON.stringify(INITIAL_MODULES)),
        partnerType: 'STUDIO',
        projectScale: 'STANDARD',
        estimationStep: 'SCOPE',
        projectSummaryContent: '',
        aiInsight: '',
        referencedFiles: []
      },
      meta: {
        title,
        isLoading: false,
        lastModified: Date.now()
      }
    };

    this.units.set(sessionId, unit);
    this.saveToStorage();
    console.log(`[SessionCoupler] Created atomic unit: ${sessionId}`);
    return unit;
  }

  getUnit(sessionId: string): AtomicSessionUnit | null {
    return this.units.get(sessionId) || null;
  }

  getCurrentUnit(): AtomicSessionUnit | null {
    if (!this.currentSessionId) return null;
    return this.units.get(this.currentSessionId) || null;
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  validateOwnership(sessionId: string, operationType: string): boolean {
    if (!this.currentSessionId) {
      console.warn(`[SessionCoupler] No active session for ${operationType}`);
      return false;
    }
    
    if (sessionId !== this.currentSessionId) {
      console.error(`[SessionCoupler] OWNERSHIP VIOLATION: ${operationType} attempted on ${sessionId}, but current is ${this.currentSessionId}`);
      return false;
    }
    
    return true;
  }

  switchSession(targetSessionId: string): AtomicSessionUnit | null {
    if (this.lockFlag) {
      console.warn('[SessionCoupler] Session switch blocked - operation in progress');
      return null;
    }

    const unit = this.units.get(targetSessionId);
    if (!unit) {
      console.error(`[SessionCoupler] Cannot switch to non-existent session: ${targetSessionId}`);
      return null;
    }

    const previousId = this.currentSessionId;
    this.currentSessionId = targetSessionId;
    this.saveToStorage();
    
    console.log(`[SessionCoupler] STRICT SWITCH: ${previousId} → ${targetSessionId}`);
    console.log(`[SessionCoupler] Syncing: Chat(${unit.chat.messages.length} msgs) + Dashboard(${unit.dashboard.modules.length} modules)`);
    
    return unit;
  }

  updateChat(
    sessionId: string,
    updater: (chat: AtomicSessionUnit['chat']) => Partial<AtomicSessionUnit['chat']>
  ): boolean {
    if (!this.validateOwnership(sessionId, 'updateChat')) {
      return false;
    }

    const unit = this.units.get(sessionId);
    if (!unit) return false;

    const updates = updater(unit.chat);
    unit.chat = { ...unit.chat, ...updates };
    unit.meta.lastModified = Date.now();
    
    this.saveToStorage();
    return true;
  }

  updateDashboard(
    sessionId: string,
    updater: (dashboard: AtomicSessionUnit['dashboard']) => Partial<AtomicSessionUnit['dashboard']>
  ): boolean {
    if (!this.validateOwnership(sessionId, 'updateDashboard')) {
      return false;
    }

    const unit = this.units.get(sessionId);
    if (!unit) return false;

    const updates = updater(unit.dashboard);
    unit.dashboard = { ...unit.dashboard, ...updates };
    unit.meta.lastModified = Date.now();
    
    this.saveToStorage();
    return true;
  }

  updateMeta(
    sessionId: string,
    updates: Partial<AtomicSessionUnit['meta']>
  ): boolean {
    const unit = this.units.get(sessionId);
    if (!unit) return false;

    unit.meta = { ...unit.meta, ...updates, lastModified: Date.now() };
    this.saveToStorage();
    return true;
  }

  backgroundUpdate(
    sessionId: string,
    updater: (unit: AtomicSessionUnit) => void
  ): boolean {
    const unit = this.units.get(sessionId);
    if (!unit) {
      console.error(`[SessionCoupler] Background update failed: session ${sessionId} not found`);
      return false;
    }

    console.log(`[SessionCoupler] Background update for ${sessionId} (current: ${this.currentSessionId})`);
    updater(unit);
    unit.meta.lastModified = Date.now();
    this.saveToStorage();
    return true;
  }

  setLock(locked: boolean): void {
    this.lockFlag = locked;
    console.log(`[SessionCoupler] Lock ${locked ? 'ACQUIRED' : 'RELEASED'}`);
  }

  isLocked(): boolean {
    return this.lockFlag;
  }

  deleteUnit(sessionId: string): boolean {
    const deleted = this.units.delete(sessionId);
    if (deleted) {
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }
      this.saveToStorage();
      console.log(`[SessionCoupler] Deleted atomic unit: ${sessionId}`);
    }
    return deleted;
  }

  getAllUnits(): AtomicSessionUnit[] {
    return Array.from(this.units.values());
  }

  getAllSessionIds(): string[] {
    return Array.from(this.units.keys());
  }

  clearCurrentSession(): void {
    this.currentSessionId = null;
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }
}

export const sessionCoupler = new SessionCoupler();

export function withCoupledSession<T>(
  sessionId: string,
  operation: string,
  executor: (unit: AtomicSessionUnit) => T,
  fallback: T
): T {
  if (!sessionCoupler.validateOwnership(sessionId, operation)) {
    console.log(`[withCoupledSession] Returning fallback for blocked operation: ${operation}`);
    return fallback;
  }

  const unit = sessionCoupler.getUnit(sessionId);
  if (!unit) {
    console.error(`[withCoupledSession] Unit not found: ${sessionId}`);
    return fallback;
  }

  return executor(unit);
}

export function createIsolationGuard(sessionId: string) {
  return {
    canUpdateChat: () => sessionCoupler.validateOwnership(sessionId, 'chat_update'),
    canUpdateDashboard: () => sessionCoupler.validateOwnership(sessionId, 'dashboard_update'),
    canRender: () => sessionCoupler.getCurrentSessionId() === sessionId,
    getSessionId: () => sessionId,
    isActive: () => sessionCoupler.getCurrentSessionId() === sessionId
  };
}
