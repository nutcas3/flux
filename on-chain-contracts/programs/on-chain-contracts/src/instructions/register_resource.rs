use pinocchio::{
    account_info::AccountInfo,
    instruction::{AccountMeta, Instruction},
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    ProgramResult,
};
use borsh::BorshSerialize;

use crate::state;

pub fn register_resource(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let host = &accounts[0];
    let resource_account = &accounts[1];
    let system_program = &accounts[2];

    let specs = state::ResourceSpecs::try_from_slice(data)?;

    if specs.price_per_hour == 0 {
        return Err(ProgramError::Custom(1)); // InvalidPrice
    }

    if !host.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let (resource_pda, bump) = Pubkey::create_program_address(
        &[b"resource", host.key.as_ref(), specs.id.to_le_bytes().as_ref()],
        &pinocchio::ID,
    )?;

    if resource_account.key != &resource_pda {
        return Err(ProgramError::InvalidAccountData);
    }

    let create_account_ix = system_instruction::create_account(
        host.key,
        resource_account.key,
        1000000, 
        state::ResourceAccount::SPACE as u64,
        &pinocchio::ID,
    );

    let create_account_instruction = Instruction {
        program_id: system_program.key,
        accounts: vec![
            AccountMeta::new(*host.key, true),
            AccountMeta::new(*resource_account.key, false),
            AccountMeta::new(*system_program.key, false),
        ],
        data: create_account_ix.data,
    };

    invoke_signed(
        &create_account_instruction,
        accounts,
        &[&[b"resource", host.key.as_ref(), specs.id.to_le_bytes().as_ref(), &[bump]]],
    )?;

    let mut account_data = resource_account.try_borrow_mut_data()?;
    let mut resource = state::ResourceAccount {
        host: *host.key,
        specs,
        status: state::ResourceStatus::Idle,
        reputation_score: 1000,
        staked_flux: 0,
        last_updated: 0, 
    };
    account_data.copy_from_slice(&resource.try_to_vec()?);

    Ok(())
}
