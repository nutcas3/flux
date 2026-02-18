use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod errors;
pub mod constants;

use instructions::*;

declare_id!("C9xzMFbaR39ftisYXsnbELsPpxgsMeeLW5fVH4fSVNiR");

#[program]
pub mod flux_marketplace {
    use super::*;

    pub fn register_provider(
        ctx: Context<RegisterProvider>,
        gpu_model: String,
        vram_gb: u32,
        compute_capability: String,
        pcie_id: String,
    ) -> Result<()> {
        instructions::provider::register_provider(ctx, gpu_model, vram_gb, compute_capability, pcie_id)
    }

    pub fn submit_hardware_attestation(
        ctx: Context<SubmitHardwareAttestation>,
        device_fingerprint: [u8; 32],
        driver_version: String,
    ) -> Result<()> {
        instructions::attestation::submit_hardware_attestation(ctx, device_fingerprint, driver_version)
    }

    pub fn issue_benchmark_challenge(
        ctx: Context<IssueBenchmarkChallenge>,
        challenge_type: u8,
        input_data: Vec<u8>,
    ) -> Result<()> {
        instructions::attestation::issue_benchmark_challenge(ctx, challenge_type, input_data)
    }

    pub fn submit_benchmark_result(
        ctx: Context<SubmitBenchmarkResult>,
        result_hash: [u8; 32],
        execution_time_ms: u64,
        gpu_utilization: u8,
    ) -> Result<()> {
        instructions::attestation::submit_benchmark_result(ctx, result_hash, execution_time_ms, gpu_utilization)
    }

    pub fn stake_for_sla(
        ctx: Context<StakeForSLA>,
        amount: u64,
        tier: u8,
    ) -> Result<()> {
        instructions::sla::stake_for_sla(ctx, amount, tier)
    }

    pub fn lock_stake_for_job(
        ctx: Context<LockStakeForJob>,
        job_id: u64,
        duration_hours: u32,
    ) -> Result<()> {
        instructions::sla::lock_stake_for_job(ctx, job_id, duration_hours)
    }

    pub fn record_uptime_check(
        ctx: Context<RecordUptimeCheck>,
        is_online: bool,
        timestamp: i64,
    ) -> Result<()> {
        instructions::sla::record_uptime_check(ctx, is_online, timestamp)
    }

    pub fn execute_slash(
        ctx: Context<ExecuteSlash>,
        job_id: u64,
    ) -> Result<()> {
        instructions::sla::execute_slash(ctx, job_id)
    }

    pub fn unstake_sla(
        ctx: Context<UnstakeSLA>,
        amount: u64,
    ) -> Result<()> {
        instructions::sla::unstake_sla(ctx, amount)
    }

    pub fn mint_reputation_sbt(
        ctx: Context<MintReputationSBT>,
    ) -> Result<()> {
        instructions::reputation::mint_reputation_sbt(ctx)
    }

    pub fn update_reputation(
        ctx: Context<UpdateReputation>,
        job_id: u64,
        was_successful: bool,
        completion_time_hours: u32,
        job_value: u64,
    ) -> Result<()> {
        instructions::reputation::update_reputation(ctx, job_id, was_successful, completion_time_hours, job_value)
    }

    pub fn award_badge(
        ctx: Context<AwardBadge>,
        badge_type: u8,
    ) -> Result<()> {
        instructions::reputation::award_badge(ctx, badge_type)
    }

    pub fn initialize_market_state(
        ctx: Context<InitializeMarketState>,
        base_price_per_hour: u64,
    ) -> Result<()> {
        instructions::pricing::initialize_market_state(ctx, base_price_per_hour)
    }

    pub fn update_market_utilization(
        ctx: Context<UpdateMarketUtilization>,
        available_capacity: u64,
    ) -> Result<()> {
        instructions::pricing::update_market_utilization(ctx, available_capacity)
    }

    pub fn create_dutch_auction(
        ctx: Context<CreateDutchAuction>,
        starting_price: u64,
        reserve_price: u64,
        duration: i64,
    ) -> Result<()> {
        instructions::pricing::create_dutch_auction(ctx, starting_price, reserve_price, duration)
    }

    pub fn accept_auction_bid(
        ctx: Context<AcceptAuctionBid>,
    ) -> Result<()> {
        instructions::pricing::accept_auction_bid(ctx)
    }

    pub fn create_job(
        ctx: Context<CreateJob>,
        gpu_requirements: String,
        duration_hours: u32,
        max_price: u64,
    ) -> Result<()> {
        instructions::job::create_job(ctx, gpu_requirements, duration_hours, max_price)
    }

    pub fn assign_job_to_provider(
        ctx: Context<AssignJobToProvider>,
        job_id: u64,
    ) -> Result<()> {
        instructions::job::assign_job_to_provider(ctx, job_id)
    }

    pub fn start_job_execution(
        ctx: Context<StartJobExecution>,
        job_id: u64,
    ) -> Result<()> {
        instructions::job::start_job_execution(ctx, job_id)
    }

    pub fn submit_job_result(
        ctx: Context<SubmitJobResult>,
        job_id: u64,
        result_hash: [u8; 32],
        proof: Vec<u8>,
    ) -> Result<()> {
        instructions::job::submit_job_result(ctx, job_id, result_hash, proof)
    }

    pub fn verify_and_complete_job(
        ctx: Context<VerifyAndCompleteJob>,
        job_id: u64,
    ) -> Result<()> {
        instructions::job::verify_and_complete_job(ctx, job_id)
    }

    pub fn deposit_to_escrow(
        ctx: Context<DepositToEscrow>,
        job_id: u64,
        amount: u64,
    ) -> Result<()> {
        instructions::escrow::deposit_to_escrow(ctx, job_id, amount)
    }

    pub fn release_payment(
        ctx: Context<ReleasePayment>,
        job_id: u64,
    ) -> Result<()> {
        instructions::escrow::release_payment(ctx, job_id)
    }

    pub fn refund_client(
        ctx: Context<RefundClient>,
        job_id: u64,
    ) -> Result<()> {
        instructions::escrow::refund_client(ctx, job_id)
    }
}
