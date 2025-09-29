use pinocchio::{
    account_info::AccountInfo,
    instruction::{AccountMeta, Instruction},
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
    ProgramResult,
};

use crate::state;


const SPL_TOKEN_PROGRAM_ID: Pubkey = pubkey!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

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

    let (staking_pda, bump) = Pubkey::create_program_address(
        &[b"stake", resource_account.key.as_ref()],
        &pinocchio::ID,
    )?;
    let transfer_ix = spl_token::instruction::transfer(
        &SPL_TOKEN_PROGRAM_ID,
        token_account.key,
        &staking_pda,
        host.key,
        &[],
        amount,
    )?;

    let transfer_instruction = Instruction {
        program_id: *token_program.key,
        accounts: vec![
            AccountMeta::new(*token_account.key, false),
            AccountMeta::new(staking_pda, false),
            AccountMeta::new(*host.key, true),
        ],
        data: transfer_ix.data,
    };

    invoke(&transfer_instruction, accounts)?;

    msg!("Staking FLUX for host");
    let mut resource_data_mut = resource_account.try_borrow_mut_data()?;
    let mut resource_mut = state::ResourceAccount::try_from_slice(&resource_data_mut)?;
    resource_mut.staked_flux += amount;
    resource_data_mut.copy_from_slice(&resource_mut.try_to_vec()?);

    Ok(())
}
