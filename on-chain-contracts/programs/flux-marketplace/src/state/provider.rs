use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Provider {
    pub authority: Pubkey,
    pub gpu_model: String,
    pub vram_gb: u32,
    pub compute_capability: String,
    pub pcie_id: String,
    pub registered_at: i64,
    pub status: ProviderStatus,
    pub total_jobs_completed: u64,
    pub total_uptime_hours: u64,
    pub bump: u8,
}

impl Provider {
    pub const MAX_SIZE: usize = 8 + // discriminator
        32 + // authority
        4 + 50 + // gpu_model (String)
        4 + // vram_gb
        4 + 20 + // compute_capability
        4 + 30 + // pcie_id
        8 + // registered_at
        1 + // status
        8 + // total_jobs_completed
        8 + // total_uptime_hours
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq)]
pub enum ProviderStatus {
    #[default]
    Pending,
    Active,
    Suspended,
    Banned,
}
