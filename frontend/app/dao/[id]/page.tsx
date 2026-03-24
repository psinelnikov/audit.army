'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuditsByDAO, checkDAOReviewer, prepareAssignReview, claimReview, getReviewerProfile } from '../../../lib/api';
import { ReviewerAllocationService, ReviewerAllocationStrategy } from '../../../lib/reviewer-allocation';
import { TIME_CONSTANTS, TRANSACTION_WAIT_TIMES, API_ENDPOINTS, UI_CONSTANTS, AUDIT_STATUS, BADGE_COLORS } from '../../../lib/constants';
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
  auditEscrowAddress: string;
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
  status: number;
  createdAt: number;
  completedAt?: number;
  reviewerPaid: boolean;
  daoPaid: boolean;
}

interface ReviewerProfile {
  reviewer: string;
  activeReviews: number;
  completedReviews: number;
  reputation: number;
  lastAssignment: number;
  isActive: boolean;
  maxConcurrentReviews: number;
  atCapacity: boolean;
  availableSlots: number;
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
  const [assigningReview, setAssigningReview] = useState<string | null>(null);
  const [allocationStrategy, setAllocationStrategy] = useState<ReviewerAllocationStrategy>(ReviewerAllocationStrategy.SELF_ASSIGNMENT);
  const [allocationService] = useState(() => ReviewerAllocationService.getInstance());
  const [userAudits, setUserAudits] = useState<Audit[]>([]);
  const [reviewerProfile, setReviewerProfile] = useState<ReviewerProfile | null>(null);

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
      fetchReviewerProfile();
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
              createdAt: details.data.createdAt || dao.createdAt,
              auditEscrowAddress: details.data.auditEscrowAddress || dao.auditEscrowAddress
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

  const fetchAudits = async (): Promise<Audit[]> => {
    if (!dao) return [];
    
    try {
      setAuditsLoading(true);
      
      const response = await getAuditsByDAO(dao.auditEscrowAddress);
      
      if (response.success) {
        const freshAudits = response.data.audits;
        setAudits(freshAudits);
        
        // Determine optimal allocation strategy based on DAO characteristics
        const reviewerCount = freshAudits.length > 0 ? 
          Math.ceil(Math.sqrt(freshAudits.length)) : 1;
        const daoSize = reviewerCount <= 3 ? 'small' : reviewerCount <= 10 ? 'medium' : 'large';
        const optimalStrategy = allocationService.getOptimalStrategy(daoSize, reviewerCount);
        
        setAllocationStrategy(optimalStrategy);
        return freshAudits;
      } else {
        console.error('Failed to fetch audits:', response.error);
        return audits;
      }
    } catch (error) {
      console.error('Error fetching audits:', error);
      return audits;
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

  const fetchReviewerProfile = async () => {
    if (!dao || !authState.address) return;
    
    try {
      const response = await getReviewerProfile(dao.auditEscrowAddress, authState.address);
      if (response.success) {
        setReviewerProfile(response.data.profile);
      } else {
        console.error('Failed to fetch reviewer profile:', response.error);
      }
    } catch (error) {
      console.error('Error fetching reviewer profile:', error);
    }
  };

  const getPendingAudits = () => audits.filter(audit => audit.status === AUDIT_STATUS.PENDING);
  const getInReviewAudits = () => audits.filter(audit => audit.status === AUDIT_STATUS.IN_REVIEW);
  const getCompletedAudits = () => audits.filter(audit => audit.status === AUDIT_STATUS.COMPLETED);
  const getUserAudits = () => {
    if (!authState.address) return [];
    return audits.filter(audit => audit.requester.toLowerCase() === authState.address?.toLowerCase());
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getTimeRemaining = (createdAt: number) => {
    const now = Date.now();
    const createdTime = createdAt * 1000;
    const timeElapsed = now - createdTime;
    const reviewPeriod = TIME_CONSTANTS.REVIEW_PERIOD_MILLISECONDS;
    const timeRemaining = reviewPeriod - timeElapsed;
    
    if (timeRemaining <= 0) {
      return { text: 'Overdue', isOverdue: true };
    }
    
    const days = Math.floor(timeRemaining / TIME_CONSTANTS.DAY_IN_MILLISECONDS);
    const hours = Math.floor((timeRemaining % TIME_CONSTANTS.DAY_IN_MILLISECONDS) / TIME_CONSTANTS.HOUR_IN_MILLISECONDS);
    
    return { 
      text: `${days}d ${hours}h remaining`, 
      isOverdue: false 
    };
  };

  const handleClaimReview = async (auditId: string) => {
    if (!authState.address) {
      throw new Error('Please connect your wallet first');
    }

    if (!isDAOReviewer) {
      throw new Error('Only DAO reviewers can claim reviews');
    }

    // Check if audit is in pending status
    const audit = audits.find(a => a.id.toString() === auditId);
    if (!audit) {
      throw new Error('Audit not found');
    }
    
    if (audit.status !== AUDIT_STATUS.PENDING) {
      throw new Error('Only pending audits can be claimed');
    }

    try {
      setAssigningReview(auditId);
      
      // Create a claim using the allocation service
      const claim = await allocationService.claimReview(auditId, authState.address, allocationStrategy);
      
      // Handle different strategies
      switch (allocationStrategy) {
        case ReviewerAllocationStrategy.SELF_ASSIGNMENT:
          // Try direct assignment (will fail due to smart contract limitation)
          await handleDirectAssignment(auditId, authState.address);
          break;
        
        case ReviewerAllocationStrategy.DAO_ADMIN_ASSIGNMENT:
          // Show admin contact information
          showAdminContactInfo(auditId, authState.address, claim);
          break;
        
        case ReviewerAllocationStrategy.ROTATION_ASSIGNMENT:
          // Add to rotation pool
          showRotationPoolInfo(auditId, authState.address, claim);
          break;
        
        default:
          // Default to admin assignment for unknown strategies
          showAdminContactInfo(auditId, authState.address, claim);
          break;
      }
    } catch (error: any) {
      console.error('Error claiming review:', error);
      alert(error.message || 'Failed to claim review');
    } finally {
      setAssigningReview(null);
    }
  };

  const checkReviewerEligibility = async (reviewerAddress: string) => {
    try {
      if (!dao?.contractAddress) {
        console.error('DAO contract address not available');
        return false;
      }
      
      // Check if user is actually a reviewer for this DAO
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.DEBUG_REVIEWER_STATUS(dao.contractAddress, reviewerAddress)}`);
      const result = await response.json();
      
      if (result.success) {
        console.log('Reviewer status debug info:', result.data);
        return result.data.isReviewer;
      } else {
        console.error('Failed to check reviewer status:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error checking reviewer eligibility:', error);
      return false;
    }
  };

  const handleDirectAssignment = async (auditId: string, reviewerAddress: string) => {
    try {
      if (!dao) {
        alert('DAO not loaded');
        return;
      }
      
      // First check if user is actually a reviewer
      const isReviewer = await checkReviewerEligibility(reviewerAddress);
      if (!isReviewer) {
        alert('You are not registered as a reviewer for this DAO. Please check the console for detailed information.');
        return;
      }

      console.log('Using DAO-specific AuditEscrow:', dao.auditEscrowAddress);

      // Use the DAO's specific AuditEscrow address
      const response = await claimReview({
        auditId,
        reviewerAddress,
        auditEscrowAddress: dao.auditEscrowAddress, // Pass the DAO's AuditEscrow address
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to prepare claim transaction');
      }

      console.log('Claiming review:', { auditId, reviewerAddress });
      console.log('Transaction data:', response.data);

      const txHash = await signAndSendTransaction(response.data);
      console.log('Transaction hash:', txHash);
      
      // Wait for transaction confirmation
      await waitForTransaction(txHash, TRANSACTION_WAIT_TIMES.DEFAULT);
      
      console.log('Transaction confirmed');
      
      // Get the transaction receipt to check events
      const receipt = await (window as any).ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      });
      
      console.log('Transaction receipt:', receipt);
      
      // Check if events were emitted
      if (receipt && receipt.logs) {
        console.log('Transaction logs:', receipt.logs);
        const reviewClaimedEvents = receipt.logs.filter((log: any) => 
          log.topics && log.topics[0] && log.topics[0].startsWith('0x')
        );
        console.log('ReviewClaimed events:', reviewClaimedEvents);
      }
      
      // Double-check the audit was actually claimed with retry logic
      // Provider may need time to see the mined transaction
      let freshAudits: Audit[] = [];
      let retryCount = 0;
      const maxRetries = 3;
      const retryDelay = 2000; // 2 seconds
      
      while (retryCount < maxRetries) {
        freshAudits = await fetchAudits();
        console.log(`Audit fetch attempt ${retryCount + 1}:`, freshAudits);
        
        const updatedAudit = freshAudits.find(a => a.id === Number(auditId));
        console.log('Checking audit:', updatedAudit);
        
        if (updatedAudit && updatedAudit.assignedReviewer && 
            updatedAudit.assignedReviewer.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
          console.log('Audit successfully assigned to:', updatedAudit.assignedReviewer);
          break;
        }
        
        if (retryCount < maxRetries - 1) {
          console.log(`Waiting ${retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        retryCount++;
      }
      
      // Use the fresh data, not the stale audits state
      const updatedAudit = freshAudits.find(a => a.id === Number(auditId));
      console.log('Final updated audit:', updatedAudit);
      
      if (updatedAudit && updatedAudit.assignedReviewer && 
          updatedAudit.assignedReviewer.toLowerCase() === reviewerAddress.toLowerCase()) {
        alert('Review claimed successfully!');
      } else {
        console.error('Audit assignment failed:', { updatedAudit, expectedReviewer: reviewerAddress });
        alert('Transaction succeeded but audit assignment not confirmed. Please refresh the page to check status.');
      }
    } catch (error: any) {
      // For debugging: Show the actual error instead of fallback
      console.error('Self-assignment error:', error);
      
      // Check for specific contract revert reasons
      if (error.message.includes('Not a DAO reviewer')) {
        alert(`You are not registered as a reviewer for this DAO. Please contact the DAO admin to be added as a reviewer.`);
      } else if (error.message.includes('Reviewer not eligible')) {
        alert(`You are not eligible to claim reviews at this time. You may have too many active reviews.`);
      } else if (error.message.includes('Audit does not exist')) {
        alert(`This audit does not exist or may have been cancelled.`);
      } else if (error.message.includes('Audit is not pending')) {
        alert(`This audit is no longer available for claiming. It may have been assigned already.`);
      } else if (error.message.includes('Audit already has reviewer')) {
        alert(`This audit has already been assigned to another reviewer.`);
      } else {
        alert(`Self-assignment failed: ${error.message}\n\nThis likely means you're not registered as a DAO reviewer or have too many active reviews.`);
      }
      throw error;
    }
  };

  const checkMyReviewerStatus = async () => {
    if (!authState.address || !dao) {
      alert('Please connect your wallet and ensure DAO is loaded');
      return;
    }
    
    // Debug: Log the contract address being used
    console.log('Using contract address:', dao.auditEscrowAddress);
    console.log('DAO object:', dao);
    console.log('DAO contractAddress:', dao.contractAddress);
    
    // Use the actual DAO address from the DAO object
    const actualDAOAddress = dao.contractAddress;
    console.log('Using actual DAO address:', actualDAOAddress);
    console.log('Calling API:', `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.DEBUG_REVIEWER_STATUS(actualDAOAddress, authState.address)}`);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.DEBUG_REVIEWER_STATUS(actualDAOAddress, authState.address)}`);
      const result = await response.json();
      
      if (result.success) {
        const info = result.data;
        const message = `Reviewer Status Check:
        
DAO Address: ${info.daoAddress}
Your Address: ${info.reviewerAddress}
Is Reviewer: ${info.isReviewer ? 'YES ✅' : 'NO ❌'}
Total Reviewers: ${info.allReviewers.length}
All Reviewers: ${info.allReviewers.map((r: string) => r.slice(0, UI_CONSTANTS.ADDRESS_TRUNCATE_LENGTH) + '...' + r.slice(-4)).join(', ')}

${info.isReviewer ? 'You should be able to claim reviews!' : 'You are not registered as a reviewer for this DAO.'}`;
        
        alert(message);
        console.log('Detailed reviewer info:', info);
      } else {
        alert(`Failed to check reviewer status: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error checking reviewer status:', error);
      alert(`Error checking reviewer status: ${error.message}`);
    }
  };

  const showAdminContactInfo = (auditId: string, reviewerAddress: string, claim: any) => {
    const message = `Review assignment requested!
    
Audit ID: ${auditId}
Your Address: ${reviewerAddress}
Strategy: ${allocationService.getStrategyDescription(allocationStrategy)}

Please notify the DAO admin to assign this review to you. You can share your wallet address for verification.`;
    
    alert(message);
  };

  const showRotationPoolInfo = (auditId: string, reviewerAddress: string, claim: any) => {
    const message = `Added to review rotation pool!
    
Audit ID: ${auditId}
Your Address: ${reviewerAddress}
Strategy: ${allocationService.getStrategyDescription(allocationStrategy)}

You will be automatically assigned when your turn comes in the rotation. Current active reviews will be considered.`;
    
    alert(message);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--nav-height,4rem))]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading DAO profile...</p>
        </div>
      </div>
    );
  }

  if (error || !dao) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--nav-height,4rem))]">
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
    <div>
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
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">DAO Contract</h4>
                  <p className="font-mono text-sm text-primary hover:text-primary/80 cursor-pointer" 
                     title={dao.contractAddress}
                     onClick={() => navigator.clipboard.writeText(dao.contractAddress)}>
                    {formatAddress(dao.contractAddress)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Audit Escrow</h4>
                  <p className="font-mono text-sm text-primary hover:text-primary/80 cursor-pointer" 
                     title={dao.auditEscrowAddress}
                     onClick={() => navigator.clipboard.writeText(dao.auditEscrowAddress)}>
                    {formatAddress(dao.auditEscrowAddress)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Creator</h4>
                  <p className="font-mono text-sm text-primary hover:text-primary/80 cursor-pointer" 
                     title={dao.creatorWallet}
                     onClick={() => navigator.clipboard.writeText(dao.creatorWallet)}>
                    {formatAddress(dao.creatorWallet)}
                  </p>
                </div>
              </div>

                          </div>
          </CardContent>
        </Card>

        {/* Conditional Content Section */}
        <Card className="bg-card border-border camo-border">
          <CardHeader>
            <CardTitle className="text-foreground text-2xl font-bold">
              {authState.isAuthenticated && isDAOReviewer ? 'DAO Review Management' : 
               authState.isAuthenticated ? 'Request an Audit' : 
               'DAO Activity'}
            </CardTitle>
            <CardDescription className="text-base">
              {authState.isAuthenticated && isDAOReviewer 
                ? 'Manage pending and in-progress reviews for this DAO'
                : authState.isAuthenticated 
                  ? 'Submit your smart contract for audit by this DAO\'s community of reviewers'
                  : 'View the audit activity of this DAO'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User's Audit Requests - Visible to authenticated users */}
            {authState.isAuthenticated && getUserAudits().length > 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Your Audit Requests</h3>
                  <div className="space-y-4">
                    {getUserAudits().map((audit) => {
                      const statusInfo = audit.status === AUDIT_STATUS.PENDING ? { label: 'Pending Assignment', color: BADGE_COLORS.PENDING } :
                                       audit.status === AUDIT_STATUS.IN_REVIEW ? { label: 'In Review', color: BADGE_COLORS.IN_REVIEW } :
                                       audit.status === AUDIT_STATUS.COMPLETED ? { label: 'Completed', color: BADGE_COLORS.COMPLETED } :
                                       audit.status === AUDIT_STATUS.DISPUTED ? { label: 'Disputed', color: BADGE_COLORS.DISPUTED } :
                                       { label: 'Refunded', color: BADGE_COLORS.REFUNDED };
                      
                      return (
                        <Card key={audit.id} className="bg-muted border-border">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-mono text-sm text-primary">Audit #{audit.id}</p>
                                <p className="text-sm text-muted-foreground">Amount: {audit.amount} ETH</p>
                                <p className="text-sm text-muted-foreground">Requested: {formatDate(audit.createdAt)}</p>
                                {audit.assignedReviewer && audit.assignedReviewer !== '0x0000000000000000000000000000000000000000' && (
                                  <p className="text-sm text-muted-foreground">Reviewer: {formatAddress(audit.assignedReviewer)}</p>
                                )}
                              </div>
                              <div className="text-right space-y-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                                <Link href={`/audit/status?auditId=${audit.id}&auditEscrowAddress=${encodeURIComponent(dao.auditEscrowAddress)}`}>
                                  <Button className="block w-full bg-accent hover:bg-accent/90 text-xs camo-border" size="sm">
                                    Track Status
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {authState.isAuthenticated && isDAOReviewer ? (
              // DAO Reviewer View - Show pending and in-review audits
              <div className="space-y-8">
                {/* Pending Audits */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Pending Reviews</h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={checkMyReviewerStatus}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        🔍 Check My Status
                      </Button>
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {allocationService.getStrategyDescription(allocationStrategy)}
                      </div>
                      <div className="text-xs text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20">
                        {allocationStrategy.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Strategy Info Box */}
                  <div className="mb-4 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                    <p className="text-xs text-foreground">
                      <strong>Current Strategy:</strong> {allocationService.getStrategyDescription(allocationStrategy)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This strategy is automatically selected based on DAO size and complexity. DAO admins can configure allocation strategies in settings.
                    </p>
                  </div>

                  {/* Capacity Warning */}
                  {reviewerProfile && reviewerProfile.atCapacity && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <span className="text-red-500 text-lg">⚠️</span>
                        <div>
                          <p className="text-sm font-semibold text-red-400">
                            At Maximum Review Capacity
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            You have {reviewerProfile.activeReviews} active reviews (max: {reviewerProfile.maxConcurrentReviews}). 
                            Complete an in-progress review before claiming new ones.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {reviewerProfile && !reviewerProfile.atCapacity && reviewerProfile.activeReviews > 0 && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-xs text-yellow-400">
                        <strong>Active Reviews:</strong> {reviewerProfile.activeReviews} / {reviewerProfile.maxConcurrentReviews} slots used ({reviewerProfile.availableSlots} available)
                      </p>
                    </div>
                  )}
                  
                  {getPendingAudits().length === 0 ? (
                    <p className="text-muted-foreground">No pending audits at this time.</p>
                  ) : (
                    <div className="space-y-4">
                      {getPendingAudits().map((audit) => (
                        <Card key={audit.id} className="bg-muted border-border">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-mono text-sm text-primary">Audit #{audit.id}</p>
                                <p className="text-sm text-muted-foreground">Requester: {formatAddress(audit.requester)}</p>
                                <p className="text-sm text-muted-foreground">Amount: {audit.amount} ETH</p>
                                <p className="text-sm text-muted-foreground">Requested: {formatDate(audit.createdAt)}</p>
                              </div>
                              <div className="text-right space-y-2">
                                <span className={`px-3 py-1 text-xs rounded-full font-medium ${BADGE_COLORS.PENDING}`}>PENDING</span>
                                <Button
                                  onClick={() => handleClaimReview(audit.id.toString())}
                                  disabled={assigningReview === audit.id.toString() || (reviewerProfile?.atCapacity ?? false)}
                                  className="block w-full bg-accent hover:bg-accent/90 text-xs camo-border"
                                  size="sm"
                                >
                                  {assigningReview === audit.id.toString() ? 'Processing...' : 
                                   reviewerProfile?.atCapacity ? 'At Capacity' : allocationService.getClaimButtonText(allocationStrategy)}
                                </Button>
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
                      {getInReviewAudits().map((audit) => {
                        const timeInfo = getTimeRemaining(audit.createdAt);
                        const isAssignedToMe = authState.address && audit.assignedReviewer && 
                                           audit.assignedReviewer.toLowerCase() === authState.address.toLowerCase();
                        return (
                        <Card key={audit.id} className={`bg-muted border-border ${
                          isAssignedToMe ? 'ring-2 ring-primary/50 border-primary/50' : ''
                        }`}>
                          <CardContent className="p-4">
                            {/* Header with status and time info */}
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="font-mono text-sm text-primary">Audit #{audit.id}</p>
                                <p className="text-sm text-muted-foreground">Requester: {formatAddress(audit.requester)}</p>
                              </div>
                              <div className="flex flex-row items-end space-x-2">
                                <span className={`px-3 py-1 text-xs rounded-full font-medium ${BADGE_COLORS.IN_REVIEW}`}>IN REVIEW</span>
                                <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                                  timeInfo.isOverdue 
                                    ? BADGE_COLORS.OVERDUE
                                    : BADGE_COLORS.ON_TIME
                                }`}>
                                  {timeInfo.text}
                                </div>
                              </div>
                            </div>

                            {/* Reviewer section */}
                            {audit.assignedReviewer && (
                              <div className="mb-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-xs font-semibold text-accent-foreground">REVIEWER</p>
                                  <div className="flex items-center">
                                    {isAssignedToMe && (
                                      <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full font-medium">
                                        YOUR REVIEW
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-accent font-mono">{formatAddress(audit.assignedReviewer)}</p>
                              </div>
                            )}

                            {/* Details and actions */}
                            <div className="flex justify-between items-end">
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Amount: {audit.amount} ETH</p>
                                <p className="text-sm text-muted-foreground">Started: {formatDate(audit.createdAt)}</p>
                              </div>
                              
                              {/* Submit Review button */}
                              {isAssignedToMe && (
                                <Link href={`/review/submit?auditId=${audit.id}&auditEscrowAddress=${encodeURIComponent(dao.auditEscrowAddress)}`}>
                                  <Button className="bg-primary hover:bg-primary/90 text-xs camo-border" size="sm">
                                    Submit Review
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )})}
                    </div>
                  )}
                </div>
              </div>
            ) : authState.isAuthenticated ? (
              // Regular authenticated user - Show audit request button
              <div className="text-center py-8">
                {dao.contractAddress && dao.auditEscrowAddress ? (
                  <Link href={`/audit/request?dao=${encodeURIComponent(dao.contractAddress)}&name=${encodeURIComponent(dao.name)}&auditEscrowAddress=${encodeURIComponent(dao.auditEscrowAddress)}`}>
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
        <Card className="bg-card border-border camo-border mt-8">
          <CardHeader>
            <CardTitle className="text-foreground text-2xl font-bold">Completed Reviews</CardTitle>
            <CardDescription className="text-base">
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
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${BADGE_COLORS.COMPLETED}`}>COMPLETED</span>
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
