package solana

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"flux-worker-go/internal/types"
)

// Agent handles all communication and transaction signing with the Solana network.
type Agent struct {
	HostPublicKey string // The host's wallet address (Public Key)
	HostKeypair []byte   // The private key used for signing transactions
	ClusterURL string   // Solana RPC endpoint
	ProgramID string     // Flux Marketplace Program ID
}

// NewAgent initializes the Solana Agent by loading the host's private key.
func NewAgent(keyPath string) (*Agent, error) {
	// In a real application, the key would be securely loaded.
	keypair, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read host keypair at %s: %w", keyPath, err)
	}

	// MOCK: Deriving the public key from the keypair is complex in a single go file.
	// We'll use a placeholder for the host's public key for display purposes.
	mockPK := "WorkerNodeHostWalletPublicKey11111111111111111111"

	return &Agent{
		HostPublicKey: mockPK,
		HostKeypair:   keypair, // In production, never store this in plain text
		ClusterURL:    "https://api.devnet.solana.com",
		ProgramID:     "FLUXc5wA22u74Y64e1YjP1c137452d371d374f3747f4",
	}, nil
}

// RegisterResource sends a signed transaction to the Solana program to create a ResourceAccount.
func (a *Agent) RegisterResource(specs types.ResourceSpecs) error {
	log.Printf("--- Submitting Resource Registration TX ---")
	
	// This function requires complex steps:
	// 1. Finding the Program Derived Address (PDA) for the ResourceAccount.
	// 2. Serializing the 'register_resource' instruction data (including Anchor discriminator and specs).
	// 3. Building a full Solana transaction with the necessary accounts (Host, Resource PDA, SystemProgram).
	// 4. Signing the transaction with a.HostKeypair.
	// 5. Sending the transaction via RPC to a.ClusterURL.
	
	// MOCK IMPLEMENTATION: We simulate the success of the RPC call.
	
	// Example of the data structure that would be serialized for the instruction:
	payload := map[string]interface{}{
		"instruction": "register_resource",
		"host": a.HostPublicKey,
		"specs": specs,
	}
	payloadBytes, _ := json.MarshalIndent(payload, "", "  ")

	log.Printf("Successfully signed and sent registration transaction for Host: %s", a.HostPublicKey)
	fmt.Printf("Serialized Payload (MOCK): \n%s\n", string(payloadBytes))
	log.Printf("--- Registration TX Completed ---")

	// MOCK return success
	return nil
}

// UpdateResourceStatus sends a signed transaction to update the resource's status (Idle/Busy/Offline).
func (a *Agent) UpdateResourceStatus(status types.ResourceStatus) error {
	// This function would use the 'update_resource_status' instruction.
	// It is crucial for heartbeats and responding to job assignments.
	
	// MOCK IMPLEMENTATION: Simulate success.
	fmt.Printf("Updating status to %s via Solana RPC at %s... (MOCK OK)\n", types.StatusToString(status), a.ClusterURL)
	return nil
}

// --- Future Functions ---
// func (a *Agent) SubmitProofOfComputation(proof types.Proof) error {...}
