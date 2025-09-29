use pinocchio::{
    account_info::AccountInfo,
    msg,
    program_error::ProgramError,
    ProgramResult,
};

use crate::state;

pub fn create_proposal(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let proposer = &accounts[0];
    let proposal_account = &accounts[1];
    let system_program = &accounts[2];

    if !proposer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let proposal_id = u64::from_le_bytes(data[0..8].try_into().unwrap());
    let description = String::from_utf8(data[8..].to_vec()).unwrap_or_default();

    let mut proposal_data = state::ProposalAccount {
        proposal_id,
        proposer: *proposer.key,
        description,
        votes_for: 0,
        votes_against: 0,
        status: state::ProposalStatus::Active,
        deadline: 0,
    };

    let mut account_data = proposal_account.try_borrow_mut_data()?;
    account_data.copy_from_slice(&proposal_data.try_to_vec()?);

    msg!("Proposal {} created by {}", proposal_id, proposer.key);

    Ok(())
}
