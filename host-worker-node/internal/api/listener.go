package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"flux-worker-go/internal/jobprocessor"
	"flux-worker-go/internal/solana"
	"flux-worker-go/internal/types"
)

// Listener handles HTTP API for receiving job dispatches
type Listener struct {
	port      string
	agent     *solana.Agent
	executor  *jobprocessor.Executor
	server    *http.Server
	isRunning bool
	mu        sync.Mutex
}

// NewListener creates a new API listener
func NewListener(port string, agent *solana.Agent, executor *jobprocessor.Executor) *Listener {
	return &Listener{
		port:     port,
		agent:    agent,
		executor: executor,
	}
}

// Start starts the HTTP server
func (l *Listener) Start() error {
	l.mu.Lock()
	if l.isRunning {
		l.mu.Unlock()
		return fmt.Errorf("listener already running")
	}
	l.isRunning = true
	l.mu.Unlock()

	mux := http.NewServeMux()
	mux.HandleFunc("/job", l.handleJobDispatch)
	mux.HandleFunc("/status", l.handleStatus)
	mux.HandleFunc("/health", l.handleHealth)

	l.server = &http.Server{
		Addr:    l.port,
		Handler: mux,
	}

	log.Printf("API listener starting on %s", l.port)
	
	go func() {
		if err := l.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("API listener error: %v", err)
		}
	}()

	return nil
}

// Stop stops the HTTP server
func (l *Listener) Stop() error {
	l.mu.Lock()
	defer l.mu.Unlock()

	if !l.isRunning {
		return fmt.Errorf("listener not running")
	}

	if l.server != nil {
		ctx := context.Background()
		if err := l.server.Shutdown(ctx); err != nil {
			return fmt.Errorf("failed to shutdown server: %w", err)
		}
	}

	l.isRunning = false
	log.Println("API listener stopped")
	return nil
}

// handleJobDispatch handles POST /job requests
func (l *Listener) handleJobDispatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var jobPayload types.JobPayload
	if err := json.NewDecoder(r.Body).Decode(&jobPayload); err != nil {
		log.Printf("Failed to decode job payload: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("Received job dispatch: JobID=%s, Image=%s", jobPayload.JobID, jobPayload.ImageUrl)

	// Update status to Busy
	if err := l.agent.UpdateResourceStatus(types.Busy); err != nil {
		log.Printf("Failed to update status to Busy: %v", err)
		http.Error(w, "Failed to update status", http.StatusInternalServerError)
		return
	}

	// Execute job asynchronously
	go func() {
		defer func() {
			// Update status back to Idle after job completion
			if err := l.agent.UpdateResourceStatus(types.Idle); err != nil {
				log.Printf("Failed to update status to Idle: %v", err)
			}
		}()

		result, err := l.executor.Execute(jobPayload)
		if err != nil {
			log.Printf("Job execution failed: %v", err)
			return
		}

		// Submit result to blockchain
		if err := l.agent.SubmitJobResult(jobPayload.JobID, result.Hash); err != nil {
			log.Printf("Failed to submit job result: %v", err)
			return
		}

		log.Printf("Job completed successfully: JobID=%s", jobPayload.JobID)
	}()

	// Respond immediately
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "accepted",
		"job_id":  jobPayload.JobID,
		"message": "Job dispatched for execution",
	})
}

// handleStatus handles GET /status requests
func (l *Listener) handleStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	status := map[string]interface{}{
		"running":  l.isRunning,
		"executor": l.executor != nil,
		"agent":    l.agent != nil,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// handleHealth handles GET /health requests
func (l *Listener) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
	})
}
