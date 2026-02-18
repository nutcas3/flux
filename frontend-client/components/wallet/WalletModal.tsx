'use client';

import { useWalletConnection } from '@solana/react-hooks';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect } = useWalletConnection();
  const wallets: any[] = []; // Wallet discovery handled by autoDiscover in provider

  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleConnect('phantom')}
            className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors border border-gray-700"
          >
            <span className="text-white font-medium">Phantom</span>
          </button>
          <button
            onClick={() => handleConnect('solflare')}
            className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors border border-gray-700"
          >
            <span className="text-white font-medium">Solflare</span>
          </button>
          <button
            onClick={() => handleConnect('backpack')}
            className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors border border-gray-700"
          >
            <span className="text-white font-medium">Backpack</span>
          </button>
          <div className="text-center py-4">
            <a
              href="https://phantom.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A926B6] hover:text-[#DC694F] underline text-sm"
            >
              Don't have a wallet? Install Phantom
            </a>
          </div>
        </div>

        <p className="text-gray-500 text-sm mt-6 text-center">
          By connecting, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
