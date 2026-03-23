'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  connectWallet,
  getWalletState,
  switchToSepolia,
  isMetaMaskInstalled,
  formatAddress,
} from '../lib/wallet';
import { getWalletAddress } from '../lib/api';

export default function Home() {
  const [walletState, setWalletState] = useState<{
    isConnected: boolean;
    address: string | null;
    chainId: number | null;
    network: string | null;
  }>({
    isConnected: false,
    address: null,
    chainId: null,
    network: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const state = await getWalletState();
      setWalletState(state);
    } catch (err) {
      console.error('Error checking wallet:', err);
    }
  };

  const handleConnectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('Please install MetaMask to use this application');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const state = await connectWallet();
      setWalletState(state);

      // Check if on Sepolia, if not, switch
      if (state.chainId !== 11155111) {
        await switchToSepolia();
        // Update chain info after switch
        setTimeout(async () => {
          const newState = await getWalletState();
          setWalletState(newState);
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchNetwork = async () => {
    setLoading(true);
    setError(null);

    try {
      await switchToSepolia();
      setTimeout(async () => {
        const state = await getWalletState();
        setWalletState(state);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to switch network');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">🎖️ Audit Army</h1>
          
          <div className="flex items-center gap-4">
            {walletState.isConnected ? (
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">● Connected</span>
                  <span className="text-gray-400">
                    {formatAddress(walletState.address || '')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    walletState.network === 'Sepolia Testnet'
                      ? 'bg-green-600'
                      : 'bg-red-600'
                  }`}>
                    {walletState.network || 'Unknown'}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-900 border border-red-700 p-4 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="text-center py-20">
          <h2 className="text-5xl font-bold mb-6">Create Your Own Review DAOs</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Build decentralized auditing communities for any industry. Like having multiple specialized Better Business Bureaus.
          </p>

          {walletState.isConnected && walletState.network !== 'Sepolia Testnet' && (
            <div className="mb-8 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
              <p className="text-yellow-200 mb-4">
                ⚠️ Please switch to Sepolia testnet to use this prototype
              </p>
              <button
                onClick={handleSwitchNetwork}
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Switching...' : 'Switch to Sepolia'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link
              href="/dao/create"
              className="bg-green-600 hover:bg-green-700 p-6 rounded-lg text-left disabled:opacity-50"
              prefetch={false}
            >
              <h3 className="text-2xl font-bold mb-2">Create DAO</h3>
              <p className="text-gray-200">
                Launch your own specialized DAO for crypto, healthcare, finance, or any industry
              </p>
            </Link>

            <Link
              href="/audit/request"
              className="bg-blue-600 hover:bg-blue-700 p-6 rounded-lg text-left disabled:opacity-50"
              prefetch={false}
            >
              <h3 className="text-2xl font-bold mb-2">Request Audit</h3>
              <p className="text-gray-200">
                Submit audit requests and lock payment in smart contract escrow
              </p>
            </Link>

            <Link
              href="/review/submit"
              className="bg-purple-600 hover:bg-purple-700 p-6 rounded-lg text-left disabled:opacity-50"
              prefetch={false}
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
          <p className="text-sm mt-4">
            🔒 Your private key is NEVER exposed. All transactions are signed securely in your wallet.
          </p>
        </div>
      </div>
    </div>
  );
}
