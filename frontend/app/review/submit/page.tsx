'use client';

import { useState } from 'react';
import Link from 'next/link';
import { submitReview } from '../../../lib/api';

export default function SubmitReviewPage() {
  const [formData, setFormData] = useState({
    auditId: '',
    ipfsHash: '',
    privateKey: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await submitReview(formData);
      setResult(response);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Failed to submit review',
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

        <h1 className="text-4xl font-bold mb-8">Submit Your Review</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold">Audit ID</label>
            <input
              type="text"
              value={formData.auditId}
              onChange={(e) => setFormData({ ...formData, auditId: e.target.value })}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
              placeholder="1, 2, 3..."
              required
            />
            <p className="text-sm text-gray-400 mt-1">
              The ID of the audit you want to review
            </p>
          </div>

          <div>
            <label className="block mb-2 font-semibold">IPFS Hash (Review Report)</label>
            <input
              type="text"
              value={formData.ipfsHash}
              onChange={(e) => setFormData({ ...formData, ipfsHash: e.target.value })}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
              placeholder="Qm..."
              required
            />
            <p className="text-sm text-gray-400 mt-1">
              Upload your review report to IPFS and paste the hash here
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
              ⚠️ You must be the assigned reviewer for this audit
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-6 rounded-lg ${result.success ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'}`}>
            {result.success ? (
              <div>
                <h3 className="text-xl font-bold mb-2">✓ Review Submitted Successfully!</h3>
                <p className="mb-2">Transaction Hash: {result.data.txHash}</p>
                <p>Review ID: {result.data.reviewId}</p>
                <p className="text-sm text-gray-300 mt-2">
                  Your review has been submitted. DAO members will vote on its quality.
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
