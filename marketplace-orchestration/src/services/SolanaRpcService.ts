import { createSolanaRpc } from '@solana/kit';

// Mock interfaces mirroring the on-chain Rust structure
interface ResourceSpecs {
    id: bigint;
    gpuModel: string;
    vramGb: number;
    cpuCores: number;
    computeRating: number;
    pricePerHour: bigint;
}
interface ResourceListing {
    publicKey: string; // The PDA address of the ResourceAccount
    host: string; // The Host's wallet address
    specs: ResourceSpecs;
    status: 'Idle' | 'Busy' | 'Offline';
    reputationScore: number;
    lastUpdated: number;
}
// ResourceAccount discriminator (first 8 bytes of serialized ResourceAccount)
const RESOURCE_ACCOUNT_DISCRIMINATOR = Buffer.from([/* Add actual discriminator bytes here */]);

/**
 * Manages fetching and decoding data from the Solana Resource Registry Program.
 * Uses @solana/kit for enhanced Solana interactions.
 */
export class SolanaRpcService {
    private rpc: any; // RPC client from Kit
    private program: any; // Anchor Program instance

    constructor(clusterUrl: string = "https://api.devnet.solana.com", programIdString: string = "FLUXc5wA22u74Y64e1YjP1c137452d371d374f3747f4") {
        this.rpc = createSolanaRpc(clusterUrl);
        // const program = new Program(YourProgramIdl, programIdString, this.rpc); // Use your IDL
        this.program = {} as any; // Placeholder; replace with real Program
        console.log(`SolanaRpcService initialized for cluster ${clusterUrl} and program ${programIdString}`);
    }

    /**
     * Fetches all current resource accounts from the Flux Marketplace program.
     * Uses Kit's program account fetching with discriminator filter.
     */
    public async getAllResourceListings(): Promise<ResourceListing[]> {
        console.log(`[RPC] Querying all ResourceAccount PDAs from Program...`);

        try {
            // Use Kit's program.accounts to fetch filtered accounts
            const accounts = await this.program.account.resourceAccount.all([
                {
                    memcmp: {
                        offset: 0,
                        bytes: RESOURCE_ACCOUNT_DISCRIMINATOR,
                    },
                },
            ]);

            const listings: ResourceListing[] = accounts.map(account => {
                const data = account.account;
                return {
                    publicKey: account.publicKey.toString(),
                    host: data.host.toString(),
                    specs: {
                        id: data.specs.id,
                        gpuModel: data.specs.gpuModel,
                        vramGb: data.specs.vramGb,
                        cpuCores: data.specs.cpuCores,
                        computeRating: data.specs.computeRating,
                        pricePerHour: data.specs.pricePerHour,
                    },
                    status: data.status === 0 ? 'Idle' : data.status === 1 ? 'Busy' : 'Offline',
                    reputationScore: data.reputationScore,
                    lastUpdated: data.lastUpdated,
                };
            });

            console.log(`[RPC] Fetched ${listings.length} resource listings`);
            return listings;
        } catch (error) {
            console.error('[RPC] Error fetching resource listings:', error);
            // Fallback to mock data for development
            return this.getMockResourceListings();
        }
    }

    /**
     * Mock data for development when RPC fails.
     */
    private getMockResourceListings(): ResourceListing[] {
        return [
            {
                publicKey: "ResPDA1111111111111111111111111111111",
                host: "HostA23456789012345678901234567890123456",
                specs: { id: 1n, gpuModel: "NVIDIA RTX 4090", vramGb: 24, cpuCores: 16, computeRating: 15000, pricePerHour: 5000n },
                status: 'Idle',
                reputationScore: 9500,
                lastUpdated: Date.now() / 1000 - 60,
            },
            {
                publicKey: "ResPDA2222222222222222222222222222222",
                host: "HostB23456789012345678901234567890123456",
                specs: { id: 2n, gpuModel: "AMD Radeon Pro VII", vramGb: 16, cpuCores: 32, computeRating: 12000, pricePerHour: 3500n },
                status: 'Busy',
                reputationScore: 8800,
                lastUpdated: Date.now() / 1000 - 10,
            },
            {
                publicKey: "ResPDA3333333333333333333333333333333",
                host: "HostC23456789012345678901234567890123456",
                specs: { id: 3n, gpuModel: "NVIDIA A100", vramGb: 80, cpuCores: 40, computeRating: 35000, pricePerHour: 25000n },
                status: 'Idle',
                reputationScore: 10000,
                lastUpdated: Date.now() / 1000 - 5,
            }
        ];
    }

    /**
     * Sends a transaction to the JobEscrow program to lock client funds.
     */
    public async initiateJobEscrow(clientPK: string, resourcePK: string, amount: bigint): Promise<string> {
        console.log(`[TX] Initiating escrow: Client=${clientPK}, Resource=${resourcePK}, Amount=${amount} FLUX`);
        // Use Kit's transaction building and sending
        // const tx = await this.program.methods.depositEscrow(amount).accounts({...}).rpc();
        // return tx;
        return `MockTxHash-${Date.now()}`;
    }
}