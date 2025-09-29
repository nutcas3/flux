use pinocchio::pubkey::Pubkey;
use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Clone)]
pub struct ResourceAccount {
    pub host: Pubkey, 
    pub specs: ResourceSpecs,
    pub status: ResourceStatus,
    pub reputation_score: u16, 
    pub staked_flux: u64, 
    pub last_updated: i64,
}

impl ResourceAccount {
    pub const SPACE: usize = 32 + ResourceSpecs::SPACE + 1 + 2 + 8 + 8;
}

#[derive(BorshSerialize, BorshDeserialize, Clone)]
pub struct ResourceSpecs {
    pub id: u64, 
    pub gpu_model: String, 
    pub vram_gb: u8, 
    pub cpu_cores: u8, 
    pub compute_rating: u32, 
    pub price_per_hour: u64,
}

impl ResourceSpecs {
    pub const SPACE: usize = 8 + 4 + 20 + 1 + 1 + 4 + 8;
}
#[derive(BorshSerialize, BorshDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum ResourceStatus {
    Idle,      
    Busy,      
    Offline,   
}

// Job-related structures
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

// Extend error codes for jobs
pub enum FluxError {
    ResourceIdAlreadyExists,
    InvalidPrice,
    JobNotFound,
    UnauthorizedHost,
    InvalidJobStatus,
}