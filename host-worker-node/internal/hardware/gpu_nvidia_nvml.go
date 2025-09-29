package hardware

import (
	"log"
	"github.com/NVIDIA/go-nvml/pkg/nvml"
)

// detectNVIDIAGPUNVML detects NVIDIA GPU using NVML bindings
func detectNVIDIAGPUNVML() string {
	ret := nvml.Init()
	if ret != nvml.SUCCESS {
		log.Printf("Failed to initialize NVML: %v", nvml.ErrorString(ret))
		return ""
	}
	defer nvml.Shutdown()

	count, ret := nvml.DeviceGetCount()
	if ret != nvml.SUCCESS || count == 0 {
		return ""
	}

	device, ret := nvml.DeviceGetHandleByIndex(0)
	if ret != nvml.SUCCESS {
		return ""
	}

	name, ret := device.GetName()
	if ret != nvml.SUCCESS {
		return ""
	}

	log.Printf("Detected NVIDIA GPU via NVML: %s", name)
	return name
}

// detectNVIDIAVRAMNVML detects NVIDIA VRAM using NVML bindings
func detectNVIDIAVRAMNVML() uint8 {
	ret := nvml.Init()
	if ret != nvml.SUCCESS {
		return 0
	}
	defer nvml.Shutdown()

	count, ret := nvml.DeviceGetCount()
	if ret != nvml.SUCCESS || count == 0 {
		return 0
	}

	device, ret := nvml.DeviceGetHandleByIndex(0)
	if ret != nvml.SUCCESS {
		return 0
	}

	memory, ret := device.GetMemoryInfo()
	if ret != nvml.SUCCESS {
		return 0
	}

	vramGB := uint8(memory.Total / (1024 * 1024 * 1024))
	log.Printf("Detected NVIDIA VRAM via NVML: %d GB", vramGB)
	return vramGB
}

// GetNVIDIAUtilizationNVML gets GPU utilization via NVML
func GetNVIDIAUtilizationNVML() int {
	ret := nvml.Init()
	if ret != nvml.SUCCESS {
		return 0
	}
	defer nvml.Shutdown()

	device, ret := nvml.DeviceGetHandleByIndex(0)
	if ret != nvml.SUCCESS {
		return 0
	}

	utilization, ret := device.GetUtilizationRates()
	if ret != nvml.SUCCESS {
		return 0
	}

	return int(utilization.Gpu)
}

// GetNVIDIATemperatureNVML gets GPU temperature via NVML
func GetNVIDIATemperatureNVML() int {
	ret := nvml.Init()
	if ret != nvml.SUCCESS {
		return 0
	}
	defer nvml.Shutdown()

	device, ret := nvml.DeviceGetHandleByIndex(0)
	if ret != nvml.SUCCESS {
		return 0
	}

	temp, ret := device.GetTemperature(nvml.TEMPERATURE_GPU)
	if ret != nvml.SUCCESS {
		return 0
	}

	return int(temp)
}

// GetNVIDIAPowerUsageNVML gets GPU power usage via NVML
func GetNVIDIAPowerUsageNVML() int {
	ret := nvml.Init()
	if ret != nvml.SUCCESS {
		return 0
	}
	defer nvml.Shutdown()

	device, ret := nvml.DeviceGetHandleByIndex(0)
	if ret != nvml.SUCCESS {
		return 0
	}

	power, ret := device.GetPowerUsage()
	if ret != nvml.SUCCESS {
		return 0
	}

	return int(power / 1000) // Convert milliwatts to watts
}
