use pinocchio::{
    account_info::AccountInfo,
    program_error::ProgramError,
    ProgramResult,
};

use crate::state;

pub fn stake_flux(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let host = &accounts[0];
    let resource_account = &accounts[1];
    let token_account = &accounts[2];
    let token_program = &accounts[3];

    if !host.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let amount = u64::from_le_bytes(data[0..8].try_into().unwrap());
    let resource_data = resource_account.try_borrow_data()?;
    let resource = state::ResourceAccount::try_from_slice(&resource_data)?;
    if resource.host != *host.key {
        return Err(ProgramError::Custom(2));
    }

    // Simplified: Assume token transfer to staking pool
    // In reality, use SPL Token CPI for staking
    msg!("Staking {} FLUX for host {}", amount, host.key);

    // Update staked amount in resource
    let mut resource_data_mut = resource_account.try_borrow_mut_data()?;
    let mut resource_mut = state::ResourceAccount::try_from_slice(&resource_data_mut)?;
    resource_mut.staked_flux += amount;
    resource_data_mut.copy_from_slice(&resource_mut.try_to_vec()?);

    Ok(())
}
