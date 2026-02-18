use anchor_lang::prelude::*;

#[constant]
pub const PROVIDER_SEED: &[u8] = b"provider";

#[constant]
pub const ATTESTATION_SEED: &[u8] = b"attestation";

#[constant]
pub const CHALLENGE_SEED: &[u8] = b"challenge";

#[constant]
pub const STAKE_SEED: &[u8] = b"stake";

#[constant]
pub const JOB_SLA_SEED: &[u8] = b"job_sla";

#[constant]
pub const REPUTATION_SEED: &[u8] = b"reputation";

#[constant]
pub const MARKET_STATE_SEED: &[u8] = b"market_state";

#[constant]
pub const AUCTION_SEED: &[u8] = b"auction";

#[constant]
pub const JOB_SEED: &[u8] = b"job";

#[constant]
pub const ESCROW_SEED: &[u8] = b"escrow";

// Time constants
pub const SECONDS_PER_HOUR: i64 = 3600;
pub const CHALLENGE_EXPIRY_SECONDS: i64 = 600; // 10 minutes
pub const REVERIFICATION_INTERVAL: i64 = 86400; // 24 hours
pub const UPTIME_CHECK_INTERVAL: i64 = 300; // 5 minutes

// Economic constants
pub const MIN_JOB_STAKE_LAMPORTS: u64 = 100_000_000; // 0.1 SOL
pub const PLATFORM_FEE_BPS: u16 = 250; // 2.5%
