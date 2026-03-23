import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import * as ReviewSubmissionABI from './ReviewSubmission.json';

@Injectable()
export class ReviewSubmissionService {
  private readonly logger = new Logger(ReviewSubmissionService.name);
  private provider: ethers.Provider;
  private reviewSubmission: any;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const reviewAddress = process.env.REVIEW_SUBMISSION_ADDRESS;

    if (!reviewAddress) {
      throw new Error('REVIEW_SUBMISSION_ADDRESS environment variable is required');
    }

    this.reviewSubmission = new ethers.Contract(
      reviewAddress,
      ReviewSubmissionABI.abi,
      this.provider
    );
    this.logger.log(`Review Submission initialized at ${reviewAddress}`);
  }

  /**
   * Prepare unsigned transaction for frontend to sign
   */
  async prepareSubmitReviewTransaction(
    auditId: string,
    ipfsHash: string,
    fromAddress: string
  ): Promise<{ to: string; data: string; from: string; value: string }> {
    try {
      this.logger.log(`Preparing review submission transaction for: ${fromAddress}`);

      const submission = new ethers.Contract(
        process.env.REVIEW_SUBMISSION_ADDRESS!,
        ReviewSubmissionABI.abi,
        this.provider
      );

      const txData = await submission.submitReview.populateTransaction(
        auditId,
        ipfsHash
      );

      return {
        to: process.env.REVIEW_SUBMISSION_ADDRESS!,
        data: txData.data || '0x',
        from: fromAddress,
        value: '0x0'
      };
    } catch (error) {
      this.logger.error(`Error preparing review transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getReview(reviewId: string): Promise<any> {
    try {
      const review = await this.reviewSubmission.getReview(reviewId);
      return {
        id: Number(review.id),
        auditId: Number(review.auditId),
        reviewer: review.reviewer,
        ipfsHash: review.ipfsHash,
        status: Number(review.status),
        approvalCount: Number(review.approvalCount),
        rejectionCount: Number(review.rejectionCount),
        submittedAt: Number(review.submittedAt),
        approvedAt: Number(review.approvedAt)
      };
    } catch (error) {
      this.logger.error(`Error getting review: ${error.message}`);
      throw error;
    }
  }

  async getAuditReviews(auditId: string): Promise<number[]> {
    try {
      const reviews = await this.reviewSubmission.getAuditReviews(auditId);
      return reviews.map((id: bigint) => Number(id));
    } catch (error) {
      this.logger.error(`Error getting audit reviews: ${error.message}`);
      throw error;
    }
  }

  async getReviewCount(): Promise<number> {
    try {
      const count = await this.reviewSubmission.getReviewCount();
      return Number(count);
    } catch (error) {
      this.logger.error(`Error getting review count: ${error.message}`);
      throw error;
    }
  }
}

