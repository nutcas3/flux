use pinocchio::{
    account_info::AccountInfo,
    program_error::ProgramError,
    ProgramResult,
};

use crate::state;

pub fn resolve_job(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let client = &accounts[0];
    let host = &accounts[1];
    let job_account = &accounts[2];
    let escrow_account = &accounts[3];

    if !client.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let account_data = job_account.try_borrow_data()?;
    let job = state::JobAccount::try_from_slice(&account_data)?;
    if job.client != *client.key {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Simplified: Assume job is resolved successfully
    // Release payment, update reputation, etc.

    let mut job_data_mut = job_account.try_borrow_mut_data()?;
    let mut job_mut = state::JobAccount::try_from_slice(&job_data_mut)?;
    job_mut.status = state::JobStatus::Completed;
    job_data_mut.copy_from_slice(&job_mut.try_to_vec()?);

    Ok(())
}
