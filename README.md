# Flux Marketplace - Decentralized Compute Infrastructure

A comprehensive DePIN (Decentralized Physical Infrastructure Network) system for decentralized GPU compute resources, built on Solana blockchain with distributed orchestration and host worker nodes.

## 🏗️ Architecture Overview

The Flux Marketplace consists of three main components working together to create a decentralized compute marketplace:

### 1. On-Chain Contracts (`on-chain-contracts/`)
**Technology**: Rust + Anchor Framework
**Blockchain**: Solana

- **Resource Registry**: Smart contracts for registering and managing compute resources
- **Account Management**: PDA-based resource accounts with unique identifiers
- **Status Tracking**: Real-time resource availability and reputation scoring
- **Future Extensions**: Job escrow, slashing mechanisms, and governance

### 2. Host Worker Node (`host-worker-node/`)
**Technology**: Go
**Purpose**: Hardware resource management and blockchain interaction

- **Hardware Detection**: Automatic GPU/CPU specification scanning
- **Blockchain Integration**: Solana RPC client for on-chain operations
- **Status Heartbeat**: Regular status updates to maintain resource availability
- **Job Execution**: Containerized workload execution (Docker)

### 3. Marketplace Orchestration (`marketplace-orchestration/`)
**Technology**: TypeScript/Node.js
**Purpose**: Job matching and coordination

- **Dynamic Matching**: Intelligent host selection based on requirements
- **Resource Discovery**: Real-time querying of available compute resources
- **Job Dispatching**: Secure job assignment and monitoring
- **Escrow Management**: Payment coordination and dispute resolution

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Go 1.20+
- Rust & Anchor Framework
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
anchor build
anchor deploy
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
│       └── Cargo.toml          # Rust dependencies
├── host-worker-node/            # Go worker implementation
│   ├── main.go                 # Application entry point
│   ├── go.mod                  # Go module definition
│   └── internal/
│       ├── hardware/           # Hardware detection
│       ├── solana/             # Blockchain client
│       └── types/              # Shared data types
└── marketplace-orchestration/   # TypeScript orchestrator
    └── src/
        ├── index.ts            # Main application
        ├── services/           # External service integrations
        └── match_engine/       # Job matching algorithms
```

## 🔧 Development

### On-Chain Development
```bash
cd on-chain-contracts/programs/on-chain-contracts
anchor test
anchor deploy --provider.cluster devnet
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

### Dynamic Matching
- Multi-criteria optimization
- Real-time availability checking
- Reputation-weighted selection
- Price-performance balancing

### Job Lifecycle
1. **Submission**: Client submits job requirements
2. **Matching**: Orchestrator finds optimal host
3. **Escrow**: Funds locked on-chain
4. **Execution**: Job dispatched to worker
5. **Verification**: Proof-of-work validation
6. **Settlement**: Payment release and reputation update

## 🔒 Security Considerations

- **Key Management**: Secure wallet key storage
- **Transaction Signing**: Hardware security modules recommended
- **Access Control**: PDA-based authorization
- **Slashing Protection**: Reputation and stake-based penalties
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
- Earnings analytics

### Network Health
- Total registered resources
- Active job count
- Network throughput
- Geographic distribution

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

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: [Link to docs]
- **Discord**: [Community server]
- **GitHub Issues**: [Issue tracker]
- **Email**: support@fluxmarketplace.com

---

**Built with ❤️ for the decentralized future**
