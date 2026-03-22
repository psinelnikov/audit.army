'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createDAO } from '../../../lib/api';

export default function CreateDAOPage() {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    initialReviewers: '',
    privateKey: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const initialReviewers = formData.initialReviewers
        .split(',')
        .map(addr => addr.trim())
        .filter(addr => addr.startsWith('0x'));

      const response = await createDAO({
        ...formData,
        initialReviewers,
      });

      setResult(response);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Failed to create DAO',
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

        <h1 className="text-4xl font-bold mb-8">Create Your DAO</h1>

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
            />
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
              ⚠️ In production, you would sign with your wallet. For this prototype, we use private key for simplicity.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating DAO...' : 'Create DAO'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-6 rounded-lg ${result.success ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'}`}>
            {result.success ? (
              <div>
                <h3 className="text-xl font-bold mb-2">✓ DAO Created Successfully!</h3>
                <p className="mb-2">Transaction Hash: {result.data.txHash}</p>
                <p>DAO Address: {result.data.daoAddress}</p>
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
