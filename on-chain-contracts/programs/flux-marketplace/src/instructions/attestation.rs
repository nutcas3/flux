use anchor_lang::prelude::*;
use sha3::{Digest, Sha3_256};
use crate::state::*;
use crate::constants::*;
use crate::errors::FluxError;

#[derive(Accounts)]
pub struct SubmitHardwareAttestation<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [PROVIDER_SEED, authority.key().as_ref()],
        bump = provider.bump,
        constraint = provider.authority == authority.key()
    )]
    pub provider: Account<'info, Provider>,
    
    #[account(
        init,
        payer = authority,
        space = HardwareAttestation::MAX_SIZE,
        seeds = [ATTESTATION_SEED, provider.key().as_ref()],
        bump
    )]
    pub attestation: Account<'info, HardwareAttestation>,
    
    pub system_program: Program<'info, System>,
}

pub fn submit_hardware_attestation(
    ctx: Context<SubmitHardwareAttestation>,
    device_fingerprint: [u8; 32],
    driver_version: String,
) -> Result<()> {
    let attestation = &mut ctx.accounts.attestation;
    let clock = Clock::get()?;
    
    attestation.provider = ctx.accounts.provider.key();
    attestation.device_fingerprint = device_fingerprint;
    attestation.driver_version = driver_version;
    attestation.attestation_timestamp = clock.unix_timestamp;
    attestation.verification_status = VerificationStatus::Pending;
    attestation.benchmark_score = 0;
    attestation.last_verification = clock.unix_timestamp;
    attestation.bump = ctx.bumps.attestation;
    
    msg!("Hardware attestation submitted for provider: {}", ctx.accounts.provider.key());
    
    Ok(())
}

#[derive(Accounts)]
pub struct IssueBenchmarkChallenge<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: Provider account being challenged
    pub provider: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = authority,
        space = BenchmarkChallenge::MAX_SIZE,
        seeds = [CHALLENGE_SEED, provider.key().as_ref()],
        bump
    )]
    pub challenge: Account<'info, BenchmarkChallenge>,
    
    pub system_program: Program<'info, System>,
}

pub fn issue_benchmark_challenge(
    ctx: Context<IssueBenchmarkChallenge>,
    challenge_type: u8,
    input_data: Vec<u8>,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    let clock = Clock::get()?;
    
    let challenge_type_enum = match challenge_type {
        0 => ChallengeType::MatrixMultiplication,
        1 => ChallengeType::SHA256Hashing,
        2 => ChallengeType::FloatingPointOps,
        3 => ChallengeType::MemoryBandwidth,
        4 => ChallengeType::TensorComputation,
        _ => return Err(FluxError::InvalidInputData.into()),
    };
    
    let mut hasher = Sha3_256::new();
    hasher.update(&input_data);
    let input_hash: [u8; 32] = hasher.finalize().into();
    
    hasher = Sha3_256::new();
    hasher.update(&input_data);
    hasher.update(b"expected_result");
    let expected_hash: [u8; 32] = hasher.finalize().into();
    
    challenge.provider = ctx.accounts.provider.key();
    challenge.challenge_id = clock.unix_timestamp as u64;
    challenge.challenge_type = challenge_type_enum;
    challenge.input_data_hash = input_hash;
    challenge.expected_result_hash = expected_hash;
    challenge.max_execution_time_ms = challenge_type_enum.max_execution_time_ms();
    challenge.issued_at = clock.unix_timestamp;
    challenge.expires_at = clock.unix_timestamp + CHALLENGE_EXPIRY_SECONDS;
    challenge.completed = false;
    challenge.bump = ctx.bumps.challenge;
    
    msg!("Benchmark challenge issued to provider: {}", ctx.accounts.provider.key());
    
    Ok(())
}

#[derive(Accounts)]
pub struct SubmitBenchmarkResult<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [PROVIDER_SEED, authority.key().as_ref()],
        bump = provider.bump,
        constraint = provider.authority == authority.key()
    )]
    pub provider: Account<'info, Provider>,
    
    #[account(
        mut,
        seeds = [CHALLENGE_SEED, provider.key().as_ref()],
        bump = challenge.bump,
        constraint = !challenge.completed @ FluxError::InvalidInputData
    )]
    pub challenge: Account<'info, BenchmarkChallenge>,
    
    #[account(
        mut,
        seeds = [ATTESTATION_SEED, provider.key().as_ref()],
        bump = attestation.bump
    )]
    pub attestation: Account<'info, HardwareAttestation>,
}

pub fn submit_benchmark_result(
    ctx: Context<SubmitBenchmarkResult>,
    result_hash: [u8; 32],
    execution_time_ms: u64,
    gpu_utilization: u8,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    let attestation = &mut ctx.accounts.attestation;
    let provider = &mut ctx.accounts.provider;
    let clock = Clock::get()?;
    
    require!(
        clock.unix_timestamp <= challenge.expires_at,
        FluxError::ChallengeExpired
    );
    
    require!(
        result_hash == challenge.expected_result_hash,
        FluxError::BenchmarkVerificationFailed
    );
    
    require!(
        execution_time_ms <= challenge.max_execution_time_ms,
        FluxError::ExecutionTimeExceeded
    );
    
    let time_score = (challenge.max_execution_time_ms * 1000) / execution_time_ms;
    let efficiency_score = (gpu_utilization as u64 * 10);
    let benchmark_score = time_score + efficiency_score;
    
    challenge.completed = true;
    attestation.benchmark_score = benchmark_score;
    attestation.verification_status = VerificationStatus::Verified;
    attestation.last_verification = clock.unix_timestamp;
    provider.status = ProviderStatus::Active;
    
    msg!("Benchmark verified, score: {}", benchmark_score);
    
    Ok(())
}
