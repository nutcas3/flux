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


// Pinocchio entrypoint
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
        7 => instructions::create_proposal(accounts, rest),
        8 => instructions::vote_on_proposal(accounts, rest),
        9 => instructions::stake_flux(accounts, rest), // New staking instruction
        10 => instructions::unstake_flux(accounts, rest), // New unstaking instruction
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

/// Starts a new job and assigns it to an available host.
/// Accounts: [client, job_account, resource_account, escrow_account, system_program]
pub fn start_job(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let client = &accounts[0];
    let job_account = &accounts[1];
    let resource_account = &accounts[2];
    let escrow_account = &accounts[3];
    let system_program = &accounts[4];

    // Deserialize job details from data
    let job_id = u64::from_le_bytes(data[0..8].try_into().unwrap());
    let specs = state::ResourceSpecs::try_from_slice(&data[8..])?;

    if !client.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Check if resource is available
    let resource_data = resource_account.try_borrow_data()?;
    let resource = state::ResourceAccount::try_from_slice(&resource_data)?;
    if resource.status != state::ResourceStatus::Idle {
        return Err(ProgramError::Custom(4)); // Resource not available
    }

    // Create job account (simplified)
    // In a full implementation, handle PDA and creation

    // Initialize job data
    let mut job_data = state::JobAccount {
        job_id,
        client: *client.key,
        host: *resource.host.key(),
        status: state::JobStatus::Active,
        specs,
        result_hash: [0; 32],
        deadline: 0, // Placeholder
        payment_amount: specs.price_per_hour, // Simplified
        escrow_account: *escrow_account.key,
    };

    let mut account_data = job_account.try_borrow_mut_data()?;
    account_data.copy_from_slice(&job_data.try_to_vec()?);

    // Update resource status to Busy
    let mut resource_data_mut = resource_account.try_borrow_mut_data()?;
    let mut resource_mut = state::ResourceAccount::try_from_slice(&resource_data_mut)?;
    resource_mut.status = state::ResourceStatus::Busy;
    resource_data_mut.copy_from_slice(&resource_mut.try_to_vec()?);

    Ok(())
}

/// Submits the result of a job by the host.
/// Accounts: [host, job_account]
pub fn submit_job_result(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let host = &accounts[0];
    let job_account = &accounts[1];

    if !host.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Deserialize result hash
    let result_hash: [u8; 32] = data.try_into().unwrap();

    let account_data = job_account.try_borrow_data()?;
    let job = state::JobAccount::try_from_slice(&account_data)?;
    if job.host != *host.key {
        return Err(ProgramError::Custom(3)); // UnauthorizedHost
    }

    // Update job with result
    let mut account_data_mut = job_account.try_borrow_mut_data()?;
    let mut job_mut = state::JobAccount::try_from_slice(&account_data_mut)?;
    job_mut.result_hash = result_hash;
    job_mut.status = state::JobStatus::Completed;
    account_data_mut.copy_from_slice(&job_mut.try_to_vec()?);

    Ok(())
}

/// Resolves a job, handling payment and reputation updates.
/// Accounts: [client, host, job_account, escrow_account]
pub fn resolve_job(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let client = &accounts[0];
    let host = &accounts[1];
    let job_account = &accounts[2];
    let escrow_account = &accounts[3];

    if !client.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let account_data = job_account.try_borrow_data()?;
    let job = state::JobAccount::try_from_slice(&account_data)?;
    if job.client != *client.key {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Simplified: Assume job is resolved successfully
    // Release payment, update reputation, etc.

    let mut job_data_mut = job_account.try_borrow_mut_data()?;
    let mut job_mut = state::JobAccount::try_from_slice(&job_data_mut)?;
    job_mut.status = state::JobStatus::Completed;
    job_data_mut.copy_from_slice(&job_mut.try_to_vec()?);

    Ok(())
}

/// Deposits FLUX tokens into escrow for a job.
/// Accounts: [client, escrow_account, token_account, token_program]
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

/// Releases payment from escrow to the host.
/// Accounts: [client, host, escrow_account, token_account, token_program]
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
        return Err(ProgramError::Custom(6)); // EscrowNotLocked
    }

    // Simplified: Transfer tokens to host
    msg!("Releasing {} FLUX to host {}", escrow.amount, host.key);

    // Update escrow status
    let mut escrow_data_mut = escrow_account.try_borrow_mut_data()?;
    let mut escrow_mut = state::EscrowAccount::try_from_slice(&escrow_data_mut)?;
    escrow_mut.status = state::EscrowStatus::Released;
    escrow_data_mut.copy_from_slice(&escrow_mut.try_to_vec()?);

    Ok(())
}

/// Creates a new governance proposal.
/// Accounts: [proposer, proposal_account, system_program]
pub fn create_proposal(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let proposer = &accounts[0];
    let proposal_account = &accounts[1];
    let system_program = &accounts[2];

    if !proposer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let proposal_id = u64::from_le_bytes(data[0..8].try_into().unwrap());
    let description = String::from_utf8(data[8..].to_vec()).unwrap_or_default();

    // Initialize proposal
    let mut proposal_data = state::ProposalAccount {
        proposal_id,
        proposer: *proposer.key,
        description,
        votes_for: 0,
        votes_against: 0,
        status: state::ProposalStatus::Active,
        deadline: 0, // Set based on time
    };

    let mut account_data = proposal_account.try_borrow_mut_data()?;
    account_data.copy_from_slice(&proposal_data.try_to_vec()?);

    msg!("Proposal {} created by {}", proposal_id, proposer.key);

    Ok(())
}

/// Votes on a governance proposal.
/// Accounts: [voter, proposal_account]
pub fn vote_on_proposal(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let voter = &accounts[0];
    let proposal_account = &accounts[1];

    if !voter.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let vote = data[0] != 0; // true for yes, false for no
    let proposal_data = proposal_account.try_borrow_data()?;
    let proposal = state::ProposalAccount::try_from_slice(&proposal_data)?;
    if proposal.status != state::ProposalStatus::Active {
        return Err(ProgramError::Custom(7)); // ProposalNotActive
    }

    // Update votes
    let mut proposal_data_mut = proposal_account.try_borrow_mut_data()?;
    let mut proposal_mut = state::ProposalAccount::try_from_slice(&proposal_data_mut)?;
    if vote {
        proposal_mut.votes_for += 1;
    } else {
        proposal_mut.votes_against += 1;
    }
    proposal_data_mut.copy_from_slice(&proposal_mut.try_to_vec()?);

    msg!("Vote cast by {} on proposal {}", voter.key, proposal.proposal_id);

    Ok(())
}

/// Stakes FLUX tokens for a host to participate in the marketplace.
/// Accounts: [host, resource_account, token_account, token_program]
pub fn stake_flux(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let host = &accounts[0];
    let resource_account = &accounts[1];
    let token_account = &accounts[2];
    let token_program = &accounts[3];

    if !host.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let amount = u64::from_le_bytes(data[0..8].try_into().unwrap());

    // Check if host owns the resource
    let resource_data = resource_account.try_borrow_data()?;
    let resource = state::ResourceAccount::try_from_slice(&resource_data)?;
    if resource.host != *host.key {
        return Err(ProgramError::Custom(2)); // Unauthorized
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

/// Unstakes FLUX tokens from a host's staked amount.
/// Accounts: [host, resource_account, token_account, token_program]
pub fn unstake_flux(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let host = &accounts[0];
    let resource_account = &accounts[1];
    let token_account = &accounts[2];
    let token_program = &accounts[3];

    if !host.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let amount = u64::from_le_bytes(data[0..8].try_into().unwrap());

    // Check ownership and sufficient stake
    let resource_data = resource_account.try_borrow_data()?;
    let resource = state::ResourceAccount::try_from_slice(&resource_data)?;
    if resource.host != *host.key || resource.staked_flux < amount {
        return Err(ProgramError::Custom(5)); // InsufficientFunds
    }

    // Simplified: Transfer tokens back
    msg!("Unstaking {} FLUX for host {}", amount, host.key);

    // Update staked amount
    let mut resource_data_mut = resource_account.try_borrow_mut_data()?;
    let mut resource_mut = state::ResourceAccount::try_from_slice(&resource_data_mut)?;
    resource_mut.staked_flux -= amount;
    resource_data_mut.copy_from_slice(&resource_mut.try_to_vec()?);

    Ok(())
}

