'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getAudit } from '../../../lib/api';
import { formatAddress, formatDate } from '../../../lib/wallet';
import { BADGE_COLORS } from '../../../lib/constants';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

interface AuditDetails {
  id: number;
  dao: string;
  requester: string;
  assignedReviewer: string;
  amount: string;
  ipfsHash: string;
  status: number;
  createdAt: number;
  completedAt: number;
  reviewerPaid: boolean;
  daoPaid: boolean;
}

const statusMap = {
  0: { label: 'Pending Assignment', color: BADGE_COLORS.PENDING, description: 'Waiting for a reviewer to be assigned' },
  1: { label: 'In Review', color: BADGE_COLORS.IN_REVIEW, description: 'A reviewer is currently working on your audit' },
  2: { label: 'Completed', color: BADGE_COLORS.COMPLETED, description: 'Audit has been completed and reviewed' },
  3: { label: 'Disputed', color: BADGE_COLORS.DISPUTED, description: 'Audit has been disputed and is under review' },
  4: { label: 'Refunded', color: BADGE_COLORS.REFUNDED, description: 'Payment has been refunded' },
};

export default function AuditStatusPage() {
  const searchParams = useSearchParams();
  const auditId = searchParams.get('auditId');
  const auditEscrowAddress = searchParams.get('auditEscrowAddress');
  const txHash = searchParams.get('txHash');

  const [audit, setAudit] = useState<AuditDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auditId) {
      fetchAuditStatus();
    } else if (txHash) {
      // If no auditId but we have txHash, show a message
      setLoading(false);
      setError('Audit ID not found. Please check your transaction and try again.');
    }
  }, [auditId, txHash]);

  const fetchAuditStatus = async () => {
    if (!auditId) return;

    try {
      setLoading(true);
      const response = await getAudit(auditId, auditEscrowAddress || undefined);
      
      if (response.success) {
        setAudit(response.data.audit);
      } else {
        setError(response.error || 'Failed to fetch audit status');
      }
    } catch (err) {
      setError('Failed to fetch audit status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: number) => {
    return statusMap[status as keyof typeof statusMap] || statusMap[0];
  };

  const getTimeRemaining = (audit: AuditDetails) => {
    if (audit.status !== 1) return null;
    
    const now = Date.now();
    const assignedTime = audit.createdAt * 1000; // Using createdAt as assignment time
    const reviewPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
    const timeElapsed = now - assignedTime;
    const timeRemaining = reviewPeriod - timeElapsed;
    
    if (timeRemaining <= 0) {
      return { text: 'Overdue', isOverdue: true };
    }
    
    const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    return { text: `${days}d ${hours}h remaining`, isOverdue: false };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading audit status...</p>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Audit Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'We couldn\'t find the audit you\'re looking for.'}
          </p>
          <Link href="/audit/request">
            <Button className="bg-accent hover:bg-accent/90 camo-border">
              Request New Audit
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(audit.status);
  const timeInfo = getTimeRemaining(audit);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/" className="text-accent hover:underline mb-4 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2">Audit Status</h1>
        <p className="text-muted-foreground">
          Track the progress of your audit request
        </p>
      </div>

      <div className="space-y-6">
        {/* Status Overview */}
        <Card className="bg-card border-border camo-border">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-foreground">Audit #{audit.id}</CardTitle>
                <CardDescription>
                  Requested on {formatDate(audit.createdAt)}
                </CardDescription>
              </div>
              <Badge className={`px-3 py-1 font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="text-foreground">{statusInfo.description}</p>
              </div>
              
              {timeInfo && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Review Progress</p>
                  <div className={`text-sm px-3 py-1 rounded-full inline-block font-medium ${
                    timeInfo.isOverdue 
                      ? BADGE_COLORS.OVERDUE
                      : BADGE_COLORS.ON_TIME
                  }`}>
                    {timeInfo.text}
                  </div>
                </div>
              )}

              {txHash && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transaction</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline text-sm"
                  >
                    View on Etherscan →
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card border-border camo-border">
            <CardHeader>
              <CardTitle className="text-foreground">Audit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-foreground font-semibold">{audit.amount} ETH</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Document</p>
                <a
                  href={`https://ipfs.io/ipfs/${audit.ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline text-sm"
                >
                  View Document →
                </a>
              </div>
              {audit.completedAt > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-foreground">{formatDate(audit.completedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border camo-border">
            <CardHeader>
              <CardTitle className="text-foreground">Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Requester (You)</p>
                <p className="text-foreground font-mono text-sm">{formatAddress(audit.requester)}</p>
              </div>
              
              {audit.assignedReviewer && audit.assignedReviewer !== '0x0000000000000000000000000000000000000000' && (
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Reviewer</p>
                  <p className="text-foreground font-mono text-sm">{formatAddress(audit.assignedReviewer)}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">DAO</p>
                <p className="text-foreground font-mono text-sm">{formatAddress(audit.dao)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Status */}
        {(audit.reviewerPaid || audit.daoPaid) && (
          <Card className="bg-card border-border camo-border">
            <CardHeader>
              <CardTitle className="text-foreground">Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border ${
                  audit.reviewerPaid 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-gray-500/10 border-gray-500/20'
                }`}>
                  <p className="text-sm font-medium mb-1">Reviewer Payment</p>
                  <p className={`text-sm ${
                    audit.reviewerPaid ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {audit.reviewerPaid ? 'Paid' : 'Pending'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg border ${
                  audit.daoPaid 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-gray-500/10 border-gray-500/20'
                }`}>
                  <p className="text-sm font-medium mb-1">DAO Return</p>
                  <p className={`text-sm ${
                    audit.daoPaid ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {audit.daoPaid ? 'Paid' : 'Pending'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="bg-card border-border camo-border">
          <CardHeader>
            <CardTitle className="text-foreground">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {audit.status === 1 && (
              <Button
                onClick={() => window.open(`mailto:support@audit.army?subject=Audit Dispute - Audit #${audit.id}`, '_blank')}
                className="w-full bg-destructive hover:bg-destructive/90"
                variant="destructive"
              >
                Dispute Audit
              </Button>
            )}
            
            <Link href={`/dao/${audit.dao}`}>
              <Button className="w-full bg-accent hover:bg-accent/90 camo-border">
                View DAO Page
              </Button>
            </Link>
            
            <Link href="/audit/request">
              <Button variant="outline" className="w-full">
                Request Another Audit
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
