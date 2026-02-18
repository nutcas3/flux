use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::FluxError;

#[derive(Accounts)]
pub struct MintReputationSBT<'info> {
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
        space = ReputationAccount::MAX_SIZE,
        seeds = [REPUTATION_SEED, provider.key().as_ref()],
        bump
    )]
    pub reputation: Account<'info, ReputationAccount>,
    
    pub system_program: Program<'info, System>,
}

pub fn mint_reputation_sbt(ctx: Context<MintReputationSBT>) -> Result<()> {
    let reputation = &mut ctx.accounts.reputation;
    let clock = Clock::get()?;
    
    reputation.provider = ctx.accounts.provider.key();
    reputation.total_jobs_completed = 0;
    reputation.total_uptime_hours = 0;
    reputation.average_uptime_percentage = 10000;
    reputation.total_value_processed = 0;
    reputation.successful_jobs = 0;
    reputation.failed_jobs = 0;
    reputation.slashed_count = 0;
    reputation.member_since = clock.unix_timestamp;
    reputation.tier = ReputationTier::Novice;
    reputation.reputation_score = 0;
    reputation.badges = vec![Badge {
        badge_type: BadgeType::FirstJob,
        earned_at: clock.unix_timestamp,
        metadata_hash: [0; 32],
    }];
    reputation.bump = ctx.bumps.reputation;
    
    msg!("Reputation SBT minted for provider: {}", ctx.accounts.provider.key());
    
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [REPUTATION_SEED, reputation.provider.as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Account<'info, ReputationAccount>,
}

pub fn update_reputation(
    ctx: Context<UpdateReputation>,
    _job_id: u64,
    was_successful: bool,
    completion_time_hours: u32,
    job_value: u64,
) -> Result<()> {
    let reputation = &mut ctx.accounts.reputation;
    
    reputation.total_jobs_completed = reputation.total_jobs_completed.checked_add(1)
        .ok_or(FluxError::ArithmeticOverflow)?;
    reputation.total_uptime_hours = reputation.total_uptime_hours.checked_add(completion_time_hours as u64)
        .ok_or(FluxError::ArithmeticOverflow)?;
    reputation.total_value_processed = reputation.total_value_processed.checked_add(job_value)
        .ok_or(FluxError::ArithmeticOverflow)?;
    
    if was_successful {
        reputation.successful_jobs = reputation.successful_jobs.checked_add(1)
            .ok_or(FluxError::ArithmeticOverflow)?;
    } else {
        reputation.failed_jobs = reputation.failed_jobs.checked_add(1)
            .ok_or(FluxError::ArithmeticOverflow)?;
    }
    
    if reputation.total_jobs_completed > 0 {
        reputation.average_uptime_percentage = 
            ((reputation.successful_jobs as u128 * 10000) / reputation.total_jobs_completed as u128) as u16;
    }
    
    let old_tier = reputation.tier;
    reputation.tier = ReputationTier::from_jobs(
        reputation.total_jobs_completed,
        reputation.average_uptime_percentage
    );
    
    reputation.reputation_score = calculate_reputation_score(reputation);
    
    if reputation.tier != old_tier {
        msg!("Provider promoted to {:?}", reputation.tier);
    }
    
    check_and_award_badges(reputation)?;
    
    msg!("Reputation updated for provider: {}", reputation.provider);
    
    Ok(())
}

#[derive(Accounts)]
pub struct AwardBadge<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [REPUTATION_SEED, reputation.provider.as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Account<'info, ReputationAccount>,
}

pub fn award_badge(
    ctx: Context<AwardBadge>,
    badge_type: u8,
) -> Result<()> {
    let reputation = &mut ctx.accounts.reputation;
    let clock = Clock::get()?;
    
    let badge_type_enum = match badge_type {
        0 => BadgeType::FirstJob,
        1 => BadgeType::HundredJobs,
        2 => BadgeType::ThousandJobs,
        3 => BadgeType::PerfectMonth,
        4 => BadgeType::HighValue,
        5 => BadgeType::LongTermProvider,
        6 => BadgeType::ZeroSlashes,
        7 => BadgeType::FastCompletion,
        _ => return Err(FluxError::InvalidInputData.into()),
    };
    
    if has_badge(reputation, badge_type_enum) {
        return Err(FluxError::BadgeAlreadyAwarded.into());
    }
    
    reputation.badges.push(Badge {
        badge_type: badge_type_enum,
        earned_at: clock.unix_timestamp,
        metadata_hash: [0; 32],
    });
    
    msg!("Badge {:?} awarded to provider: {}", badge_type_enum, reputation.provider);
    
    Ok(())
}

fn calculate_reputation_score(reputation: &ReputationAccount) -> u64 {
    let tier_weight = reputation.tier.tier_weight();
    let uptime_score = (reputation.average_uptime_percentage as u64) * 10;
    let job_completion_score = reputation.total_jobs_completed * 100;
    let value_score = reputation.total_value_processed / 1_000_000_000;
    
    let clock = Clock::get().unwrap();
    let longevity_days = (clock.unix_timestamp - reputation.member_since) / 86400;
    let longevity_score = (longevity_days as u64) * 50;
    
    let badge_score = reputation.badges.len() as u64 * 1000;
    let slash_penalty = (reputation.slashed_count as u64) * 5000;
    
    tier_weight
        .saturating_add(uptime_score)
        .saturating_add(job_completion_score)
        .saturating_add(value_score)
        .saturating_add(longevity_score)
        .saturating_add(badge_score)
        .saturating_sub(slash_penalty)
}

fn check_and_award_badges(reputation: &mut ReputationAccount) -> Result<()> {
    let clock = Clock::get()?;
    
    if reputation.total_jobs_completed == 100 && !has_badge(reputation, BadgeType::HundredJobs) {
        reputation.badges.push(Badge {
            badge_type: BadgeType::HundredJobs,
            earned_at: clock.unix_timestamp,
            metadata_hash: [0; 32],
        });
    }
    
    if reputation.total_jobs_completed == 1000 && !has_badge(reputation, BadgeType::ThousandJobs) {
        reputation.badges.push(Badge {
            badge_type: BadgeType::ThousandJobs,
            earned_at: clock.unix_timestamp,
            metadata_hash: [0; 32],
        });
    }
    
    if reputation.slashed_count == 0 && reputation.total_jobs_completed >= 100 
        && !has_badge(reputation, BadgeType::ZeroSlashes) {
        reputation.badges.push(Badge {
            badge_type: BadgeType::ZeroSlashes,
            earned_at: clock.unix_timestamp,
            metadata_hash: [0; 32],
        });
    }
    
    Ok(())
}

fn has_badge(reputation: &ReputationAccount, badge_type: BadgeType) -> bool {
    reputation.badges.iter().any(|b| b.badge_type == badge_type)
}
