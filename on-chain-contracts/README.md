# Flux On-Chain Contracts

Solana smart contracts for the Flux Marketplace - a decentralized compute resource marketplace built with Pinocchio framework.

## 🏗️ Overview

The on-chain contracts manage the core marketplace logic including resource registration, job lifecycle, escrow payments, and staking mechanisms. Built using Pinocchio for optimal performance and minimal compute units.

## 📋 Contract Instructions

### Resource Management
- **`register_resource`** (0) - Register new compute resources with hardware specs
- **`update_resource_status`** (1) - Update resource availability (Idle/Busy/Offline)

### Job Lifecycle
- **`start_job`** (2) - Initialize a new job with client and host
- **`submit_job_result`** (3) - Host submits job completion proof
- **`resolve_job`** (4) - Finalize job and trigger payment

### Payment & Escrow
- **`deposit_escrow`** (5) - Lock client funds for job payment
- **`release_payment`** (6) - Transfer funds to host after job completion

### Staking
- **`stake_flux`** (7) - Stake FLUX tokens for reputation
- **`unstake_flux`** (8) - Withdraw staked tokens

## 🗂️ State Structures

### ResourceAccount
```rust
pub struct ResourceAccount {
    pub host: Pubkey,              // Host wallet address
    pub specs: ResourceSpecs,      // Hardware specifications
    pub status: ResourceStatus,    // Idle, Busy, or Offline
    pub reputation_score: u16,     // Reputation score (0-10000)
    pub staked_flux: u64,          // Staked FLUX tokens
    pub last_updated: i64,         // Last status update timestamp
}
```

### ResourceSpecs
```rust
pub struct ResourceSpecs {
    pub id: u64,                   // Unique resource ID
    pub gpu_model: String,         // GPU model name
    pub vram_gb: u8,               // VRAM in GB
    pub cpu_cores: u8,             // Number of CPU cores
    pub compute_rating: u32,       // Compute performance rating
    pub price_per_hour: u64,       // Price in FLUX tokens per hour
}
```

### ResourceStatus (Enum)
- `Idle` (0) - Available for jobs
- `Busy` (1) - Currently executing a job
- `Offline` (2) - Not available

### JobAccount
```rust
pub struct JobAccount {
    pub job_id: u64,               // Unique job ID
    pub client: Pubkey,            // Client wallet address
    pub host: Pubkey,              // Assigned host wallet
    pub status: JobStatus,         // Job status
    pub specs: ResourceSpecs,      // Required specifications
    pub result_hash: [u8; 32],     // Job result hash
    pub deadline: i64,             // Job deadline timestamp
    pub payment_amount: u64,       // Payment amount in FLUX
    pub escrow_account: Pubkey,    // Associated escrow account
}
```

### JobStatus (Enum)
- `Pending` - Awaiting host assignment
- `Active` - Job in progress
- `Completed` - Successfully finished
- `Failed` - Failed or disputed

### EscrowAccount
```rust
pub struct EscrowAccount {
    pub job_id: u64,               // Associated job ID
    pub client: Pubkey,            // Client wallet
    pub host: Pubkey,              // Host wallet
    pub amount: u64,               // Locked FLUX tokens
    pub status: EscrowStatus,      // Escrow status
}
```

### EscrowStatus (Enum)
- `Locked` - Funds held until job completion
- `Released` - Funds transferred to host
- `Refunded` - Funds returned to client

## 🚀 Building & Deployment

### Prerequisites
- Rust 1.70+
- Solana CLI tools
- Cargo

### Build
```bash
cd programs/on-chain-contracts
cargo build-sbf
```

### Test
```bash
cargo test
```

### Deploy to Devnet
```bash
solana program deploy --program-id <PROGRAM_ID> target/deploy/on_chain_contracts.so --url devnet
```

### Deploy to Mainnet
```bash
solana program deploy --program-id <PROGRAM_ID> target/deploy/on_chain_contracts.so --url mainnet-beta
```

## 🔧 Development

### Check for Errors
```bash
cargo check
```

### Run Tests
```bash
cargo test
```

### Format Code
```bash
cargo fmt
```

### Lint
```bash
cargo clippy
```

## 📊 Program Accounts

### PDA Derivation

**Resource Account**:
```rust
seeds: [b"resource", host_pubkey, resource_id]
```

**Job Account**:
```rust
seeds: [b"job", client_pubkey, job_id]
```

**Escrow Account**:
```rust
seeds: [b"escrow", client_pubkey, job_id]
```

**Staking Pool**:
```rust
seeds: [b"stake", resource_account_pubkey]
```

## 🔒 Security Features

- **PDA-based Authorization**: All accounts use Program Derived Addresses
- **Signer Verification**: Critical operations require signature verification
- **Escrow Protection**: Funds locked until job completion or dispute resolution
- **Stake Requirements**: Hosts must stake tokens for reputation
- **Status Validation**: State transitions validated on-chain

## 📈 Error Codes

Custom error codes (via `ProgramError::Custom(code)`):
- `0` - ResourceIdAlreadyExists
- `1` - InvalidPrice
- `2` - UnauthorizedHost
- `3` - UnauthorizedHost (job submission)
- `4` - ResourceNotAvailable
- `5` - InsufficientFunds
- `6` - JobNotCompleted
- `7` - ProposalNotActive (deprecated)

## 🔗 Integration

### Client Integration (TypeScript)
```typescript
import { createSolanaRpc } from '@solana/kit';

const rpc = createSolanaRpc('https://api.devnet.solana.com');
// Use program methods to interact with contracts
```

### Host Integration (Go)
```go
import "flux-worker-go/internal/solana"

agent, err := solana.NewAgent("./config/host_identity.json")
// Register resource, update status, etc.
```

## 📄 Dependencies

- `pinocchio = "0.9.2"` - Lightweight Solana framework
- `anchor-lang = "0.31.1"` - Anchor framework utilities
- `borsh` - Binary serialization
- `spl-token = "4.0"` - SPL Token program integration

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
