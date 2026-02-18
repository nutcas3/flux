use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::FluxError;

#[derive(Accounts)]
pub struct InitializeMarketState<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = MarketState::MAX_SIZE,
        seeds = [MARKET_STATE_SEED],
        bump
    )]
    pub market_state: Account<'info, MarketState>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_market_state(
    ctx: Context<InitializeMarketState>,
    base_price_per_hour: u64,
) -> Result<()> {
    let market_state = &mut ctx.accounts.market_state;
    let clock = Clock::get()?;
    
    market_state.total_capacity = 0;
    market_state.available_capacity = 0;
    market_state.active_jobs = 0;
    market_state.base_price_per_hour = base_price_per_hour;
    market_state.current_multiplier = 100;
    market_state.last_update = clock.unix_timestamp;
    market_state.bump = ctx.bumps.market_state;
    
    msg!("Market state initialized with base price: {}", base_price_per_hour);
    
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateMarketUtilization<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [MARKET_STATE_SEED],
        bump = market_state.bump
    )]
    pub market_state: Account<'info, MarketState>,
}

pub fn update_market_utilization(
    ctx: Context<UpdateMarketUtilization>,
    available_capacity: u64,
) -> Result<()> {
    let market_state = &mut ctx.accounts.market_state;
    let clock = Clock::get()?;
    
    market_state.available_capacity = available_capacity;
    market_state.current_multiplier = market_state.determine_surge_multiplier();
    market_state.last_update = clock.unix_timestamp;
    
    let current_price = market_state.current_price();
    let utilization = market_state.calculate_utilization();
    
    msg!("Market updated: utilization={}%, price={}, multiplier={}x", 
        utilization as f64 / 100.0, 
        current_price,
        market_state.current_multiplier as f64 / 100.0
    );
    
    Ok(())
}

#[derive(Accounts)]
pub struct CreateDutchAuction<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [PROVIDER_SEED, authority.key().as_ref()],
        bump = provider.bump,
        constraint = provider.authority == authority.key()
    )]
    pub provider: Account<'info, Provider>,
    
    #[account(
        init,
        payer = authority,
        space = DutchAuction::MAX_SIZE,
        seeds = [AUCTION_SEED, provider.key().as_ref()],
        bump
    )]
    pub auction: Account<'info, DutchAuction>,
    
    pub system_program: Program<'info, System>,
}

pub fn create_dutch_auction(
    ctx: Context<CreateDutchAuction>,
    starting_price: u64,
    reserve_price: u64,
    duration: i64,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let clock = Clock::get()?;
    
    require!(starting_price > reserve_price, FluxError::InvalidInputData);
    require!(duration > 0, FluxError::InvalidInputData);
    
    let price_decay = (starting_price - reserve_price) / duration as u64;
    
    auction.resource_id = clock.unix_timestamp as u64;
    auction.provider = ctx.accounts.provider.key();
    auction.starting_price = starting_price;
    auction.reserve_price = reserve_price;
    auction.current_price = starting_price;
    auction.start_time = clock.unix_timestamp;
    auction.duration = duration;
    auction.price_decay_per_second = price_decay;
    auction.status = AuctionStatus::Active;
    auction.bump = ctx.bumps.auction;
    
    msg!("Dutch auction created: start={}, reserve={}, duration={}s", 
        starting_price, reserve_price, duration);
    
    Ok(())
}

#[derive(Accounts)]
pub struct AcceptAuctionBid<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    
    #[account(
        mut,
        seeds = [AUCTION_SEED, auction.provider.as_ref()],
        bump = auction.bump,
        constraint = auction.status == AuctionStatus::Active @ FluxError::AuctionNotActive
    )]
    pub auction: Account<'info, DutchAuction>,
    
    /// CHECK: Provider to receive payment
    #[account(mut)]
    pub provider: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn accept_auction_bid(ctx: Context<AcceptAuctionBid>) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let clock = Clock::get()?;
    
    require!(
        clock.unix_timestamp <= auction.start_time + auction.duration,
        FluxError::AuctionExpired
    );
    
    let final_price = auction.calculate_current_price(clock.unix_timestamp);
    
    auction.current_price = final_price;
    auction.status = AuctionStatus::Sold;
    
    **ctx.accounts.client.to_account_info().try_borrow_mut_lamports()? -= final_price;
    **ctx.accounts.provider.try_borrow_mut_lamports()? += final_price;
    
    msg!("Auction sold for {} lamports", final_price);
    
    Ok(())
}
