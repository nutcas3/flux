package main

import (
	"flag"
	"log"

	"flux-worker-go/internal/server"
)

func main() {
	log.Println("🚀 Starting Flux Worker Node...")

	config := server.NewConfig()

	flag.Uint64Var(&config.ResourceID, "resource-id", config.ResourceID, "Unique resource ID for this worker")
	flag.StringVar(&config.KeypairPath, "keypair", config.KeypairPath, "Path to Solana keypair file")
	flag.StringVar(&config.RPCEndpoint, "rpc", config.RPCEndpoint, "Solana RPC endpoint")
	flag.StringVar(&config.ProgramID, "program-id", config.ProgramID, "Flux marketplace program ID")
	flag.DurationVar(&config.HealthInterval, "health-interval", config.HealthInterval, "Health check interval")
	flag.DurationVar(&config.HeartbeatInterval, "heartbeat-interval", config.HeartbeatInterval, "Heartbeat interval")
	flag.StringVar(&config.APIPort, "port", config.APIPort, "API server port")
	flag.BoolVar(&config.EnableAttestation, "enable-attestation", config.EnableAttestation, "Enable hardware attestation")

	flag.Parse()

	fluxServer, err := server.NewFluxServer(config)
	if err != nil {
		log.Fatalf("Failed to initialize Flux Server: %v", err)
	}

	if err := fluxServer.Run(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
