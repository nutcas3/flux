use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct ReputationAccount {
    pub provider: Pubkey,
    pub total_jobs_completed: u64,
    pub total_uptime_hours: u64,
    pub average_uptime_percentage: u16,
    pub total_value_processed: u64,
    pub successful_jobs: u64,
    pub failed_jobs: u64,
    pub slashed_count: u32,
    pub member_since: i64,
    pub tier: ReputationTier,
    pub reputation_score: u64,
    pub badges: Vec<Badge>,
    pub bump: u8,
}

impl ReputationAccount {
    pub const MAX_SIZE: usize = 8 + // discriminator
        32 + // provider
        8 + // total_jobs_completed
        8 + // total_uptime_hours
        2 + // average_uptime_percentage
        8 + // total_value_processed
        8 + // successful_jobs
        8 + // failed_jobs
        4 + // slashed_count
        8 + // member_since
        1 + // tier
        8 + // reputation_score
        4 + (10 * (1 + 8 + 4 + 32)) + // badges (max 10)
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq)]
pub enum ReputationTier {
    #[default]
    Novice,      // 0-10 jobs
    Apprentice,  // 11-50 jobs
    Journeyman,  // 51-200 jobs
    Expert,      // 201-1000 jobs
    Master,      // 1001+ jobs
    Legend,      // 10000+ jobs + 99.9% uptime
}

impl ReputationTier {
    pub fn from_jobs(jobs: u64, uptime: u16) -> Self {
        if jobs >= 10000 && uptime >= 9990 {
            ReputationTier::Legend
        } else if jobs >= 1001 {
            ReputationTier::Master
        } else if jobs >= 201 {
            ReputationTier::Expert
        } else if jobs >= 51 {
            ReputationTier::Journeyman
        } else if jobs >= 11 {
            ReputationTier::Apprentice
        } else {
            ReputationTier::Novice
        }
    }

    pub fn tier_weight(&self) -> u64 {
        match self {
            ReputationTier::Novice => 100,
            ReputationTier::Apprentice => 500,
            ReputationTier::Journeyman => 2000,
            ReputationTier::Expert => 5000,
            ReputationTier::Master => 10000,
            ReputationTier::Legend => 25000,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Badge {
    pub badge_type: BadgeType,
    pub earned_at: i64,
    pub metadata_hash: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq)]
pub enum BadgeType {
    #[default]
    FirstJob,
    HundredJobs,
    ThousandJobs,
    PerfectMonth,
    HighValue,
    LongTermProvider,
    ZeroSlashes,
    FastCompletion,
}
