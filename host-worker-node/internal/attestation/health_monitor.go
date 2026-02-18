package attestation

import (
	"context"
	"fmt"
	"log"
	"time"
)

type HealthReport struct {
	Timestamp         time.Time
	GPUTemperature    uint8
	GPUUtilization    uint8
	MemoryUtilization uint8
	PowerDraw         uint16
	FanSpeed          uint8
	ClockSpeed        uint32
	ErrorCount        uint32
	IsHealthy         bool
	Warnings          []string
}

type HealthMonitor struct {
	attestor       *GPUAttestor
	interval       time.Duration
	reportChan     chan *HealthReport
	stopChan       chan struct{}
	errorCount     uint32
	lastReport     *HealthReport
}

func NewHealthMonitor(attestor *GPUAttestor, interval time.Duration) *HealthMonitor {
	return &HealthMonitor{
		attestor:   attestor,
		interval:   interval,
		reportChan: make(chan *HealthReport, 100),
		stopChan:   make(chan struct{}),
	}
}

func (hm *HealthMonitor) Start(ctx context.Context) {
	ticker := time.NewTicker(hm.interval)
	defer ticker.Stop()
	
	log.Printf("Health monitor started with interval: %v", hm.interval)
	
	for {
		select {
		case <-ctx.Done():
			log.Println("Health monitor stopped")
			return
		case <-hm.stopChan:
			log.Println("Health monitor stopped")
			return
		case <-ticker.C:
			report, err := hm.collectHealthReport()
			if err != nil {
				log.Printf("Failed to collect health report: %v", err)
				hm.errorCount++
				continue
			}
			
			hm.lastReport = report
			
			select {
			case hm.reportChan <- report:
			default:
				log.Println("Health report channel full, dropping report")
			}
			
			if !report.IsHealthy {
				log.Printf("⚠️  GPU health warning: %v", report.Warnings)
			}
		}
	}
}

func (hm *HealthMonitor) Stop() {
	close(hm.stopChan)
}

func (hm *HealthMonitor) GetReportChannel() <-chan *HealthReport {
	return hm.reportChan
}

func (hm *HealthMonitor) GetLastReport() *HealthReport {
	return hm.lastReport
}

func (hm *HealthMonitor) collectHealthReport() (*HealthReport, error) {
	metrics, err := getCurrentGPUMetrics()
	if err != nil {
		return nil, fmt.Errorf("failed to get GPU metrics: %w", err)
	}
	
	report := &HealthReport{
		Timestamp:         time.Now(),
		GPUTemperature:    metrics.Temperature,
		GPUUtilization:    metrics.Utilization,
		MemoryUtilization: uint8((metrics.MemoryUsed * 100) / hm.attestor.gpuInfo.VRAM),
		PowerDraw:         metrics.PowerDraw,
		FanSpeed:          metrics.FanSpeed,
		ClockSpeed:        metrics.ClockSpeed,
		ErrorCount:        hm.errorCount,
		IsHealthy:         true,
		Warnings:          []string{},
	}
	
	if report.GPUTemperature > 85 {
		report.IsHealthy = false
		report.Warnings = append(report.Warnings, fmt.Sprintf("High temperature: %d°C", report.GPUTemperature))
	}
	
	if report.GPUTemperature > 90 {
		report.Warnings = append(report.Warnings, "CRITICAL: Temperature above 90°C")
	}
	
	if report.MemoryUtilization > 95 {
		report.IsHealthy = false
		report.Warnings = append(report.Warnings, fmt.Sprintf("High memory utilization: %d%%", report.MemoryUtilization))
	}
	
	if report.PowerDraw > 350 {
		report.Warnings = append(report.Warnings, fmt.Sprintf("High power draw: %dW", report.PowerDraw))
	}
	
	if hm.errorCount > 10 {
		report.IsHealthy = false
		report.Warnings = append(report.Warnings, fmt.Sprintf("High error count: %d", hm.errorCount))
	}
	
	return report, nil
}

func (hm *HealthMonitor) ResetErrorCount() {
	hm.errorCount = 0
}

func (hm *HealthMonitor) IncrementErrorCount() {
	hm.errorCount++
}

type HealthReporter interface {
	ReportHealth(report *HealthReport) error
}

type SolanaHealthReporter struct {
	programID string
	rpcURL    string
}

func NewSolanaHealthReporter(programID, rpcURL string) *SolanaHealthReporter {
	return &SolanaHealthReporter{
		programID: programID,
		rpcURL:    rpcURL,
	}
}

func (r *SolanaHealthReporter) ReportHealth(report *HealthReport) error {
	log.Printf("Reporting health to Solana: temp=%d°C, util=%d%%, healthy=%v",
		report.GPUTemperature, report.GPUUtilization, report.IsHealthy)
	
	return nil
}

func (hm *HealthMonitor) StartReporting(ctx context.Context, reporter HealthReporter) {
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case report := <-hm.reportChan:
				if err := reporter.ReportHealth(report); err != nil {
					log.Printf("Failed to report health: %v", err)
					hm.IncrementErrorCount()
				}
			}
		}
	}()
}
