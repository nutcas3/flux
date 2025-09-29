# Flux Marketplace - Decentralized Compute Infrastructure

A comprehensive DePIN (Decentralized Physical Infrastructure Network) system for decentralized GPU compute resources, built on Solana blockchain with distributed orchestration and host worker nodes.

## 🏗️ Architecture Overview

The Flux Marketplace consists of three main components working together to create a decentralized compute marketplace:

### 1. On-Chain Contracts (`on-chain-contracts/`)
**Technology**: Rust + Pinocchio Framework
**Blockchain**: Solana

- **Resource Registry**: Smart contracts for registering and managing compute resources
- **Job Lifecycle**: Complete job management from submission to completion
- **Escrow System**: Secure payment handling with locked funds
- **Staking Mechanism**: FLUX token staking for host reputation
- **Status Tracking**: Real-time resource availability (Idle, Busy, Offline)

**Core Instructions**:
- `register_resource` - Register new compute resources
- `update_resource_status` - Update resource availability
- `start_job` - Initialize job with escrow
- `submit_job_result` - Submit job completion proof
- `resolve_job` - Finalize job and release payment
- `deposit_escrow` - Lock client funds
- `release_payment` - Transfer funds to host
- `stake_flux` - Stake tokens for reputation
- `unstake_flux` - Withdraw staked tokens

### 2. Host Worker Node (`host-worker-node/`)
**Technology**: Go
**Purpose**: Hardware resource management and blockchain interaction

- **Hardware Detection**: Automatic GPU/CPU specification scanning
- **Blockchain Integration**: Solana RPC client for on-chain operations
- **Status Heartbeat**: Regular status updates (Idle/Busy/Offline)
- **Job Execution**: Containerized workload execution (Docker)
- **Resource Management**: Dynamic status updates based on job state

### 3. Marketplace Orchestration (`marketplace-orchestration/`)
**Technology**: TypeScript/Node.js
**Purpose**: Job matching and coordination

- **Dynamic Matching**: Intelligent host selection based on requirements
- **Oracle Integration**: Real-time benchmark data for reputation scoring
- **Resource Discovery**: Real-time querying of available compute resources
- **Job Dispatching**: Secure job assignment and monitoring
- **Escrow Management**: Payment coordination via on-chain contracts
- **Reputation System**: Oracle-backed scoring and updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Go 1.20+
- Rust & Cargo
- Solana CLI tools
- Docker (for containerized workloads)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd flux-marketplace
```

### 2. Build On-Chain Contracts
```bash
cd on-chain-contracts/programs/on-chain-contracts
cargo build-sbf
solana program deploy target/deploy/on_chain_contracts.so
```

### 3. Start Host Worker Node
```bash
cd host-worker-node
go mod tidy
go run main.go
```

### 4. Launch Marketplace Orchestrator
```bash
cd marketplace-orchestration
npm install
npm start
```

## 📁 Project Structure

```
flux-marketplace/
├── on-chain-contracts/          # Solana smart contracts
│   └── programs/on-chain-contracts/src/
│       ├── lib.rs              # Main contract logic
│       ├── instructions/       # Contract instructions
│       │   ├── register_resource.rs
│       │   ├── start_job.rs
│       │   ├── deposit_escrow.rs
│       │   ├── stake_flux.rs
│       │   └── ...
│       ├── state/              # Data structures
│       │   ├── resource.rs     # ResourceAccount, ResourceSpecs, ResourceStatus
│       │   ├── job.rs          # JobAccount, JobStatus
│       │   └── escrow.rs       # EscrowAccount, EscrowStatus
│       └── Cargo.toml          # Rust dependencies
├── host-worker-node/            # Go worker implementation
│   ├── main.go                 # Application entry point
│   ├── go.mod                  # Go module definition
│   └── internal/
│       ├── hardware/           # Hardware detection
│       ├── solana/             # Blockchain client
│       ├── types/              # Shared data types (matches Rust)
│       ├── api/                # HTTP API listener
│       └── jobprocessor/       # Docker job execution
└── marketplace-orchestration/   # TypeScript orchestrator
    └── src/
        ├── index.ts            # Main application
        ├── services/           # External service integrations
        │   └── SolanaRpcService.ts
        ├── match_engine/       # Job matching algorithms
        │   ├── DynamicMatcher.ts
        │   └── MatchQueue.ts
        └── reputation_system/  # Oracle-based reputation
            ├── OracleFeed.ts
            └── ScorerUpdater.ts
```

## 🔧 Development

### On-Chain Development
```bash
cd on-chain-contracts/programs/on-chain-contracts
cargo check
cargo test
solana program deploy --program-id <PROGRAM_ID> target/deploy/on_chain_contracts.so
```

### Host Worker Development
```bash
cd host-worker-node
go test ./...
go run main.go --config ./config/host_identity.json
```

### Orchestrator Development
```bash
cd marketplace-orchestration
npm run dev
npm test
```

## 📊 Key Features

### Resource Registration
- Hardware specification validation
- Unique resource identification via PDAs
- Reputation-based scoring system
- Price discovery mechanism
- Status tracking: Idle, Busy, Offline

### Dynamic Matching
- Multi-criteria optimization
- Real-time availability checking
- Reputation-weighted selection
- Price-performance balancing
- Oracle-backed benchmark data

### Job Lifecycle
1. **Submission**: Client submits job requirements
2. **Matching**: Orchestrator finds optimal host
3. **Escrow**: Funds locked on-chain via `deposit_escrow`
4. **Job Start**: Job initialized with `start_job` instruction
5. **Execution**: Job dispatched to worker node
6. **Result Submission**: Host submits proof via `submit_job_result`
7. **Resolution**: Job finalized with `resolve_job`
8. **Settlement**: Payment released via `release_payment`

### Staking System
- Hosts stake FLUX tokens for reputation
- Staking increases trust score
- Unstaking available after cooldown
- Slashing for malicious behavior (future)

## 🔒 Security Considerations

- **Key Management**: Secure wallet key storage
- **Transaction Signing**: Hardware security modules recommended
- **Access Control**: PDA-based authorization
- **Escrow Protection**: Funds locked until job completion
- **Reputation System**: Stake-based penalties for bad actors
- **Audit Trail**: Complete on-chain transaction history

## 🌐 Network Configuration

### Supported Networks
- **Devnet**: Development and testing
- **Testnet**: Staging environment
- **Mainnet**: Production deployment

### RPC Endpoints
- Devnet: `https://api.devnet.solana.com`
- Testnet: `https://api.testnet.solana.com`
- Mainnet: `https://api.mainnet-beta.solana.com`

## 📈 Monitoring & Analytics

### Host Metrics
- Resource utilization
- Job completion rates
- Reputation scores
- Staked FLUX amount
- Earnings analytics

### Network Health
- Total registered resources
- Active job count
- Network throughput
- Geographic distribution
- Total value locked (TVL)

## 🔄 Data Type Alignment

All components use matching data structures:

**ResourceStatus** (3 states):
- `Idle` (0) - Available for jobs
- `Busy` (1) - Currently executing job
- `Offline` (2) - Not available

**ResourceSpecs**:
- `id`: u64
- `gpu_model`: String
- `vram_gb`: u8
- `cpu_cores`: u8
- `compute_rating`: u32
- `price_per_hour`: u64

**JobStatus**:
- `Pending` - Awaiting host assignment
- `Active` - In progress
- `Completed` - Successfully finished
- `Failed` - Failed or disputed

**EscrowStatus**:
- `Locked` - Funds held
- `Released` - Paid to host
- `Refunded` - Returned to client

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

### Development Guidelines
- Follow existing code style
- Add unit tests for new functionality
- Update documentation
- Test on devnet before mainnet
- Ensure data type alignment across all components

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: [Link to docs]
- **Discord**: [Community server]
- **GitHub Issues**: [Issue tracker]
- **Email**: support@fluxmarketplace.com

---

**Built with ❤️ for the decentralized future**
