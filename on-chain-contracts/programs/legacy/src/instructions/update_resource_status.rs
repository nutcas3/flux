use pinocchio::{
    account_info::AccountInfo,
    program_error::ProgramError,
    ProgramResult,
};

use crate::state;

pub fn update_resource_status(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let host = &accounts[0];
    let resource_account = &accounts[1];

    let new_status = state::ResourceStatus::try_from_slice(data)?;

    if !host.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    let account_data = resource_account.try_borrow_data()?;
    let resource = state::ResourceAccount::try_from_slice(&account_data)?;
    if resource.host != *host.key {
        return Err(ProgramError::Custom(2));
    }

    let mut account_data_mut = resource_account.try_borrow_mut_data()?;
    let mut resource_mut = state::ResourceAccount::try_from_slice(&account_data_mut)?;
    resource_mut.status = new_status;
    resource_mut.last_updated = 0;  
    account_data_mut.copy_from_slice(&resource_mut.try_to_vec()?);

    Ok(())
}
