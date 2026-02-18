import { Router } from 'express';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ACTIONS_CORS_HEADERS, ActionGetResponse, ActionPostResponse } from '@solana/actions';

const router = Router();

const FLUX_PROGRAM_ID = new PublicKey('FLUXmktpLaceH1pDePINGPUMarketV2000000000000000');
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

router.get('/', async (req, res) => {
  const { gpu = 'A100', hours = '1' } = req.query;
  
  const response: ActionGetResponse = {
    icon: 'https://flux.market/gpu-icon.png',
    title: `Rent ${gpu} GPU`,
    description: `Rent a ${gpu} GPU for ${hours} hour(s) on Flux Network. Decentralized, trustless, and cost-effective compute power.`,
    label: `Rent for ${calculatePrice(gpu as string, parseInt(hours as string))} SOL`,
    links: {
      actions: [
        {
          type: 'transaction',
          label: '1 Hour',
          href: `/api/actions/rent-gpu?gpu=${gpu}&hours=1`,
        },
        {
          type: 'transaction',
          label: '4 Hours',
          href: `/api/actions/rent-gpu?gpu=${gpu}&hours=4`,
        },
        {
          type: 'transaction',
          label: '24 Hours',
          href: `/api/actions/rent-gpu?gpu=${gpu}&hours=24`,
        },
        {
          type: 'transaction',
          label: 'Custom Duration',
          href: `/api/actions/rent-gpu?gpu=${gpu}&hours={hours}`,
          parameters: [
            {
              name: 'hours',
              label: 'Number of hours',
              required: true,
            },
          ],
        },
      ],
    },
  };
  
  res.set(ACTIONS_CORS_HEADERS).json(response);
});

router.post('/', async (req, res) => {
  try {
    const { account } = req.body;
    const { gpu = 'A100', hours = '1' } = req.query;
    
    if (!account) {
      return res.status(400).json({ error: 'Account required' });
    }
    
    const userPubkey = new PublicKey(account);
    const gpuType = gpu as string;
    const duration = parseInt(hours as string);
    
    const connection = new Connection(RPC_URL);
    
    const transaction = await buildRentGPUTransaction(
      connection,
      userPubkey,
      gpuType,
      duration
    );
    
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    
    const response: ActionPostResponse = {
      type: 'transaction',
      transaction: serialized.toString('base64'),
      message: `Successfully rented ${gpuType} for ${duration} hours!`,
    };
    
    res.set(ACTIONS_CORS_HEADERS).json(response);
  } catch (error) {
    console.error('Error building transaction:', error);
    res.status(500).json({ error: 'Failed to build transaction' });
  }
});

router.options('/', (req, res) => {
  res.set(ACTIONS_CORS_HEADERS).status(200).end();
});

async function buildRentGPUTransaction(
  connection: Connection,
  user: PublicKey,
  gpuType: string,
  hours: number
): Promise<Transaction> {
  const transaction = new Transaction();
  
  const [jobPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('job'), Buffer.from(Date.now().toString())],
    FLUX_PROGRAM_ID
  );
  
  const [escrowPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), Buffer.from(Date.now().toString())],
    FLUX_PROGRAM_ID
  );
  
  const amount = calculatePrice(gpuType, hours) * LAMPORTS_PER_SOL;
  
  const createJobIx = createJobInstruction(
    user,
    jobPDA,
    escrowPDA,
    amount,
    gpuType,
    hours
  );
  
  transaction.add(createJobIx);
  
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = user;
  
  return transaction;
}

function calculatePrice(gpuType: string, hours: number): number {
  const rates: Record<string, number> = {
    'A100': 0.25,
    'H100': 0.50,
    'RTX4090': 0.15,
    'V100': 0.20,
  };
  return (rates[gpuType] || 0.20) * hours;
}

function createJobInstruction(
  user: PublicKey,
  jobPDA: PublicKey,
  escrowPDA: PublicKey,
  amount: number,
  gpuType: string,
  hours: number
) {
  const data = Buffer.alloc(200);
  let offset = 0;
  
  data.writeUInt8(0, offset);
  offset += 1;
  
  const gpuBytes = Buffer.from(gpuType);
  data.writeUInt32LE(gpuBytes.length, offset);
  offset += 4;
  gpuBytes.copy(data, offset);
  offset += gpuBytes.length;
  
  data.writeUInt32LE(hours, offset);
  offset += 4;
  
  data.writeBigUInt64LE(BigInt(amount), offset);
  
  return {
    programId: FLUX_PROGRAM_ID,
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: jobPDA, isSigner: false, isWritable: true },
      { pubkey: escrowPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  };
}

export { router as rentGPURouter };
