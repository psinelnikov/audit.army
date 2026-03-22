import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AuditEscrowService } from './audit-escrow.service';
import { ethers } from 'ethers';

class CreateAuditDto {
  daoAddress: string;
  ipfsHash: string;
  amount: string;
  privateKey: string;
}

@Controller('api/audit')
export class AuditController {
  constructor(private readonly auditEscrowService: AuditEscrowService) {}

  @Post('create')
  async createAudit(@Body() createAuditDto: CreateAuditDto) {
    try {
      const { daoAddress, ipfsHash, amount, privateKey } = createAuditDto;

      const signer = new ethers.Wallet(privateKey);

      const result = await this.auditEscrowService.createAudit(
        daoAddress,
        ipfsHash,
        amount,
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
  async getAudit(@Param('id') id: string) {
    try {
      const audit = await this.auditEscrowService.getAudit(id);
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

  @Get('count')
  async getAuditCount() {
    try {
      const count = await this.auditEscrowService.getAuditCount();
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
