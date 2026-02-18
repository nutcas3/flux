use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct ProviderStake {
    pub provider: Pubkey,
    pub total_staked: u64,
    pub locked_stake: u64,
    pub available_stake: u64,
    pub active_jobs: u32,
    pub sla_tier: SLATier,
    pub last_slash_timestamp: i64,
    pub total_slashed: u64,
    pub uptime_percentage: u16,
    pub bump: u8,
}

impl ProviderStake {
    pub const MAX_SIZE: usize = 8 + // discriminator
        32 + // provider
        8 + // total_staked
        8 + // locked_stake
        8 + // available_stake
        4 + // active_jobs
        1 + // sla_tier
        8 + // last_slash_timestamp
        8 + // total_slashed
        2 + // uptime_percentage
        1; // bump
}

#[account]
#[derive(Default)]
pub struct JobSLA {
    pub job_id: u64,
    pub provider: Pubkey,
    pub client: Pubkey,
    pub locked_stake: u64,
    pub start_time: i64,
    pub expected_duration: u32,
    pub deadline: i64,
    pub uptime_checks: u32,
    pub successful_checks: u32,
    pub status: JobSLAStatus,
    pub bump: u8,
}

impl JobSLA {
    pub const MAX_SIZE: usize = 8 + // discriminator
        8 + // job_id
        32 + // provider
        32 + // client
        8 + // locked_stake
        8 + // start_time
        4 + // expected_duration
        8 + // deadline
        4 + // uptime_checks
        4 + // successful_checks
        1 + // status
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq)]
pub enum SLATier {
    #[default]
    Bronze,   // 95% uptime, 10% stake requirement
    Silver,   // 98% uptime, 20% stake requirement
    Gold,     // 99.5% uptime, 30% stake requirement
    Platinum, // 99.9% uptime, 50% stake requirement
}

impl SLATier {
    pub fn min_stake_lamports(&self) -> u64 {
        match self {
            SLATier::Bronze => 1000 * 1_000_000_000,   // 1000 SOL
            SLATier::Silver => 5000 * 1_000_000_000,   // 5000 SOL
            SLATier::Gold => 10000 * 1_000_000_000,    // 10000 SOL
            SLATier::Platinum => 25000 * 1_000_000_000, // 25000 SOL
        }
    }
    
    pub fn uptime_requirement(&self) -> u16 {
        match self {
            SLATier::Bronze => 9500,   // 95.00%
            SLATier::Silver => 9800,   // 98.00%
            SLATier::Gold => 9950,     // 99.50%
            SLATier::Platinum => 9990, // 99.90%
        }
    }
    
    pub fn slash_percentage(&self) -> u8 {
        match self {
            SLATier::Bronze => 5,
            SLATier::Silver => 10,
            SLATier::Gold => 15,
            SLATier::Platinum => 20,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq)]
pub enum JobSLAStatus {
    #[default]
    Active,
    Completed,
    Violated,
    Slashed,
}
