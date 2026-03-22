'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string>('');

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask to use this prototype');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">🎖️ Audit Army</h1>
          <div className="flex items-center gap-4">
            {walletAddress ? (
              <div className="text-sm">
                Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        <div className="text-center py-20">
          <h2 className="text-5xl font-bold mb-6">Create Your Own Review DAOs</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Build decentralized auditing communities for any industry. Like having multiple specialized Better Business Bureaus.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link
              href="/dao/create"
              className="bg-green-600 hover:bg-green-700 p-6 rounded-lg text-left"
            >
              <h3 className="text-2xl font-bold mb-2">Create DAO</h3>
              <p className="text-gray-200">
                Launch your own specialized DAO for crypto, healthcare, finance, or any industry
              </p>
            </Link>

            <Link
              href="/audit/request"
              className="bg-blue-600 hover:bg-blue-700 p-6 rounded-lg text-left"
            >
              <h3 className="text-2xl font-bold mb-2">Request Audit</h3>
              <p className="text-gray-200">
                Submit audit requests and lock payment in smart contract escrow
              </p>
            </Link>

            <Link
              href="/review/submit"
              className="bg-purple-600 hover:bg-purple-700 p-6 rounded-lg text-left"
            >
              <h3 className="text-2xl font-bold mb-2">Submit Review</h3>
              <p className="text-gray-200">
                As a reviewer, submit your audit reports and earn from quality work
              </p>
            </Link>
          </div>
        </div>

        <div className="mt-20 text-center text-gray-400">
          <p className="text-sm">
            ⚠️ This is a working prototype. Do not use with real money.
          </p>
          <p className="text-sm mt-2">
            Smart contracts deployed to Sepolia testnet. Get test ETH at{' '}
            <a href="https://sepoliafaucet.com/" className="text-blue-400 hover:underline">
              Sepolia Faucet
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
