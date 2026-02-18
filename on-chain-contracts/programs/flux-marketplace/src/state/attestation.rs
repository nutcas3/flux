use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct HardwareAttestation {
    pub provider: Pubkey,
    pub device_fingerprint: [u8; 32],
    pub driver_version: String,
    pub attestation_timestamp: i64,
    pub verification_status: VerificationStatus,
    pub benchmark_score: u64,
    pub last_verification: i64,
    pub bump: u8,
}

impl HardwareAttestation {
    pub const MAX_SIZE: usize = 8 + // discriminator
        32 + // provider
        32 + // device_fingerprint
        4 + 30 + // driver_version
        8 + // attestation_timestamp
        1 + // verification_status
        8 + // benchmark_score
        8 + // last_verification
        1; // bump
}

#[account]
#[derive(Default)]
pub struct BenchmarkChallenge {
    pub provider: Pubkey,
    pub challenge_id: u64,
    pub challenge_type: ChallengeType,
    pub input_data_hash: [u8; 32],
    pub expected_result_hash: [u8; 32],
    pub max_execution_time_ms: u64,
    pub issued_at: i64,
    pub expires_at: i64,
    pub completed: bool,
    pub bump: u8,
}

impl BenchmarkChallenge {
    pub const MAX_SIZE: usize = 8 + // discriminator
        32 + // provider
        8 + // challenge_id
        1 + // challenge_type
        32 + // input_data_hash
        32 + // expected_result_hash
        8 + // max_execution_time_ms
        8 + // issued_at
        8 + // expires_at
        1 + // completed
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq)]
pub enum VerificationStatus {
    #[default]
    Pending,
    Verified,
    Failed,
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq)]
pub enum ChallengeType {
    #[default]
    MatrixMultiplication,
    SHA256Hashing,
    FloatingPointOps,
    MemoryBandwidth,
    TensorComputation,
}

impl ChallengeType {
    pub fn max_execution_time_ms(&self) -> u64 {
        match self {
            ChallengeType::MatrixMultiplication => 5000,
            ChallengeType::SHA256Hashing => 2000,
            ChallengeType::FloatingPointOps => 3000,
            ChallengeType::MemoryBandwidth => 1000,
            ChallengeType::TensorComputation => 10000,
        }
    }
}
