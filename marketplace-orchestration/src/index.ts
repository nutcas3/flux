import { SolanaRpcService } from './services/SolanaRpcService';
import { DynamicMatcher } from './match_engine/DynamicMatcher';
import { OracleFeed } from './reputation_system/OracleFeed';
import { MatchQueue } from './match_engine/MatchQueue';
import { ScorerUpdater } from './reputation_system/ScorerUpdater';

console.log("--- Flux Marketplace Orchestrator Starting ---");

// Initialize core services
const rpcService = new SolanaRpcService();
const oracle = new OracleFeed();
const matcher = new DynamicMatcher(rpcService, oracle);
const queue = new MatchQueue(oracle);
const scorer = new ScorerUpdater(oracle);

// Enhanced function to simulate the entire job submission lifecycle with real contract interactions
async function simulateJobSubmission(clientPK: string) {
    console.log("\n--- Client Job Request Received ---");

    // 1. Define Job Requirements (From Frontend API call)
    const jobRequirements = {
        requiredVram: 20,
        minComputeRating: 10000,
        maxPricePerSecond: 10000n, // Max 0.01 FLUX per hour
        isHighPriority: false,
    };

    // 2. Find the Best Host using real on-chain data
    const bestMatch = await matcher.findBestMatch(jobRequirements);

    if (!bestMatch) {
        console.log("\n[Job Submission Failed] Could not find a matching, available resource.");
        return;
    }

    console.log(`Best match found: ${bestMatch.publicKey} with score based on reputation and oracle data`);

    // 3. Initiate Escrow Payment on Solana using real contract
    const requiredAmount = 25000n; // Example: 5 hours of compute at the price

    try {
        const txHash = await rpcService.initiateJobEscrow(
            clientPK,
            bestMatch.publicKey,
            requiredAmount
        );
        console.log(`Escrow initiated with TX: ${txHash}`);
    } catch (error) {
        console.error("Escrow initiation failed:", error);
        return;
    }

    // 4. Start the job on-chain using contract instructions
    const jobId = BigInt(Date.now()); // Unique job ID
    const specs = bestMatch.specs; // Use matched resource specs

    // In a real implementation, call the contract's start_job instruction
    // For now, simulate the on-chain call
    console.log(`Starting job ${jobId} with specs: ${JSON.stringify(specs)}`);

    // 5. Dispatch Job to the Host Worker Node
    const jobPayload = {
        JobID: `JOB-${jobId}`,
        ImageUrl: "dockerhub/pytorch-model-v2:latest",
        InputData: "s3://client-data-bucket/input-file.zip",
        TimeoutSec: 18000, // 5 hours
    };

    const isDispatched = await matcher.dispatchJobToHost(bestMatch, jobPayload);

    if (isDispatched) {
        console.log("\n--- JOB SUCCESS ---");
        console.log(`Job ID: ${jobPayload.JobID}`);
        console.log(`Assigned Host: ${bestMatch.host.substring(0, 10)}...`);
        console.log(`Resource: ${bestMatch.publicKey}`);
        console.log("Job dispatched to host worker node");
        console.log("-------------------");

        // 6. Simulate job completion and reputation update
        const jobOutcome = {
            jobId: jobPayload.JobID,
            host: bestMatch.host,
            resourceId: bestMatch.publicKey,
            success: true,
            duration: 1800, // 30 minutes
            oracleData: await oracle.fetchBenchmarkData(bestMatch.specs.gpuModel),
        };

        await scorer.updateScore(jobOutcome);
        console.log("Reputation updated based on job outcome");
    } else {
        console.log("Job Dispatch Failed (Internal Error).");
    }
}

// Run the simulation with real contract-based operations
simulateJobSubmission("ClientWallet123456789012345678901234567890123456");
