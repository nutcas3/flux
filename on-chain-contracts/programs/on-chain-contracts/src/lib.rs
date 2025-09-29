use pinocchio::{
    account_info::AccountInfo,
    declare_id,
    entrypoint,
    instruction::{AccountMeta, Instruction},
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::{self, Pubkey},
    system_instruction,
    ProgramResult,
};
use borsh::{BorshDeserialize, BorshSerialize};

declare_id!("C9xzMFbaR39ftisYXsnbELsPpxgsMeeLW5fVH4fSVNiR");

pub mod state;
pub mod instructions;

entrypoint!(process_instruction);

pub fn process_instruction(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let (instruction, rest) = data.split_first().ok_or(ProgramError::InvalidInstructionData)?;
    match instruction {
        0 => instructions::register_resource(accounts, rest),
        1 => instructions::update_resource_status(accounts, rest),
        2 => instructions::start_job(accounts, rest),
        3 => instructions::submit_job_result(accounts, rest),
        4 => instructions::resolve_job(accounts, rest),
        5 => instructions::deposit_escrow(accounts, rest),
        6 => instructions::release_payment(accounts, rest),
        7 => instructions::stake_flux(accounts, rest), 
        8 => instructions::unstake_flux(accounts, rest), 
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

