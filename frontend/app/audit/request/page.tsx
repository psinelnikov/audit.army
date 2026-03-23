'use client';

import { useState } from 'react';
import Link from 'next/link';
import { prepareCreateAudit } from '../../../lib/api';
import {
  signAndSendTransaction,
  waitForTransaction,
  getWalletState,
} from '../../../lib/wallet';

export default function RequestAuditPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    daoAddress: '',
    ipfsHash: '',
    amount: '0.01',
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

      // Prepare transaction
      const response = await prepareCreateAudit({
        ...formData,
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
        error: error.message || 'Failed to create audit',
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

        <h1 className="text-4xl font-bold mb-8">Request an Audit</h1>

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
            <label className="block mb-2 font-semibold">DAO Address</label>
            <input
              type="text"
              value={formData.daoAddress}
              onChange={(e) => setFormData({ ...formData, daoAddress: e.target.value })}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
              placeholder="0x123..."
              required
              disabled={!walletAddress}
            />
            <p className="text-sm text-gray-400 mt-1">
              The DAO address you want to request an audit from
            </p>
          </div>

          <div>
            <label className="block mb-2 font-semibold">IPFS Hash (Document Hash)</label>
            <input
              type="text"
              value={formData.ipfsHash}
              onChange={(e) => setFormData({ ...formData, ipfsHash: e.target.value })}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
              placeholder="Qm..."
              required
              disabled={!walletAddress}
            />
            <p className="text-sm text-gray-400 mt-1">
              Upload your documents to IPFS and paste the hash here
            </p>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Audit Fee (ETH)</label>
            <input
              type="number"
              step="0.001"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
              placeholder="0.01"
              required
              min="0.001"
              disabled={!walletAddress}
            />
            <p className="text-sm text-gray-400 mt-1">
              80% goes to reviewer, 20% to DAO treasury
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !walletAddress}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Preparing Transaction...' : 
             signing ? 'Signing...' : 
             'Request Audit (Pay & Sign)'}
          </button>
        </form>

        {result && result.success && result.txHash && (
          <div className="mt-6 p-6 rounded-lg bg-blue-900 border border-blue-700">
            <h3 className="text-xl font-bold mb-2">✓ Audit Request Started!</h3>
            <p className="mb-2">Transaction Hash: {result.txHash}</p>
            <p className="text-sm text-blue-200">
              Your transaction has been submitted to Sepolia with payment locked in escrow.
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
            The payment is locked in the smart contract escrow.
            You sign the transaction directly in your MetaMask wallet.
          </p>
        </div>
      </div>
    </div>
  );
}
