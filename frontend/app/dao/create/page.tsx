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
    <div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 camo-text">Create Your DAO</h1>

        {walletAddress ? (
          <Alert className="mb-6 border-primary bg-primary/10 camo-border">
            <AlertDescription className="text-primary">
              ✓ Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
              <Button
                onClick={checkWallet}
                variant="outline"
                size="sm"
                className="mt-2 ml-4 camo-border"
              >
                Refresh
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 border-secondary bg-secondary/10 camo-border">
            <AlertDescription className="text-secondary-foreground">
              ⚠️ Please connect your wallet on the home page first
              <Link href="/" className="ml-4">
                <Button variant="outline" className="camo-border">
                  Go to Home
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-card border-border camo-border">
          <CardContent className="space-y-6 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-foreground font-semibold">DAO Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2 bg-muted border-border text-foreground"
                  placeholder="My Audit DAO"
                  required
                  disabled={!walletAddress}
                />
              </div>

              <div>
                <Label htmlFor="symbol" className="text-foreground font-semibold">DAO Symbol</Label>
                <Input
                  id="symbol"
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="mt-2 bg-muted border-border text-foreground"
                  placeholder="MAD"
                  required
                  maxLength={8}
                  disabled={!walletAddress}
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-foreground font-semibold">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2 bg-muted border-border text-foreground"
                  placeholder="A decentralized audit community"
                  rows={4}
                  required
                  disabled={!walletAddress}
                />
              </div>

              <div>
                <Label htmlFor="reviewers" className="text-foreground font-semibold">
                  Initial Reviewers (comma-separated addresses)
                </Label>
                <Input
                  id="reviewers"
                  type="text"
                  value={formData.initialReviewers}
                  onChange={(e) => setFormData({ ...formData, initialReviewers: e.target.value })}
                  className="mt-2 bg-muted border-border text-foreground"
                  placeholder="0x123..., 0x456..."
                  required
                  disabled={!walletAddress}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Must be valid Ethereum addresses starting with 0x
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || !walletAddress}
                className="w-full bg-primary hover:bg-primary/90 camo-border"
              >
                {loading ? 'Preparing Transaction...' : 
                 signing ? 'Signing...' : 
                 'Create DAO (Sign with Wallet)'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && result.success && result.txHash && (
          <Alert className="mt-6 border-accent bg-accent/10 camo-border">
            <AlertDescription className="text-accent-foreground">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">✓ DAO Creation Started!</h3>
                <p>Transaction Hash: {result.txHash}</p>
                <p className="text-sm">
                  Your transaction has been submitted to Sepolia. It will take 1-2 minutes to confirm.
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline mt-4 inline-block"
                >
                  View on Etherscan →
                </a>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {result && !result.success && (
          <Alert className="mt-6 border-destructive bg-destructive/10 camo-border">
            <AlertDescription className="text-destructive">
              <h3 className="text-xl font-bold text-foreground mb-2">✗ Error</h3>
              <p>{result.error}</p>
            </AlertDescription>
          </Alert>
        )}

      </div>
    </div>
  );
}
