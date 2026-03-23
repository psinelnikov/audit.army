'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { prepareCreateAudit, uploadDocument } from '../../../lib/api';
import {
  signAndSendTransaction,
  waitForTransaction,
  getWalletState,
  formatAddress,
} from '../../../lib/wallet';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';

interface DAOProfile {
  id: number;
  name: string;
  symbol: string;
  description: string;
  contractAddress: string;
  creatorWallet: string;
  createdAt: string;
  logoUrl?: string;
  isUserCreated?: boolean;
}

export default function DAOProfilePage() {
  const params = useParams();
  const router = useRouter();
  const daoId = params.id as string;

  const [dao, setDAO] = useState<DAOProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // Audit request form state
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
  } | null>(null);
  const [auditFormData, setAuditFormData] = useState({
    ipfsHash: '',
    amount: '0.01',
  });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
    txHash?: string;
  } | null>(null);

  useEffect(() => {
    fetchDAOProfile();
    checkWallet();
  }, [daoId]);

  const fetchDAOProfile = async () => {
    try {
      // First, try to get DAO from search results
      const response = await fetch('/api/dao/search');
      const data = await response.json();
      
      if (data.success) {
        const foundDAO = data.data.daos.find((d: DAOProfile) => d.id.toString() === daoId);
        if (foundDAO) {
          setDAO(foundDAO);
        } else {
          setError('DAO not found');
        }
      } else {
        setError('Failed to fetch DAO data');
      }
    } catch (error) {
      setError('Error fetching DAO profile');
    } finally {
      setLoading(false);
    }
  };

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
        setAuditFormData({ ...auditFormData, ipfsHash: response.data.ipfsHash });
      } else {
        setUploadResult({ success: false, error: response.error || 'Upload failed' });
      }
    } catch (error) {
      setUploadResult({ success: false, error: 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleAuditRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuditLoading(true);
    setAuditResult(null);

    try {
      if (!walletAddress) {
        throw new Error('Please connect your wallet first');
      }

      if (!auditFormData.ipfsHash) {
        throw new Error('Please upload a document first');
      }

      // Prepare transaction
      const response = await prepareCreateAudit({
        daoAddress: dao!.contractAddress,
        ipfsHash: auditFormData.ipfsHash,
        amount: auditFormData.amount,
        walletAddress,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to prepare transaction');
      }

      // Sign and send transaction
      const txHash = await signAndSendTransaction(response.data);

      // Wait for transaction confirmation
      setAuditResult({
        success: true,
        txHash,
      });

      await waitForTransaction(txHash);

      setAuditResult({
        success: true,
        data: { txHash },
      });

      // Reset form
      setShowAuditForm(false);
      setSelectedFile(null);
      setAuditFormData({ ipfsHash: '', amount: '0.01' });
      setUploadResult(null);
    } catch (error: any) {
      setAuditResult({
        success: false,
        error: error.message || 'Failed to request audit',
      });
    } finally {
      setAuditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground army-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading DAO profile...</p>
        </div>
      </div>
    );
  }

  if (error || !dao) {
    return (
      <div className="min-h-screen bg-background text-foreground army-pattern flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">DAO Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || 'The DAO you are looking for does not exist.'}</p>
          <Link href="/dao/search">
            <Button className="bg-primary hover:bg-primary/90 camo-border">
              ← Back to DAO Search
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground army-pattern">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/dao/search" className="text-primary hover:underline inline-block">
            ← Back to DAO Search
          </Link>
        </div>

        {/* DAO Profile Header */}
        <Card className="bg-card border-border camo-border mb-8">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                {dao.logoUrl ? (
                  <img src={dao.logoUrl} alt={dao.name} className="w-16 h-16 rounded-lg" />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground text-lg">{dao.symbol.slice(0, 2)}</span>
                  </div>
                )}
                <div>
                  <div className="mb-2">
                    <h1 className="text-3xl font-bold">{dao.name}</h1>
                  </div>
                  <p className="text-primary font-mono text-lg">{dao.symbol}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Description</h3>
                <p className="text-foreground leading-relaxed">{dao.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Contract Address</h4>
                  <p className="font-mono text-sm text-primary hover:text-primary/80 cursor-pointer" 
                     title={dao.contractAddress}
                     onClick={() => navigator.clipboard.writeText(dao.contractAddress)}>
                    {formatAddress(dao.contractAddress)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Creator</h4>
                  <p className="font-mono text-sm text-muted-foreground" 
                     title={dao.creatorWallet}
                     onClick={() => navigator.clipboard.writeText(dao.creatorWallet)}>
                    {formatAddress(dao.creatorWallet)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Created</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(dao.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Request Section */}
        <Card className="bg-card border-border camo-border">
          <CardHeader>
            <CardTitle className="text-foreground">Request an Audit</CardTitle>
            <CardDescription>
              Submit your smart contract for audit by this DAO's community of reviewers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showAuditForm ? (
              <div className="text-center py-8">
                <Button
                  onClick={() => setShowAuditForm(true)}
                  disabled={!walletAddress}
                  className="bg-primary hover:bg-primary/90 text-lg px-8 py-3 camo-border"
                >
                  {walletAddress ? 'Request Audit' : 'Connect Wallet to Request Audit'}
                </Button>
                {!walletAddress && (
                  <p className="text-muted-foreground mt-4 text-sm">
                    Connect your wallet to request an audit from this DAO
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleAuditRequest} className="space-y-6">
                <div>
                  <Label htmlFor="document" className="text-foreground font-semibold">Audit Document</Label>
                  <div className="mt-2 space-y-4">
                    <div className="flex items-center space-x-4">
                      <Input
                        id="document"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="bg-muted border-border text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        disabled={!walletAddress || uploading}
                      />
                      <Button
                        onClick={handleFileUpload}
                        disabled={!selectedFile || uploading || !walletAddress}
                        className="bg-primary hover:bg-primary/90 camo-border"
                        type="button"
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                    
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
                </div>

                <div>
                  <Label htmlFor="amount" className="text-foreground font-semibold">Audit Fee (ETH)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.001"
                    value={auditFormData.amount}
                    onChange={(e) => setAuditFormData({ ...auditFormData, amount: e.target.value })}
                    className="mt-2 bg-muted border-border text-foreground"
                    placeholder="0.01"
                    required
                    disabled={!walletAddress}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Amount to lock in escrow for the audit
                  </p>
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={!walletAddress || !auditFormData.ipfsHash || auditLoading}
                    className="bg-accent hover:bg-accent/90 camo-border"
                  >
                    {auditLoading ? 'Processing...' : 'Submit Audit Request'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAuditForm(false);
                      setSelectedFile(null);
                      setAuditFormData({ ipfsHash: '', amount: '0.01' });
                      setUploadResult(null);
                    }}
                    variant="outline"
                    className="camo-border"
                  >
                    Cancel
                  </Button>
                </div>

                {auditResult && (
                  <Alert className={auditResult.success ? 'border-accent bg-accent/10 camo-border' : 'border-destructive bg-destructive/10 camo-border'}>
                    <AlertDescription className={auditResult.success ? 'text-accent-foreground' : 'text-destructive'}>
                      {auditResult.success 
                        ? `✅ Audit request submitted successfully! Transaction: ${auditResult.txHash?.slice(0, 20)}...`
                        : `❌ ${auditResult.error}`
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
