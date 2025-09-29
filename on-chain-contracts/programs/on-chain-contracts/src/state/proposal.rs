use pinocchio::pubkey::Pubkey;
use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Clone)]
pub struct ProposalAccount {
    pub proposal_id: u64,
    pub proposer: Pubkey,
    pub description: String,
    pub votes_for: u64,
    pub votes_against: u64,
    pub status: ProposalStatus,
    pub deadline: i64,
}

impl ProposalAccount {
    pub const SPACE: usize = 8 + 32 + (4 + 100) + 8 + 8 + 1 + 8; // Approximate for string
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum ProposalStatus {
    Active,
    Passed,
    Rejected,
}
