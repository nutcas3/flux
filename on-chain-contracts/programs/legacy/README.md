# Legacy Contracts (Pinocchio-based)

## ⚠️ DEPRECATED

These contracts are the original Pinocchio-based implementation and are **no longer in active use**.

## Current Production Program

The production program is now:
- **Location**: `/programs/flux-marketplace/`
- **Framework**: Anchor 0.31.1
- **Program ID**: `FLUXmktpLaceH1pDePINGPUMarketV2000000000000000`

## Why These Are Archived

1. **Framework Migration**: Moved from Pinocchio to Anchor for better tooling and maintainability
2. **Enhanced Features**: New program includes:
   - Hardware attestation system
   - SLA enforcement with tiered staking
   - Reputation system with Soulbound Tokens
   - Dynamic pricing mechanisms
   - Comprehensive escrow system

3. **Better Testing**: Anchor provides superior testing infrastructure

## Migration Path

If you need to migrate data from the old contracts:

1. Read state from old program accounts
2. Transform data to new format
3. Initialize new accounts in flux-marketplace program
4. Transfer ownership/authority

## Reference Only

These contracts are kept for:
- Historical reference
- Understanding the evolution of the codebase
- Comparison with Pinocchio patterns

**Do not deploy or use these contracts in production.**

---

**Last Updated**: February 18, 2026
**Status**: Archived
