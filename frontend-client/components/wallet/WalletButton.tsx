'use client';

import { useWalletConnection } from '@solana/react-hooks';
import { useState } from 'react';
import { Wallet, ChevronDown } from 'lucide-react';
import { WalletModal } from './WalletModal';

export function WalletButton() {
  const { wallet, disconnect } = useWalletConnection();
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (wallet) {
      disconnect();
    } else {
      setShowModal(true);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 bg-[#DC694F] hover:bg-[#994D6F] text-white rounded-lg font-medium transition-colors"
      >
        <Wallet className="w-4 h-4" />
        {wallet ? (
          <>
            <span>{formatAddress(wallet.account.address)}</span>
            <ChevronDown className="w-4 h-4" />
          </>
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>
      
      <WalletModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
