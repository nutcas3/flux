use pinocchio::{
    account_info::AccountInfo,
    instruction::{AccountMeta, Instruction},
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    ProgramResult,
};

use crate::state;


pub fn start_job(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let client = &accounts[0];
    let job_account = &accounts[1];
    let resource_account = &accounts[2];
    let escrow_account = &accounts[3];
    let system_program = &accounts[4];


    let job_id = u64::from_le_bytes(data[0..8].try_into().unwrap());
    let specs = state::ResourceSpecs::try_from_slice(&data[8..])?;

    if !client.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let (job_pda, bump) = Pubkey::create_program_address(
        &[b"job", client.key.as_ref(), job_id.to_le_bytes().as_ref()],
        &pinocchio::ID,
    )?;

    if job_account.key != &job_pda {
        return Err(ProgramError::InvalidAccountData);
    }

    let create_account_ix = system_instruction::create_account(
        client.key,
        job_account.key,
        1000000,
        state::JobAccount::SPACE as u64,
        &pinocchio::ID,
    );

    let create_account_instruction = Instruction {
        program_id: system_program.key,
        accounts: vec![
            AccountMeta::new(*client.key, true),
            AccountMeta::new(*job_account.key, false),
            AccountMeta::new(*system_program.key, false),
        ],
        data: create_account_ix.data,
    };

    invoke_signed(
        &create_account_instruction,
        accounts,
        &[&[b"job", client.key.as_ref(), job_id.to_le_bytes().as_ref(), &[bump]]],
    )?;

    let resource_data = resource_account.try_borrow_data()?;
    let resource = state::ResourceAccount::try_from_slice(&resource_data)?;
    if resource.status != state::ResourceStatus::Idle {
        return Err(ProgramError::Custom(4));
    }

    let mut job_data = state::JobAccount {
        job_id,
        client: *client.key,
        host: *resource.host.key(),
        status: state::JobStatus::Active,
        specs,
        result_hash: [0; 32],
        deadline: 0,
        payment_amount: specs.price_per_hour,
        escrow_account: *escrow_account.key,
    };

    let mut account_data = job_account.try_borrow_mut_data()?;
    account_data.copy_from_slice(&job_data.try_to_vec()?);

    let mut resource_data_mut = resource_account.try_borrow_mut_data()?;
    let mut resource_mut = state::ResourceAccount::try_from_slice(&resource_data_mut)?;
    resource_mut.status = state::ResourceStatus::Busy;
    resource_data_mut.copy_from_slice(&resource_mut.try_to_vec()?);

    Ok(())
}
