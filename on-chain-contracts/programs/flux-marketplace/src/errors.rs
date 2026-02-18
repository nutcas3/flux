use anchor_lang::prelude::*;

#[error_code]
pub enum FluxError {
    #[msg("Insufficient stake for selected SLA tier")]
    InsufficientStake,
    
    #[msg("Insufficient available stake for job")]
    InsufficientAvailableStake,
    
    #[msg("Challenge has expired")]
    ChallengeExpired,
    
    #[msg("Benchmark result verification failed")]
    BenchmarkVerificationFailed,
    
    #[msg("Execution time exceeded maximum")]
    ExecutionTimeExceeded,
    
    #[msg("SLA not violated, cannot slash")]
    SLANotViolated,
    
    #[msg("Job SLA is not active")]
    JobSLANotActive,
    
    #[msg("Uptime requirement not met")]
    UptimeRequirementNotMet,
    
    #[msg("Provider not verified")]
    ProviderNotVerified,
    
    #[msg("Job not in correct status")]
    InvalidJobStatus,
    
    #[msg("Escrow not in correct status")]
    InvalidEscrowStatus,
    
    #[msg("Auction has expired")]
    AuctionExpired,
    
    #[msg("Auction not active")]
    AuctionNotActive,
    
    #[msg("Price exceeds maximum")]
    PriceExceedsMaximum,
    
    #[msg("Invalid proof provided")]
    InvalidProof,
    
    #[msg("Job deadline exceeded")]
    DeadlineExceeded,
    
    #[msg("Unauthorized action")]
    Unauthorized,
    
    #[msg("Invalid tier selection")]
    InvalidTier,
    
    #[msg("Reputation tier requirement not met")]
    ReputationTierNotMet,
    
    #[msg("Badge already awarded")]
    BadgeAlreadyAwarded,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Invalid input data")]
    InvalidInputData,
}
