# FLUX Marketplace - Decentralized GPU Power

**Forged in Code. Driven by Solana.**

A sophisticated DePIN (Decentralized Physical Infrastructure Network) for high-performance GPU compute resources, featuring a premium user experience and enterprise-grade infrastructure.

## Project Vision

FLUX creates a decentralized network where GPU owners monetize idle hardware while clients access affordable, scalable computing resources for AI/ML workloads, rendering, and scientific computing. Our platform combines the transparency of blockchain with the elegance of modern web design.

## Architecture

The system consists of four interconnected components:

### 1. **On-Chain Contracts** (Solana/Rust)
Smart contracts managing the marketplace infrastructure:
- Resource registration and discovery
- Job lifecycle management  
- Escrow-based payment system
- Reputation and staking mechanisms
- SLA enforcement with automatic slashing

### 2. **Host Worker Node** (Go)
Runs on GPU provider machines:
- Automatic hardware detection (NVIDIA/AMD)
- Cryptographic hardware attestation
- Job execution in isolated containers
- Real-time status reporting
- Proof-of-work submission with benchmark challenges

### 3. **Marketplace Orchestration** (TypeScript/Node.js)
Central coordination service:
- Intelligent job-to-host matching
- Oracle-based reputation scoring
- Payment coordination with Blockradar integration
- Network monitoring and health checks
- Multi-currency support (SOL/USDC/Fiat)

### 4. **Frontend Client** (Next.js 14 + React)
Premium user interface with sophisticated design:
- Modern marketplace with real-time GPU listings
- Provider command center with SLA staking
- Client dashboard with fleet management
- Transaction flows with cryptographic verification
- **FLUX Color Palette**: White, Champagne, Daring, Befitting, Magentleman, Ebizome Purple, Seal Brown

## Key Features

- **Zero Trust, Total Certainty**: Cryptographic hardware attestation
- **Instant Deployment**: One-click GPU rentals with Solana speed
- **Fair Market Pricing**: Dynamic pricing based on supply/demand
- **SLA Guaranteed**: Staking-based service level agreements
- **Multi-Currency**: SOL, USDC, and fiat payment options
- **Premium UX**: Sophisticated design system optimized for conversion
- **Global Access**: Decentralized network with worldwide GPU availability

## How It Works

1. **Providers** register GPU resources with cryptographic attestation
2. **Clients** browse marketplace and select optimal hardware
3. **Smart Contracts** lock funds in escrow with SLA guarantees
4. **Orchestrator** matches jobs to verified providers
5. **Execution** happens on provider's hardware with monitoring
6. **Verification** ensures work completion and SLA compliance
7. **Settlement** releases payment with reputation updates
8. **Reputation** system builds trust through performance history

## Technology Stack

### Blockchain Layer
- **Solana**: High-speed, low-cost transactions
- **Anchor/Pinocchio**: Smart contract framework
- **@solana/kit**: Modern client SDK
- **Wallet Standard**: Multi-wallet compatibility

### Backend Services
- **Go**: High-performance worker nodes
- **TypeScript/Node.js**: Orchestration and APIs
- **Docker**: Containerized job execution
- **NVML/ROCm**: GPU hardware detection

### Frontend Experience
- **Next.js 14**: App Router with React 18
- **TailwindCSS**: Utility-first styling
- **shadcn/ui**: Premium component library
- **Lucide React**: Modern icon system
- **@solana/react-hooks**: Wallet integration

### Infrastructure
- **NVIDIA/AMD GPU Support**: Broad hardware compatibility
- **Blockradar**: Fiat payment processing
- **Oracle Networks**: Real-time reputation scoring
- **IPFS**: Decentralized storage for job data

## Design System

**FLUX Color Palette:**
- **White** (#FFFFFF): Primary backgrounds
- **Champagne** (#E8D1AB): Subtle accents and borders
- **Daring** (#DC694F): Primary CTAs and actions
- **Befitting** (#994D6F): Secondary elements
- **Magentleman** (#A926B6): Tech highlights and Solana branding
- **Ebizome Purple** (#6B2850): Deep backgrounds and premium sections
- **Seal Brown** (#331018): Primary typography and navigation

**Typography & UX:**
- Massive hero typography (8xl on desktop)
- High-contrast text for readability
- Smooth hover transitions and micro-interactions
- Conversion-optimized transaction flows
- Mobile-first responsive design

## Use Cases

### AI/ML Workloads
- Large language model training
- Computer vision and image processing
- Natural language processing
- Reinforcement learning

### Creative & Technical
- 3D rendering and animation
- Video processing and encoding
- Scientific simulations
- Data analysis and visualization

### Enterprise Solutions
- Batch processing pipelines
- High-performance computing
- Research and development
- Prototyping and testing

## Network Benefits

**For GPU Providers:**
- **Monetize Idle Hardware**: Turn unused GPUs into revenue
- **Flexible Participation**: Set your own availability and pricing
- **Reputation-Based Earnings**: Higher reputation = premium rates
- **SLA Protection**: Fair dispute resolution with escrow

**For Compute Clients:**
- **Cost-Effective Access**: Up to 42% savings vs. centralized cloud
- **No Long-Term Commitments**: Pay-per-use with no contracts
- **Global Resource Pool**: Access GPUs worldwide
- **Enterprise-Grade SLAs**: Guaranteed performance with staking

## Security & Trust

- **Cryptographic Attestation**: Hardware verification with zero-knowledge proofs
- **Escrow System**: Funds locked until job completion verification
- **SLA Staking**: Providers stake tokens for service guarantees
- **Reputation System**: Oracle-backed performance tracking
- **Automatic Slashing**: Penalties for SLA violations
- **Multi-Sig Protection**: Enhanced security for large transactions

## Repository Structure

```
flux/
├── on-chain-contracts/          # Solana smart contracts (Rust)
├── host-worker-node/            # GPU provider software (Go)
├── marketplace-orchestration/   # Coordination service (TypeScript)
├── frontend-client/             # Premium web interface (Next.js)
├── marketing-website/           # Landing page templates
└── docs/                       # Technical documentation
```

## Project Status

### **Phase 1: Core Infrastructure** (Complete)
- Smart contracts with escrow and SLA enforcement
- Worker node with hardware attestation
- Orchestration service with job matching
- Basic frontend implementation

### **Phase 2: Premium Frontend** (Complete)
- Sophisticated landing page with FLUX design system
- Client dashboard with "Command Center" UI
- Provider dashboard with SLA staking interface
- Transaction flow with cryptographic verification
- Marketplace with real-time GPU listings

### **Phase 3: Production Deployment** (In Progress)
- Mainnet deployment on Solana
- Advanced monitoring and analytics
- Mobile app development
- Enterprise features and APIs

### **Phase 4: Ecosystem Expansion** (Planned)
- Multi-chain support
- Advanced AI/ML tooling
- Research partnerships
- Global GPU network expansion

## Quick Start

### For Clients
1. Visit the marketplace at `http://localhost:3000`
2. Connect your Solana wallet
3. Browse available GPUs and select your requirements
4. Complete the 4-step transaction flow
5. Access your rented GPU via SSH/API

### For Providers
1. Run the host worker node on your GPU machine
2. Complete hardware attestation and registration
3. Set your pricing and SLA tier
4. Start earning from compute jobs
5. Monitor performance via provider dashboard

### For Developers
```bash
# Start frontend
cd frontend-client && npm run dev

# Start worker node  
cd host-worker-node && go run main.go

# Start orchestration
cd marketplace-orchestration && npm start
```

## Contributing

We welcome contributions! Each component has detailed setup instructions:

- **Smart Contracts**: See `on-chain-contracts/README.md`
- **Worker Nodes**: See `host-worker-node/README.md`  
- **Orchestration**: See `marketplace-orchestration/README.md`
- **Frontend**: See `frontend-client/README.md`

## License

MIT License - See LICENSE file for details

## Support & Community

- **Documentation**: Comprehensive guides in `/docs`
- **Issues**: GitHub issue tracker for bug reports
- **Discord**: [Community chat and support]
- **Twitter**: [@FluxGPU] for updates and announcements

---

**Decentralized GPU Power. Forged in Code. Driven by Solana.** 

