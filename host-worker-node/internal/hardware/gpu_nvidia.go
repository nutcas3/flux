package hardware

import (
	"log"
	"strings"
)

// detectNVIDIAGPU detects NVIDIA GPU model using nvidia-smi
func detectNVIDIAGPU() string {
	output, err := execCommand("nvidia-smi", "--query-gpu=name", "--format=csv,noheader")
	if err != nil {
		log.Printf("NVIDIA GPU detection failed: %v", err)
		return ""
	}

	gpuName := strings.TrimSpace(output)
	if gpuName != "" {
		log.Printf("Detected NVIDIA GPU: %s", gpuName)
		return gpuName
	}

	return ""
}

// detectNVIDIAVRAM detects NVIDIA GPU VRAM in GB
func detectNVIDIAVRAM() uint8 {
	output, err := execCommand("nvidia-smi", "--query-gpu=memory.total", "--format=csv,noheader,nounits")
	if err != nil {
		log.Printf("NVIDIA VRAM detection failed: %v", err)
		return 0
	}

	// Parse VRAM in MB and convert to GB
	vramMB := parseInt(strings.TrimSpace(output))
	if vramMB > 0 {
		vramGB := uint8(vramMB / 1024)
		log.Printf("Detected NVIDIA VRAM: %d GB", vramGB)
		return vramGB
	}

	return 0
}

// getNVIDIAUtilization gets current GPU utilization percentage
func getNVIDIAUtilization() int {
	output, err := execCommand("nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits")
	if err != nil {
		return 0
	}

	util := parseInt(strings.TrimSpace(output))
	return util
}

// getNVIDIATemperature gets current GPU temperature in Celsius
func getNVIDIATemperature() int {
	output, err := execCommand("nvidia-smi", "--query-gpu=temperature.gpu", "--format=csv,noheader")
	if err != nil {
		return 0
	}

	temp := parseInt(strings.TrimSpace(output))
	return temp
}

// getNVIDIAPowerUsage gets current power usage in watts
func getNVIDIAPowerUsage() int {
	output, err := execCommand("nvidia-smi", "--query-gpu=power.draw", "--format=csv,noheader,nounits")
	if err != nil {
		return 0
	}

	power := parseInt(strings.TrimSpace(output))
	return power
}
