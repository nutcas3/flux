use anchor_lang::prelude::*;

declare_id!("C9xzMFbaR39ftisYXsnbELsPpxgsMeeLW5fVH4fSVNiR");

#[program]
pub mod on_chain_contracts {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
