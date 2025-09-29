package hardware

import (
	"log"
	"strings"
)

// detectAMDGPU detects AMD GPU model using rocm-smi
func detectAMDGPU() string {
	output, err := execCommand("rocm-smi", "--showproductname")
	if err != nil {
		log.Printf("AMD GPU detection failed: %v", err)
		return ""
	}

	// Parse rocm-smi output
	lines := strings.SplitSeq(output, "\n")
	for line := range lines {
		if strings.Contains(line, "Card series:") || strings.Contains(line, "Card model:") {
			parts := strings.Split(line, ":")
			if len(parts) > 1 {
				gpuName := strings.TrimSpace(parts[1])
				log.Printf("Detected AMD GPU: %s", gpuName)
				return gpuName
			}
		}
	}

	return ""
}

// detectAMDVRAM detects AMD GPU VRAM in GB
func detectAMDVRAM() uint8 {
	output, err := execCommand("rocm-smi", "--showmeminfo", "vram")
	if err != nil {
		log.Printf("AMD VRAM detection failed: %v", err)
		return 0
	}

	// Parse VRAM from output
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, "Total Memory") {
			// Extract memory size (usually in MB)
			parts := strings.Fields(line)
			for i, part := range parts {
				if strings.Contains(part, "MB") || strings.Contains(part, "GB") {
					if i > 0 {
						vramMB := parseInt(parts[i-1])
						if vramMB > 0 {
							vramGB := uint8(vramMB / 1024)
							if strings.Contains(part, "GB") {
								vramGB = uint8(vramMB)
							}
							log.Printf("Detected AMD VRAM: %d GB", vramGB)
							return vramGB
						}
					}
				}
			}
		}
	}

	return 0
}

// getAMDUtilization gets current GPU utilization percentage
func getAMDUtilization() int {
	output, err := execCommand("rocm-smi", "--showuse")
	if err != nil {
		return 0
	}

	// Parse utilization from output
	lines := strings.SplitSeq(output, "\n")
	for line := range lines {
		if strings.Contains(line, "GPU use") {
			parts := strings.Fields(line)
			for _, part := range parts {
				if strings.Contains(part, "%") {
					util := parseInt(strings.TrimSuffix(part, "%"))
					return util
				}
			}
		}
	}

	return 0
}

// getAMDTemperature gets current GPU temperature in Celsius
func getAMDTemperature() int {
	output, err := execCommand("rocm-smi", "--showtemp")
	if err != nil {
		return 0
	}

	// Parse temperature from output
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, "Temperature") {
			parts := strings.Fields(line)
			for _, part := range parts {
				if strings.Contains(part, "C") || strings.Contains(part, "°") {
					temp := parseInt(strings.TrimSuffix(strings.TrimSuffix(part, "C"), "°"))
					return temp
				}
			}
		}
	}

	return 0
}

// getAMDPowerUsage gets current power usage in watts
func getAMDPowerUsage() int {
	output, err := execCommand("rocm-smi", "--showpower")
	if err != nil {
		return 0
	}

	// Parse power from output
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, "Average Graphics Package Power") {
			parts := strings.Fields(line)
			for _, part := range parts {
				if strings.Contains(part, "W") {
					power := parseInt(strings.TrimSuffix(part, "W"))
					return power
				}
			}
		}
	}

	return 0
}
