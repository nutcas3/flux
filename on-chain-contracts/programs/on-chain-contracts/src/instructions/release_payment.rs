use pinocchio::{
    account_info::AccountInfo,
    msg,
    program_error::ProgramError,
    ProgramResult,
};

use crate::state;

pub fn release_payment(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let client = &accounts[0];
    let host = &accounts[1];
    let escrow_account = &accounts[2];
    let token_account = &accounts[3];
    let token_program = &accounts[4];

    if !client.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let escrow_data = escrow_account.try_borrow_data()?;
    let escrow = state::EscrowAccount::try_from_slice(&escrow_data)?;
    if escrow.status != state::EscrowStatus::Locked {
        return Err(ProgramError::Custom(6));
    }

    msg!("Releasing {} FLUX to host {}", escrow.amount, host.key);

    let mut escrow_data_mut = escrow_account.try_borrow_mut_data()?;
    let mut escrow_mut = state::EscrowAccount::try_from_slice(&escrow_data_mut)?;
    escrow_mut.status = state::EscrowStatus::Released;
    escrow_data_mut.copy_from_slice(&escrow_mut.try_to_vec()?);

    Ok(())
}
