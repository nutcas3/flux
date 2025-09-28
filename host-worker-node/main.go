package main

import (
    "fmt"
    "log"
    "os"
    "os/signal"
    "syscall"
    "time"

    "flux-worker-go/internal/hardware"
    "flux-worker-go/internal/solana"
    "flux-worker-go/internal/types"
)

// Main application loop for the Flux Host Worker Node.
func main() {
    // 1. Load Configuration and Host Key
    // In a real app, config would load from a file/environment variables.
    hostKeyPath := "./config/host_identity.json"
    solanaAgent, err := solana.NewAgent(hostKeyPath)
    if err != nil {
        log.Fatalf("Failed to initialize Solana Agent: %v", err)
    }

    // 2. Initial Hardware Scan
    specs := hardware.GetHardwareSpecs()
    fmt.Printf("Detected Specs: GPU=%s, VRAM=%dGB, Cores=%d\n", specs.GpuModel, specs.VramGB, specs.CPUCores)
    
    // 3. Register Resource on Solana
    // This is the CRITICAL DePIN onboarding step.
    err = solanaAgent.RegisterResource(specs)
    if err != nil {
        log.Printf("Warning: Failed to register/verify resource on Solana: %v", err)
        // We continue, assuming registration might happen manually later, but warn the user.
    } else {
        log.Println("Resource successfully registered and verified on-chain.")
    }

    // 4. Start Status Heartbeat Loop
    ticker := time.NewTicker(30 * time.Second)
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

    log.Println("Worker Node running. Sending resource status heartbeat every 30 seconds.")

    for {
        select {
        case <-ticker.C:
            // In a production system, this would check if a job is running via the API Listener
            currentStatus := types.Idle // Mocking idle status
            err = solanaAgent.UpdateResourceStatus(currentStatus)
            if err != nil {
                log.Printf("Heartbeat failed: Could not update status to Solana: %v", err)
            } else {
                log.Printf("Status heartbeat sent: %s", types.StatusToString(currentStatus))
            }
        
        case s := <-quit:
            // 5. Cleanup: Set status to Offline upon shutdown
            log.Printf("Caught signal %v. Setting status to Offline...", s)
            solanaAgent.UpdateResourceStatus(types.Offline) 
            ticker.Stop()
            return
        }
    }
}
