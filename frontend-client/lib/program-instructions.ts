import { FLUX_PROGRAM_ID } from './solana-client';

export interface RentGPUParams {
  provider: string;
  hours: number;
  maxPrice: bigint;
}

export interface RegisterProviderParams {
  gpuModel: string;
  vram: number;
  cpuCores: number;
  computeRating: number;
  pricePerHour: bigint;
}

export interface StakeForSLAParams {
  amount: bigint;
  tier: number;
}

export async function buildRentGPUInstruction(params: RentGPUParams) {
  // This would use @solana-program/* builders in production
  // For now, returning instruction structure
  return {
    programId: FLUX_PROGRAM_ID,
    accounts: [
      { address: params.provider, role: 'writable' },
    ],
    data: new Uint8Array([
      0, // Instruction discriminator for rent_gpu
      ...encodeU64(BigInt(params.hours)),
      ...encodeU64(params.maxPrice),
    ]),
  };
}

export async function buildRegisterProviderInstruction(params: RegisterProviderParams) {
  return {
    programId: FLUX_PROGRAM_ID,
    accounts: [],
    data: new Uint8Array([
      1, // Instruction discriminator for register_provider
      ...encodeString(params.gpuModel),
      params.vram,
      params.cpuCores,
      ...encodeU32(params.computeRating),
      ...encodeU64(params.pricePerHour),
    ]),
  };
}

export async function buildStakeInstruction(params: StakeForSLAParams) {
  return {
    programId: FLUX_PROGRAM_ID,
    accounts: [],
    data: new Uint8Array([
      2, // Instruction discriminator for stake
      ...encodeU64(params.amount),
      params.tier,
    ]),
  };
}

function encodeU64(value: bigint): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, value, true);
  return new Uint8Array(buffer);
}

function encodeU32(value: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, value, true);
  return new Uint8Array(buffer);
}

function encodeString(str: string): Uint8Array {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  const length = new Uint8Array([encoded.length]);
  return new Uint8Array([...length, ...encoded]);
}
