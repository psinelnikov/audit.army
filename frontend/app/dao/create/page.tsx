'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { prepareCreateDAO } from '../../../lib/api';
import {
  signAndSendTransaction,
  waitForTransaction,
  getWalletState,
  switchToSepolia,
} from '../../../lib/wallet';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';

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

  useEffect(() => {
    checkWallet();
  }, []);

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
          <Alert className="mb-6 border-green-700 bg-green-900 text-green-200">
            <AlertDescription>
              ✓ Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
              <Button
                onClick={checkWallet}
                variant="outline"
                size="sm"
                className="mt-2 ml-4 border-green-800 text-green-200 hover:bg-green-800"
              >
                Refresh
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 border-yellow-700 bg-yellow-900 text-yellow-200">
            <AlertDescription>
              ⚠️ Please connect your wallet on the home page first
              <Link href="/" className="ml-4">
                <Button variant="outline" className="border-yellow-600 text-yellow-200 hover:bg-yellow-600">
                  Go to Home
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Create Your DAO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-white font-semibold">DAO Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                  placeholder="Crypto Audit DAO"
                  required
                  disabled={!walletAddress}
                />
              </div>

              <div>
                <Label htmlFor="symbol" className="text-white font-semibold">DAO Symbol</Label>
                <Input
                  id="symbol"
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                  placeholder="CAD"
                  required
                  maxLength={8}
                  disabled={!walletAddress}
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white font-semibold">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                  placeholder="A DAO for crypto audits"
                  rows={4}
                  required
                  disabled={!walletAddress}
                />
              </div>

              <div>
                <Label htmlFor="reviewers" className="text-white font-semibold">
                  Initial Reviewers (comma-separated addresses)
                </Label>
                <Input
                  id="reviewers"
                  type="text"
                  value={formData.initialReviewers}
                  onChange={(e) => setFormData({ ...formData, initialReviewers: e.target.value })}
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                  placeholder="0x123..., 0x456..."
                  required
                  disabled={!walletAddress}
                />
                <p className="text-sm text-gray-400 mt-1">
                  Must be valid Ethereum addresses starting with 0x
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || !walletAddress}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Preparing Transaction...' : 
                 signing ? 'Signing...' : 
                 'Create DAO (Sign with Wallet)'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && result.success && result.txHash && (
          <Alert className="mt-6 border-blue-700 bg-blue-900">
            <AlertDescription className="text-blue-200">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">✓ DAO Creation Started!</h3>
                <p>Transaction Hash: {result.txHash}</p>
                <p className="text-sm">
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
            </AlertDescription>
          </Alert>
        )}

        {result && !result.success && (
          <Alert className="mt-6 border-red-700 bg-red-900">
            <AlertDescription className="text-red-200">
              <h3 className="text-xl font-bold text-white mb-2">✗ Error</h3>
              <p>{result.error}</p>
            </AlertDescription>
          </Alert>
        )}

      </div>
    </div>
  );
}
