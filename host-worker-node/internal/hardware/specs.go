package hardware

import (
    "log"
    "math/rand"
    "time"

    "flux-worker-go/internal/types"
)

// GetHardwareSpecs Mocks reading static hardware specifications from the host machine.
// In a real application, this would use libraries like goprocinfo or NVIDIA's NVML bindings.
func GetHardwareSpecs() types.ResourceSpecs {
    // Create a new random source with current time seed
    r := rand.New(rand.NewSource(time.Now().UnixNano()))
    
    // Simulate detection of a random high-end GPU for variability
    gpuModels := []string{"RTX 4080", "A100 Tensor", "H100 Hopper", "RTX 3090"}
    selectedModel := gpuModels[r.Intn(len(gpuModels))]

    specs := types.ResourceSpecs{
        // This must match the ID used in the Rust program's PDA seeds.
        ID:            123456789, 
        GpuModel:      selectedModel,
        VramGB:        uint8(32 + r.Intn(48)), // Simulating 32GB to 80GB VRAM
        CPUCores:      uint8(16 + r.Intn(32)),
        // MOCK: Compute rating would be derived from a benchmark test.
        ComputeRating: uint32(20000 + r.Intn(20000)), 
        // MOCK: Price is set locally by the Host, in $FLUX token base units.
        PricePerHour:  uint64(5000 + r.Intn(10000)), // 0.005 to 0.015 FLUX
    }

    log.Println("Hardware scanning complete.")
    return specs
}
