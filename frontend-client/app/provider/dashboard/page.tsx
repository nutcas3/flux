'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WalletButton } from '@/components/wallet/WalletButton';
import { Cpu, DollarSign, Briefcase, TrendingUp, Activity } from 'lucide-react';
import type { ProviderStats } from '@/lib/solana-client';

const mockStats: ProviderStats = {
  totalEarnings: BigInt(5000000000), // 5 SOL
  activeJobs: 3,
  completedJobs: 127,
  reputation: 4.8,
  stakedAmount: BigInt(10000000000), // 10 SOL
  slaTier: 2,
};

export default function ProviderDashboard() {
  const [stats] = useState<ProviderStats>(mockStats);

  const earnings = Number(stats.totalEarnings) / 1e9;
  const staked = Number(stats.stakedAmount) / 1e9;

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
                <Link href="/marketplace" className="text-[#E8D1AB] hover:text-white transition-colors">
                  Marketplace
                </Link>
                <Link href="/provider/dashboard" className="text-white font-bold">
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
          <h1 className="text-5xl font-bold mb-3 text-[#331018]">Provider Command Center</h1>
          <p className="text-[#6B2850] text-lg">Manage your GPU resources and maximize your earnings on the network.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border-2 border-[#E8D1AB] rounded-xl p-6 hover:border-[#A926B6] transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-[#A926B6]" />
              <span className="text-[#6B2850] font-medium">Total Earnings</span>
            </div>
            <div className="text-3xl font-bold text-[#331018]">{earnings.toFixed(2)} <span className="text-lg text-[#6B2850]">SOL</span></div>
          </div>

          <div className="bg-white border-2 border-[#E8D1AB] rounded-xl p-6 hover:border-[#A926B6] transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-[#A926B6]" />
              <span className="text-[#6B2850] font-medium">Active Jobs</span>
            </div>
            <div className="text-3xl font-bold text-[#331018]">{stats.activeJobs} <span className="text-lg text-[#6B2850]">Running</span></div>
          </div>

          <div className="bg-white border-2 border-[#E8D1AB] rounded-xl p-6 hover:border-[#A926B6] transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="w-5 h-5 text-[#994D6F]" />
              <span className="text-[#6B2850] font-medium">Completed Jobs</span>
            </div>
            <div className="text-3xl font-bold text-[#331018]">{stats.completedJobs}</div>
          </div>

          <div className="bg-white border-2 border-[#E8D1AB] rounded-xl p-6 hover:border-[#DC694F] transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#DC694F]" />
              <span className="text-[#6B2850] font-medium">Reputation</span>
            </div>
            <div className="text-3xl font-bold text-[#331018]">{stats.reputation.toFixed(1)} <span className="text-lg text-[#6B2850]">/ 5.0</span></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#6B2850] to-[#331018] rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">SLA Staking</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-3">
                  <span className="text-[#E8D1AB]">Staked Amount</span>
                  <span className="text-white font-bold text-lg">{staked.toFixed(2)} SOL</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-[#E8D1AB]">SLA Tier</span>
                  <span className="text-white font-bold text-lg">Tier {stats.slaTier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#E8D1AB]">Guaranteed Uptime</span>
                  <span className="text-[#A926B6] font-bold">99%</span>
                </div>
              </div>
              <button className="w-full py-3 bg-[#DC694F] hover:bg-[#994D6F] text-white font-bold rounded-lg transition-colors shadow-lg">
                Increase Stake
              </button>
            </div>
          </div>

          <div className="bg-white border-2 border-[#E8D1AB] rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#331018]">Hardware Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-[#A926B6]" />
                  <span className="text-[#331018] font-semibold">NVIDIA RTX 4090</span>
                </div>
                <span className="px-3 py-1 bg-[#A926B6]/10 text-[#A926B6] rounded-full text-sm font-semibold">● Online</span>
              </div>
              <div className="text-sm text-[#6B2850] space-y-1">
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="font-semibold text-[#A926B6]">99.8%</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Attestation:</span>
                  <span className="font-semibold">2 hours ago</span>
                </div>
              </div>
              <Link
                href="/provider/register"
                className="block w-full py-3 bg-white border-2 border-[#E8D1AB] hover:bg-[#E8D1AB] text-[#331018] font-semibold rounded-lg transition-colors text-center"
              >
                Register New GPU
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-[#E8D1AB] rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-[#331018]">Recent Jobs</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-[#E8D1AB]/10 border border-[#E8D1AB] rounded-xl hover:border-[#994D6F] transition-colors">
                <div>
                  <div className="font-bold text-[#331018] text-lg">Job #FLX-{1000 + i}</div>
                  <div className="text-sm text-[#6B2850]">Client: {`Client${i}...`}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#331018] text-lg">0.05 SOL</div>
                  <div className="text-sm text-[#6B2850]">2 hours</div>
                </div>
                <span className="px-4 py-2 bg-[#E8D1AB] text-[#331018] rounded-full text-sm font-semibold">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
