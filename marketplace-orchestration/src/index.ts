// Filename: marketplace-orchestrator/src/index.ts

import { SolanaRpcService } from './services/SolanaRpcService';
import { DynamicMatcher } from './match_engine/DynamicMatcher';
import { OracleFeed } from './reputation_system/OracleFeed';

console.log("--- Flux Marketplace Orchestrator Starting ---");

// Initialize core services
const rpcService = new SolanaRpcService();
const oracle = new OracleFeed();
const matcher = new DynamicMatcher(rpcService, oracle);

// MOCK: A simple function to simulate the entire job submission lifecycle
async function simulateJobSubmission(clientPK: string) {
    console.log("\n--- Client Job Request Received ---");

    // 1. Define Job Requirements (From Frontend API call)
    const jobRequirements = {
        requiredVram: 20,
        minComputeRating: 10000,
        maxPricePerSecond: 10000n, // Max 0.01 FLUX per hour
        isHighPriority: false,
    };

    // 2. Find the Best Host
    const bestMatch = await matcher.findBestMatch(jobRequirements);

    if (!bestMatch) {
        console.log("\n[Job Submission Failed] Could not find a matching, available resource.");
        return;
    }

    // 3. Initiate Escrow Payment on Solana
    const requiredAmount = 25000n; // Example: 5 hours of compute at the price

    const txHash = await rpcService.initiateJobEscrow(
        clientPK,
        bestMatch.publicKey,
        requiredAmount
    );

    // 4. Dispatch Job to the Host Worker Node
    const jobPayload = {
        JobID: `JOB-${Date.now()}`,
        ImageUrl: "dockerhub/pytorch-model-v2:latest",
        InputData: "s3://client-data-bucket/input-file.zip",
        TimeoutSec: 18000, // 5 hours
    };

    const isDispatched = await matcher.dispatchJobToHost(bestMatch, jobPayload);

    if (isDispatched) {
        console.log("\n--- JOB SUCCESS ---");
        console.log(`Job ID: ${jobPayload.JobID}`);
        console.log(`Assigned Host: ${bestMatch.host.substring(0, 10)}...`);
        console.log(`Escrow TX: ${txHash.substring(0, 15)}...`);
        console.log("-------------------");
    } else {
        console.log("Job Dispatch Failed (Internal Error).");
    }
}

// Run the simulation
simulateJobSubmission("ClientWallet123456789012345678901234567890123456");
