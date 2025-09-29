package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"flux-worker-go/internal/api"
	"flux-worker-go/internal/hardware"
	"flux-worker-go/internal/jobprocessor"
	"flux-worker-go/internal/solana"
	"flux-worker-go/internal/types"
)

// Main application loop for the Flux Host Worker Node.
func main() {
	// 1. Load Configuration and Host Key
	hostKeyPath := "./config/host_identity.json"
	solanaAgent, err := solana.NewAgent(hostKeyPath)
	if err != nil {
		log.Fatalf("Failed to initialize Solana Agent: %v", err)
	}

	// 2. Initial Hardware Scan using Detector
	detector := hardware.NewDetector(123456789) // Resource ID
	specs := detector.DetectSpecs()
	fmt.Printf("Detected Specs: GPU=%s, VRAM=%dGB, Cores=%d, Rating=%d\n", 
		specs.GpuModel, specs.VramGB, specs.CPUCores, specs.ComputeRating)

	// 3. Register Resource on Solana
	err = solanaAgent.RegisterResource(specs)
	if err != nil {
		log.Printf("Warning: Failed to register/verify resource on Solana: %v", err)
	} else {
		log.Println("Resource successfully registered and verified on-chain.")
	}

	// 4. Start Job Executor and API Listener
	executor := jobprocessor.NewExecutor()
	listener := api.NewListener(":8080", solanaAgent, executor)
	
	if err := listener.Start(); err != nil {
		log.Fatalf("Failed to start API listener: %v", err)
	}
	defer listener.Stop()

	// 5. Start Status Heartbeat Loop
	ticker := time.NewTicker(30 * time.Second)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	log.Println("Worker Node running. API listening on :8080")
	log.Println("Sending resource status heartbeat every 30 seconds.")

	for {
		select {
		case <-ticker.C:
			currentStatus := types.Idle
			err = solanaAgent.UpdateResourceStatus(currentStatus)
			if err != nil {
				log.Printf("Heartbeat failed: Could not update status to Solana: %v", err)
			} else {
				log.Printf("Status heartbeat sent: %s", types.StatusToString(currentStatus))
			}

		case s := <-quit:
			log.Printf("Caught signal %v. Setting status to Offline...", s)
			solanaAgent.UpdateResourceStatus(types.Offline)
			ticker.Stop()
			return
		}
	}
}
