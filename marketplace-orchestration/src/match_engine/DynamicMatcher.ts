// Filename: marketplace-orchestrator/src/match_engine/DynamicMatcher.ts

import { SolanaRpcService } from '../services/SolanaRpcService';

interface JobRequirements {
    requiredVram: number;
    minComputeRating: number;
    maxPricePerSecond: bigint;
    isHighPriority: boolean;
}

interface JobPayload {
    JobID: string;
    ImageUrl: string;
    InputData: string;
    TimeoutSec: number;
}

interface ResourceListing {
    publicKey: string; 
    host: string; 
    specs: {
        id: bigint;
        gpuModel: string;
        vramGb: number;
        cpuCores: number;
        computeRating: number;
        pricePerHour: bigint;
    };
    status: 'Idle' | 'Busy' | 'Offline' | 'Suspended';
    reputationScore: number;
    lastUpdated: number;
}

/**
 * Implements the core matching logic to find the best available host for compute jobs.
 * Uses a scoring system based on:
 * 1. Hardware requirements match
 * 2. Price within budget
 * 3. Host reputation
 * 4. Recent activity (freshness of status updates)
 */
export class DynamicMatcher {
    constructor(private rpcService: SolanaRpcService) {}

    /**
     * Finds the best matching host for the given job requirements.
     */
    public async findBestMatch(requirements: JobRequirements): Promise<ResourceListing | null> {
        const resources = await this.rpcService.getAllResourceListings();
        
        // Filter out unavailable resources
        const availableResources = resources.filter(r => r.status === 'Idle');
        if (availableResources.length === 0) return null;

        // Filter by minimum requirements
        const qualifiedResources = availableResources.filter(r => 
            r.specs.vramGb >= requirements.requiredVram &&
            r.specs.computeRating >= requirements.minComputeRating &&
            this.getPricePerSecond(r.specs.pricePerHour) <= requirements.maxPricePerSecond
        );
        if (qualifiedResources.length === 0) return null;

        // Score each resource
        const scoredResources = qualifiedResources.map(r => ({
            resource: r,
            score: this.calculateMatchScore(r, requirements)
        }));

        // Sort by score (highest first) and return the best match
        scoredResources.sort((a, b) => b.score - a.score);
        return scoredResources[0].resource;
    }

    /**
     * Dispatches a job to the selected host.
     * In a real system, this would interact with a job queue and host API.
     */
    public async dispatchJobToHost(host: ResourceListing, payload: JobPayload): Promise<boolean> {
        console.log(`[DISPATCH] Sending job ${payload.JobID} to host ${host.host}`);
        console.log(`[DISPATCH] Docker Image: ${payload.ImageUrl}`);
        
        // MOCK: Simulate API call to host's worker node
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In production:
        // 1. Send job details to host's API endpoint
        // 2. Wait for acknowledgment
        // 3. Monitor job status
        return true;
    }

    private calculateMatchScore(resource: ResourceListing, requirements: JobRequirements): number {
        let score = 0;

        // Hardware capability score (0-40 points)
        const vramScore = Math.min(resource.specs.vramGb / requirements.requiredVram * 20, 20);
        const computeScore = Math.min(resource.specs.computeRating / requirements.minComputeRating * 20, 20);
        score += vramScore + computeScore;

        // Price competitiveness score (0-20 points)
        const priceRatio = Number(this.getPricePerSecond(resource.specs.pricePerHour)) / 
                          Number(requirements.maxPricePerSecond);
        score += Math.max(20 * (1 - priceRatio), 0);

        // Reputation score (0-30 points)
        score += (resource.reputationScore / 10000) * 30;

        // Status freshness score (0-10 points)
        const secondsSinceUpdate = Date.now()/1000 - resource.lastUpdated;
        score += Math.max(10 - (secondsSinceUpdate / 6), 0); // Lose 1 point per 6 seconds

        return score;
    }

    private getPricePerSecond(pricePerHour: bigint): bigint {
        return pricePerHour / 3600n;
    }
}
