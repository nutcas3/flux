'use client';

import { useState } from 'react';
import { Shield, Zap, CheckCircle, Loader2 } from 'lucide-react';

interface TransactionFlowProps {
  gpuModel: string;
  pricePerHour: number;
  hours: number;
  onComplete: () => void;
  onCancel: () => void;
}

type FlowStep = 'selection' | 'attestation' | 'execution' | 'success';

export function TransactionFlow({ gpuModel, pricePerHour, hours, onComplete, onCancel }: TransactionFlowProps) {
  const [step, setStep] = useState<FlowStep>('selection');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalCost = (pricePerHour * hours).toFixed(3);
  const networkFee = 0.000005;

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    // Step 1: Selection -> Attestation
    if (step === 'selection') {
      setTimeout(() => {
        setStep('attestation');
        setIsProcessing(false);
      }, 1000);
      return;
    }

    // Step 2: Attestation -> Execution
    if (step === 'attestation') {
      setTimeout(() => {
        setStep('execution');
        setIsProcessing(false);
      }, 2000);
      return;
    }

    // Step 3: Execution -> Success
    if (step === 'execution') {
      setTimeout(() => {
        setStep('success');
        setIsProcessing(false);
      }, 1500);
      return;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#331018]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border-2 border-[#E8D1AB]">
        
        {/* Step 1: Resource Selection */}
        {step === 'selection' && (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-[#331018] mb-4">Claim Your Power</h2>
            <p className="text-[#6B2850] mb-6">
              From H100s to localized clusters, pick the iron that matches your ambition.
            </p>

            <div className="bg-[#E8D1AB]/20 border-2 border-[#E8D1AB] rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-[#6B2850] mb-1">Selected Hardware</div>
                  <div className="text-2xl font-bold text-[#331018]">{gpuModel}</div>
                </div>
                <div className="px-4 py-2 bg-[#A926B6] text-white rounded-lg font-semibold">
                  Best Value for LLM Training
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-[#6B2850]">Duration</div>
                  <div className="font-bold text-[#331018]">{hours} hours</div>
                </div>
                <div>
                  <div className="text-[#6B2850]">Rate</div>
                  <div className="font-bold text-[#331018]">{pricePerHour} SOL/hr</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E8D1AB] rounded-xl p-4 mb-6">
              <div className="text-sm text-[#6B2850] mb-3">Order Summary</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6B2850]">Compute Cost</span>
                  <span className="font-semibold text-[#331018]">{totalCost} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B2850]">Network Fee</span>
                  <span className="font-semibold text-[#331018]">{networkFee} SOL</span>
                </div>
                <div className="border-t border-[#E8D1AB] pt-2 flex justify-between">
                  <span className="font-bold text-[#331018]">Total (Escrowed)</span>
                  <span className="font-bold text-[#DC694F] text-lg">{(parseFloat(totalCost) + networkFee).toFixed(6)} SOL</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#6B2850] italic mb-6">
              Securing high-performance hardware on Solana. Your rental is protected by on-chain SLA.
            </p>

            <div className="flex gap-4">
              <button
                onClick={onCancel}
                className="flex-1 py-3 border-2 border-[#E8D1AB] text-[#331018] rounded-lg font-semibold hover:bg-[#E8D1AB]/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 py-3 bg-[#DC694F] hover:bg-[#994D6F] text-white rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Cryptographic Attestation */}
        {step === 'attestation' && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#A926B6]/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#A926B6]">
                <Shield className="w-10 h-10 text-[#A926B6] animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold text-[#331018] mb-2">Auditing the Metal</h2>
              <p className="text-[#6B2850]">
                We don't just take their word for it. FLUX is currently performing a cryptographic handshake with the GPU.
              </p>
            </div>

            <div className="bg-[#E8D1AB]/20 border border-[#E8D1AB] rounded-xl p-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B2850]">Scanning VRAM integrity...</span>
                  <CheckCircle className="w-5 h-5 text-[#A926B6]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B2850]">Verifying compute rating...</span>
                  <CheckCircle className="w-5 h-5 text-[#A926B6]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B2850]">Staking collateral...</span>
                  <Loader2 className="w-5 h-5 text-[#A926B6] animate-spin" />
                </div>
              </div>
            </div>

            <div className="bg-[#A926B6]/10 border border-[#A926B6]/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-[#A926B6] font-semibold">
                ✓ You're paying for 80GB. We're ensuring you get 80GB.
              </p>
            </div>

            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="w-full py-3 bg-[#DC694F] hover:bg-[#994D6F] text-white rounded-lg font-bold transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Verifying...' : 'Proceed to Payment'}
            </button>
          </div>
        )}

        {/* Step 3: Smart Contract Execution */}
        {step === 'execution' && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#DC694F]/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#DC694F]">
                <Zap className="w-10 h-10 text-[#DC694F] animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold text-[#331018] mb-2">Commit to the Compute</h2>
              <p className="text-[#6B2850]">
                Near-zero gas, lightning-fast finality. Your workload starts before the transaction hash even cools.
              </p>
            </div>

            <div className="bg-[#E8D1AB]/20 border-2 border-[#E8D1AB] rounded-xl p-6 mb-6">
              <div className="text-center mb-4">
                <div className="text-sm text-[#6B2850] mb-2">Transaction Details</div>
                <div className="text-3xl font-bold text-[#DC694F] mb-1">{totalCost} SOL</div>
                <div className="text-sm text-[#6B2850]">Escrowed until job completion</div>
              </div>
              
              <div className="border-t border-[#E8D1AB] pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B2850]">Network</span>
                  <span className="font-semibold text-[#331018]">Solana Devnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B2850]">Gas Fee</span>
                  <span className="font-semibold text-[#331018]">{networkFee} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B2850]">SLA Protection</span>
                  <span className="font-semibold text-[#A926B6]">✓ Guaranteed</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#6B2850] text-center mb-6 italic">
              SLA guaranteed. Funds held in secure escrow until job completion.
            </p>

            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="w-full py-4 bg-[#DC694F] hover:bg-[#994D6F] text-white rounded-lg font-bold text-lg transition-colors disabled:opacity-50 shadow-lg"
            >
              {isProcessing ? 'Authorizing...' : 'Authorize & Ignite Workload'}
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="p-8 bg-gradient-to-br from-[#6B2850] to-[#331018] text-white rounded-2xl">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#E8D1AB]">
                <CheckCircle className="w-12 h-12 text-[#E8D1AB]" />
              </div>
              <h2 className="text-4xl font-bold mb-3">We Have Liftoff.</h2>
              <p className="text-[#E8D1AB] text-lg">
                Your instance is live. Your SSH tunnel is primed and ready for commands.
              </p>
            </div>

            <div className="bg-white/10 border border-[#E8D1AB]/30 rounded-xl p-6 mb-6">
              <div className="text-sm text-[#E8D1AB] mb-3">Instance Details</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#E8D1AB]">Instance ID</span>
                  <span className="font-mono font-semibold text-white">FLX-{Math.floor(Math.random() * 10000)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#E8D1AB]">Hardware</span>
                  <span className="font-semibold text-white">{gpuModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#E8D1AB]">Status</span>
                  <span className="font-semibold text-[#DC694F]">● RUNNING</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="py-3 bg-white text-[#331018] rounded-lg font-bold hover:bg-[#E8D1AB] transition-colors">
                Open Terminal
              </button>
              <button
                onClick={() => {
                  onComplete();
                }}
                className="py-3 bg-[#E8D1AB]/20 text-[#E8D1AB] border border-[#E8D1AB] rounded-lg font-bold hover:bg-[#E8D1AB]/30 transition-colors"
              >
                View Live Metrics
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
