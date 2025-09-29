use pinocchio::{
    account_info::AccountInfo,
    msg,
    program_error::ProgramError,
    ProgramResult,
};

use crate::state;

pub fn vote_on_proposal(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let voter = &accounts[0];
    let proposal_account = &accounts[1];

    if !voter.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let vote = data[0] != 0;
    let proposal_data = proposal_account.try_borrow_data()?;
    let proposal = state::ProposalAccount::try_from_slice(&proposal_data)?;
    if proposal.status != state::ProposalStatus::Active {
        return Err(ProgramError::Custom(7));
    }

    let mut proposal_data_mut = proposal_account.try_borrow_mut_data()?;
    let mut proposal_mut = state::ProposalAccount::try_from_slice(&proposal_data_mut)?;
    if vote {
        proposal_mut.votes_for += 1;
    } else {
        proposal_mut.votes_against += 1;
    }
    proposal_data_mut.copy_from_slice(&proposal_mut.try_to_vec()?);

    msg!("Vote cast by {} on proposal {}", voter.key, proposal.proposal_id);

    Ok(())
}
