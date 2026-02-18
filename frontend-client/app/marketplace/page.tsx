'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WalletButton } from '@/components/wallet/WalletButton';
import { GPUCard } from '@/components/marketplace/GPUCard';
import { GPUFilter } from '@/components/marketplace/GPUFilter';
import { TransactionFlow } from '@/components/transaction/TransactionFlow';
import type { GPUListing } from '@/lib/solana-client';

const mockGPUs: GPUListing[] = [
  {
    id: '1',
    provider: 'Provider1...',
    model: 'NVIDIA RTX 4090',
    vram: 24,
    pricePerHour: BigInt(50000000), // 0.05 SOL
    available: true,
    reputation: 4.8,
    uptime: 99,
  },
  {
    id: '2',
    provider: 'Provider2...',
    model: 'NVIDIA A100',
    vram: 80,
    pricePerHour: BigInt(150000000), // 0.15 SOL
    available: true,
    reputation: 4.9,
    uptime: 100,
  },
  {
    id: '3',
    provider: 'Provider3...',
    model: 'NVIDIA RTX 3090',
    vram: 24,
    pricePerHour: BigInt(40000000), // 0.04 SOL
    available: false,
    reputation: 4.6,
    uptime: 98,
  },
  {
    id: '4',
    provider: 'Provider4...',
    model: 'NVIDIA H100',
    vram: 80,
    pricePerHour: BigInt(200000000), // 0.2 SOL
    available: true,
    reputation: 5.0,
    uptime: 100,
  },
];

export default function MarketplacePage() {
  const [gpus, setGpus] = useState<GPUListing[]>(mockGPUs);
  const [selectedGPU, setSelectedGPU] = useState<GPUListing | null>(null);
  const [showTransactionFlow, setShowTransactionFlow] = useState(false);

  const handleFilterChange = (filters: any) => {
    let filtered = [...mockGPUs];

    if (filters.search) {
      filtered = filtered.filter(gpu =>
        gpu.model.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.minVram > 0) {
      filtered = filtered.filter(gpu => gpu.vram >= filters.minVram);
    }

    if (filters.availableOnly) {
      filtered = filtered.filter(gpu => gpu.available);
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price':
          return Number(a.pricePerHour - b.pricePerHour);
        case 'reputation':
          return b.reputation - a.reputation;
        case 'vram':
          return b.vram - a.vram;
        default:
          return 0;
      }
    });

    setGpus(filtered);
  };

  const handleRent = (gpu: GPUListing) => {
    setSelectedGPU(gpu);
    setShowTransactionFlow(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-[#E8D1AB] bg-[#331018] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-bold text-[#E8D1AB]">
                FLUX
              </Link>
              <div className="hidden md:flex gap-6">
                <Link href="/marketplace" className="text-white font-bold">
                  Marketplace
                </Link>
                <Link href="/provider/dashboard" className="text-[#E8D1AB] hover:text-white transition-colors">
                  Providers
                </Link>
                <Link href="/client/dashboard" className="text-[#E8D1AB] hover:text-white transition-colors">
                  Clients
                </Link>
              </div>
            </div>
            <WalletButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-3 text-[#331018]">Choose Your Engine</h1>
          <p className="text-[#6B2850] text-lg">From H100s to localized clusters, pick the iron that matches your ambition.</p>
        </div>

        <GPUFilter onFilterChange={handleFilterChange} />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gpus.map((gpu) => (
            <GPUCard key={gpu.id} gpu={gpu} onRent={handleRent} />
          ))}
        </div>

        {gpus.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#6B2850] text-lg">No GPUs found matching your criteria</p>
          </div>
        )}
      </main>

      {showTransactionFlow && selectedGPU && (
        <TransactionFlow
          gpuModel={selectedGPU.model}
          pricePerHour={Number(selectedGPU.pricePerHour) / 1e9}
          hours={2}
          onComplete={() => {
            setShowTransactionFlow(false);
            window.location.href = '/client/dashboard';
          }}
          onCancel={() => setShowTransactionFlow(false)}
        />
      )}
    </div>
  );
}
