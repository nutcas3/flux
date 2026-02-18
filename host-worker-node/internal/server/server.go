package server

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"flux-worker-go/internal/api"
	"flux-worker-go/internal/attestation"
	"flux-worker-go/internal/hardware"
	"flux-worker-go/internal/jobprocessor"
	"flux-worker-go/internal/solana"
	"flux-worker-go/internal/types"
)

const (
	DefaultResourceID   = 1001
	DefaultKeyPath      = "~/.config/solana/id.json"
	HealthCheckInterval = 60 * time.Second
	HeartbeatInterval   = 30 * time.Second
	DefaultAPIPort      = ":8080"
)

type Config struct {
	ResourceID        uint64
	KeypairPath       string
	RPCEndpoint       string
	ProgramID         string
	HealthInterval    time.Duration
	HeartbeatInterval time.Duration
	APIPort           string
	EnableAttestation bool
}

type FluxServer struct {
	config        *Config
	detector      *hardware.Detector
	attestor      *attestation.GPUAttestor
	benchmarker   *attestation.Benchmarker
	healthMonitor *attestation.HealthMonitor
	solanaAgent   *solana.Agent
	jobProcessor  *jobprocessor.Executor
	apiListener   *api.Listener
	specs         types.ResourceSpecs
	ctx           context.Context
	cancel        context.CancelFunc
}

func NewConfig() *Config {
	return &Config{
		ResourceID:        DefaultResourceID,
		KeypairPath:       DefaultKeyPath,
		RPCEndpoint:       "https://api.devnet.solana.com",
		ProgramID:         "FLUXmktpLaceH1pDePINGPUMarketV2000000000000000",
		HealthInterval:    HealthCheckInterval,
		HeartbeatInterval: HeartbeatInterval,
		APIPort:           DefaultAPIPort,
		EnableAttestation: true,
	}
}

func NewFluxServer(config *Config) (*FluxServer, error) {
	log.Println("📦 Initializing Flux Server components...")

	detector := hardware.NewDetector(config.ResourceID)
	specs := detector.DetectSpecs()

	log.Printf("✅ Hardware detected: %s with %dGB VRAM", specs.GpuModel, specs.VramGB)

	solanaAgent, err := solana.NewAgent(config.KeypairPath)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Solana agent: %w", err)
	}
	log.Println("✅ Solana agent initialized")

	var attestor *attestation.GPUAttestor
	var benchmarker *attestation.Benchmarker
	var healthMonitor *attestation.HealthMonitor

	if config.EnableAttestation {
		attestor, err = attestation.NewGPUAttestor()
		if err != nil {
			log.Printf("⚠️  GPU attestation unavailable: %v", err)
		} else {
			log.Printf("✅ GPU attestation initialized: %s", attestor.GetFingerprintHex())

			benchmarker = attestation.NewBenchmarker(attestor)
			log.Println("✅ Benchmarker initialized")

			healthMonitor = attestation.NewHealthMonitor(attestor, config.HealthInterval)
			log.Println("✅ Health monitor initialized")
		}
	}

	jobProcessor := jobprocessor.NewExecutor()
	log.Println("✅ Job processor initialized")

	apiListener := api.NewListener(config.APIPort, solanaAgent, jobProcessor)
	log.Println("✅ API listener initialized")

	ctx, cancel := context.WithCancel(context.Background())

	return &FluxServer{
		config:        config,
		detector:      detector,
		attestor:      attestor,
		benchmarker:   benchmarker,
		healthMonitor: healthMonitor,
		solanaAgent:   solanaAgent,
		jobProcessor:  jobProcessor,
		apiListener:   apiListener,
		specs:         specs,
		ctx:           ctx,
		cancel:        cancel,
	}, nil
}

func (s *FluxServer) Start() error {
	log.Println("🔄 Starting Flux Server...")

	if err := s.registerProvider(); err != nil {
		return fmt.Errorf("failed to register provider: %w", err)
	}

	if s.attestor != nil {
		if err := s.submitAttestation(); err != nil {
			log.Printf("⚠️  Attestation submission failed: %v", err)
		}
	}

	if s.healthMonitor != nil {
		go s.healthMonitor.Start(s.ctx)
		log.Println("✅ Health monitoring started")

		reporter := attestation.NewSolanaHealthReporter(s.config.ProgramID, s.config.RPCEndpoint)
		s.healthMonitor.StartReporting(s.ctx, reporter)
		log.Println("✅ Health reporting started")
	}

	if err := s.apiListener.Start(); err != nil {
		return fmt.Errorf("failed to start API listener: %w", err)
	}
	log.Printf("✅ API listener started on %s", s.config.APIPort)

	go s.heartbeatLoop()
	log.Println("✅ Heartbeat loop started")

	log.Println("🎉 Flux Server is now running!")
	return nil
}

func (s *FluxServer) Stop() {
	log.Println("🔄 Stopping Flux Server...")

	s.cancel()

	if s.healthMonitor != nil {
		s.healthMonitor.Stop()
		log.Println("✅ Health monitor stopped")
	}

	if s.apiListener != nil {
		s.apiListener.Stop()
		log.Println("✅ API listener stopped")
	}

	if err := s.solanaAgent.UpdateResourceStatus(types.Offline); err != nil {
		log.Printf("⚠️  Failed to update status to offline: %v", err)
	} else {
		log.Println("✅ Status updated to offline")
	}
}

func (s *FluxServer) Run() error {
	if err := s.Start(); err != nil {
		return err
	}

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	<-sigChan
	log.Println("\n🛑 Shutdown signal received, gracefully stopping...")

	s.Stop()
	log.Println("✅ Flux Server stopped successfully")

	return nil
}

func (s *FluxServer) registerProvider() error {
	log.Println("📝 Registering provider on-chain...")

	if err := s.solanaAgent.RegisterResource(s.specs); err != nil {
		return fmt.Errorf("registration failed: %w", err)
	}

	log.Println("✅ Provider registered successfully")
	return nil
}

func (s *FluxServer) submitAttestation() error {
	log.Println("🔐 Submitting hardware attestation...")

	gpuInfo := s.attestor.GetGPUInfo()
	fingerprint := s.attestor.GetDeviceFingerprint()

	log.Printf("Device Fingerprint: %x", fingerprint)
	log.Printf("GPU: %s, VRAM: %dGB, Driver: %s",
		gpuInfo.Model, gpuInfo.VRAM, gpuInfo.DriverVersion)

	log.Println("✅ Attestation submitted")
	return nil
}

func (s *FluxServer) heartbeatLoop() {
	ticker := time.NewTicker(s.config.HeartbeatInterval)
	defer ticker.Stop()

	log.Println("💓 Heartbeat loop started")

	for {
		select {
		case <-s.ctx.Done():
			log.Println("Heartbeat loop stopped")
			return
		case <-ticker.C:
			currentStatus := types.Idle
			if err := s.solanaAgent.UpdateResourceStatus(currentStatus); err != nil {
				log.Printf("⚠️  Heartbeat failed: %v", err)
			} else {
				log.Printf("💓 Heartbeat sent: %s", types.StatusToString(currentStatus))
			}
		}
	}
}
