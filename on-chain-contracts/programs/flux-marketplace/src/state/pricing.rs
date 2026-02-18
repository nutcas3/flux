use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct MarketState {
    pub total_capacity: u64,
    pub available_capacity: u64,
    pub active_jobs: u32,
    pub base_price_per_hour: u64,
    pub current_multiplier: u16,
    pub last_update: i64,
    pub bump: u8,
}

impl MarketState {
    pub const MAX_SIZE: usize = 8 + // discriminator
        8 + // total_capacity
        8 + // available_capacity
        4 + // active_jobs
        8 + // base_price_per_hour
        2 + // current_multiplier
        8 + // last_update
        1; // bump

    pub fn calculate_utilization(&self) -> u16 {
        if self.total_capacity == 0 {
            return 0;
        }
        let used_capacity = self.total_capacity.saturating_sub(self.available_capacity);
        ((used_capacity as u128 * 10000) / self.total_capacity as u128) as u16
    }

    pub fn determine_surge_multiplier(&self) -> u16 {
        let utilization = self.calculate_utilization();
        
        if utilization >= 9500 {
            300 // 3.0x
        } else if utilization >= 8500 {
            200 // 2.0x
        } else if utilization >= 7000 {
            150 // 1.5x
        } else if utilization >= 5000 {
            120 // 1.2x
        } else {
            100 // 1.0x
        }
    }

    pub fn current_price(&self) -> u64 {
        let multiplier = self.determine_surge_multiplier();
        (self.base_price_per_hour as u128 * multiplier as u128 / 100) as u64
    }
}

#[account]
#[derive(Default)]
pub struct DutchAuction {
    pub resource_id: u64,
    pub provider: Pubkey,
    pub starting_price: u64,
    pub reserve_price: u64,
    pub current_price: u64,
    pub start_time: i64,
    pub duration: i64,
    pub price_decay_per_second: u64,
    pub status: AuctionStatus,
    pub bump: u8,
}

impl DutchAuction {
    pub const MAX_SIZE: usize = 8 + // discriminator
        8 + // resource_id
        32 + // provider
        8 + // starting_price
        8 + // reserve_price
        8 + // current_price
        8 + // start_time
        8 + // duration
        8 + // price_decay_per_second
        1 + // status
        1; // bump

    pub fn calculate_current_price(&self, current_time: i64) -> u64 {
        if current_time >= self.start_time + self.duration {
            return self.reserve_price;
        }

        let elapsed = current_time.saturating_sub(self.start_time);
        let price_reduction = self.price_decay_per_second.saturating_mul(elapsed as u64);
        self.starting_price
            .saturating_sub(price_reduction)
            .max(self.reserve_price)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq)]
pub enum AuctionStatus {
    #[default]
    Active,
    Sold,
    Expired,
}
