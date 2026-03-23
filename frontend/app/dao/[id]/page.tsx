'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuditsByDAO, checkDAOReviewer } from '../../../lib/api';
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
import { useAuth } from '../../../contexts/AuthContext';

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

interface Audit {
  id: number;
  dao: string;
  requester: string;
  assignedReviewer?: string;
  amount: string;
  ipfsHash: string;
  status: number; // 0=PENDING, 1=IN_REVIEW, 2=COMPLETED, etc.
  createdAt: number;
  completedAt?: number;
  reviewerPaid: boolean;
  daoPaid: boolean;
}

export default function DAOProfilePage() {
  const params = useParams();
  const router = useRouter();
  const daoId = params.id as string;
  const { authState } = useAuth();

  const [dao, setDAO] = useState<DAOProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [isDAOReviewer, setIsDAOReviewer] = useState(false);
  const [auditsLoading, setAuditsLoading] = useState(true);

  useEffect(() => {
    fetchDAOProfile();
    checkWallet();
  }, [daoId]);

  useEffect(() => {
    if (dao) {
      fetchDAODetailsFromContract(); // Try to fetch real details if we have placeholder data
    }
  }, [dao]);

  useEffect(() => {
    if (dao && authState.isAuthenticated && authState.address) {
      fetchAudits();
      checkDAOReviewerStatus();
    } else if (dao) {
      fetchAudits(); // Still fetch audits for non-authenticated users
    }
  }, [dao, authState]);

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

  const fetchDAODetailsFromContract = async () => {
    if (!dao) return;
    
    try {
      // If the DAO has placeholder data, try to fetch real details from contract
      if (dao.creatorWallet === '0x0000000000000000000000000000000000000000' || 
          dao.description.includes('A DAO created by the community') ||
          dao.name.includes('User Created DAO')) {
        
        // Try to fetch real details from the contract
        const response = await fetch(`/api/dao/details/${dao.contractAddress}`);
        if (response.ok) {
          const details = await response.json();
          if (details.success) {
            // Update the DAO with real details
            setDAO({
              ...dao,
              name: details.data.name || dao.name,
              symbol: details.data.symbol || dao.symbol,
              description: details.data.description || dao.description,
              creatorWallet: details.data.creator || dao.creatorWallet,
              createdAt: details.data.createdAt || dao.createdAt
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching DAO details from contract:', error);
      // Don't update the DAO if we can't fetch details
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

  const fetchAudits = async () => {
    if (!dao) return;
    
    try {
      setAuditsLoading(true);
      const response = await getAuditsByDAO(dao.contractAddress);
      
      if (response.success) {
        setAudits(response.data.audits);
      } else {
        console.error('Failed to fetch audits:', response.error);
      }
    } catch (error) {
      console.error('Error fetching audits:', error);
    } finally {
      setAuditsLoading(false);
    }
  };

  const checkDAOReviewerStatus = async () => {
    if (!dao || !authState.address) return;
    
    try {
      const response = await checkDAOReviewer(dao.contractAddress, authState.address);
      if (response.success) {
        setIsDAOReviewer(response.data.isReviewer);
      } else {
        console.error('Failed to check DAO reviewer status:', response.error);
      }
    } catch (error) {
      console.error('Error checking DAO reviewer status:', error);
    }
  };

  const getPendingAudits = () => audits.filter(audit => audit.status === 0);
  const getInReviewAudits = () => audits.filter(audit => audit.status === 1);
  const getCompletedAudits = () => audits.filter(audit => audit.status === 2);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading DAO profile...</p>
        </div>
      </div>
    );
  }

  if (error || !dao) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
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
    <div className="army-pattern">
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

        {/* Conditional Content Section */}
        <Card className="bg-card border-border camo-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              {authState.isAuthenticated && isDAOReviewer ? 'DAO Review Management' : 
               authState.isAuthenticated ? 'Request an Audit' : 
               'DAO Activity'}
            </CardTitle>
            <CardDescription>
              {authState.isAuthenticated && isDAOReviewer 
                ? 'Manage pending and in-progress reviews for this DAO'
                : authState.isAuthenticated 
                  ? 'Submit your smart contract for audit by this DAO\'s community of reviewers'
                  : 'View the audit activity of this DAO'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {authState.isAuthenticated && isDAOReviewer ? (
              // DAO Reviewer View - Show pending and in-review audits
              <div className="space-y-8">
                {/* Pending Audits */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Pending Reviews</h3>
                  {getPendingAudits().length === 0 ? (
                    <p className="text-muted-foreground">No pending audits at this time.</p>
                  ) : (
                    <div className="space-y-4">
                      {getPendingAudits().map((audit) => (
                        <Card key={audit.id} className="bg-muted border-border">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-mono text-sm text-primary">Audit #{audit.id}</p>
                                <p className="text-sm text-muted-foreground">Requester: {formatAddress(audit.requester)}</p>
                                <p className="text-sm text-muted-foreground">Amount: {audit.amount} ETH</p>
                                <p className="text-sm text-muted-foreground">Requested: {formatDate(audit.createdAt)}</p>
                              </div>
                              <div className="text-right">
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">PENDING</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* In-Review Audits */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">In-Progress Reviews</h3>
                  {getInReviewAudits().length === 0 ? (
                    <p className="text-muted-foreground">No audits currently in review.</p>
                  ) : (
                    <div className="space-y-4">
                      {getInReviewAudits().map((audit) => (
                        <Card key={audit.id} className="bg-muted border-border">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-mono text-sm text-primary">Audit #{audit.id}</p>
                                <p className="text-sm text-muted-foreground">Requester: {formatAddress(audit.requester)}</p>
                                <p className="text-sm text-muted-foreground">Reviewer: {audit.assignedReviewer ? formatAddress(audit.assignedReviewer) : 'Not assigned'}</p>
                                <p className="text-sm text-muted-foreground">Amount: {audit.amount} ETH</p>
                                <p className="text-sm text-muted-foreground">Started: {formatDate(audit.createdAt)}</p>
                              </div>
                              <div className="text-right">
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">IN REVIEW</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : authState.isAuthenticated ? (
              // Regular authenticated user - Show audit request button
              <div className="text-center py-8">
                {dao.contractAddress ? (
                  <Link href={`/audit/request?dao=${encodeURIComponent(dao.contractAddress)}&name=${encodeURIComponent(dao.name)}`}>
                    <Button
                      disabled={!walletAddress}
                      className="bg-primary hover:bg-primary/90 text-lg px-8 py-3 camo-border"
                    >
                      {walletAddress ? 'Request Audit' : 'Connect Wallet to Request Audit'}
                    </Button>
                  </Link>
                ) : (
                  <div>
                    <Button disabled className="bg-muted text-muted-foreground text-lg px-8 py-3 camo-border">
                      DAO Loading...
                    </Button>
                    <p className="text-muted-foreground mt-4 text-sm">
                      Please wait for DAO information to load
                    </p>
                  </div>
                )}
                {!walletAddress && (
                  <p className="text-muted-foreground mt-4 text-sm">
                    Connect your wallet to request an audit from this DAO
                  </p>
                )}
              </div>
            ) : (
              // Non-authenticated user - Show message to sign in
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Please sign in to request an audit from this DAO or view detailed audit information.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Reviews - Visible to everyone */}
        <Card className="bg-card border-border camo-border">
          <CardHeader>
            <CardTitle className="text-foreground">Completed Reviews</CardTitle>
            <CardDescription>
              Past audits completed by this DAO community
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading completed reviews...</p>
              </div>
            ) : getCompletedAudits().length === 0 ? (
              <p className="text-muted-foreground">No completed audits yet.</p>
            ) : (
              <div className="space-y-4">
                {getCompletedAudits().map((audit) => (
                  <Card key={audit.id} className="bg-muted border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-sm text-primary">Audit #{audit.id}</p>
                          <p className="text-sm text-muted-foreground">Requester: {formatAddress(audit.requester)}</p>
                          <p className="text-sm text-muted-foreground">Reviewer: {audit.assignedReviewer ? formatAddress(audit.assignedReviewer) : 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">Amount: {audit.amount} ETH</p>
                          <p className="text-sm text-muted-foreground">Completed: {audit.completedAt ? formatDate(audit.completedAt) : 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">COMPLETED</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
