import { DynamicMatcher } from './DynamicMatcher';
import { OracleFeed } from '../reputation_system/OracleFeed';

export interface QueuedJob {
    id: string;
    requirements: {
        requiredVram: number;
        minComputeRating: number;
        maxPricePerSecond: bigint;
        isHighPriority: boolean;
    };
    payload: {
        JobID: string;
        ImageUrl: string;
        InputData: string;
        TimeoutSec: number;
    };
    status: 'pending' | 'matching' | 'matched' | 'failed' | 'dispatched';
    matchedResource?: any;
    createdAt: number;
    processedAt?: number;
}

export interface QueueStats {
    pending: number;
    matching: number;
    matched: number;
    failed: number;
    dispatched: number;
}

/**
 * Manages a queue of jobs for matching against available resources.
 * Integrates with DynamicMatcher for automatic processing.
 */
export class MatchQueue {
    private queue: QueuedJob[] = [];
    private matcher: DynamicMatcher;
    private isProcessing: boolean = false;

    constructor(private oracleFeed: OracleFeed) {
        // Initialize matcher with a mock RPC service (replace with real service)
        this.matcher = new DynamicMatcher({
            getAllResourceListings: async () => [] // Mock; implement real RPC calls
        } as any, oracleFeed);
    }

    /**
     * Adds a new job to the queue.
     */
    public enqueue(job: Omit<QueuedJob, 'id' | 'status' | 'createdAt'>): string {
        const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const queuedJob: QueuedJob = {
            ...job,
            id,
            status: 'pending',
            createdAt: Date.now(),
        };

        this.queue.push(queuedJob);
        console.log(`[QUEUE] Added job ${id} to queue`);

        // Start processing if not already running
        if (!this.isProcessing) {
            this.processQueue();
        }

        return id;
    }

    /**
     * Removes a job from the queue by ID.
     */
    public dequeue(id: string): boolean {
        const index = this.queue.findIndex(job => job.id === id);
        if (index !== -1) {
            this.queue.splice(index, 1);
            console.log(`[QUEUE] Removed job ${id} from queue`);
            return true;
        }
        return false;
    }

    /**
     * Gets the current queue stats.
     */
    public getStats(): QueueStats {
        const stats = this.queue.reduce((acc, job) => {
            acc[job.status]++;
            return acc;
        }, { pending: 0, matching: 0, matched: 0, failed: 0, dispatched: 0 });

        return stats as QueueStats;
    }

    /**
     * Gets all jobs in the queue.
     */
    public getQueue(): QueuedJob[] {
        return [...this.queue];
    }

    /**
     * Processes the queue automatically.
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            // Sort queue by priority (high priority first)
            this.queue.sort((a, b) => {
                if (a.requirements.isHighPriority && !b.requirements.isHighPriority) return -1;
                if (!a.requirements.isHighPriority && b.requirements.isHighPriority) return 1;
                return a.createdAt - b.createdAt; // FIFO for same priority
            });

            const job = this.queue.find(j => j.status === 'pending');
            if (!job) break;

            job.status = 'matching';
            job.processedAt = Date.now();
            console.log(`[QUEUE] Processing job ${job.id}`);

            try {
                const match = await this.matcher.findBestMatch(job.requirements);
                if (match) {
                    job.status = 'matched';
                    job.matchedResource = match;
                    console.log(`[QUEUE] Matched job ${job.id} to resource ${match.publicKey}`);

                    // Dispatch the job
                    const dispatched = await this.matcher.dispatchJobToHost(match, job.payload);
                    if (dispatched) {
                        job.status = 'dispatched';
                        console.log(`[QUEUE] Dispatched job ${job.id}`);
                    } else {
                        job.status = 'failed';
                        console.log(`[QUEUE] Failed to dispatch job ${job.id}`);
                    }
                } else {
                    job.status = 'failed';
                    console.log(`[QUEUE] No match found for job ${job.id}`);
                }
            } catch (error) {
                job.status = 'failed';
                console.error(`[QUEUE] Error processing job ${job.id}:`, error);
            }
        }

        this.isProcessing = false;
    }
}

// Example usage:
// const oracle = new OracleFeed();
// const queue = new MatchQueue(oracle);
// const jobId = queue.enqueue({
//     requirements: { requiredVram: 8, minComputeRating: 5000, maxPricePerSecond: 100n, isHighPriority: false },
//     payload: { JobID: 'test-job', ImageUrl: 'nginx', InputData: 'data', TimeoutSec: 3600 }
// });
// console.log(queue.getStats());