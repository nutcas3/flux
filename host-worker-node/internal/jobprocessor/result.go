package jobprocessor

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

// JobResult represents the result of a job execution
type JobResult struct {
	JobID       string
	Success     bool
	Output      string
	Hash        [32]byte
	Duration    time.Duration
	Error       error
	CompletedAt time.Time
}

// NewJobResult creates a new job result
func NewJobResult(jobID string, output string, err error, duration time.Duration) *JobResult {
	result := &JobResult{
		JobID:       jobID,
		Success:     err == nil,
		Output:      output,
		Duration:    duration,
		Error:       err,
		CompletedAt: time.Now(),
	}

	// Generate result hash
	result.Hash = result.generateHash()

	return result
}

// generateHash generates a SHA-256 hash of the job result
func (r *JobResult) generateHash() [32]byte {
	data := fmt.Sprintf("%s:%s:%t:%d",
		r.JobID,
		r.Output,
		r.Success,
		r.CompletedAt.Unix(),
	)

	return sha256.Sum256([]byte(data))
}

// HashString returns the hash as a hex string
func (r *JobResult) HashString() string {
	return hex.EncodeToString(r.Hash[:])
}

// IsValid checks if the result is valid
func (r *JobResult) IsValid() bool {
	return r.Success && r.Error == nil && len(r.Output) > 0
}

// String returns a string representation of the result
func (r *JobResult) String() string {
	status := "SUCCESS"
	if !r.Success {
		status = "FAILED"
	}

	return fmt.Sprintf("JobResult{ID=%s, Status=%s, Duration=%v, Hash=%s}",
		r.JobID,
		status,
		r.Duration,
		r.HashString()[:16]+"...",
	)
}
