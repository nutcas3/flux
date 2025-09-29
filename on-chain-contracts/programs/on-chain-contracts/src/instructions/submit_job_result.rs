use pinocchio::{
    account_info::AccountInfo,
    program_error::ProgramError,
    ProgramResult,
};

use crate::state;

pub fn submit_job_result(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let host = &accounts[0];
    let job_account = &accounts[1];

    if !host.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let result_hash: [u8; 32] = data.try_into().unwrap();

    let account_data = job_account.try_borrow_data()?;
    let job = state::JobAccount::try_from_slice(&account_data)?;
    if job.host != *host.key {
        return Err(ProgramError::Custom(3));
    }

    let mut account_data_mut = job_account.try_borrow_mut_data()?;
    let mut job_mut = state::JobAccount::try_from_slice(&account_data_mut)?;
    job_mut.result_hash = result_hash;
    job_mut.status = state::JobStatus::Completed;
    account_data_mut.copy_from_slice(&job_mut.try_to_vec()?);

    Ok(())
}
