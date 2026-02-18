use pinocchio::pubkey::Pubkey;
use borsh::{BorshDeserialize, BorshSerialize};

use super::resource::ResourceSpecs;

#[derive(BorshSerialize, BorshDeserialize, Clone)]
pub struct JobAccount {
    pub job_id: u64,
    pub client: Pubkey,
    pub host: Pubkey,
    pub status: JobStatus,
    pub specs: ResourceSpecs, // Copy of the specs for the job
    pub result_hash: [u8; 32],
    pub deadline: i64,
    pub payment_amount: u64,
    pub escrow_account: Pubkey,
}

impl JobAccount {
    pub const SPACE: usize = 8 + 32 + 32 + 1 + ResourceSpecs::SPACE + 32 + 8 + 8 + 32;
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum JobStatus {
    Pending,   // Waiting for host assignment
    Active,    // In progress
    Completed, // Finished successfully
    Failed,    // Failed or disputed
}
