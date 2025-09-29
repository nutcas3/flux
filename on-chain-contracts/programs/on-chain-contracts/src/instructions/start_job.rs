use pinocchio::{
    account_info::AccountInfo,
    program_error::ProgramError,
    ProgramResult,
};

use crate::state;

/// Starts a new job and assigns it to an available host.
pub fn start_job(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let client = &accounts[0];
    let job_account = &accounts[1];
    let resource_account = &accounts[2];
    let escrow_account = &accounts[3];
    let system_program = &accounts[4];

    // Deserialize job details from data
    let job_id = u64::from_le_bytes(data[0..8].try_into().unwrap());
    let specs = state::ResourceSpecs::try_from_slice(&data[8..])?;

    if !client.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Check if resource is available
    let resource_data = resource_account.try_borrow_data()?;
    let resource = state::ResourceAccount::try_from_slice(&resource_data)?;
    if resource.status != state::ResourceStatus::Idle {
        return Err(ProgramError::Custom(4)); // Resource not available
    }

    // Create job account (simplified)
    // In a full implementation, handle PDA and creation

    // Initialize job data
    let mut job_data = state::JobAccount {
        job_id,
        client: *client.key,
        host: *resource.host.key(),
        status: state::JobStatus::Active,
        specs,
        result_hash: [0; 32],
        deadline: 0, // Placeholder
        payment_amount: specs.price_per_hour, // Simplified
        escrow_account: *escrow_account.key,
    };

    let mut account_data = job_account.try_borrow_mut_data()?;
    account_data.copy_from_slice(&job_data.try_to_vec()?);

    // Update resource status to Busy
    let mut resource_data_mut = resource_account.try_borrow_mut_data()?;
    let mut resource_mut = state::ResourceAccount::try_from_slice(&resource_data_mut)?;
    resource_mut.status = state::ResourceStatus::Busy;
    resource_data_mut.copy_from_slice(&resource_mut.try_to_vec()?);

    Ok(())
}
