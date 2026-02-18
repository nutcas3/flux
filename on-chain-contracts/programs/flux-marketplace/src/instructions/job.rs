use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::FluxError;

#[derive(Accounts)]
pub struct CreateJob<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    
    #[account(
        init,
        payer = client,
        space = Job::MAX_SIZE,
        seeds = [JOB_SEED, &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub job: Account<'info, Job>,
    
    #[account(
        seeds = [MARKET_STATE_SEED],
        bump = market_state.bump
    )]
    pub market_state: Account<'info, MarketState>,
    
    pub system_program: Program<'info, System>,
}

pub fn create_job(
    ctx: Context<CreateJob>,
    gpu_requirements: String,
    duration_hours: u32,
    max_price: u64,
) -> Result<()> {
    let job = &mut ctx.accounts.job;
    let market_state = &ctx.accounts.market_state;
    let clock = Clock::get()?;
    
    let current_price = market_state.current_price();
    require!(current_price <= max_price, FluxError::PriceExceedsMaximum);
    
    job.job_id = clock.unix_timestamp as u64;
    job.client = ctx.accounts.client.key();
    job.provider = Pubkey::default();
    job.gpu_requirements = gpu_requirements;
    job.duration_hours = duration_hours;
    job.max_price = max_price;
    job.actual_price = current_price;
    job.status = JobStatus::Pending;
    job.created_at = clock.unix_timestamp;
    job.started_at = 0;
    job.completed_at = 0;
    job.deadline = clock.unix_timestamp + (duration_hours as i64 * SECONDS_PER_HOUR);
    job.result_hash = [0; 32];
    job.proof_hash = [0; 32];
    job.bump = ctx.bumps.job;
    
    msg!("Job created: id={}, price={}, duration={}h", 
        job.job_id, current_price, duration_hours);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct AssignJobToProvider<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [JOB_SEED, &job_id.to_le_bytes()],
        bump = job.bump,
        constraint = job.status == JobStatus::Pending @ FluxError::InvalidJobStatus
    )]
    pub job: Account<'info, Job>,
    
    #[account(
        seeds = [PROVIDER_SEED, provider.authority.as_ref()],
        bump = provider.bump,
        constraint = provider.status == ProviderStatus::Active @ FluxError::ProviderNotVerified
    )]
    pub provider: Account<'info, Provider>,
}

pub fn assign_job_to_provider(
    ctx: Context<AssignJobToProvider>,
    _job_id: u64,
) -> Result<()> {
    let job = &mut ctx.accounts.job;
    
    job.provider = ctx.accounts.provider.key();
    job.status = JobStatus::Assigned;
    
    msg!("Job {} assigned to provider {}", job.job_id, job.provider);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct StartJobExecution<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [JOB_SEED, &job_id.to_le_bytes()],
        bump = job.bump,
        constraint = job.status == JobStatus::Assigned @ FluxError::InvalidJobStatus
    )]
    pub job: Account<'info, Job>,
    
    #[account(
        seeds = [PROVIDER_SEED, authority.key().as_ref()],
        bump = provider.bump,
        constraint = provider.authority == authority.key(),
        constraint = provider.key() == job.provider @ FluxError::Unauthorized
    )]
    pub provider: Account<'info, Provider>,
}

pub fn start_job_execution(
    ctx: Context<StartJobExecution>,
    _job_id: u64,
) -> Result<()> {
    let job = &mut ctx.accounts.job;
    let clock = Clock::get()?;
    
    job.status = JobStatus::Active;
    job.started_at = clock.unix_timestamp;
    
    msg!("Job {} execution started", job.job_id);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct SubmitJobResult<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [JOB_SEED, &job_id.to_le_bytes()],
        bump = job.bump,
        constraint = job.status == JobStatus::Active @ FluxError::InvalidJobStatus
    )]
    pub job: Account<'info, Job>,
    
    #[account(
        seeds = [PROVIDER_SEED, authority.key().as_ref()],
        bump = provider.bump,
        constraint = provider.authority == authority.key(),
        constraint = provider.key() == job.provider @ FluxError::Unauthorized
    )]
    pub provider: Account<'info, Provider>,
}

pub fn submit_job_result(
    ctx: Context<SubmitJobResult>,
    _job_id: u64,
    result_hash: [u8; 32],
    proof: Vec<u8>,
) -> Result<()> {
    let job = &mut ctx.accounts.job;
    let clock = Clock::get()?;
    
    require!(clock.unix_timestamp <= job.deadline, FluxError::DeadlineExceeded);
    
    use sha3::{Digest, Sha3_256};
    let mut hasher = Sha3_256::new();
    hasher.update(&proof);
    let proof_hash: [u8; 32] = hasher.finalize().into();
    
    job.result_hash = result_hash;
    job.proof_hash = proof_hash;
    job.completed_at = clock.unix_timestamp;
    
    msg!("Job {} result submitted", job.job_id);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct VerifyAndCompleteJob<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [JOB_SEED, &job_id.to_le_bytes()],
        bump = job.bump,
        constraint = job.status == JobStatus::Active @ FluxError::InvalidJobStatus
    )]
    pub job: Account<'info, Job>,
    
    #[account(
        mut,
        seeds = [PROVIDER_SEED, job.provider.as_ref()],
        bump = provider.bump
    )]
    pub provider: Account<'info, Provider>,
}

pub fn verify_and_complete_job(
    ctx: Context<VerifyAndCompleteJob>,
    _job_id: u64,
) -> Result<()> {
    let job = &mut ctx.accounts.job;
    let provider = &mut ctx.accounts.provider;
    
    require!(job.result_hash != [0; 32], FluxError::InvalidProof);
    
    job.status = JobStatus::Completed;
    provider.total_jobs_completed = provider.total_jobs_completed.checked_add(1)
        .ok_or(FluxError::ArithmeticOverflow)?;
    provider.total_uptime_hours = provider.total_uptime_hours.checked_add(job.duration_hours as u64)
        .ok_or(FluxError::ArithmeticOverflow)?;
    
    msg!("Job {} verified and completed", job.job_id);
    
    Ok(())
}
