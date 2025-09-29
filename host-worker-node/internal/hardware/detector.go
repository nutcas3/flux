package hardware

import (
	"log"
	"runtime"

	"flux-worker-go/internal/types"
)

type Detector struct {
	resourceID uint64
}

func NewDetector(resourceID uint64) *Detector {
	return &Detector{
		resourceID: resourceID,
	}
}

func (d *Detector) DetectSpecs() types.ResourceSpecs {
	log.Println("Starting hardware detection...")

	specs := types.ResourceSpecs{
		ID:            d.resourceID,
		GpuModel:      d.detectGPU(),
		VramGB:        d.detectVRAM(),
		CPUCores:      d.detectCPUCores(),
		ComputeRating: d.calculateComputeRating(),
		PricePerHour:  d.calculatePrice(),
	}

	log.Printf("Hardware detection complete: GPU=%s, VRAM=%dGB, Cores=%d, Rating=%d",
		specs.GpuModel, specs.VramGB, specs.CPUCores, specs.ComputeRating)

	return specs
}

func (d *Detector) detectGPU() string {
	if gpu := detectNVIDIAGPUNVML(); gpu != "" {
		return gpu
	}

	if gpu := detectNVIDIAGPU(); gpu != "" {
		return gpu
	}

	if gpu := detectAMDGPU(); gpu != "" {
		return gpu
	}

	log.Println("No GPU detected, using CPU-only mode")
	return "CPU-Only"
}

func (d *Detector) detectVRAM() uint8 {
	if vram := detectNVIDIAVRAMNVML(); vram > 0 {
		return vram
	}

	if vram := detectNVIDIAVRAM(); vram > 0 {
		return vram
	}

	if vram := detectAMDVRAM(); vram > 0 {
		return vram
	}

	return 0
}

func (d *Detector) detectCPUCores() uint8 {
	cores := min(runtime.NumCPU(), 255)
	log.Printf("Detected %d CPU cores", cores)
	return uint8(cores)
}

func (d *Detector) calculateComputeRating() uint32 {
	baseRating := uint32(d.detectCPUCores()) * 500
	gpuModel := d.detectGPU()
	gpuBonus := getGPUComputeBonus(gpuModel)
	
	totalRating := baseRating + gpuBonus
	log.Printf("Calculated compute rating: %d (CPU: %d + GPU: %d)", totalRating, baseRating, gpuBonus)
	
	return totalRating
}

func getGPUComputeBonus(gpuModel string) uint32 {
	if contains(gpuModel, "H100") {
		return 40000
	}
	if contains(gpuModel, "4090") || contains(gpuModel, "A100") {
		return 30000
	}
	
	if contains(gpuModel, "4080") || contains(gpuModel, "3090") {
		return 20000
	}
	if contains(gpuModel, "4070") || contains(gpuModel, "3080") {
		return 15000
	}
	
	if contains(gpuModel, "4060") || contains(gpuModel, "3070") {
		return 10000
	}
	
	if contains(gpuModel, "MI300") || contains(gpuModel, "MI250") {
		return 35000
	}
	if contains(gpuModel, "7900") {
		return 20000
	}
	
	if gpuModel == "CPU-Only" {
		return 0
	}
	return 8000
}
func (d *Detector) calculatePrice() uint64 {
	rating := d.calculateComputeRating()
	
	basePrice := uint64(5000)
	
	if rating >= 35000 {
		return basePrice + 45000
	} else if rating >= 25000 {
		return basePrice + 35000
	} else if rating >= 15000 {
		return basePrice + 20000
	} else if rating >= 8000 {
		return basePrice + 8000
	}
	
	return basePrice
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || 
		len(s) > len(substr) && (
			s[:len(substr)] == substr || 
			s[len(s)-len(substr):] == substr ||
			findSubstring(s, substr)))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
