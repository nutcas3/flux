use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Job {
    pub job_id: u64,
    pub client: Pubkey,
    pub provider: Pubkey,
    pub gpu_requirements: String,
    pub duration_hours: u32,
    pub max_price: u64,
    pub actual_price: u64,
    pub status: JobStatus,
    pub created_at: i64,
    pub started_at: i64,
    pub completed_at: i64,
    pub deadline: i64,
    pub result_hash: [u8; 32],
    pub proof_hash: [u8; 32],
    pub bump: u8,
}

impl Job {
    pub const MAX_SIZE: usize = 8 + // discriminator
        8 + // job_id
        32 + // client
        32 + // provider
        4 + 100 + // gpu_requirements
        4 + // duration_hours
        8 + // max_price
        8 + // actual_price
        1 + // status
        8 + // created_at
        8 + // started_at
        8 + // completed_at
        8 + // deadline
        32 + // result_hash
        32 + // proof_hash
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq)]
pub enum JobStatus {
    #[default]
    Pending,      // Waiting for provider assignment
    Assigned,     // Provider assigned, waiting to start
    Active,       // In progress
    Completed,    // Finished successfully
    Failed,       // Failed or disputed
    Cancelled,    // Cancelled by client
}
