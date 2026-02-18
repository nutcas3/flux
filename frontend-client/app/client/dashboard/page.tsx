'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WalletButton } from '@/components/wallet/WalletButton';
import { Briefcase, Clock, CheckCircle, XCircle, DollarSign, Activity, Zap, Terminal } from 'lucide-react';
import type { JobDetails } from '@/lib/solana-client';

const mockJobs: JobDetails[] = [
  {
    id: 'FLX-9928',
    client: 'Client1...',
    provider: 'Provider1...',
    status: 'active',
    startTime: Date.now() - 3600000,
    duration: 2,
    cost: BigInt(100000000), // 0.1 SOL
  },
  {
    id: 'FLX-9927',
    client: 'Client1...',
    provider: 'Provider2...',
    status: 'completed',
    startTime: Date.now() - 7200000,
    duration: 4,
    cost: BigInt(200000000), // 0.2 SOL
    result: 'Job completed successfully',
  },
  {
    id: 'FLX-9926',
    client: 'Client1...',
    provider: 'Provider3...',
    status: 'pending',
    startTime: Date.now(),
    duration: 1,
    cost: BigInt(50000000), // 0.05 SOL
  },
];

export default function ClientDashboard() {
  const [jobs] = useState<JobDetails[]>(mockJobs);

  const activeInstances = jobs.filter(j => j.status === 'active').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const totalSpent = jobs.reduce((sum, j) => sum + Number(j.cost), 0) / 1e9;
  const totalVRAM = 320; // Mock: 320 GB VRAM
  const spendRate = 4.20; // Mock: $4.20/hr
  const walletBalance = 14.5; // Mock: 14.5 SOL

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#E8D1AB] text-[#331018]';
      case 'completed': return 'bg-[#A926B6]/20 text-[#A926B6]';
      case 'failed': return 'bg-[#DC694F]/20 text-[#DC694F]';
      default: return 'bg-[#994D6F]/20 text-[#994D6F]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
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
                <Link href="/marketplace" className="text-[#E8D1AB] hover:text-white transition-colors">
                  Marketplace
                </Link>
                <Link href="/provider/dashboard" className="text-[#E8D1AB] hover:text-white transition-colors">
                  Providers
                </Link>
                <Link href="/client/dashboard" className="text-white font-bold">
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
          <h1 className="text-4xl font-bold mb-2 text-[#331018]">Good morning, Architect.</h1>
          <p className="text-[#6B2850] text-lg">Your fleet is optimized and the lattice is stable. You have <span className="font-bold text-[#A926B6]">{(totalVRAM / 1000 * 32.4).toFixed(1)} Teraflops</span> of untapped power at your fingertips.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border-2 border-[#E8D1AB] rounded-xl p-6 hover:border-[#A926B6] transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-[#A926B6]" />
              <span className="text-[#6B2850] font-medium">Active Instances</span>
            </div>
            <div className="text-3xl font-bold text-[#331018]">{activeInstances} <span className="text-lg text-[#6B2850]">Nodes Running</span></div>
          </div>

          <div className="bg-white border-2 border-[#E8D1AB] rounded-xl p-6 hover:border-[#A926B6] transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-[#A926B6]" />
              <span className="text-[#6B2850] font-medium">Total Compute Power</span>
            </div>
            <div className="text-3xl font-bold text-[#331018]">{totalVRAM} <span className="text-lg text-[#6B2850]">GB VRAM</span></div>
          </div>

          <div className="bg-white border-2 border-[#E8D1AB] rounded-xl p-6 hover:border-[#A926B6] transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-[#994D6F]" />
              <span className="text-[#6B2850] font-medium">Current Spend Rate</span>
            </div>
            <div className="text-3xl font-bold text-[#331018]">${spendRate.toFixed(2)} <span className="text-lg text-[#6B2850]">/ hr</span></div>
          </div>

          <div className="bg-white border-2 border-[#E8D1AB] rounded-xl p-6 hover:border-[#DC694F] transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-[#DC694F]" />
              <span className="text-[#6B2850] font-medium">Wallet Balance</span>
            </div>
            <div className="text-3xl font-bold text-[#331018]">{walletBalance.toFixed(1)} <span className="text-lg text-[#6B2850]">SOL</span></div>
            <button className="mt-2 text-sm text-[#DC694F] hover:text-[#994D6F] font-semibold">Quick Refill →</button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#6B2850] to-[#331018] rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Performance Pulse</h2>
              <p className="text-[#E8D1AB]">Your workloads are currently running at <span className="font-bold text-white">98% efficiency</span>. No throttles detected.</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-[#E8D1AB] mb-1">Cost Efficiency</div>
              <div className="text-3xl font-bold text-[#DC694F]">42%</div>
              <div className="text-sm text-[#E8D1AB]">Saved vs. centralized cloud</div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/marketplace"
              className="p-6 bg-[#DC694F] hover:bg-[#994D6F] rounded-lg transition-all text-center group"
            >
              <Zap className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-lg">Deploy New Node</div>
              <div className="text-sm text-[#E8D1AB]">Scale horizontally in a heartbeat</div>
            </Link>
            <button className="p-6 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-center border border-[#E8D1AB]/30">
              <Terminal className="w-8 h-8 mx-auto mb-2" />
              <div className="font-bold text-lg">Open Terminal</div>
              <div className="text-sm text-[#E8D1AB]">SSH into your instances</div>
            </button>
          </div>
        </div>

        <div className="bg-white border-2 border-[#E8D1AB] rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-[#331018]">Active Jobs Table</h2>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="p-6 bg-[#E8D1AB]/10 border border-[#E8D1AB] rounded-xl hover:border-[#994D6F] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-[#994D6F]">#{job.id}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        {job.status.toUpperCase()}
                      </span>
                      {job.status === 'active' && (
                        <span className="px-3 py-1 bg-[#A926B6]/10 text-[#A926B6] rounded-full text-xs font-semibold flex items-center gap-1">
                          🛡️ SLA Verified
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[#6B2850] mb-2">
                      <span className="font-semibold">Hardware:</span> 1x NVIDIA H100
                    </div>
                    {job.status === 'active' && (
                      <div className="text-sm text-[#A926B6] font-semibold">
                        Uptime: 99.98%
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#331018]">
                      {(Number(job.cost) / 1e9).toFixed(3)} SOL
                    </div>
                    <div className="text-sm text-[#6B2850]">{job.duration} hours</div>
                  </div>
                </div>

                {job.status === 'active' && (
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-[#E8D1AB] hover:border-[#994D6F] text-[#331018] rounded-lg transition-colors text-sm font-semibold">
                      [SSH Key]
                    </button>
                    <button className="px-4 py-2 bg-white border border-[#E8D1AB] hover:border-[#994D6F] text-[#331018] rounded-lg transition-colors text-sm font-semibold">
                      [Logs]
                    </button>
                    <button className="flex-1 py-2 bg-[#DC694F] hover:bg-[#994D6F] text-white rounded-lg transition-colors font-semibold">
                      Terminate
                    </button>
                  </div>
                )}

                {job.status === 'completed' && job.result && (
                  <div className="mt-4 p-4 bg-[#A926B6]/10 border border-[#A926B6]/30 rounded-lg">
                    <div className="text-sm text-[#A926B6] font-semibold">✓ {job.result}</div>
                  </div>
                )}

                {job.status === 'pending' && (
                  <div className="mt-4 p-4 bg-[#994D6F]/10 border border-[#994D6F]/30 rounded-lg">
                    <div className="text-sm text-[#994D6F] font-semibold">⏳ Waiting for provider to accept...</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {jobs.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-[#E8D1AB]" />
              <p className="text-[#6B2850] mb-4 text-lg">No active workloads. Your compute power awaits.</p>
              <Link
                href="/marketplace"
                className="inline-block px-8 py-4 bg-[#DC694F] hover:bg-[#994D6F] text-white font-bold rounded-lg transition-colors"
              >
                Browse GPUs
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
