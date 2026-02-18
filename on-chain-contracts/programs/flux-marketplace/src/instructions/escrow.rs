use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::*;
use crate::constants::*;
use crate::errors::FluxError;

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct DepositToEscrow<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    
    #[account(
        seeds = [JOB_SEED, &job_id.to_le_bytes()],
        bump = job.bump,
        constraint = job.client == client.key() @ FluxError::Unauthorized
    )]
    pub job: Account<'info, Job>,
    
    #[account(
        init,
        payer = client,
        space = Escrow::MAX_SIZE,
        seeds = [ESCROW_SEED, &job_id.to_le_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    pub system_program: Program<'info, System>,
}

pub fn deposit_to_escrow(
    ctx: Context<DepositToEscrow>,
    job_id: u64,
    amount: u64,
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let job = &ctx.accounts.job;
    let clock = Clock::get()?;
    
    require!(amount >= job.actual_price, FluxError::InsufficientStake);
    
    let transfer_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.client.to_account_info(),
            to: escrow.to_account_info(),
        },
    );
    transfer(transfer_ctx, amount)?;
    
    escrow.job_id = job_id;
    escrow.client = ctx.accounts.client.key();
    escrow.provider = job.provider;
    escrow.amount = amount;
    escrow.status = EscrowStatus::Locked;
    escrow.created_at = clock.unix_timestamp;
    escrow.released_at = 0;
    escrow.bump = ctx.bumps.escrow;
    
    msg!("Deposited {} to escrow for job {}", amount, job_id);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct ReleasePayment<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [JOB_SEED, &job_id.to_le_bytes()],
        bump = job.bump,
        constraint = job.status == JobStatus::Completed @ FluxError::InvalidJobStatus
    )]
    pub job: Account<'info, Job>,
    
    #[account(
        mut,
        seeds = [ESCROW_SEED, &job_id.to_le_bytes()],
        bump = escrow.bump,
        constraint = escrow.status == EscrowStatus::Locked @ FluxError::InvalidEscrowStatus
    )]
    pub escrow: Account<'info, Escrow>,
    
    /// CHECK: Provider to receive payment
    #[account(mut)]
    pub provider: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn release_payment(
    ctx: Context<ReleasePayment>,
    _job_id: u64,
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;
    
    let platform_fee = (escrow.amount as u128 * PLATFORM_FEE_BPS as u128 / 10000) as u64;
    let provider_payment = escrow.amount.checked_sub(platform_fee)
        .ok_or(FluxError::ArithmeticOverflow)?;
    
    **escrow.to_account_info().try_borrow_mut_lamports()? -= provider_payment;
    **ctx.accounts.provider.try_borrow_mut_lamports()? += provider_payment;
    
    escrow.status = EscrowStatus::Released;
    escrow.released_at = clock.unix_timestamp;
    
    msg!("Released {} to provider (fee: {})", provider_payment, platform_fee);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct RefundClient<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [JOB_SEED, &job_id.to_le_bytes()],
        bump = job.bump,
        constraint = job.status == JobStatus::Failed || job.status == JobStatus::Cancelled @ FluxError::InvalidJobStatus
    )]
    pub job: Account<'info, Job>,
    
    #[account(
        mut,
        seeds = [ESCROW_SEED, &job_id.to_le_bytes()],
        bump = escrow.bump,
        constraint = escrow.status == EscrowStatus::Locked @ FluxError::InvalidEscrowStatus
    )]
    pub escrow: Account<'info, Escrow>,
    
    /// CHECK: Client to receive refund
    #[account(mut)]
    pub client: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn refund_client(
    ctx: Context<RefundClient>,
    _job_id: u64,
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;
    
    let refund_amount = escrow.amount;
    
    **escrow.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
    **ctx.accounts.client.try_borrow_mut_lamports()? += refund_amount;
    
    escrow.status = EscrowStatus::Refunded;
    escrow.released_at = clock.unix_timestamp;
    
    msg!("Refunded {} to client", refund_amount);
    
    Ok(())
}
