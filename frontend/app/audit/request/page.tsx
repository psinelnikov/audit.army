'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // Read query parameters immediately
  const daoAddress = searchParams.get('dao');
  const daoName = searchParams.get('name');
  const auditEscrowAddress = searchParams.get('auditEscrowAddress');
  
  const [daoInfo, setDaoInfo] = useState({
    address: daoAddress || '',
    name: daoName || '',
  });
  const [formData, setFormData] = useState({
    ipfsHash: '',
    amount: '0.00000001',
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
  }, [searchParams]);

  const checkWallet = async () => {
    try {
      const state = await getWalletState();
      setWalletAddress(state.address || null);
    } catch (error) {
      console.error('Error checking wallet:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) {
      setUploadResult({ success: false, error: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const response = await uploadDocument(file);
      
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

      if (!daoInfo.address) {
        throw new Error('DAO address is required');
      }

      if (!formData.ipfsHash) {
        throw new Error('Please upload a document first');
      }

      // Validate DAO address format
      if (!daoInfo.address.startsWith('0x') || daoInfo.address.length !== 42) {
        throw new Error('Invalid DAO address format');
      }

      // Prepare transaction
      const response = await prepareCreateAudit({
        ipfsHash: formData.ipfsHash,
        amount: formData.amount,
        walletAddress,
        auditEscrowAddress: auditEscrowAddress || '',
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

      // Refresh any cached audit data
      if (typeof window !== 'undefined') {
        // Clear any potential cache
        localStorage.removeItem(`audits_${daoInfo.address}`);
      }
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
    <div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2 camo-text">
          {daoInfo.name ? `Request Audit from ${daoInfo.name}` : 'Request an Audit'}
        </h1>
        {daoInfo.name && (
          <p className="text-muted-foreground mb-8">
            Submit your smart contract for audit by {daoInfo.name}
          </p>
        )}
        <Card className="bg-card border-border camo-border">
          <CardContent className="space-y-6 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="daoAddress" className="text-foreground font-semibold">DAO Address</Label>
                <Input
                  id="daoAddress"
                  type="text"
                  value={daoInfo.address}
                  className="mt-2 bg-muted border-border text-foreground"
                  placeholder="0x123..."
                  required
                  disabled={!walletAddress}
                  readOnly
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {daoInfo.address !== '' 
                    ? `Requesting audit from ${daoInfo.name || 'this DAO'}`
                    : 'The DAO address you want to request an audit from'
                  }
                </p>
              </div>

              <div>
                <Label htmlFor="document" className="text-foreground font-semibold">Audit Document</Label>
                <div className="mt-2 space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      id="document"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedFile(file);
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                      className="hidden"
                      disabled={!walletAddress || uploading}
                    />
                    <label
                      htmlFor="document"
                      className={`cursor-pointer inline-block ${
                        (!walletAddress || uploading) ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="text-5xl text-center">📄</div>
                        <p className="text-lg font-medium text-center">
                          {uploading ? 'Uploading...' : selectedFile ? selectedFile.name : 'Choose a file or drag it here'}
                        </p>
                        <p className="text-sm text-muted-foreground text-center max-w-xs mx-auto">
                          PDF, Word, or images (max 10MB)
                        </p>
                      </div>
                    </label>
                  </div>
                  
                  {uploading && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Uploading document...</p>
                    </div>
                  )}
                
                  {uploadResult && (
                    <Alert className={uploadResult.success ? 'border-accent bg-accent/10 camo-border' : 'border-destructive bg-destructive/10 camo-border'}>
                      <AlertDescription className={uploadResult.success ? 'text-accent-foreground' : 'text-destructive'}>
                        {uploadResult.success 
                          ? `✅ Document uploaded successfully! IPFS Hash: ${uploadResult.data?.ipfsHash?.slice(0, 20)}...`
                          : `❌ ${uploadResult.error}`
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <p className="text-sm text-muted-foreground">
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
                <Label htmlFor="amount" className="text-foreground font-semibold">Audit Fee (ETH)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.00000001"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-2 bg-muted border-border text-foreground"
                  placeholder="0.00000001"
                  required
                  min="0.00000001"
                  disabled={!walletAddress}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  80% goes to reviewer, 20% to DAO treasury
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || !walletAddress}
                className="w-full bg-accent hover:bg-accent/90 camo-border"
              >
                {loading ? 'Preparing Transaction...' : 
                 signing ? 'Signing...' : 
                 'Request Audit (Pay & Sign)'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && result.success && result.data?.txHash && (
          <Alert className="mt-6 border-primary bg-primary/10 camo-border">
            <AlertDescription className="text-primary">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">✓ Audit Request Submitted!</h3>
                <p>Transaction Hash: {result.data.txHash}</p>
                <p className="text-sm">
                  Your transaction has been submitted to Sepolia with payment locked in escrow.
                </p>
                <div className="flex space-x-4 mt-4">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${result.data.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View on Etherscan →
                  </a>
                  <Link href={`/audit/status?txHash=${result.data.txHash}&auditEscrowAddress=${auditEscrowAddress || ''}`} className="text-primary hover:underline">
                    Track Status →
                  </Link>
                  {daoInfo.address && (
                    <Link href={`/dao/${daoInfo.address}`} className="text-primary hover:underline">
                      View on DAO Page →
                    </Link>
                  )}
                </div>
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
