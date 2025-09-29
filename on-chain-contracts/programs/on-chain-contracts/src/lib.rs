use pinocchio::{
    account_info::AccountInfo,
    declare_id,
    entrypoint,
    instruction::{AccountMeta, Instruction},
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::{self, Pubkey},
    system_instruction,
    ProgramResult,
};
use borsh::{BorshDeserialize, BorshSerialize};

declare_id!("C9xzMFbaR39ftisYXsnbELsPpxgsMeeLW5fVH4fSVNiR");

pub mod state;


// Pinocchio entrypoint
entrypoint!(process_instruction);

pub fn process_instruction(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let (instruction, rest) = data.split_first().ok_or(ProgramError::InvalidInstructionData)?;
    match instruction {
        0 => register_resource(accounts, rest),
        1 => update_resource_status(accounts, rest),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

/// Registers a new hardware resource account for a Host.
pub fn register_resource(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let host = &accounts[0];
    let resource_account = &accounts[1];
    let system_program = &accounts[2];

    // Deserialize specs from data
    let specs = state::ResourceSpecs::try_from_slice(data)?;

    if specs.price_per_hour == 0 {
        return Err(ProgramError::Custom(1)); // InvalidPrice
    }

    // Manual authority check: ensure host is signer
    if !host.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Calculate PDA for the resource account
    let (resource_pda, bump) = Pubkey::create_program_address(
        &[b"resource", host.key.as_ref(), specs.id.to_le_bytes().as_ref()],
        &pinocchio::ID,
    )?;

    // Ensure the resource_account matches the PDA
    if resource_account.key != &resource_pda {
        return Err(ProgramError::InvalidAccountData);
    }

    // Create the account using system_instruction
    let create_account_ix = system_instruction::create_account(
        host.key,
        resource_account.key,
        1000000, // Rent-exempt lamports (adjust as needed)
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

    // Invoke the create_account instruction, signing with PDA
    invoke_signed(
        &create_account_instruction,
        accounts,
        &[&[b"resource", host.key.as_ref(), specs.id.to_le_bytes().as_ref(), &[bump]]],
    )?;

    // Now initialize the account data
    let mut account_data = resource_account.try_borrow_mut_data()?;
    let mut resource = state::ResourceAccount {
        host: *host.key,
        specs,
        status: state::ResourceStatus::Idle,
        reputation_score: 1000,
        staked_flux: 0,
        last_updated: 0, // Placeholder for timestamp
    };
    account_data.copy_from_slice(&resource.try_to_vec()?);

    Ok(())
}

/// Updates the specs and status of an existing resource, mainly used by the Host Worker Node.
pub fn update_resource_status(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let host = &accounts[0];
    let resource_account = &accounts[1];

    // Deserialize new_status from data
    let new_status = state::ResourceStatus::try_from_slice(data)?;

    // Authority check
    if !host.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Check ownership
    let account_data = resource_account.try_borrow_data()?;
    let resource = state::ResourceAccount::try_from_slice(&account_data)?;
    if resource.host != *host.key {
        return Err(ProgramError::Custom(2)); // Unauthorized
    }

    // Update status
    let mut account_data_mut = resource_account.try_borrow_mut_data()?;
    let mut resource_mut = state::ResourceAccount::try_from_slice(&account_data_mut)?;
    resource_mut.status = new_status;
    resource_mut.last_updated = 0; // Placeholder
    account_data_mut.copy_from_slice(&resource_mut.try_to_vec()?);

    Ok(())
}

