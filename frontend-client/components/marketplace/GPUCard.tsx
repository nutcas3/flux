'use client';

import { Cpu, HardDrive, Zap, Star } from 'lucide-react';
import type { GPUListing } from '@/lib/solana-client';

interface GPUCardProps {
  gpu: GPUListing;
  onRent: (gpu: GPUListing) => void;
}

export function GPUCard({ gpu, onRent }: GPUCardProps) {
  const pricePerHour = Number(gpu.pricePerHour) / 1e9; // Convert lamports to SOL

  return (
    <div className="bg-white border-2 border-[#E8D1AB] rounded-xl p-6 hover:border-[#A926B6] transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#331018] mb-1">{gpu.model}</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm text-black">{gpu.reputation.toFixed(1)}</span>
            </div>
            <span className="text-gray-600">•</span>
            <span className="text-sm text-black">{gpu.uptime}% uptime</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          gpu.available 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {gpu.available ? 'Available' : 'In Use'}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-black">
          <HardDrive className="w-5 h-5 text-black" />
          <span>{gpu.vram} GB VRAM</span>
        </div>
        <div className="flex items-center gap-3 text-black">
          <span>High Performance</span>
        </div>
        <div className="flex items-center gap-3 text-black">
          <Zap className="w-5 h-5 text-[#DC694F]" />
          <span>Instant Deployment</span>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4 mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-black">{pricePerHour.toFixed(4)}</span>
          <span className="text-gray-400">SOL/hour</span>
        </div>
      </div>

      <button
        onClick={() => onRent(gpu)}
        disabled={!gpu.available}
        className="w-full py-3 bg-[#DC694F] hover:bg-[#994D6F] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {gpu.available ? 'Rent Now' : 'Unavailable'}
      </button>
    </div>
  );
}
