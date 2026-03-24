import { Body, Controller, Get, Logger, Param, Post, Put, Query, UseInterceptors, UploadedFile, ValidationPipe, ParseIntPipe } from '@nestjs/common';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { AuditEscrowService } from './audit-escrow.service';
import { DaoFactoryService } from './dao-factory.service';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { FileInterceptor } from '@nestjs/platform-express';

class CreateAuditDto {
  @IsString()
  @IsNotEmpty()
  ipfsHash: string;

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  auditEscrowAddress: string;
}

@Controller('api/audit')
export class AuditController {
  private readonly logger: Logger = new Logger(AuditController.name);

  constructor(
    private readonly auditEscrowService: AuditEscrowService,
    private readonly daoFactoryService: DaoFactoryService
  ) {}

  @Post('prepare-transaction')
  async prepareCreateAuditTx(@Body() createAuditDto: CreateAuditDto) {
    try {
      const { ipfsHash, documentUrl, amount, walletAddress, auditEscrowAddress } = createAuditDto;

      const result = await this.auditEscrowService.prepareCreateAuditTransaction(
        ipfsHash,
        amount,
        walletAddress,
        auditEscrowAddress
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

  @Post('claim-review')
  async claimReview(@Body() claimReviewDto: { auditId: string; reviewerAddress: string; auditEscrowAddress?: string }) {
    try {
      const { auditId, reviewerAddress, auditEscrowAddress } = claimReviewDto;

      if (!auditEscrowAddress) {
        throw new Error('AuditEscrow address is required');
      }

      const result = await this.auditEscrowService.prepareClaimReviewTransaction(
        auditId,
        reviewerAddress,
        auditEscrowAddress
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

  @Post('assign-review')
  async assignReview(@Body() assignReviewDto: { auditId: string; reviewerAddress: string; auditEscrowAddress: string }) {
    try {
      const { auditId, reviewerAddress, auditEscrowAddress } = assignReviewDto;

      const result = await this.auditEscrowService.prepareAssignReviewerTransaction(
        auditId,
        reviewerAddress,
        auditEscrowAddress
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
      this.logger.log(`Uploading audit document: ${file.originalname}`);

      // Validate file
      if (!file.mimetype.match(/^(application\/pdf|image\/jpeg|image\/png|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/)) {
        throw new Error('Invalid file type. Please upload PDF, images (JPEG/PNG), or Word documents.');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      // Save file locally
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = './uploads/audit-documents';

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, file.buffer);

      const documentUrl = `/api/audit/documents/${filename}`;

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

  @Get('debug/reviewer-status/:daoAddress/:reviewerAddress')
  async debugReviewerStatus(@Param('daoAddress') daoAddress: string, @Param('reviewerAddress') reviewerAddress: string) {
    try {
      this.logger.log(`Debug reviewer status - DAO: ${daoAddress}, Reviewer: ${reviewerAddress}`);
      
      // Call the DAO contract directly instead of DAO Factory
      const daoContract = new ethers.Contract(daoAddress, [
        'function reviewers(address) view returns (bool)',
        'function reviewerList() view returns (address[])'
      ], new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL));

      this.logger.log(`Created DAO contract for address: ${daoAddress}`);

      // Check if reviewer is registered
      const isReviewer = await daoContract.reviewers(reviewerAddress);
      this.logger.log(`Reviewer ${reviewerAddress} isReviewer: ${isReviewer}`);
      
      // Get all reviewers for the DAO
      let reviewers: string[] = [];
      try {
        reviewers = await daoContract.reviewerList();
        this.logger.log(`All reviewers: ${JSON.stringify(reviewers)}`);
      } catch (listError: any) {
        this.logger.log(`Failed to get reviewerList: ${listError.message}`);
        // Fallback: try to get it differently or use empty array
        reviewers = [];
      }
      
      // Check if the reviewer address is in the list
      const isInList = reviewers.length > 0 && reviewers.some((r: string) => r.toLowerCase() === reviewerAddress.toLowerCase());
      this.logger.log(`Reviewer in list: ${isInList}`);

      // Try calling the function directly to see the exact error
      try {
        const directCall = await daoContract.reviewers.staticCall(reviewerAddress);
        this.logger.log(`Direct call result: ${directCall}`);
      } catch (directError: any) {
        this.logger.log(`Direct call error: ${directError.message}`);
      }

      this.logger.log(`Reviewer status result: ${isReviewer}, Total reviewers: ${reviewers.length}`);

      return {
        success: true,
        data: {
          isReviewer,
          allReviewers: reviewers,
          reviewerAddress: reviewerAddress.toLowerCase(),
          daoAddress: daoAddress.toLowerCase(),
          method: 'Direct DAO contract call',
          note: reviewers.length === 0 ? 'reviewerList() function not available, but reviewers() works' : 'All functions working'
        }
      };
    } catch (error) {
      this.logger.error(`Debug reviewer status error: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('dao/:daoAddress/audit-escrow-address')
  async getAuditEscrowAddress(@Param('daoAddress') daoAddress: string) {
    try {
      const auditEscrowAddress = await this.daoFactoryService['factory'].getAuditEscrowAddress(daoAddress);
      return {
        success: true,
        data: { auditEscrowAddress }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('dao')
  async getAuditsByDAO(@Query('auditEscrowAddress') auditEscrowAddress: string) {
    try {
      if (!auditEscrowAddress) {
        throw new Error('AuditEscrow address is required');
      }

      const audits = await this.auditEscrowService.getAudits(auditEscrowAddress);
      return {
        success: true,
        data: { audits }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get audits for DAO'
      };
    }
  }

  @Get('dao/:daoAddress/check-reviewer/:userAddress')
  async checkDAOReviewer(@Param('daoAddress') daoAddress: string, @Param('userAddress') userAddress: string) {
    try {
      const isReviewer = await this.auditEscrowService.isDAOReviewer(daoAddress, userAddress);
      return {
        success: true,
        data: { isReviewer }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to check DAO reviewer status'
      };
    }
  }

  @Get(':auditEscrowAddress/reviewer-profile/:reviewerAddress')
  async getReviewerProfile(
    @Param('auditEscrowAddress') auditEscrowAddress: string,
    @Param('reviewerAddress') reviewerAddress: string
  ) {
    try {
      const profile = await this.auditEscrowService.getReviewerProfile(auditEscrowAddress, reviewerAddress);
      return {
        success: true,
        data: { profile }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get reviewer profile'
      };
    }
  }

  @Get(':auditId')
  async getAudit(@Param('auditId') auditId: string, @Query('auditEscrowAddress') auditEscrowAddress: string) {
    try {
      if (!auditEscrowAddress) {
        throw new Error('AuditEscrow address is required');
      }

      const audit = await this.auditEscrowService.getAudit(auditId, auditEscrowAddress);
      return {
        success: true,
        data: { audit }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('document/:filename')
  async getDocument(@Param('filename') filename: string) {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join('./uploads/audit-documents', filename);

      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'Document not found'
        };
      }

      const stats = fs.statSync(filePath);
      const fileBuffer = fs.readFileSync(filePath);

      return {
        success: true,
        data: {
          filename,
          size: stats.size,
          mimetype: 'application/octet-stream',
          buffer: fileBuffer.toString('base64'),
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get document'
      };
    }
  }
}
