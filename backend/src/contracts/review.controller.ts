import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ReviewSubmissionService } from './review-submission.service';

class SubmitReviewDto {
  auditId: string;
  ipfsHash: string;
  walletAddress: string;
}

@Controller('api/review')
export class ReviewController {
  constructor(
    private readonly reviewSubmissionService: ReviewSubmissionService
  ) {}

  @Post('prepare-transaction')
  async prepareSubmitReviewTx(@Body() submitReviewDto: SubmitReviewDto) {
    try {
      const { auditId, ipfsHash, walletAddress } = submitReviewDto;

      const result = await this.reviewSubmissionService.prepareSubmitReviewTransaction(
        auditId,
        ipfsHash,
        walletAddress
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
}
