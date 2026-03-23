'use client';

import { useState } from 'react';
import Link from 'next/link';
import { prepareCreateDAO } from '../../../lib/api';
import {
  signAndSendTransaction,
  waitForTransaction,
  getWalletState,
  switchToSepolia,
} from '../../../lib/wallet';

export default function CreateDAOPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    initialReviewers: '',
  });
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
    txHash?: string;
  } | null>(null);

  const checkWallet = async () => {
    try {
      const state = await getWalletState();
      setWalletAddress(state.address || null);
    } catch (error) {
      console.error('Error checking wallet:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSigning(false);
    setResult(null);

    try {
      if (!walletAddress) {
        throw new Error('Please connect your wallet first');
      }

      const initialReviewers = formData.initialReviewers
        .split(',')
        .map((addr) => addr.trim())
        .filter((addr) => addr.startsWith('0x'));

      if (initialReviewers.length === 0) {
        throw new Error('Please provide at least one reviewer address');
      }

      // Prepare transaction
      const response = await prepareCreateDAO({
        ...formData,
        initialReviewers,
        walletAddress,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to prepare transaction');
      }

      // Sign and send transaction
      setSigning(true);
      const txHash = await signAndSendTransaction(response.data);
      setSigning(false);

      // Wait for transaction confirmation
      setResult({
        success: true,
        txHash,
      });

      await waitForTransaction(txHash);

      setResult({
        success: true,
        data: { txHash },
      });
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Failed to create DAO',
      });
    } finally {
      setLoading(false);
      setSigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="text-blue-400 hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Create Your DAO</h1>

        {walletAddress ? (
          <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg">
            <p className="text-sm text-green-200">
              ✓ Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
            </p>
            <button
              onClick={checkWallet}
              className="mt-2 text-xs bg-green-800 hover:bg-green-900 px-3 py-1 rounded"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
            <p className="text-yellow-200 mb-4">
              ⚠️ Please connect your wallet on the home page first
            </p>
            <Link href="/" className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg inline-block">
              Go to Home
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold">DAO Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
              placeholder="Crypto Audit DAO"
              required
              disabled={!walletAddress}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">DAO Symbol</label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
              placeholder="CAD"
              required
              maxLength={8}
              disabled={!walletAddress}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
              placeholder="A DAO for crypto audits"
              rows={4}
              required
              disabled={!walletAddress}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Initial Reviewers (comma-separated addresses)
            </label>
            <input
              type="text"
              value={formData.initialReviewers}
              onChange={(e) => setFormData({ ...formData, initialReviewers: e.target.value })}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
              placeholder="0x123..., 0x456..."
              required
              disabled={!walletAddress}
            />
            <p className="text-sm text-gray-400 mt-1">
              Must be valid Ethereum addresses starting with 0x
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !walletAddress}
            className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Preparing Transaction...' : 
             signing ? 'Signing...' : 
             'Create DAO (Sign with Wallet)'}
          </button>
        </form>

        {result && result.success && result.txHash && (
          <div className="mt-6 p-6 rounded-lg bg-blue-900 border border-blue-700">
            <h3 className="text-xl font-bold mb-2">✓ DAO Creation Started!</h3>
            <p className="mb-2">Transaction Hash: {result.txHash}</p>
            <p className="text-sm text-blue-200">
              Your transaction has been submitted to Sepolia. It will take 1-2 minutes to confirm.
            </p>
            <a
              href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline mt-4 inline-block"
            >
              View on Etherscan →
            </a>
          </div>
        )}

        {result && !result.success && (
          <div className="mt-6 p-6 rounded-lg bg-red-900 border border-red-700">
            <h3 className="text-xl font-bold mb-2">✗ Error</h3>
            <p>{result.error}</p>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h4 className="font-semibold mb-2">🔒 Security Information</h4>
          <p className="text-sm text-gray-300">
            Your private key is NEVER exposed or transmitted to the server.
            All transactions are signed directly in your MetaMask wallet.
            This is the secure, standard way web3 applications work.
          </p>
        </div>
      </div>
    </div>
  );
}
