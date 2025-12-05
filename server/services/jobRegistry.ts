export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobType = 'analyze' | 'rfp' | 'chat';

export interface ChunkLog {
  sequence: number;
  text: string;
  timestamp: number;
  type: 'content' | 'parsed' | 'error';
}

export interface Job {
  id: string;
  sessionId: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  payload: any;
  result: any | null;
  error: string | null;
  chunkLog: ChunkLog[];
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

class JobRegistry {
  private jobs: Map<string, Job> = new Map();
  private sessionJobs: Map<string, Set<string>> = new Map();

  createJob(sessionId: string, type: JobType, payload: any): Job {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const job: Job = {
      id,
      sessionId,
      type,
      status: 'pending',
      progress: 0,
      payload,
      result: null,
      error: null,
      chunkLog: [],
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };

    this.jobs.set(id, job);
    
    if (!this.sessionJobs.has(sessionId)) {
      this.sessionJobs.set(sessionId, new Set());
    }
    this.sessionJobs.get(sessionId)!.add(id);

    console.log(`[JobRegistry] Created job ${id} for session ${sessionId}`);
    return job;
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  getJobsBySession(sessionId: string): Job[] {
    const jobIds = this.sessionJobs.get(sessionId);
    if (!jobIds) return [];
    return Array.from(jobIds).map(id => this.jobs.get(id)!).filter(Boolean);
  }

  getActiveJobForSession(sessionId: string): Job | undefined {
    const jobs = this.getJobsBySession(sessionId);
    return jobs.find(j => j.status === 'pending' || j.status === 'running');
  }

  updateJobStatus(jobId: string, status: JobStatus, error?: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = status;
    job.updatedAt = Date.now();
    
    if (error) {
      job.error = error;
    }
    
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      job.completedAt = Date.now();
    }

    console.log(`[JobRegistry] Job ${jobId} status -> ${status}`);
  }

  updateJobProgress(jobId: string, progress: number): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.progress = Math.min(100, Math.max(0, progress));
    job.updatedAt = Date.now();
  }

  appendChunk(jobId: string, text: string, type: ChunkLog['type'] = 'content'): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const chunk: ChunkLog = {
      sequence: job.chunkLog.length,
      text,
      timestamp: Date.now(),
      type
    };

    job.chunkLog.push(chunk);
    job.updatedAt = Date.now();
  }

  setJobResult(jobId: string, result: any): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.result = result;
    job.updatedAt = Date.now();
  }

  getChunksAfter(jobId: string, afterSequence: number): ChunkLog[] {
    const job = this.jobs.get(jobId);
    if (!job) return [];

    return job.chunkLog.filter(c => c.sequence > afterSequence);
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    if (job.status === 'pending' || job.status === 'running') {
      job.status = 'cancelled';
      job.updatedAt = Date.now();
      job.completedAt = Date.now();
      console.log(`[JobRegistry] Job ${jobId} cancelled`);
      return true;
    }
    return false;
  }

  cleanupOldJobs(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.jobs.forEach((job, id) => {
      if (job.completedAt && (now - job.completedAt) > maxAgeMs) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => {
      const job = this.jobs.get(id);
      if (job) {
        const sessionJobs = this.sessionJobs.get(job.sessionId);
        if (sessionJobs) {
          sessionJobs.delete(id);
          if (sessionJobs.size === 0) {
            this.sessionJobs.delete(job.sessionId);
          }
        }
        this.jobs.delete(id);
      }
    });

    if (toDelete.length > 0) {
      console.log(`[JobRegistry] Cleaned up ${toDelete.length} old jobs`);
    }
  }
}

export const jobRegistry = new JobRegistry();

setInterval(() => {
  jobRegistry.cleanupOldJobs();
}, 300000);
