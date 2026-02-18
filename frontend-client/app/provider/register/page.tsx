'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WalletButton } from '@/components/wallet/WalletButton';
import { Cpu, Shield, Zap } from 'lucide-react';

export default function RegisterProvider() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gpuModel: '',
    vram: 0,
    cpuCores: 0,
    pricePerHour: '',
    slaTier: 1,
    stakeAmount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    // TODO: Implement registration transaction
    console.log('Registering provider:', formData);
    router.push('/provider/dashboard');
  };

  return (
    <div className="min-h-screen bg-black">
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-bold text-[#E8D1AB]">
                FLUX
              </Link>
            </div>
            <WalletButton />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Register as Provider</h1>
          <p className="text-gray-400">Join the Flux network and start earning</p>
        </div>

        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? 'bg-[#DC694F] text-white' : 'bg-[#E8D1AB] text-[#331018]'
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`w-24 h-1 ${
                  step > s ? 'bg-[#DC694F]' : 'bg-[#E8D1AB]'
                }`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Cpu className="w-6 h-6 text-[#A926B6]" />
                <h2 className="text-2xl font-bold">Hardware Specifications</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  GPU Model
                </label>
                <input
                  type="text"
                  value={formData.gpuModel}
                  onChange={(e) => setFormData({ ...formData, gpuModel: e.target.value })}
                  placeholder="e.g., NVIDIA RTX 4090"
                  className="w-full px-4 py-3 bg-white border-2 border-[#E8D1AB] rounded-lg text-[#331018] focus:outline-none focus:border-[#A926B6]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    VRAM (GB)
                  </label>
                  <input
                    type="number"
                    value={formData.vram || ''}
                    onChange={(e) => setFormData({ ...formData, vram: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border-2 border-[#E8D1AB] rounded-lg text-[#331018] focus:outline-none focus:border-[#A926B6]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    CPU Cores
                  </label>
                  <input
                    type="number"
                    value={formData.cpuCores || ''}
                    onChange={(e) => setFormData({ ...formData, cpuCores: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border-2 border-[#E8D1AB] rounded-lg text-[#331018] focus:outline-none focus:border-[#A926B6]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Price Per Hour (SOL)
                </label>
                <input
                  type="text"
                  value={formData.pricePerHour}
                  onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                  placeholder="0.05"
                  className="w-full px-4 py-3 bg-white border-2 border-[#E8D1AB] rounded-lg text-[#331018] focus:outline-none focus:border-[#A926B6]"
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-[#A926B6]" />
                <h2 className="text-2xl font-bold">Hardware Attestation</h2>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <p className="text-gray-300 mb-4">
                  Hardware attestation verifies your GPU specifications using cryptographic proofs.
                </p>
                <button
                  type="button"
                  className="w-full py-3 bg-[#DC694F] hover:bg-[#994D6F] text-white font-semibold rounded-lg transition-colors"
                >
                  Run Attestation
                </button>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 text-sm">✓ Attestation completed successfully</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-6 h-6 text-[#DC694F]" />
                <h2 className="text-2xl font-bold">SLA Staking</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  SLA Tier
                </label>
                <select
                  value={formData.slaTier}
                  onChange={(e) => setFormData({ ...formData, slaTier: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E8D1AB] rounded-lg text-[#331018] focus:outline-none focus:border-[#A926B6]"
                >
                  <option value={1}>Tier 1 (95% uptime) - 5 SOL stake</option>
                  <option value={2}>Tier 2 (99% uptime) - 10 SOL stake</option>
                  <option value={3}>Tier 3 (99.9% uptime) - 20 SOL stake</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Stake Amount (SOL)
                </label>
                <input
                  type="text"
                  value={formData.stakeAmount}
                  onChange={(e) => setFormData({ ...formData, stakeAmount: e.target.value })}
                  placeholder="10"
                  className="w-full px-4 py-3 bg-white border-2 border-[#E8D1AB] rounded-lg text-[#331018] focus:outline-none focus:border-[#A926B6]"
                  required
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Staked funds will be locked and subject to slashing for SLA violations
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              {step === 3 ? 'Complete Registration' : 'Continue'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
