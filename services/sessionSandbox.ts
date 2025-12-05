export interface SessionSnapshot {
  sessionId: string;
  timestamp: number;
  scrollPosition: number;
  inputText: string;
  pendingJobId: string | null;
  lastChunkSequence: number;
  streamingBuffer: string;
  viewState: 'landing' | 'detail';
  analysisInProgress: boolean;
}

const DB_NAME = 'WishketSessionDB';
const STORE_NAME = 'snapshots';
const DB_VERSION = 1;

class SessionSandboxManager {
  private db: IDBDatabase | null = null;
  private memoryCache: Map<string, SessionSnapshot> = new Map();
  private currentSessionId: string | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'sessionId' });
        }
      };
    });
  }

  async freezeSession(snapshot: SessionSnapshot): Promise<void> {
    this.memoryCache.set(snapshot.sessionId, snapshot);

    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(snapshot);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`[SessionSandbox] Frozen session ${snapshot.sessionId}`);
        resolve();
      };
    });
  }

  async thawSession(sessionId: string): Promise<SessionSnapshot | null> {
    if (this.memoryCache.has(sessionId)) {
      console.log(`[SessionSandbox] Thawed session ${sessionId} from cache`);
      return this.memoryCache.get(sessionId)!;
    }

    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(sessionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const snapshot = request.result as SessionSnapshot | undefined;
        if (snapshot) {
          this.memoryCache.set(sessionId, snapshot);
          console.log(`[SessionSandbox] Thawed session ${sessionId} from IndexedDB`);
        }
        resolve(snapshot || null);
      };
    });
  }

  async deleteSnapshot(sessionId: string): Promise<void> {
    this.memoryCache.delete(sessionId);

    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(sessionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`[SessionSandbox] Deleted snapshot ${sessionId}`);
        resolve();
      };
    });
  }

  setCurrentSession(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }

  getCurrentSession(): string | null {
    return this.currentSessionId;
  }

  getCachedSnapshot(sessionId: string): SessionSnapshot | undefined {
    return this.memoryCache.get(sessionId);
  }
}

export const sessionSandbox = new SessionSandboxManager();

export interface JobStatusResponse {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result: any | null;
  error: string | null;
  chunkCount: number;
}

export interface ChunkResponse {
  sequence: number;
  text: string;
  timestamp: number;
  type: 'content' | 'parsed' | 'error';
}

export async function fetchSessionJobs(sessionId: string): Promise<JobStatusResponse[]> {
  try {
    const response = await fetch(`/api/jobs/session/${sessionId}`);
    const data = await response.json();
    return data.success ? data.jobs : [];
  } catch (error) {
    console.error('[SessionSandbox] Failed to fetch session jobs:', error);
    return [];
  }
}

export async function fetchJobStatus(jobId: string): Promise<JobStatusResponse | null> {
  try {
    const response = await fetch(`/api/jobs/${jobId}`);
    const data = await response.json();
    return data.success ? data.job : null;
  } catch (error) {
    console.error('[SessionSandbox] Failed to fetch job status:', error);
    return null;
  }
}

export async function fetchJobChunks(jobId: string, afterSequence: number = -1): Promise<{
  chunks: ChunkResponse[];
  totalChunks: number;
  status: string;
  result: any | null;
}> {
  try {
    const response = await fetch(`/api/jobs/${jobId}/chunks?after=${afterSequence}`);
    const data = await response.json();
    return data.success ? data : { chunks: [], totalChunks: 0, status: 'unknown', result: null };
  } catch (error) {
    console.error('[SessionSandbox] Failed to fetch job chunks:', error);
    return { chunks: [], totalChunks: 0, status: 'error', result: null };
  }
}

export async function cancelJob(jobId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('[SessionSandbox] Failed to cancel job:', error);
    return false;
  }
}

export async function startAnalyzeJob(sessionId: string, text: string, fileDataList: any[], modelId?: string): Promise<{ jobId: string; status: string } | null> {
  try {
    const response = await fetch('/api/jobs/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, text, fileDataList, modelId })
    });
    const data = await response.json();
    return data.success ? { jobId: data.job.id, status: data.job.status } : null;
  } catch (error) {
    console.error('[SessionSandbox] Failed to start analyze job:', error);
    return null;
  }
}
