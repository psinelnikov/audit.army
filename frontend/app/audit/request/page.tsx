'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createAudit } from '../../../lib/api';

export default function RequestAuditPage() {
  const [formData, setFormData] = useState({
    daoAddress: '',
    ipfsHash: '',
    amount: '0.01',
    privateKey: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await createAudit(formData);
      setResult(response);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Failed to create audit',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="text-blue-400 hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Request an Audit</h1>

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
            />
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
            />
            <p className="text-sm text-gray-400 mt-1">
              80% goes to reviewer, 20% to DAO treasury
            </p>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-red-400">
              Your Private Key (for prototype only)
            </label>
            <input
              type="password"
              value={formData.privateKey}
              onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
              placeholder="Your wallet private key"
              required
            />
            <p className="text-sm text-gray-400 mt-1">
              ⚠️ You need enough Sepolia ETH in this wallet to pay for the audit fee + gas
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating Audit...' : 'Request Audit (Pay)'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-6 rounded-lg ${result.success ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'}`}>
            {result.success ? (
              <div>
                <h3 className="text-xl font-bold mb-2">✓ Audit Requested Successfully!</h3>
                <p className="mb-2">Transaction Hash: {result.data.txHash}</p>
                <p>Audit ID: {result.data.auditId}</p>
                <p className="text-sm text-gray-300 mt-2">
                  Your audit is now in escrow. View on Sepolia block explorer.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold mb-2">✗ Error</h3>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
