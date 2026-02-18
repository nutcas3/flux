use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Escrow {
    pub job_id: u64,
    pub client: Pubkey,
    pub provider: Pubkey,
    pub amount: u64,
    pub status: EscrowStatus,
    pub created_at: i64,
    pub released_at: i64,
    pub bump: u8,
}

impl Escrow {
    pub const MAX_SIZE: usize = 8 + // discriminator
        8 + // job_id
        32 + // client
        32 + // provider
        8 + // amount
        1 + // status
        8 + // created_at
        8 + // released_at
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq)]
pub enum EscrowStatus {
    #[default]
    Locked,    // Funds held until job completion
    Released,  // Funds transferred to provider
    Refunded,  // Funds returned to client
}
