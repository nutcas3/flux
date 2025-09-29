package solana

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"flux-worker-go/internal/types"
)

// Agent handles all communication and transaction signing with the Solana network.
type Agent struct {
	HostPublicKey string // The host's wallet address (Public Key)
	HostKeypair []byte   // The private key used for signing transactions
	ClusterURL string   // Solana RPC endpoint
	ProgramID string     // Flux Marketplace Program ID
	BlockradarAPIKey string // API key for Blockradar
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

	apiKey := os.Getenv("BLOCKRADAR_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("BLOCKRADAR_API_KEY not set")
	}

	return &Agent{
		HostPublicKey: mockPK,
		HostKeypair: keypair,
		ClusterURL: "https://api.mainnet-beta.solana.com", // Example
		ProgramID: "C9xzMFbaR39ftisYXsnbELsPpxgsMeeLW5fVH4fSVNiR", // Your program ID
		BlockradarAPIKey: apiKey,
	}, nil
}

// ProcessStablecoinPayment initiates a stablecoin payment via Blockradar APIs.
func (a *Agent) ProcessStablecoinPayment(jobID string, amount float64, recipientAddress string, stablecoin string) error {
	// Prepare request payload
	payload := map[string]interface{}{
		"job_id": jobID,
		"amount": amount,
		"recipient": recipientAddress,
		"stablecoin": stablecoin, // e.g., "USDC", "USDT"
		"sender": a.HostPublicKey,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Make POST request to Blockradar payment endpoint
	req, err := http.NewRequest("POST", "https://api.blockradar.com/v1/payments", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer " + a.BlockradarAPIKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("payment request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Blockradar API error: %s", string(body))
	}

	// Parse response (e.g., transaction ID)
	var response map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return fmt.Errorf("failed to decode response: %w", err)
	}

	log.Printf("Payment initiated: %v", response)
	// Optionally, store transaction ID for status checks
	return nil
}

// CheckPaymentStatus queries the status of a stablecoin payment.
func (a *Agent) CheckPaymentStatus(transactionID string) (string, error) {
	url := fmt.Sprintf("https://api.blockradar.com/v1/payments/%s", transactionID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer " + a.BlockradarAPIKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("status check failed: %w", err)
	}
	defer resp.Body.Close()

	var response map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	status, ok := response["status"].(string)
	if !ok {
		return "", fmt.Errorf("invalid response format")
	}

	return status, nil
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
