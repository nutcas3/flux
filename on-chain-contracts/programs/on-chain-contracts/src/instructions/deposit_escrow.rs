use pinocchio::{
    account_info::AccountInfo,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    ProgramResult,
};

use crate::state;

/// Deposits FLUX tokens into escrow for a job.
pub fn deposit_escrow(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let client = &accounts[0];
    let escrow_account = &accounts[1];
    let token_account = &accounts[2];
    let token_program = &accounts[3];

    if !client.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let amount = u64::from_le_bytes(data[0..8].try_into().unwrap());
    let job_id = u64::from_le_bytes(data[8..16].try_into().unwrap());

    // Simplified: Assume token transfer to escrow
    // In reality, use SPL Token CPI for transfer
    msg!("Depositing {} FLUX to escrow for job {}", amount, job_id);

    // Initialize escrow data
    let mut escrow_data = state::EscrowAccount {
        job_id,
        client: *client.key,
        host: Pubkey::default(), // To be set later
        amount,
        status: state::EscrowStatus::Locked,
    };

    let mut account_data = escrow_account.try_borrow_mut_data()?;
    account_data.copy_from_slice(&escrow_data.try_to_vec()?);

    Ok(())
}
