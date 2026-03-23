import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AuditEscrowService } from './audit-escrow.service';

class CreateAuditDto {
  daoAddress: string;
  ipfsHash: string;
  amount: string;
  walletAddress: string;
}

@Controller('api/audit')
export class AuditController {
  constructor(private readonly auditEscrowService: AuditEscrowService) {}

  @Post('prepare-transaction')
  async prepareCreateAuditTx(@Body() createAuditDto: CreateAuditDto) {
    try {
      const { daoAddress, ipfsHash, amount, walletAddress } = createAuditDto;

      const result = await this.auditEscrowService.prepareCreateAuditTransaction(
        daoAddress,
        ipfsHash,
        amount,
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
}
