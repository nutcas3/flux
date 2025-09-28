use anchor_lang::prelude::*;

declare_id!("C9xzMFbaR39ftisYXsnbELsPpxgsMeeLW5fVH4fSVNiR");

/// The Flux Compute Marketplace Core Program
#[program]
pub mod flux_marketplace {
    use super::*;

    /// Registers a new hardware resource account for a Host.
    pub fn register_resource(ctx: Context<RegisterResource>, specs: ResourceSpecs) -> Result<()> {
        require!(specs.price_per_hour > 0, FluxError::InvalidPrice);

        let resource_account = &mut ctx.accounts.resource_account;
        resource_account.host = ctx.accounts.host.key();
        resource_account.status = ResourceStatus::Idle;
        resource_account.specs = specs;
        resource_account.reputation_score = 1000; // Starting score
        resource_account.staked_flux = 0;
        resource_account.last_updated = Clock::get()?.unix_timestamp;
        msg!("Resource Registered by Host: {}", ctx.accounts.host.key());
        Ok(())
    }

    /// Updates the specs and status of an existing resource, mainly used by the Host Worker Node.
    pub fn update_resource_status(ctx: Context<UpdateResource>, new_status: ResourceStatus) -> Result<()> {
        let resource_account = &mut ctx.accounts.resource_account;
        // Authority check is automatically handled by the Anchor Context constraints.
        resource_account.status = new_status;
        resource_account.last_updated = Clock::get()?.unix_timestamp;
        msg!("Resource Status updated to: {:?}", new_status);
        Ok(())
    }

    // --- FUTURE FUNCTIONS (Placeholder for full system) ---
    // pub fn start_job(ctx: Context<StartJob>, job_id: u64, price_lamports: u64) -> Result<()> {...} // Used by JobEscrow
    // pub fn resolve_job(ctx: Context<ResolveJob>, job_result_hash: [u8; 32]) -> Result<()> {...} // Used by JobEscrow
    // pub fn slash_host(ctx: Context<SlashHost>, amount: u64) -> Result<()> {...} // Used by Governance/Verification
}

// ----------------------------------------------------------------
// --- ACCOUNTS & CONTEXTS ---
// ----------------------------------------------------------------

/// Context for the `register_resource` instruction.
#[derive(Accounts)]
#[instruction(specs: ResourceSpecs)]
pub struct RegisterResource<'info> {
    /// CHECK: The Host is the authority signing the transaction.
    #[account(mut)]
    pub host: Signer<'info>,

    // Creates the new Resource Account (The Resource Registry Entry)
    #[account(
        init,
        payer = host,
        space = 8 + ResourceAccount::INIT_SPACE, // Anchor automatically adds 8 bytes for account discriminator
        seeds = [b"resource", host.key().as_ref(), specs.id.to_le_bytes().as_ref()],
        bump
    )]
    pub resource_account: Account<'info, ResourceAccount>,
    pub system_program: Program<'info, System>,
}

/// Context for the `update_resource_status` instruction.
#[derive(Accounts)]
pub struct UpdateResource<'info> {
    // The Host must sign this transaction.
    #[account(mut)]
    pub host: Signer<'info>,

    // Ensures only the resource's owner can update the account.
    #[account(
        mut,
        has_one = host, // Anchor constraint: resource_account.host must equal host.key()
        seeds = [b"resource", host.key().as_ref(), resource_account.specs.id.to_le_bytes().as_ref()],
        bump
    )]
    pub resource_account: Account<'info, ResourceAccount>,
}

// ----------------------------------------------------------------
// --- DATA STRUCTURES ---
// ----------------------------------------------------------------

/// Main data structure for a registered compute resource.
#[account]
#[derive(InitSpace)]
pub struct ResourceAccount {
    pub host: Pubkey, // 32 bytes - The wallet of the resource provider (Host)
    pub specs: ResourceSpecs, // Variable size based on ResourceSpecs
    pub status: ResourceStatus, // 1 byte
    pub reputation_score: u16, // 2 bytes - 0 to 10000
    pub staked_flux: u64, // 8 bytes - Amount of $FLUX staked
    pub last_updated: i64, // 8 bytes - Timestamp of last status update
}

/// Hardware specifications provided by the Host.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct ResourceSpecs {
    pub id: u64, // 8 bytes - A unique identifier for this specific hardware unit (Host can assign this)
    #[max_len(20)]
    pub gpu_model: String, // Variable: 4 + (Max 20 chars)
    pub vram_gb: u8, // 1 byte
    pub cpu_cores: u8, // 1 byte
    pub compute_rating: u32, // 4 bytes - Benchmark score (Oracle fed)
    pub price_per_hour: u64, // 8 bytes - Price in $FLUX token base units
}

/// The current state of the resource.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, InitSpace)]
pub enum ResourceStatus {
    Idle,      // Available and waiting for a job
    Busy,      // Currently executing a job
    Offline,   // Worker Node not reporting in
    Suspended, // Slashed or temporarily banned
}

// Add error codes for the program
#[error_code]
pub enum FluxError {
    #[msg("The resource ID provided is already registered by this host.")]
    ResourceIdAlreadyExists,
    #[msg("Invalid price or zero price provided for resource.")]
    InvalidPrice,
}
