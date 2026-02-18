import { buildRentGPUInstruction, buildRegisterProviderInstruction, buildStakeInstruction } from './program-instructions';
import type { RentGPUParams, RegisterProviderParams, StakeForSLAParams } from './program-instructions';

export async function rentGPU(params: RentGPUParams): Promise<string> {
  try {
    const instruction = await buildRentGPUInstruction(params);
    
    // TODO: Build and send transaction using @solana/kit
    // const transaction = await buildTransaction([instruction]);
    // const signature = await sendTransaction(transaction);
    
    console.log('Rent GPU transaction:', instruction);
    return 'mock-signature-' + Date.now();
  } catch (error) {
    console.error('Failed to rent GPU:', error);
    throw new Error('Transaction failed');
  }
}

export async function registerProvider(params: RegisterProviderParams): Promise<string> {
  try {
    const instruction = await buildRegisterProviderInstruction(params);
    
    // TODO: Build and send transaction using @solana/kit
    console.log('Register provider transaction:', instruction);
    return 'mock-signature-' + Date.now();
  } catch (error) {
    console.error('Failed to register provider:', error);
    throw new Error('Transaction failed');
  }
}

export async function stakeForSLA(params: StakeForSLAParams): Promise<string> {
  try {
    const instruction = await buildStakeInstruction(params);
    
    // TODO: Build and send transaction using @solana/kit
    console.log('Stake transaction:', instruction);
    return 'mock-signature-' + Date.now();
  } catch (error) {
    console.error('Failed to stake:', error);
    throw new Error('Transaction failed');
  }
}

export async function waitForConfirmation(signature: string): Promise<boolean> {
  // TODO: Implement confirmation polling
  console.log('Waiting for confirmation:', signature);
  await new Promise(resolve => setTimeout(resolve, 2000));
  return true;
}
