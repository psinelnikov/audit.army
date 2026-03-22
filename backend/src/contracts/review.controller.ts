import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ReviewSubmissionService } from './review-submission.service';
import { ethers } from 'ethers';

class SubmitReviewDto {
  auditId: string;
  ipfsHash: string;
  privateKey: string;
}

@Controller('api/review')
export class ReviewController {
  constructor(
    private readonly reviewSubmissionService: ReviewSubmissionService
  ) {}

  @Post('submit')
  async submitReview(@Body() submitReviewDto: SubmitReviewDto) {
    try {
      const { auditId, ipfsHash, privateKey } = submitReviewDto;

      const signer = new ethers.Wallet(privateKey);

      const result = await this.reviewSubmissionService.submitReview(
        auditId,
        ipfsHash,
        signer
      );

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get(':id')
  async getReview(@Param('id') id: string) {
    try {
      const review = await this.reviewSubmissionService.getReview(id);
      return {
        success: true,
        data: { review }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('audit/:auditId')
  async getAuditReviews(@Param('auditId') auditId: string) {
    try {
      const reviews = await this.reviewSubmissionService.getAuditReviews(auditId);
      return {
        success: true,
        data: { reviews }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('count')
  async getReviewCount() {
    try {
      const count = await this.reviewSubmissionService.getReviewCount();
      return {
        success: true,
        data: { count }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
