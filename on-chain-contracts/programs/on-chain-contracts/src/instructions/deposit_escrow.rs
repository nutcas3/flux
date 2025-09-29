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

    let (escrow_pda, bump) = Pubkey::create_program_address(
        &[b"escrow", client.key.as_ref(), job_id.to_le_bytes().as_ref()],
        &pinocchio::program::ID,
    )?;

    if escrow_account.key != &escrow_pda {
        return Err(ProgramError::InvalidAccountData);
    }

    let transfer_ix = spl_token::instruction::transfer(
        &SPL_TOKEN_PROGRAM_ID,
        token_account.key,
        &escrow_pda,
        client.key,
        &[],
        amount,
    )?;

    let transfer_instruction = Instruction {
        program_id: *token_program.key,
        accounts: vec![
            AccountMeta::new(*token_account.key, false),
            AccountMeta::new(escrow_pda, false),
            AccountMeta::new(*client.key, true),
        ],
        data: transfer_ix.data,
    };

    invoke(&transfer_instruction, accounts)?;

    msg!("Deposited {} FLUX to escrow for job {}", amount, job_id);
    let mut escrow_data = state::EscrowAccount {
        job_id,
        client: *client.key,
        host: Pubkey::default(),
        amount,
        status: state::EscrowStatus::Locked,
    };

    let mut account_data = escrow_account.try_borrow_mut_data()?;
    account_data.copy_from_slice(&escrow_data.try_to_vec()?);

    Ok(())
}
