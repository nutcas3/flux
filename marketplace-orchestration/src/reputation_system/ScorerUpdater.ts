import { OracleFeed, OracleData } from './OracleFeed';

export interface ReputationUpdate {
    resourceId: string;
    host: string;
    oldScore: number;
    newScore: number;
    reason: string;
    timestamp: number;
}

export interface JobOutcome {
    jobId: string;
    host: string;
    resourceId: string;
    success: boolean;
    duration: number; // In seconds
    oracleData?: OracleData;
}

/**
 * Handles updating reputation scores for resources/hosts based on job outcomes,
 * oracle data, and performance metrics.
 */
export class ScorerUpdater {
    private oracleFeed: OracleFeed;
    private baseScore: number = 1000; // Default starting score
    private maxScore: number = 10000;
    private minScore: number = 0;

    constructor(oracleFeed: OracleFeed) {
        this.oracleFeed = oracleFeed;
    }

    /**
     * Updates reputation score based on job outcome.
     */
    public async updateScore(outcome: JobOutcome): Promise<ReputationUpdate> {
        const { host, resourceId, success, duration, oracleData } = outcome;

        // Get current score (mock; replace with DB query)
        const currentScore = await this.getCurrentScore(resourceId);

        let scoreChange = 0;
        let reason = '';

        if (success) {
            // Successful job: Positive adjustment
            const baseBonus = 50; // Base points for success
            const durationBonus = Math.max(0, 100 - duration / 60); // Bonus for fast completion
            scoreChange = baseBonus + durationBonus;

            // Oracle-based adjustment
            if (oracleData) {
                const oracleMultiplier = oracleData.benchmarkScore / 10000;
                scoreChange *= oracleMultiplier;
            }

            reason = `Job ${outcome.jobId} completed successfully`;
        } else {
            // Failed job: Penalty
            const penalty = 100; // Base penalty for failure
            scoreChange = -penalty;
            reason = `Job ${outcome.jobId} failed`;
        }

        const newScore = Math.max(this.minScore, Math.min(this.maxScore, currentScore + scoreChange));

        const update: ReputationUpdate = {
            resourceId,
            host,
            oldScore: currentScore,
            newScore,
            reason,
            timestamp: Date.now(),
        };

        // Persist update (mock; replace with DB update)
        await this.persistUpdate(update);

        console.log(`[SCORER] Updated score for ${resourceId}: ${currentScore} -> ${newScore} (${reason})`);

        return update;
    }

    /**
     * Updates score based on oracle data (e.g., periodic benchmark checks).
     */
    public async updateScoreFromOracle(resourceId: string, gpuModel: string): Promise<ReputationUpdate> {
        const currentScore = await this.getCurrentScore(resourceId);
        const oracleData = await this.oracleFeed.fetchBenchmarkData(gpuModel);

        // Adjust score based on oracle benchmark
        const benchmarkMultiplier = oracleData.benchmarkScore / 10000;
        const adjustment = (benchmarkMultiplier - 1) * 100; // Positive or negative adjustment
        const newScore = Math.max(this.minScore, Math.min(this.maxScore, currentScore + adjustment));

        const update: ReputationUpdate = {
            resourceId,
            host: 'oracle_update', // Placeholder
            oldScore: currentScore,
            newScore,
            reason: `Oracle benchmark update for ${gpuModel}`,
            timestamp: Date.now(),
        };

        await this.persistUpdate(update);

        console.log(`[SCORER] Oracle update for ${resourceId}: ${currentScore} -> ${newScore}`);

        return update;
    }

    /**
     * Gets the current reputation score for a resource.
     */
    private async getCurrentScore(resourceId: string): Promise<number> {
        // Mock: In production, query database or on-chain state
        return this.baseScore; // Placeholder
    }

    /**
     * Persists the reputation update.
     */
    private async persistUpdate(update: ReputationUpdate): Promise<void> {
        // Mock: In production, update database or call Solana program
        console.log(`[SCORER] Persisting update:`, update);
    }

    /**
     * Batch updates multiple resources.
     */
    public async batchUpdate(outcomes: JobOutcome[]): Promise<ReputationUpdate[]> {
        const updates = await Promise.all(outcomes.map(outcome => this.updateScore(outcome)));
        return updates;
    }
}

// Example usage:
// const oracle = new OracleFeed();
// const scorer = new ScorerUpdater(oracle);
// const update = await scorer.updateScore({
//     jobId: 'job-123',
//     host: 'host-pubkey',
//     resourceId: 'resource-456',
//     success: true,
//     duration: 1800,
//     oracleData: { benchmarkScore: 8500, pricePerHour: 0.5, timestamp: Date.now(), source: 'Pyth' }
// });
// console.log(update);