use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct RegisterProvider<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = Provider::MAX_SIZE,
        seeds = [PROVIDER_SEED, authority.key().as_ref()],
        bump
    )]
    pub provider: Account<'info, Provider>,
    
    pub system_program: Program<'info, System>,
}

pub fn register_provider(
    ctx: Context<RegisterProvider>,
    gpu_model: String,
    vram_gb: u32,
    compute_capability: String,
    pcie_id: String,
) -> Result<()> {
    let provider = &mut ctx.accounts.provider;
    let clock = Clock::get()?;
    
    provider.authority = ctx.accounts.authority.key();
    provider.gpu_model = gpu_model;
    provider.vram_gb = vram_gb;
    provider.compute_capability = compute_capability;
    provider.pcie_id = pcie_id;
    provider.registered_at = clock.unix_timestamp;
    provider.status = ProviderStatus::Pending;
    provider.total_jobs_completed = 0;
    provider.total_uptime_hours = 0;
    provider.bump = ctx.bumps.provider;
    
    msg!("Provider registered: {}", ctx.accounts.authority.key());
    
    Ok(())
}
