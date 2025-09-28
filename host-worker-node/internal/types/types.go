package types

// ResourceSpecs must match the data types in the Rust `ResourceSpecs` struct precisely.
type ResourceSpecs struct {
    ID            uint64 `json:"id"` 
    GpuModel      string `json:"gpu_model"` 
    VramGB        uint8  `json:"vram_gb"` 
    CPUCores      uint8  `json:"cpu_cores"` 
    ComputeRating uint32 `json:"compute_rating"` 
    PricePerHour  uint64 `json:"price_per_hour"` 
}

// ResourceStatus must match the Rust `ResourceStatus` enum order.
type ResourceStatus uint8

const (
    Idle ResourceStatus = iota // 0
    Busy                       // 1
    Offline                    // 2
    Suspended                  // 3
)

// StatusToString converts the enum value to a readable string for logging.
func StatusToString(status ResourceStatus) string {
    switch status {
    case Idle:
        return "Idle"
    case Busy:
        return "Busy"
    case Offline:
        return "Offline"
    case Suspended:
        return "Suspended"
    default:
        return "Unknown"
    }
}

// JobPayload represents the data received from the Orchestrator for a compute job.
type JobPayload struct {
    JobID      string `json:"job_id"`
    ImageUrl   string `json:"image_url"`  // Docker image containing the workload
    InputData  string `json:"input_data"`
    TimeoutSec int    `json:"timeout_sec"`
}
