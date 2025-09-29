package jobprocessor

import (
	"context"
	"fmt"
	"log"
	"time"

	"flux-worker-go/internal/types"
)

// Executor handles job execution in Docker containers
type Executor struct {
	maxConcurrent int
	timeout       time.Duration
}

// NewExecutor creates a new job executor
func NewExecutor() *Executor {
	return &Executor{
		maxConcurrent: 1, // Execute one job at a time
		timeout:       30 * time.Minute,
	}
}

// Execute executes a job and returns the result
func (e *Executor) Execute(job types.JobPayload) (*JobResult, error) {
	log.Printf("Starting job execution: JobID=%s", job.JobID)
	startTime := time.Now()

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(job.TimeoutSec)*time.Second)
	defer cancel()

	// Simulate job execution (in production, this would run Docker container)
	output, err := e.executeJob(ctx, job)
	duration := time.Since(startTime)

	if err != nil {
		log.Printf("Job execution failed: JobID=%s, Error=%v", job.JobID, err)
		return NewJobResult(job.JobID, "", err, duration), err
	}

	log.Printf("Job execution completed: JobID=%s, Duration=%v", job.JobID, duration)
	return NewJobResult(job.JobID, output, nil, duration), nil
}

// executeJob executes the actual job logic
func (e *Executor) executeJob(ctx context.Context, job types.JobPayload) (string, error) {
	// TODO: Implement Docker container execution
	// For now, simulate job execution
	select {
	case <-ctx.Done():
		return "", fmt.Errorf("job execution timeout")
	case <-time.After(2 * time.Second):
		// Simulate successful execution
		output := fmt.Sprintf("Job %s completed successfully with image %s", job.JobID, job.ImageUrl)
		return output, nil
	}
}
