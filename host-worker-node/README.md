# Flux Host Worker Node

Go-based worker node for the Flux Marketplace that manages compute resources, executes jobs, and interacts with Solana blockchain.

## 🏗️ Overview

The Host Worker Node is responsible for:
- Detecting and registering hardware specifications
- Maintaining resource status on-chain
- Receiving and executing compute jobs
- Submitting job results to the blockchain
- Managing reputation through staking

## 🚀 Quick Start

### Prerequisites
- Go 1.20+
- Docker (for job execution)
- Solana wallet with SOL for transactions

### Installation
```bash
cd host-worker-node
go mod tidy
```

### Configuration
Create a configuration file at `./config/host_identity.json`:
```json
{
  "keypair_path": "/path/to/solana/keypair.json",
  "rpc_url": "https://api.devnet.solana.com",
  "program_id": "YourProgramIDHere"
}
```

### Run
```bash
go run main.go
```

## 📁 Project Structure

```
host-worker-node/
├── main.go                     # Application entry point
├── go.mod                      # Go module definition
└── internal/
    ├── hardware/               # Hardware detection
    │   ├── detector.go         # GPU/CPU specs scanning
    │   ├── gpu_nvidia.go       # NVIDIA GPU detection
    │   └── gpu_amd.go          # AMD GPU detection
    ├── solana/                 # Blockchain client
    │   └── agent.go            # Solana RPC interactions
    ├── types/                  # Data structures
    │   └── types.go            # Shared types (matches Rust)
    ├── api/                    # HTTP API listener
    │   └── listener.go         # Job dispatch endpoint
    └── jobprocessor/           # Job execution
        ├── executor.go         # Docker job runner
        └── result.go           # Result submission
```

## 🔧 Core Components

### Hardware Detection
Automatically detects system specifications:
```go
specs := hardware.GetHardwareSpecs()
// Returns: GPU model, VRAM, CPU cores, compute rating
```

Supported GPUs:
- NVIDIA (via nvidia-smi)
- AMD (via rocm-smi)
- Fallback for unknown hardware

### Solana Agent
Manages blockchain interactions:
```go
agent, err := solana.NewAgent(hostKeyPath)

// Register resource on-chain
err = agent.RegisterResource(specs)

// Update status (Idle, Busy, Offline)
err = agent.UpdateResourceStatus(types.Idle)

// Submit job result
err = agent.SubmitJobResult(jobID, resultHash)
```

### Job Processor
Executes containerized workloads:
```go
executor := jobprocessor.NewExecutor()

// Run Docker container with job
result, err := executor.Execute(jobPayload)

// Submit result to blockchain
agent.SubmitJobResult(result.JobID, result.Hash)
```

### API Listener
HTTP endpoint for receiving jobs from orchestrator:
```go
listener := api.NewListener(":8080", agent, executor)
listener.Start()

// POST /job - Receive job dispatch
// GET /status - Health check
```

## 📊 Data Types

### ResourceSpecs
```go
type ResourceSpecs struct {
    ID            uint64 `json:"id"`
    GpuModel      string `json:"gpu_model"`
    VramGB        uint8  `json:"vram_gb"`
    CPUCores      uint8  `json:"cpu_cores"`
    ComputeRating uint32 `json:"compute_rating"`
    PricePerHour  uint64 `json:"price_per_hour"`
}
```

### ResourceStatus
```go
const (
    Idle    ResourceStatus = 0  // Available for jobs
    Busy    ResourceStatus = 1  // Executing job
    Offline ResourceStatus = 2  // Not available
)
```

### JobPayload
```go
type JobPayload struct {
    JobID      string `json:"job_id"`
    ImageUrl   string `json:"image_url"`   // Docker image
    InputData  string `json:"input_data"`  // S3/IPFS URL
    TimeoutSec int    `json:"timeout_sec"` // Max execution time
}
```

## 🔄 Operational Flow

### 1. Startup
```
1. Load configuration
2. Initialize Solana agent
3. Detect hardware specs
4. Register resource on-chain
5. Start status heartbeat (every 30s)
6. Start API listener
```

### 2. Job Execution
```
1. Receive job via HTTP POST /job
2. Update status to Busy
3. Pull Docker image
4. Execute container with input data
5. Capture output and generate result hash
6. Submit result to blockchain
7. Update status to Idle
```

### 3. Shutdown
```
1. Catch SIGINT/SIGTERM
2. Update status to Offline
3. Stop heartbeat
4. Graceful shutdown
```

## 🔒 Security

### Key Management
- Store Solana keypair securely
- Use environment variables for sensitive data
- Never commit private keys to version control

### Docker Isolation
- Jobs run in isolated containers
- Resource limits enforced (CPU, memory)
- Network isolation for untrusted workloads

### Transaction Signing
- All blockchain transactions signed locally
- Private key never leaves the host

## 📈 Monitoring

### Logs
```bash
# View logs
go run main.go 2>&1 | tee worker.log

# Filter errors
grep "ERROR" worker.log
```

### Metrics
- Resource utilization (CPU, GPU, memory)
- Job completion rate
- Earnings tracking
- Reputation score

### Health Check
```bash
curl http://localhost:8080/status
```

## 🧪 Testing

### Unit Tests
```bash
go test ./...
```

### Integration Tests
```bash
go test -tags=integration ./...
```

### Manual Testing
```bash
# Test hardware detection
go run main.go --test-hardware

# Test Solana connection
go run main.go --test-solana
```

## 🔧 Configuration Options

### Environment Variables
```bash
export SOLANA_RPC_URL="https://api.devnet.solana.com"
export PROGRAM_ID="YourProgramID"
export HOST_KEYPAIR_PATH="./config/keypair.json"
export API_PORT="8080"
export HEARTBEAT_INTERVAL="30s"
```

### Command Line Flags
```bash
go run main.go \
  --config ./config/host_identity.json \
  --port 8080 \
  --heartbeat 30s \
  --log-level debug
```

## 🐛 Troubleshooting

### GPU Not Detected
- Ensure NVIDIA/AMD drivers installed
- Check `nvidia-smi` or `rocm-smi` works
- Verify GPU is not in use by another process

### Blockchain Connection Failed
- Check RPC URL is correct
- Verify network connectivity
- Ensure sufficient SOL for transactions

### Job Execution Failed
- Check Docker is running
- Verify image exists and is accessible
- Review container logs for errors

## 📦 Dependencies

```go
require (
    github.com/gagliardetto/solana-go v1.8.0
    github.com/docker/docker v24.0.0
    github.com/gorilla/mux v1.8.0
)
```

## 🚀 Deployment

### Systemd Service
```ini
[Unit]
Description=Flux Worker Node
After=network.target

[Service]
Type=simple
User=flux
WorkingDirectory=/opt/flux-worker
ExecStart=/usr/local/bin/flux-worker
Restart=always

[Install]
WantedBy=multi-user.target
```

### Docker Deployment
```dockerfile
FROM golang:1.20-alpine
WORKDIR /app
COPY . .
RUN go build -o flux-worker main.go
CMD ["./flux-worker"]
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
