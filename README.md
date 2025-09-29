# Flux Marketplace - Decentralized Compute Infrastructure

A comprehensive DePIN (Decentralized Physical Infrastructure Network) system for decentralized GPU compute resources, built on Solana blockchain.

## Project Vision

Flux Marketplace creates a decentralized network where GPU owners can monetize their idle compute power, and clients can access affordable, scalable computing resources for AI/ML workloads, rendering, and scientific computing.

## Architecture

The system consists of three interconnected components:

### 1. **On-Chain Contracts** (Solana/Rust)
Smart contracts managing the marketplace infrastructure:
- Resource registration and discovery
- Job lifecycle management
- Escrow-based payment system
- Reputation and staking mechanisms

### 2. **Host Worker Node** (Go)
Runs on GPU provider machines:
- Automatic hardware detection (NVIDIA/AMD)
- Job execution in isolated containers
- Real-time status reporting
- Proof-of-work submission

### 3. **Marketplace Orchestration** (TypeScript/Node.js)
Central coordination service:
- Intelligent job-to-host matching
- Oracle-based reputation scoring
- Payment coordination
- Network monitoring

## Key Features

- **Decentralized**: No central authority controls the network
- **Trustless**: Smart contracts enforce agreements
- **Efficient**: Direct peer-to-peer resource allocation
- **Transparent**: All transactions on-chain
- **Scalable**: Grows with network participation
- **Fair**: Reputation-based host selection

## 💡 How It Works

1. **Hosts** register their GPU resources on-chain
2. **Clients** submit compute job requirements
3. **Orchestrator** matches jobs to optimal hosts
4. **Escrow** locks payment until job completion
5. **Execution** happens on host's hardware
6. **Verification** ensures work was completed
7. **Settlement** releases payment to host
8. **Reputation** updates based on performance

## 🔧 Technology Stack

- **Blockchain**: Solana (high-speed, low-cost transactions)
- **Smart Contracts**: Rust + Pinocchio framework
- **Worker Nodes**: Go (performance + cross-platform)
- **Orchestration**: TypeScript/Node.js
- **GPU Detection**: NVIDIA NVML, nvidia-smi, rocm-smi
- **Containerization**: Docker (job isolation)

## Use Cases

- **AI/ML Training**: Distributed model training
- **Rendering**: 3D graphics and video processing
- **Scientific Computing**: Simulations and data analysis
- **Crypto Mining**: Efficient resource utilization
- **Research**: Academic and institutional workloads

## Network Benefits

**For GPU Providers:**
- Monetize idle hardware
- Passive income stream
- Flexible participation
- Reputation-based earnings

**For Compute Clients:**
- Cost-effective GPU access
- No long-term commitments
- Global resource pool
- Pay-per-use model

## Security & Trust

- **Escrow System**: Funds locked until job completion
- **Staking**: Hosts stake tokens for reputation
- **Proof-of-Work**: Cryptographic verification
- **Reputation Scoring**: Oracle-backed performance tracking
- **Slashing**: Penalties for malicious behavior

##  Repository Structure

```
flux/
├── on-chain-contracts/      # Solana smart contracts
├── host-worker-node/         # GPU provider software
├── marketplace-orchestration/# Coordination service
└── frontend-client/          # User interface (future)
```

## 🚦 Project Status

- ✅ Core smart contracts implemented
- ✅ Host worker node with NVML support
- ✅ Orchestration service with matching engine
- ✅ Reputation system with oracle integration
- 🔄 Frontend client (in development)
- 🔄 Mainnet deployment (planned)

## Contributing

We welcome contributions! Each component has its own README with detailed setup instructions.

## License

MIT License - See LICENSE file for details

## Support

- **Documentation**: See individual component READMEs
- **Issues**: GitHub issue tracker
- **Community**: [Discord/Telegram links]

---

**Building the future of decentralized compute, one GPU at a time.** 🚀
