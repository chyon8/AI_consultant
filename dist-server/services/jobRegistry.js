class JobRegistry {
    jobs = new Map();
    sessionJobs = new Map();
    createJob(sessionId, type, payload) {
        const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        const job = {
            id,
            sessionId,
            type,
            status: 'pending',
            progress: 0,
            payload,
            result: null,
            error: null,
            chunkLog: [],
            stagedResults: [],
            completedStages: new Set(),
            createdAt: now,
            updatedAt: now,
            completedAt: null
        };
        this.jobs.set(id, job);
        if (!this.sessionJobs.has(sessionId)) {
            this.sessionJobs.set(sessionId, new Set());
        }
        this.sessionJobs.get(sessionId).add(id);
        console.log(`[JobRegistry] Created job ${id} for session ${sessionId}`);
        return job;
    }
    addStagedResult(jobId, stage, data) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        if (job.completedStages.has(stage)) {
            console.log(`[JobRegistry] Stage ${stage} already completed for job ${jobId}`);
            return;
        }
        const stagedResult = {
            stage,
            data,
            completedAt: Date.now()
        };
        job.stagedResults.push(stagedResult);
        job.completedStages.add(stage);
        job.updatedAt = Date.now();
        this.appendChunk(jobId, JSON.stringify({ stage, data }), 'stage');
        console.log(`[JobRegistry] Stage ${stage} completed for job ${jobId}`);
    }
    getStagedResults(jobId) {
        const job = this.jobs.get(jobId);
        return job?.stagedResults || [];
    }
    getCompletedStages(jobId) {
        const job = this.jobs.get(jobId);
        return job ? Array.from(job.completedStages) : [];
    }
    getNewStagedResults(jobId, acknowledgedStages) {
        const job = this.jobs.get(jobId);
        if (!job)
            return [];
        return job.stagedResults.filter(sr => !acknowledgedStages.includes(sr.stage));
    }
    getJob(jobId) {
        return this.jobs.get(jobId);
    }
    getJobsBySession(sessionId) {
        const jobIds = this.sessionJobs.get(sessionId);
        if (!jobIds)
            return [];
        return Array.from(jobIds).map(id => this.jobs.get(id)).filter(Boolean);
    }
    getActiveJobForSession(sessionId) {
        const jobs = this.getJobsBySession(sessionId);
        return jobs.find(j => j.status === 'pending' || j.status === 'running');
    }
    updateJobStatus(jobId, status, error) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
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
    updateJobProgress(jobId, progress) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        job.progress = Math.min(100, Math.max(0, progress));
        job.updatedAt = Date.now();
    }
    appendChunk(jobId, text, type = 'content') {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        const chunk = {
            sequence: job.chunkLog.length,
            text,
            timestamp: Date.now(),
            type
        };
        job.chunkLog.push(chunk);
        job.updatedAt = Date.now();
    }
    setJobResult(jobId, result) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        job.result = result;
        job.updatedAt = Date.now();
    }
    getChunksAfter(jobId, afterSequence) {
        const job = this.jobs.get(jobId);
        if (!job)
            return [];
        return job.chunkLog.filter(c => c.sequence > afterSequence);
    }
    cancelJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            return false;
        if (job.status === 'pending' || job.status === 'running') {
            job.status = 'cancelled';
            job.updatedAt = Date.now();
            job.completedAt = Date.now();
            console.log(`[JobRegistry] Job ${jobId} cancelled`);
            return true;
        }
        return false;
    }
    cleanupOldJobs(maxAgeMs = 3600000) {
        const now = Date.now();
        const toDelete = [];
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
