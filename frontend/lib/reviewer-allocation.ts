export enum ReviewerAllocationStrategy {
  SELF_ASSIGNMENT = 'self_assignment',
  DAO_ADMIN_ASSIGNMENT = 'dao_admin_assignment',
  ROTATION_ASSIGNMENT = 'rotation_assignment',
  SKILL_BASED_ASSIGNMENT = 'skill_based_assignment',
  RANDOM_ASSIGNMENT = 'random_assignment',
  BID_BASED_ASSIGNMENT = 'bid_based_assignment'
}

export interface ReviewerAllocationConfig {
  strategy: ReviewerAllocationStrategy;
  daoSize: 'small' | 'medium' | 'large';
  autoAssignmentEnabled: boolean;
  assignmentTimeout: number; // hours
  maxConcurrentReviews: number;
}

export interface ReviewClaim {
  auditId: string;
  reviewerAddress: string;
  claimedAt: number;
  strategy: ReviewerAllocationStrategy;
  status: 'pending' | 'approved' | 'rejected';
}

export class ReviewerAllocationService {
  private static instance: ReviewerAllocationService;
  private claims: Map<string, ReviewClaim[]> = new Map();

  static getInstance(): ReviewerAllocationService {
    if (!ReviewerAllocationService.instance) {
      ReviewerAllocationService.instance = new ReviewerAllocationService();
    }
    return ReviewerAllocationService.instance;
  }

  /**
   * Get the optimal allocation strategy based on DAO characteristics
   */
  getOptimalStrategy(daoSize: string, reviewerCount: number): ReviewerAllocationStrategy {
    switch (daoSize) {
      case 'small':
        return ReviewerAllocationStrategy.SELF_ASSIGNMENT;
      case 'medium':
        return reviewerCount > 10 ? 
          ReviewerAllocationStrategy.ROTATION_ASSIGNMENT : 
          ReviewerAllocationStrategy.SELF_ASSIGNMENT;
      case 'large':
        return ReviewerAllocationStrategy.SKILL_BASED_ASSIGNMENT;
      default:
        return ReviewerAllocationStrategy.SELF_ASSIGNMENT;
    }
  }

  /**
   * Claim a review using the configured strategy
   */
  async claimReview(
    auditId: string, 
    reviewerAddress: string, 
    strategy: ReviewerAllocationStrategy
  ): Promise<ReviewClaim> {
    const claim: ReviewClaim = {
      auditId,
      reviewerAddress,
      claimedAt: Date.now(),
      strategy,
      status: 'pending'
    };

    // Store the claim
    const daoClaims = this.claims.get(auditId) || [];
    daoClaims.push(claim);
    this.claims.set(auditId, daoClaims);

    return claim;
  }

  /**
   * Get all claims for a specific audit
   */
  getClaimsForAudit(auditId: string): ReviewClaim[] {
    return this.claims.get(auditId) || [];
  }

  /**
   * Approve a review claim (for admin assignment)
   */
  async approveClaim(auditId: string, reviewerAddress: string): Promise<void> {
    const claims = this.getClaimsForAudit(auditId);
    const claim = claims.find(c => c.reviewerAddress === reviewerAddress);
    
    if (claim) {
      claim.status = 'approved';
    }
  }

  /**
   * Get next reviewer in rotation
   */
  getNextReviewerInRotation(reviewers: string[], lastAssignedIndex: number): string {
    const nextIndex = (lastAssignedIndex + 1) % reviewers.length;
    return reviewers[nextIndex];
  }

  /**
   * Check if reviewer is eligible for assignment
   */
  isReviewerEligible(
    reviewerAddress: string, 
    activeReviews: number, 
    maxConcurrent: number
  ): boolean {
    return activeReviews < maxConcurrent;
  }

  /**
   * Get strategy description for UI
   */
  getStrategyDescription(strategy: ReviewerAllocationStrategy): string {
    switch (strategy) {
      case ReviewerAllocationStrategy.SELF_ASSIGNMENT:
        return 'Reviewers can self-assign audits on a first-come, first-served basis';
      case ReviewerAllocationStrategy.DAO_ADMIN_ASSIGNMENT:
        return 'DAO administrators manually assign reviewers to audits';
      case ReviewerAllocationStrategy.ROTATION_ASSIGNMENT:
        return 'Reviews are automatically assigned in rotation to available reviewers';
      case ReviewerAllocationStrategy.SKILL_BASED_ASSIGNMENT:
        return 'Reviews are assigned based on reviewer expertise and audit complexity';
      case ReviewerAllocationStrategy.RANDOM_ASSIGNMENT:
        return 'Reviews are randomly assigned to eligible reviewers';
      case ReviewerAllocationStrategy.BID_BASED_ASSIGNMENT:
        return 'Reviewers bid on audits, and assignments are made based on competitive bidding';
      default:
        return 'Unknown assignment strategy';
    }
  }

  /**
   * Get action text for claim button based on strategy
   */
  getClaimButtonText(strategy: ReviewerAllocationStrategy): string {
    switch (strategy) {
      case ReviewerAllocationStrategy.SELF_ASSIGNMENT:
        return 'Assign to Me';
      case ReviewerAllocationStrategy.DAO_ADMIN_ASSIGNMENT:
        return 'Request Assignment';
      case ReviewerAllocationStrategy.ROTATION_ASSIGNMENT:
        return 'Join Rotation';
      case ReviewerAllocationStrategy.SKILL_BASED_ASSIGNMENT:
        return 'Apply for Review';
      case ReviewerAllocationStrategy.RANDOM_ASSIGNMENT:
        return 'Enter Pool';
      case ReviewerAllocationStrategy.BID_BASED_ASSIGNMENT:
        return 'Place Bid';
      default:
        return 'Claim Review';
    }
  }
}
