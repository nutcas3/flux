package attestation

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os/exec"
	"strings"
	"time"
)

type GPUInfo struct {
	Model             string
	VRAM              uint32
	PCIeID            string
	UUID              string
	DriverVersion     string
	ComputeCapability string
	DeviceFingerprint [32]byte
}

type AttestationProof struct {
	Nonce           uint64
	ResultHash      [32]byte
	ExecutionTimeMs uint64
	GPUUtilization  uint8
	MemoryUsedMB    uint32
	Temperature     uint8
	PowerDraw       uint16
}

type GPUAttestor struct {
	gpuInfo *GPUInfo
}

func NewGPUAttestor() (*GPUAttestor, error) {
	info, err := DetectNvidiaGPU()
	if err != nil {
		return nil, fmt.Errorf("failed to detect GPU: %w", err)
	}

	return &GPUAttestor{
		gpuInfo: info,
	}, nil
}

func DetectNvidiaGPU() (*GPUInfo, error) {
	cmd := exec.Command("nvidia-smi",
		"--query-gpu=name,memory.total,pci.bus_id,uuid,driver_version,compute_cap",
		"--format=csv,noheader")

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("nvidia-smi failed: %w", err)
	}

	fields := strings.Split(strings.TrimSpace(string(output)), ",")
	if len(fields) < 6 {
		return nil, fmt.Errorf("unexpected nvidia-smi output")
	}

	info := &GPUInfo{
		Model:             strings.TrimSpace(fields[0]),
		VRAM:              parseVRAM(fields[1]),
		PCIeID:            strings.TrimSpace(fields[2]),
		UUID:              strings.TrimSpace(fields[3]),
		DriverVersion:     strings.TrimSpace(fields[4]),
		ComputeCapability: strings.TrimSpace(fields[5]),
	}

	info.DeviceFingerprint = generateFingerprint(info)

	return info, nil
}

func generateFingerprint(info *GPUInfo) [32]byte {
	data := fmt.Sprintf("%s:%s:%s:%d",
		info.Model,
		info.UUID,
		info.PCIeID,
		info.VRAM)

	return sha256.Sum256([]byte(data))
}

func (a *GPUAttestor) GetGPUInfo() *GPUInfo {
	return a.gpuInfo
}

func (a *GPUAttestor) GetDeviceFingerprint() [32]byte {
	return a.gpuInfo.DeviceFingerprint
}

func (a *GPUAttestor) SolveChallenge(challengeSeed [32]byte, difficulty uint32) (*AttestationProof, error) {
	startTime := time.Now()

	var nonce uint64
	for {
		hash := computeHash(challengeSeed, nonce)
		if countLeadingZeros(hash) >= int(difficulty) {
			executionTime := uint64(time.Since(startTime).Milliseconds())

			metrics, err := getCurrentGPUMetrics()
			if err != nil {
				return nil, fmt.Errorf("failed to get GPU metrics: %w", err)
			}

			return &AttestationProof{
				Nonce:           nonce,
				ResultHash:      hash,
				ExecutionTimeMs: executionTime,
				GPUUtilization:  metrics.Utilization,
				MemoryUsedMB:    metrics.MemoryUsed,
				Temperature:     metrics.Temperature,
				PowerDraw:       metrics.PowerDraw,
			}, nil
		}
		nonce++

		if nonce%1000000 == 0 && time.Since(startTime) > 30*time.Second {
			return nil, fmt.Errorf("challenge timeout after %d iterations", nonce)
		}
	}
}

func computeHash(seed [32]byte, nonce uint64) [32]byte {
	data := append(seed[:], uint64ToBytes(nonce)...)
	return sha256.Sum256(data)
}

func countLeadingZeros(hash [32]byte) int {
	count := 0
	for _, b := range hash {
		if b == 0 {
			count += 8
		} else {
			for i := 7; i >= 0; i-- {
				if (b>>i)&1 == 0 {
					count++
				} else {
					return count
				}
			}
			break
		}
	}
	return count
}

func uint64ToBytes(n uint64) []byte {
	b := make([]byte, 8)
	for i := range 8 {
		b[i] = byte(n >> (i * 8))
	}
	return b
}

type GPUMetrics struct {
	Utilization uint8
	MemoryUsed  uint32
	Temperature uint8
	PowerDraw   uint16
	FanSpeed    uint8
	ClockSpeed  uint32
}

func getCurrentGPUMetrics() (*GPUMetrics, error) {
	cmd := exec.Command("nvidia-smi",
		"--query-gpu=utilization.gpu,memory.used,temperature.gpu,power.draw,fan.speed,clocks.current.graphics",
		"--format=csv,noheader,nounits")

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("nvidia-smi metrics failed: %w", err)
	}

	fields := strings.Split(strings.TrimSpace(string(output)), ",")
	if len(fields) < 6 {
		return nil, fmt.Errorf("unexpected nvidia-smi metrics output")
	}

	return &GPUMetrics{
		Utilization: parseUint8(fields[0]),
		MemoryUsed:  parseUint32(fields[1]),
		Temperature: parseUint8(fields[2]),
		PowerDraw:   parseUint16(fields[3]),
		FanSpeed:    parseUint8(fields[4]),
		ClockSpeed:  parseUint32(fields[5]),
	}, nil
}

func parseVRAM(vramStr string) uint32 {
	var vram uint32
	fmt.Sscanf(strings.TrimSpace(vramStr), "%d", &vram)
	return vram
}

func parseUint8(s string) uint8 {
	var val uint8
	fmt.Sscanf(strings.TrimSpace(s), "%d", &val)
	return val
}

func parseUint16(s string) uint16 {
	var val uint16
	fmt.Sscanf(strings.TrimSpace(s), "%f", &val)
	return val
}

func parseUint32(s string) uint32 {
	var val uint32
	fmt.Sscanf(strings.TrimSpace(s), "%d", &val)
	return val
}

func (a *GPUAttestor) GetFingerprintHex() string {
	return hex.EncodeToString(a.gpuInfo.DeviceFingerprint[:])
}
