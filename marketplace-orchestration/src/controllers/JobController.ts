import { SolanaRpcService } from '../services/SolanaRpcService';
import { DynamicMatcher } from '../match_engine/DynamicMatcher';
import { ScorerUpdater } from '../reputation_system/ScorerUpdater';
import { MatchQueue } from '../match_engine/MatchQueue';

export interface JobRequirements {
    requiredVram: number;
    minComputeRating: number;
    maxPricePerSecond: bigint;
    isHighPriority: boolean;
    timeoutSeconds: number;
}

export interface JobSubmission {
    clientPublicKey: string;
    requirements: JobRequirements;
    jobPayload: {
        imageUrl: string;
        inputData: string;
        maxExecutionTime: number;
    };
}

export interface JobStatus {
    jobId: string;
    status: 'pending' | 'matched' | 'executing' | 'completed' | 'failed';
    host?: string;
    startTime?: number;
    endTime?: number;
    result?: string;
    error?: string;
}

/**
 * JobController manages the complete lifecycle of compute jobs
 * from submission through execution to completion and settlement
 */
export class JobController {
    private rpcService: SolanaRpcService;
    private matcher: DynamicMatcher;
    private scorer: ScorerUpdater;
    private queue: MatchQueue;
    private activeJobs: Map<string, JobStatus> = new Map();

    constructor(
        rpcService: SolanaRpcService,
        matcher: DynamicMatcher,
        scorer: ScorerUpdater,
        queue: MatchQueue
    ) {
        this.rpcService = rpcService;
        this.matcher = matcher;
        this.scorer = scorer;
        this.queue = queue;
    }

    /**
     * Submit a new job to the marketplace
     */
    async submitJob(submission: JobSubmission): Promise<string> {
        try {
            console.log(`Submitting job for client: ${submission.clientPublicKey}`);

            // Validate job requirements
            this.validateJobRequirements(submission.requirements);

            // Generate unique job ID
            const jobId = this.generateJobId();

            // Create job status tracking
            const jobStatus: JobStatus = {
                jobId,
                status: 'pending',
                startTime: Date.now()
            };
            this.activeJobs.set(jobId, jobStatus);

            // Add to queue for matching
            this.queue.enqueue({
                requirements: submission.requirements,
                payload: {
                    JobID: jobId,
                    ImageUrl: submission.jobPayload.imageUrl,
                    InputData: submission.jobPayload.inputData,
                    TimeoutSec: submission.requirements.timeoutSeconds
                }
            });

            console.log(`Job ${jobId} submitted and queued`);
            return jobId;
        } catch (error) {
            console.error('Failed to submit job:', error);
            throw new Error(`Job submission failed: ${error}`);
        }
    }

    /**
     * Get current status of a job
     */
    async getJobStatus(jobId: string): Promise<JobStatus | null> {
        return this.activeJobs.get(jobId) || null;
    }

    /**
     * Cancel a pending job
     */
    async cancelJob(jobId: string, clientPublicKey: string): Promise<boolean> {
        const jobStatus = this.activeJobs.get(jobId);
        if (!jobStatus || jobStatus.status !== 'pending') {
            return false;
        }

        // Remove from queue
        const removed = this.queue.dequeue(jobId);
        if (!removed) {
            return false;
        }

        // Update status
        jobStatus.status = 'failed';
        jobStatus.error = 'Cancelled by client';
        jobStatus.endTime = Date.now();

        return true;
    }

    /**
     * Handle job result submission from host
     */
    async handleJobResult(jobId: string, host: string, resultHash: string): Promise<void> {
        const jobStatus = this.activeJobs.get(jobId);
        if (!jobStatus || jobStatus.host !== host) {
            throw new Error('Unauthorized or unknown job');
        }

        try {
            // Update job status
            jobStatus.status = 'completed';
            jobStatus.endTime = Date.now();
            jobStatus.result = resultHash;

            // Update host reputation
            const queueJobs = this.queue.getQueue();
            const job = queueJobs.find(j => j.payload.JobID === jobId);
            const resourceId = job?.matchedResource?.publicKey || 'unknown';

            await this.scorer.updateScore({
                jobId,
                host,
                resourceId,
                success: true,
                duration: (jobStatus.endTime - (jobStatus.startTime || 0)) / 1000
            });

            console.log(`Job ${jobId} completed successfully by host ${host}`);

        } catch (error) {
            console.error(`Failed to handle job result for ${jobId}:`, error);

            // Update reputation for failure
            const queueJobs = this.queue.getQueue();
            const job = queueJobs.find(j => j.payload.JobID === jobId);
            const resourceId = job?.matchedResource?.publicKey || 'unknown';

            await this.scorer.updateScore({
                jobId,
                host,
                resourceId,
                success: false,
                duration: 0
            });

            jobStatus.status = 'failed';
            jobStatus.error = (error as Error).message;
            jobStatus.endTime = Date.now();
        }
    }

    /**
     * Get all active jobs (for monitoring)
     */
    getActiveJobs(): JobStatus[] {
        return Array.from(this.activeJobs.values());
    }

    /**
     * Clean up completed jobs (call periodically)
     */
    cleanupCompletedJobs(): void {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const [jobId, jobStatus] of this.activeJobs.entries()) {
            if ((jobStatus.status === 'completed' || jobStatus.status === 'failed') &&
                jobStatus.endTime && (now - jobStatus.endTime) > maxAge) {
                this.activeJobs.delete(jobId);
            }
        }
    }

    // Private helper methods

    private validateJobRequirements(requirements: JobRequirements): void {
        if (requirements.requiredVram <= 0) {
            throw new Error('Invalid VRAM requirement');
        }
        if (requirements.minComputeRating <= 0) {
            throw new Error('Invalid compute rating requirement');
        }
        if (requirements.maxPricePerSecond <= 0n) {
            throw new Error('Invalid price requirement');
        }
        if (requirements.timeoutSeconds <= 0) {
            throw new Error('Invalid timeout');
        }
    }

    private generateJobId(): string {
        return `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
