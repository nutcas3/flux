package attestation

import (
	"crypto/sha256"
	"fmt"
	"math"
	"math/rand"
	"time"
)

type ChallengeType uint8

const (
	MatrixMultiplication ChallengeType = iota
	SHA256Hashing
	FloatingPointOps
	MemoryBandwidth
	TensorComputation
)

type BenchmarkChallenge struct {
	ChallengeID   uint64
	ChallengeType ChallengeType
	InputData     []byte
	ExpectedHash  [32]byte
	MaxTimeMs     uint64
}

type BenchmarkResult struct {
	ChallengeID     uint64
	ResultHash      [32]byte
	ExecutionTimeMs uint64
	GPUUtilization  uint8
	MemoryUsedMB    uint32
	Temperature     uint8
	PowerDraw       uint16
}

type Benchmarker struct {
	attestor *GPUAttestor
}

func NewBenchmarker(attestor *GPUAttestor) *Benchmarker {
	return &Benchmarker{
		attestor: attestor,
	}
}

func (b *Benchmarker) RunBenchmark(challenge *BenchmarkChallenge) (*BenchmarkResult, error) {
	startTime := time.Now()

	var resultHash [32]byte
	var err error

	switch challenge.ChallengeType {
	case MatrixMultiplication:
		resultHash, err = b.runMatrixBenchmark(challenge.InputData)
	case SHA256Hashing:
		resultHash, err = b.runHashBenchmark(challenge.InputData)
	case FloatingPointOps:
		resultHash, err = b.runFloatBenchmark(challenge.InputData)
	case MemoryBandwidth:
		resultHash, err = b.runMemoryBenchmark(challenge.InputData)
	case TensorComputation:
		resultHash, err = b.runTensorBenchmark(challenge.InputData)
	default:
		return nil, fmt.Errorf("unknown challenge type: %d", challenge.ChallengeType)
	}

	if err != nil {
		return nil, fmt.Errorf("benchmark failed: %w", err)
	}

	executionTime := uint64(time.Since(startTime).Milliseconds())

	if executionTime > challenge.MaxTimeMs {
		return nil, fmt.Errorf("execution time %dms exceeded maximum %dms", executionTime, challenge.MaxTimeMs)
	}

	metrics, err := getCurrentGPUMetrics()
	if err != nil {
		return nil, fmt.Errorf("failed to get GPU metrics: %w", err)
	}

	return &BenchmarkResult{
		ChallengeID:     challenge.ChallengeID,
		ResultHash:      resultHash,
		ExecutionTimeMs: executionTime,
		GPUUtilization:  metrics.Utilization,
		MemoryUsedMB:    metrics.MemoryUsed,
		Temperature:     metrics.Temperature,
		PowerDraw:       metrics.PowerDraw,
	}, nil
}

func (b *Benchmarker) runMatrixBenchmark(inputData []byte) ([32]byte, error) {
	size := 512
	if len(inputData) > 0 {
		size = int(inputData[0]) * 4
	}

	matrixA := make([][]float64, size)
	matrixB := make([][]float64, size)
	result := make([][]float64, size)

	for i := 0; i < size; i++ {
		matrixA[i] = make([]float64, size)
		matrixB[i] = make([]float64, size)
		result[i] = make([]float64, size)
		for j := 0; j < size; j++ {
			matrixA[i][j] = rand.Float64()
			matrixB[i][j] = rand.Float64()
		}
	}

	for i := 0; i < size; i++ {
		for j := 0; j < size; j++ {
			sum := 0.0
			for k := 0; k < size; k++ {
				sum += matrixA[i][k] * matrixB[k][j]
			}
			result[i][j] = sum
		}
	}

	hasher := sha256.New()
	for i := 0; i < size; i++ {
		for j := 0; j < size; j++ {
			hasher.Write(fmt.Appendf(nil, "%f", result[i][j]))
		}
	}

	var hash [32]byte
	copy(hash[:], hasher.Sum(nil))
	return hash, nil
}

func (b *Benchmarker) runHashBenchmark(inputData []byte) ([32]byte, error) {
	iterations := 1000000
	if len(inputData) > 0 {
		iterations = int(inputData[0]) * 10000
	}

	var hash [32]byte
	data := make([]byte, 64)
	copy(data, inputData)

	for i := 0; i < iterations; i++ {
		hash = sha256.Sum256(data)
		copy(data, hash[:])
	}

	return hash, nil
}

func (b *Benchmarker) runFloatBenchmark(inputData []byte) ([32]byte, error) {
	iterations := 10000000
	if len(inputData) > 0 {
		iterations = int(inputData[0]) * 100000
	}

	result := 0.0
	for i := 0; i < iterations; i++ {
		result += math.Sin(float64(i)) * math.Cos(float64(i))
		result = math.Sqrt(math.Abs(result))
	}

	hasher := sha256.New()
	hasher.Write(fmt.Appendf(nil, "%f", result))

	var hash [32]byte
	copy(hash[:], hasher.Sum(nil))
	return hash, nil
}

func (b *Benchmarker) runMemoryBenchmark(inputData []byte) ([32]byte, error) {
	size := 100 * 1024 * 1024
	if len(inputData) > 0 {
		size = int(inputData[0]) * 1024 * 1024
	}

	data := make([]byte, size)
	for i := range data {
		data[i] = byte(i % 256)
	}

	sum := uint64(0)
	for i := range data {
		sum += uint64(data[i])
	}

	hasher := sha256.New()
	hasher.Write(fmt.Appendf(nil, "%d", sum))

	var hash [32]byte
	copy(hash[:], hasher.Sum(nil))
	return hash, nil
}

func (b *Benchmarker) runTensorBenchmark(inputData []byte) ([32]byte, error) {
	batchSize := 32
	inputSize := 784
	hiddenSize := 256
	outputSize := 10

	if len(inputData) > 0 {
		batchSize = int(inputData[0])
	}

	input := make([][]float64, batchSize)
	for i := 0; i < batchSize; i++ {
		input[i] = make([]float64, inputSize)
		for j := range inputSize {
			input[i][j] = rand.Float64()
		}
	}

	w1 := make([][]float64, inputSize)
	for i := range inputSize {
		w1[i] = make([]float64, hiddenSize)
		for j := range hiddenSize {
			w1[i][j] = rand.Float64()
		}
	}

	w2 := make([][]float64, hiddenSize)
	for i := range hiddenSize {
		w2[i] = make([]float64, outputSize)
		for j := range outputSize {
			w2[i][j] = rand.Float64()
		}
	}

	hidden := matmul(input, w1)
	for i := range hidden {
		for j := range hidden[i] {
			hidden[i][j] = math.Max(0, hidden[i][j])
		}
	}

	output := matmul(hidden, w2)

	hasher := sha256.New()
	for i := range output {
		for j := range output[i] {
			hasher.Write(fmt.Appendf(nil, "%f", output[i][j]))
		}
	}

	var hash [32]byte
	copy(hash[:], hasher.Sum(nil))
	return hash, nil
}

func matmul(a, b [][]float64) [][]float64 {
	rows := len(a)
	cols := len(b[0])
	inner := len(b)

	result := make([][]float64, rows)
	for i := range rows {
		result[i] = make([]float64, cols)
		for j := range cols {
			sum := 0.0
			for k := range inner {
				sum += a[i][k] * b[k][j]
			}
			result[i][j] = sum
		}
	}

	return result
}
