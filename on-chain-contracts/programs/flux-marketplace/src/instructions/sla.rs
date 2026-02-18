use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::*;
use crate::constants::*;
use crate::errors::FluxError;

#[derive(Accounts)]
pub struct StakeForSLA<'info> {
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
        space = ProviderStake::MAX_SIZE,
        seeds = [STAKE_SEED, provider.key().as_ref()],
        bump
    )]
    pub stake: Account<'info, ProviderStake>,
    
    pub system_program: Program<'info, System>,
}

pub fn stake_for_sla(
    ctx: Context<StakeForSLA>,
    amount: u64,
    tier: u8,
) -> Result<()> {
    let stake = &mut ctx.accounts.stake;
    let clock = Clock::get()?;
    
    let sla_tier = match tier {
        0 => SLATier::Bronze,
        1 => SLATier::Silver,
        2 => SLATier::Gold,
        3 => SLATier::Platinum,
        _ => return Err(FluxError::InvalidTier.into()),
    };
    
    require!(
        amount >= sla_tier.min_stake_lamports(),
        FluxError::InsufficientStake
    );
    
    let transfer_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to: stake.to_account_info(),
        },
    );
    transfer(transfer_ctx, amount)?;
    
    stake.provider = ctx.accounts.provider.key();
    stake.total_staked = amount;
    stake.locked_stake = 0;
    stake.available_stake = amount;
    stake.active_jobs = 0;
    stake.sla_tier = sla_tier;
    stake.last_slash_timestamp = 0;
    stake.total_slashed = 0;
    stake.uptime_percentage = 10000;
    stake.bump = ctx.bumps.stake;
    
    msg!("Provider {} staked {} for {:?} tier", ctx.accounts.provider.key(), amount, sla_tier);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct LockStakeForJob<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [PROVIDER_SEED, authority.key().as_ref()],
        bump = provider.bump,
        constraint = provider.authority == authority.key()
    )]
    pub provider: Account<'info, Provider>,
    
    #[account(
        mut,
        seeds = [STAKE_SEED, provider.key().as_ref()],
        bump = stake.bump
    )]
    pub stake: Account<'info, ProviderStake>,
    
    /// CHECK: Client account
    pub client: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = authority,
        space = JobSLA::MAX_SIZE,
        seeds = [JOB_SLA_SEED, &job_id.to_le_bytes()],
        bump
    )]
    pub job_sla: Account<'info, JobSLA>,
    
    pub system_program: Program<'info, System>,
}

pub fn lock_stake_for_job(
    ctx: Context<LockStakeForJob>,
    job_id: u64,
    duration_hours: u32,
) -> Result<()> {
    let stake = &mut ctx.accounts.stake;
    let job_sla = &mut ctx.accounts.job_sla;
    let clock = Clock::get()?;
    
    let stake_to_lock = match stake.sla_tier {
        SLATier::Bronze => 100 * 1_000_000_000,
        SLATier::Silver => 200 * 1_000_000_000,
        SLATier::Gold => 500 * 1_000_000_000,
        SLATier::Platinum => 1000 * 1_000_000_000,
    } * duration_hours as u64;
    
    require!(
        stake.available_stake >= stake_to_lock,
        FluxError::InsufficientAvailableStake
    );
    
    stake.locked_stake = stake.locked_stake.checked_add(stake_to_lock)
        .ok_or(FluxError::ArithmeticOverflow)?;
    stake.available_stake = stake.available_stake.checked_sub(stake_to_lock)
        .ok_or(FluxError::ArithmeticOverflow)?;
    stake.active_jobs = stake.active_jobs.checked_add(1)
        .ok_or(FluxError::ArithmeticOverflow)?;
    
    job_sla.job_id = job_id;
    job_sla.provider = ctx.accounts.provider.key();
    job_sla.client = ctx.accounts.client.key();
    job_sla.locked_stake = stake_to_lock;
    job_sla.start_time = clock.unix_timestamp;
    job_sla.expected_duration = duration_hours;
    job_sla.deadline = clock.unix_timestamp + (duration_hours as i64 * SECONDS_PER_HOUR);
    job_sla.uptime_checks = 0;
    job_sla.successful_checks = 0;
    job_sla.status = JobSLAStatus::Active;
    job_sla.bump = ctx.bumps.job_sla;
    
    msg!("Locked {} stake for job {}", stake_to_lock, job_id);
    
    Ok(())
}

#[derive(Accounts)]
pub struct RecordUptimeCheck<'info> {
    #[account(mut)]
    pub oracle: Signer<'info>,
    
    #[account(
        mut,
        seeds = [JOB_SLA_SEED, &job_sla.job_id.to_le_bytes()],
        bump = job_sla.bump,
        constraint = job_sla.status == JobSLAStatus::Active @ FluxError::JobSLANotActive
    )]
    pub job_sla: Account<'info, JobSLA>,
}

pub fn record_uptime_check(
    ctx: Context<RecordUptimeCheck>,
    is_online: bool,
    _timestamp: i64,
) -> Result<()> {
    let job_sla = &mut ctx.accounts.job_sla;
    
    job_sla.uptime_checks = job_sla.uptime_checks.checked_add(1)
        .ok_or(FluxError::ArithmeticOverflow)?;
    
    if is_online {
        job_sla.successful_checks = job_sla.successful_checks.checked_add(1)
            .ok_or(FluxError::ArithmeticOverflow)?;
    }
    
    let uptime_percentage = if job_sla.uptime_checks > 0 {
        ((job_sla.successful_checks as u128 * 10000) / job_sla.uptime_checks as u128) as u16
    } else {
        10000
    };
    
    msg!("Uptime check recorded: online={}, percentage={}", is_online, uptime_percentage);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct ExecuteSlash<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [JOB_SLA_SEED, &job_id.to_le_bytes()],
        bump = job_sla.bump
    )]
    pub job_sla: Account<'info, JobSLA>,
    
    #[account(
        mut,
        seeds = [STAKE_SEED, job_sla.provider.as_ref()],
        bump = stake.bump
    )]
    pub stake: Account<'info, ProviderStake>,
    
    /// CHECK: Client to receive refund
    #[account(mut)]
    pub client: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn execute_slash(
    ctx: Context<ExecuteSlash>,
    _job_id: u64,
) -> Result<()> {
    let job_sla = &mut ctx.accounts.job_sla;
    let stake = &mut ctx.accounts.stake;
    
    let uptime_actual = if job_sla.uptime_checks > 0 {
        ((job_sla.successful_checks as u128 * 10000) / job_sla.uptime_checks as u128) as u16
    } else {
        10000
    };
    
    let uptime_required = stake.sla_tier.uptime_requirement();
    
    require!(
        uptime_actual < uptime_required,
        FluxError::UptimeRequirementNotMet
    );
    
    let slash_percentage = stake.sla_tier.slash_percentage();
    let slash_amount = (job_sla.locked_stake as u128 * slash_percentage as u128 / 100) as u64;
    
    stake.locked_stake = stake.locked_stake.checked_sub(slash_amount)
        .ok_or(FluxError::ArithmeticOverflow)?;
    stake.total_staked = stake.total_staked.checked_sub(slash_amount)
        .ok_or(FluxError::ArithmeticOverflow)?;
    stake.total_slashed = stake.total_slashed.checked_add(slash_amount)
        .ok_or(FluxError::ArithmeticOverflow)?;
    stake.active_jobs = stake.active_jobs.saturating_sub(1);
    
    job_sla.status = JobSLAStatus::Slashed;
    
    **stake.to_account_info().try_borrow_mut_lamports()? -= slash_amount;
    **ctx.accounts.client.try_borrow_mut_lamports()? += slash_amount;
    
    msg!("Slashed {} from provider for job {}", slash_amount, job_sla.job_id);
    
    Ok(())
}

#[derive(Accounts)]
pub struct UnstakeSLA<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [PROVIDER_SEED, authority.key().as_ref()],
        bump = provider.bump,
        constraint = provider.authority == authority.key()
    )]
    pub provider: Account<'info, Provider>,
    
    #[account(
        mut,
        seeds = [STAKE_SEED, provider.key().as_ref()],
        bump = stake.bump,
        constraint = stake.active_jobs == 0 @ FluxError::InvalidJobStatus
    )]
    pub stake: Account<'info, ProviderStake>,
    
    pub system_program: Program<'info, System>,
}

pub fn unstake_sla(
    ctx: Context<UnstakeSLA>,
    amount: u64,
) -> Result<()> {
    let stake = &mut ctx.accounts.stake;
    
    require!(
        amount <= stake.available_stake,
        FluxError::InsufficientAvailableStake
    );
    
    stake.available_stake = stake.available_stake.checked_sub(amount)
        .ok_or(FluxError::ArithmeticOverflow)?;
    stake.total_staked = stake.total_staked.checked_sub(amount)
        .ok_or(FluxError::ArithmeticOverflow)?;
    
    **stake.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;
    
    msg!("Unstaked {} from provider {}", amount, ctx.accounts.provider.key());
    
    Ok(())
}
