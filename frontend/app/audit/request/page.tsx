'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { prepareCreateAudit, uploadDocument } from '../../../lib/api';
import {
  signAndSendTransaction,
  waitForTransaction,
  getWalletState,
} from '../../../lib/wallet';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';

export default function RequestAuditPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    daoAddress: '',
    ipfsHash: '',
    amount: '0.01',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
  } | null>(null);
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

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadResult({ success: false, error: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const response = await uploadDocument(selectedFile);
      
      if (response.success) {
        setUploadResult(response);
        setFormData({ ...formData, ipfsHash: response.data.ipfsHash });
      } else {
        setUploadResult({ success: false, error: response.error || 'Upload failed' });
      }
    } catch (error) {
      setUploadResult({ success: false, error: 'Upload failed' });
    } finally {
      setUploading(false);
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

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Request an Audit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="daoAddress" className="text-white font-semibold">DAO Address</Label>
                <Input
                  id="daoAddress"
                  type="text"
                  value={formData.daoAddress}
                  onChange={(e) => setFormData({ ...formData, daoAddress: e.target.value })}
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                  placeholder="0x123..."
                  required
                  disabled={!walletAddress}
                />
                <p className="text-sm text-gray-400 mt-1">
                  The DAO address you want to request an audit from
                </p>
              </div>

              <div>
                <Label htmlFor="document" className="text-white font-semibold">Audit Document</Label>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center space-x-4">
                    <Input
                      id="document"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="bg-gray-700 border-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                      disabled={!walletAddress || uploading}
                    />
                    <Button
                      onClick={handleFileUpload}
                      disabled={!selectedFile || uploading || !walletAddress}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                  
                  {uploadResult && (
                    <Alert className={uploadResult.success ? 'border-green-700 bg-green-900' : 'border-red-700 bg-red-900'}>
                      <AlertDescription className={uploadResult.success ? 'text-green-200' : 'text-red-200'}>
                        {uploadResult.success 
                          ? `✅ Document uploaded successfully! IPFS Hash: ${uploadResult.data?.ipfsHash?.slice(0, 20)}...`
                          : `❌ ${uploadResult.error}`
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <p className="text-sm text-gray-400">
                    Upload your audit documents (PDF, Word, or images). Max file size: 10MB.
                  </p>
                </div>
                
                {/* Hidden IPFS hash field that gets auto-filled after upload */}
                <Input
                  id="ipfsHash"
                  type="hidden"
                  value={formData.ipfsHash}
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount" className="text-white font-semibold">Audit Fee (ETH)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.001"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                  placeholder="0.01"
                  required
                  min="0.001"
                  disabled={!walletAddress}
                />
                <p className="text-sm text-gray-400 mt-1">
                  80% goes to reviewer, 20% to DAO treasury
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || !walletAddress}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Preparing Transaction...' : 
                 signing ? 'Signing...' : 
                 'Request Audit (Pay & Sign)'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && result.success && result.txHash && (
          <Alert className="mt-6 border-blue-700 bg-blue-900">
            <AlertDescription className="text-blue-200">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">✓ Audit Request Started!</h3>
                <p>Transaction Hash: {result.txHash}</p>
                <p className="text-sm">
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
