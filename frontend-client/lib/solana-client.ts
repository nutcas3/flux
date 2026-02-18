export const FLUX_PROGRAM_ID = 'FLUXmktpLaceH1pDePINGPUMarketV2000000000000000';

export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
export const BLINKS_API_URL = process.env.NEXT_PUBLIC_BLINKS_API_URL ?? 'http://localhost:3000';

export interface GPUListing {
  id: string;
  provider: string;
  model: string;
  vram: number;
  pricePerHour: bigint;
  available: boolean;
  reputation: number;
  uptime: number;
}

export interface ProviderStats {
  totalEarnings: bigint;
  activeJobs: number;
  completedJobs: number;
  reputation: number;
  stakedAmount: bigint;
  slaTier: number;
}

export interface JobDetails {
  id: string;
  client: string;
  provider: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  startTime: number;
  duration: number;
  cost: bigint;
  result?: string;
}
