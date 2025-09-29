use pinocchio::pubkey::Pubkey;
use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Clone)]
pub struct EscrowAccount {
    pub job_id: u64,
    pub client: Pubkey,
    pub host: Pubkey,
    pub amount: u64, // FLUX tokens held
    pub status: EscrowStatus,
}

impl EscrowAccount {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 1;
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum EscrowStatus {
    Locked,    // Funds held until job completion
    Released,  // Funds transferred to host
    Refunded,  // Funds returned to client
}
