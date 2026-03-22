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

  async submitReview(
    auditId: string,
    ipfsHash: string,
    signer: ethers.Signer
  ): Promise<{ txHash: string; reviewId: string }> {
    try {
      this.logger.log(`Submitting review for audit: ${auditId}`);

      const submissionWithSigner = this.reviewSubmission.connect(signer);
      const tx = await submissionWithSigner.submitReview(auditId, ipfsHash);

      this.logger.log(`Review submission transaction sent: ${tx.hash}`);

      await tx.wait();

      this.logger.log(`Review submitted successfully`);

      const reviewCount = await this.reviewSubmission.getReviewCount();
      const reviewId = Number(reviewCount);

      return { txHash: tx.hash, reviewId: reviewId.toString() };
    } catch (error) {
      this.logger.error(`Error submitting review: ${error.message}`, error.stack);
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
