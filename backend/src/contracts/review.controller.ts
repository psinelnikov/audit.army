import { Controller, Post, Body, Get, Param, UploadedFile, Logger, UseInterceptors } from '@nestjs/common';
import { ReviewSubmissionService } from './review-submission.service';
import { v4 as uuidv4 } from 'uuid';
import { FileInterceptor } from '@nestjs/platform-express';

class SubmitReviewDto {
  auditId: string;
  ipfsHash: string;
  documentUrl?: string;
  walletAddress: string;
}

@Controller('api/review')
export class ReviewController {
  private readonly logger: Logger = new Logger(ReviewController.name);

  constructor(
    private readonly reviewSubmissionService: ReviewSubmissionService
  ) {}

  @Post('prepare-transaction')
  async prepareSubmitReviewTx(@Body() submitReviewDto: SubmitReviewDto) {
    try {
      const { auditId, ipfsHash, documentUrl, walletAddress } = submitReviewDto;

      const result = await this.reviewSubmissionService.prepareSubmitReviewTransaction(
        auditId,
        ipfsHash,
        walletAddress,
        documentUrl
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

  @Post('upload-document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: any) {
    try {
      this.logger.log(`Uploading review document: ${file.originalname}`);

      // Validate file
      if (!file.mimetype.match(/^(application\/pdf|image\/jpeg|image\/png|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/)) {
        throw new Error('Invalid file type. Please upload PDF, images (IPAEG/PNG), or Word documents.');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      // Save file locally
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = './uploads/review-documents';

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, file.buffer);

      const documentUrl = `/api/review/documents/${filename}`;

      return {
        success: true,
        data: {
          filename,
          documentUrl,
          ipfsHash: this.generateMockIpfsHash(filename),
          size: file.size,
          mimetype: file.mimetype,
        }
      };
    } catch (error) {
      this.logger.error(`Error uploading document: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to upload document'
      };
    }
  }

  private generateMockIpfsHash(filename: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(filename).digest('hex');
    return `Qm${hash.substring(0, 46)}`;
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
        error: error.message || 'Failed to get reviews'
      };
    }
  }
}
