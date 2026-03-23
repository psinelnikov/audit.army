'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { prepareSubmitReview, uploadDocument } from '../../../lib/api';
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

export default function SubmitReviewPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    auditId: '',
    ipfsHash: '',
    documentUrl: '',
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setUploadResult({
        success: false,
        error: 'Invalid file type. Please upload PDF, images (JPEG/PNG), or Word documents.'
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadResult({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
    
    // Auto-upload the file
    await handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);

    try {
      const response = await uploadDocument(file);
      
      if (response.success) {
        setFormData({
          ...formData,
          ipfsHash: response.data.ipfsHash,
          documentUrl: response.data.documentUrl,
        });
        setUploadResult({
          success: true,
          data: response.data
        });
      } else {
        setUploadResult({
          success: false,
          error: response.error || 'Failed to upload document'
        });
      }
    } catch (error: any) {
      setUploadResult({
        success: false,
        error: error.message || 'Failed to upload document'
      });
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
      const response = await prepareSubmitReview({
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
        error: error.message || 'Failed to submit review',
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
            <CardTitle className="text-white">Submit Your Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="auditId" className="text-white font-semibold">Audit ID</Label>
                <Input
                  id="auditId"
                  type="text"
                  value={formData.auditId}
                  onChange={(e) => setFormData({ ...formData, auditId: e.target.value })}
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                  placeholder="1, 2, 3..."
                  required
                  disabled={!walletAddress}
                />
                <p className="text-sm text-gray-400 mt-1">
                  The ID of the audit you want to review
                </p>
              </div>

          <div>
                <Label className="text-white font-semibold">Upload Review Document</Label>
                <div className="space-y-4 mt-2">
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      disabled={!walletAddress || uploading}
                    />
                    <label
                      htmlFor="file-upload"
                      className={`cursor-pointer inline-block ${
                        (!walletAddress || uploading) ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-400'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="text-4xl">📄</div>
                        <p className="text-lg font-medium">
                          {uploading ? 'Uploading...' : 'Choose a file or drag it here'}
                        </p>
                        <p className="text-sm text-gray-400">
                          PDF, JPEG, PNG, or Word documents (max 10MB)
                        </p>
                      </div>
                    </label>
                  </div>

                  {uploadResult && uploadResult.success && (
                    <Alert className="border-green-700 bg-green-900">
                      <AlertDescription className="text-green-200">
                        ✓ File uploaded successfully!
                        <p className="text-sm text-gray-300 mt-2">
                          File: {uploadResult.data.filename}
                        </p>
                        <p className="text-sm text-gray-300">
                          Size: {(uploadResult.data.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {uploadResult && !uploadResult.success && (
                    <Alert className="border-red-700 bg-red-900">
                      <AlertDescription className="text-red-200">
                        ✗ {uploadResult.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {formData.ipfsHash && (
                    <Alert className="border-blue-700 bg-blue-900">
                      <AlertDescription className="text-blue-200">
                        📋 Document Details
                        <p className="text-sm text-gray-300 mt-2">
                          IPFS Hash: {formData.ipfsHash}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          This hash will be stored on the blockchain
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !walletAddress || !formData.ipfsHash || uploading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? 'Preparing Transaction...' : 
                 signing ? 'Signing...' : 
                 'Submit Review (Sign with Wallet)'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && result.success && result.txHash && (
          <Alert className="mt-6 border-blue-700 bg-blue-900">
            <AlertDescription className="text-blue-200">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">✓ Review Submitted!</h3>
                <p>Transaction Hash: {result.txHash}</p>
                <p className="text-sm">
                  Your review has been submitted to Sepolia. DAO members can now vote on its quality.
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
