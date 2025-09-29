# Flux Marketplace Orchestration

TypeScript/Node.js orchestration service for the Flux Marketplace that handles job matching, resource discovery, and coordination between clients and hosts.

## 🏗️ Overview

The Marketplace Orchestration service is the central coordination layer that:
- Discovers available compute resources from the blockchain
- Matches client job requirements with optimal hosts
- Manages job lifecycle and escrow payments
- Updates reputation scores based on job outcomes
- Integrates oracle data for performance benchmarking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Access to Solana RPC endpoint

### Installation
```bash
cd marketplace-orchestration
npm install
```

### Configuration
Create a `.env` file:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=YourProgramIDHere
ORACLE_API_KEY=your_oracle_key
PORT=3000
```

### Run
```bash
npm start
```

### Development
```bash
npm run dev
```

## 📁 Project Structure

```
marketplace-orchestration/
├── src/
│   ├── index.ts                    # Main application entry
│   ├── services/
│   │   └── SolanaRpcService.ts     # Blockchain interactions
│   ├── match_engine/
│   │   ├── DynamicMatcher.ts       # Job-host matching algorithm
│   │   └── MatchQueue.ts           # Job queue management
│   ├── reputation_system/
│   │   ├── OracleFeed.ts           # External benchmark data
│   │   └── ScorerUpdater.ts        # Reputation scoring
│   └── controllers/
│       └── JobController.ts        # Job lifecycle management
├── package.json
└── tsconfig.json
```

## 🔧 Core Components

### SolanaRpcService
Manages blockchain interactions using @solana/kit:
```typescript
const rpcService = new SolanaRpcService();

// Fetch all available resources
const resources = await rpcService.getAllResourceListings();

// Initiate escrow for job payment
const txHash = await rpcService.initiateJobEscrow(
    clientPK,
    resourcePK,
    amount
);
```

### DynamicMatcher
Intelligent host selection based on multiple criteria:
```typescript
const matcher = new DynamicMatcher(rpcService, oracle);

// Find best match for job requirements
const bestMatch = await matcher.findBestMatch({
    requiredVram: 20,
    minComputeRating: 10000,
    maxPricePerSecond: 10000n,
    isHighPriority: false
});

// Dispatch job to selected host
await matcher.dispatchJobToHost(bestMatch, jobPayload);
```

### OracleFeed
Fetches real-time benchmark data:
```typescript
const oracle = new OracleFeed();

// Get GPU performance benchmarks
const benchmarkData = await oracle.fetchBenchmarkData("NVIDIA RTX 4090");

// Returns: compute score, reliability rating, market price
```

### ScorerUpdater
Updates reputation based on job outcomes:
```typescript
const scorer = new ScorerUpdater(oracle);

// Update host reputation after job completion
await scorer.updateScore({
    jobId: "JOB-123",
    host: "HostWalletAddress",
    success: true,
    duration: 1800,
    oracleData: benchmarkData
});
```

### MatchQueue
Manages pending job requests:
```typescript
const queue = new MatchQueue(oracle);

// Add job to queue
queue.enqueue(jobRequest);

// Process queue with priority sorting
const nextJob = queue.dequeue();
```

## 📊 Data Structures

### ResourceListing
```typescript
interface ResourceListing {
    publicKey: string;          // PDA address
    host: string;               // Host wallet
    specs: ResourceSpecs;       // Hardware specs
    status: 'Idle' | 'Busy' | 'Offline';
    reputationScore: number;    // 0-10000
    lastUpdated: number;        // Unix timestamp
}
```

### ResourceSpecs
```typescript
interface ResourceSpecs {
    id: bigint;
    gpuModel: string;
    vramGb: number;
    cpuCores: number;
    computeRating: number;
    pricePerHour: bigint;
}
```

### JobRequirements
```typescript
interface JobRequirements {
    requiredVram: number;
    minComputeRating: number;
    maxPricePerSecond: bigint;
    isHighPriority: boolean;
}
```

### JobPayload
```typescript
interface JobPayload {
    JobID: string;
    ImageUrl: string;           // Docker image
    InputData: string;          // S3/IPFS URL
    TimeoutSec: number;         // Max execution time
}
```

## 🔄 Job Lifecycle

### 1. Job Submission
```typescript
async function submitJob(clientPK: string, requirements: JobRequirements) {
    // Find best matching host
    const bestMatch = await matcher.findBestMatch(requirements);
    
    if (!bestMatch) {
        throw new Error("No suitable host found");
    }
    
    // Initiate escrow
    const txHash = await rpcService.initiateJobEscrow(
        clientPK,
        bestMatch.publicKey,
        calculatePayment(requirements)
    );
    
    // Dispatch job to host
    const jobPayload = createJobPayload(requirements);
    await matcher.dispatchJobToHost(bestMatch, jobPayload);
    
    return { jobId: jobPayload.JobID, txHash };
}
```

### 2. Job Monitoring
```typescript
async function monitorJob(jobId: string) {
    // Poll job status from blockchain
    const jobAccount = await rpcService.getJobAccount(jobId);
    
    // Check for completion
    if (jobAccount.status === 'Completed') {
        // Update reputation
        await scorer.updateScore({
            jobId,
            host: jobAccount.host,
            success: true,
            duration: calculateDuration(jobAccount)
        });
    }
}
```

### 3. Payment Settlement
```typescript
async function settlePayment(jobId: string) {
    // Verify job completion
    const jobAccount = await rpcService.getJobAccount(jobId);
    
    if (jobAccount.status === 'Completed') {
        // Release escrow to host
        await rpcService.releasePayment(jobId);
    } else if (jobAccount.status === 'Failed') {
        // Refund client
        await rpcService.refundEscrow(jobId);
    }
}
```

## 🎯 Matching Algorithm

### Scoring Criteria
1. **Hardware Match** (40%)
   - VRAM availability
   - Compute rating
   - CPU cores

2. **Reputation** (30%)
   - Historical success rate
   - Oracle-verified performance
   - Stake amount

3. **Price** (20%)
   - Competitive pricing
   - Price-performance ratio

4. **Availability** (10%)
   - Current status (Idle preferred)
   - Recent uptime
   - Response time

### Implementation
```typescript
function calculateMatchScore(
    resource: ResourceListing,
    requirements: JobRequirements,
    oracleData: BenchmarkData
): number {
    const hardwareScore = scoreHardware(resource, requirements);
    const reputationScore = scoreReputation(resource, oracleData);
    const priceScore = scorePrice(resource, requirements);
    const availabilityScore = scoreAvailability(resource);
    
    return (
        hardwareScore * 0.4 +
        reputationScore * 0.3 +
        priceScore * 0.2 +
        availabilityScore * 0.1
    );
}
```

## 🔒 Security

### API Authentication
```typescript
// JWT-based authentication
app.use(authenticateJWT);

// Rate limiting
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}));
```

### Transaction Validation
- Verify client signatures
- Validate escrow amounts
- Check resource availability
- Prevent double-spending

## 📈 Monitoring & Analytics

### Metrics
```typescript
// Track key metrics
metrics.recordJobSubmission(jobId);
metrics.recordMatchTime(duration);
metrics.recordSuccessRate(rate);
```

### Logging
```typescript
import { logger } from './utils/logger';

logger.info('Job matched', { jobId, hostId, score });
logger.error('Matching failed', { error, requirements });
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing
```typescript
// Test matching algorithm
const testRequirements = {
    requiredVram: 16,
    minComputeRating: 8000,
    maxPricePerSecond: 5000n,
    isHighPriority: false
};

const match = await matcher.findBestMatch(testRequirements);
console.log('Best match:', match);
```

## 🔧 Configuration

### Environment Variables
```env
# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=YourProgramID

# Oracle
ORACLE_API_URL=https://oracle.example.com
ORACLE_API_KEY=your_key

# Server
PORT=3000
NODE_ENV=production

# Matching
MIN_REPUTATION_SCORE=5000
MAX_PRICE_DEVIATION=0.2
MATCH_TIMEOUT_MS=5000
```

## 📦 Dependencies

```json
{
  "dependencies": {
    "@solana/kit": "^1.0.0",
    "express": "^4.18.0",
    "axios": "^1.4.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0"
  }
}
```

## 🚀 Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### PM2
```bash
pm2 start npm --name "flux-orchestrator" -- start
pm2 save
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License - See LICENSE file for details

---

**Part of the Flux Marketplace ecosystem**
