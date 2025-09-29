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
    Suspended, 
}

pub enum FluxError {
    ResourceIdAlreadyExists,
    InvalidPrice,
}