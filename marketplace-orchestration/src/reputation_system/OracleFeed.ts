import axios from 'axios';

// OracleFeed handles fetching external data for the reputation system using Pyth oracle on Solana.
// Pyth provides real-time price feeds and benchmarks for Solana-based assets.

export interface OracleData {
    benchmarkScore: number;
    pricePerHour: number;
    timestamp: number;
    source: string;
}

export class OracleFeed {
    private pythApiKey: string;
    private apiBaseUrl: string;

    constructor(apiKey?: string, baseUrl?: string) {
        this.pythApiKey = apiKey || process.env.PYTH_API_KEY || '';
        this.apiBaseUrl = baseUrl || 'https://hermes.pyth.network'; // Pyth's API endpoint for Solana
    }

    /**
     * Fetches compute benchmark data for a given resource spec using Pyth.
     * @param gpuModel - The GPU model to query benchmarks for.
     * @returns Promise<OracleData>
     */
    async fetchBenchmarkData(gpuModel: string): Promise<OracleData> {
        try {
            // Pyth focuses on prices; for benchmarks, we might need to map or use a proxy
            // For now, simulate benchmark fetch via Pyth's price data or a custom endpoint
            const response = await axios.get(`${this.apiBaseUrl}/api/price_feeds`, {
                params: { ids: ['benchmark_placeholder'] }, // Placeholder; adapt to Pyth's feed IDs
                headers: this.pythApiKey ? { 'Authorization': `Bearer ${this.pythApiKey}` } : {},
            });

            const data = response.data;
            return {
                benchmarkScore: data.score || 0, // Map from Pyth's data structure
                pricePerHour: data.price_per_hour || 0,
                timestamp: Date.now(),
                source: 'Pyth',
            };
        } catch (error) {
            console.error('Failed to fetch benchmark data from Pyth:', error);
            // Fallback to mock data if API fails
            return this.getMockBenchmarkData(gpuModel);
        }
    }

    /**
     * Fetches current FLUX price in USD from Pyth oracle.
     * @returns Promise<number>
     */
    async fetchFluxPrice(): Promise<number> {
        try {
            // Use Pyth's price feed for FLUX (if available) or a related token
            const response = await axios.get(`${this.apiBaseUrl}/api/latest_price_feeds`, {
                params: { ids: ['flux_price_feed_id'] }, // Replace with actual Pyth feed ID for FLUX
                headers: this.pythApiKey ? { 'Authorization': `Bearer ${this.pythApiKey}` } : {},
            });

            const priceData = response.data[0]; // Assuming first feed is FLUX
            return priceData.price || 0;
        } catch (error) {
            console.error('Failed to fetch FLUX price from Pyth:', error);
            return 1.0; // Fallback price
        }
    }

    /**
     * Updates resource reputation based on oracle data.
     * @param resourceId - The resource ID to update.
     * @param oracleData - The fetched oracle data.
     */
    async updateResourceReputation(resourceId: string, oracleData: OracleData): Promise<void> {
        // In a real implementation, this would interact with your backend or database
        // to update the resource's reputation score based on Pyth data.

        console.log(`Updating reputation for resource ${resourceId} using Pyth data:`, oracleData);

        // Example: Call your reputation system API or update local state
        // For now, just log the update
        // TODO: Integrate with your TypeScript backend or database
    }

    /**
     * Mock benchmark data for testing when API is unavailable.
     */
    private getMockBenchmarkData(gpuModel: string): OracleData {
        const mockScores: { [key: string]: number } = {
            'RTX 3080': 8500,
            'RTX 4090': 15000,
            'Tesla V100': 12000,
        };

        return {
            benchmarkScore: mockScores[gpuModel] || 5000,
            pricePerHour: 0.5, // Mock price
            timestamp: Date.now(),
            source: 'Mock',
        };
    }
}

// Example usage:
// const oracle = new OracleFeed();
// const data = await oracle.fetchBenchmarkData('RTX 4090');
// await oracle.updateResourceReputation('resource_123', data);