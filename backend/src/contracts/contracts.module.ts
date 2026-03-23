import { Module } from '@nestjs/common';
import { DaoFactoryService } from './dao-factory.service';
import { AuditEscrowService } from './audit-escrow.service';
import { ReviewSubmissionService } from './review-submission.service';
import { WalletService } from './wallet.service';
import { DaoController } from './dao.controller';
import { AuditController } from './audit.controller';
import { ReviewController } from './review.controller';
import { WalletController } from './wallet.controller';

@Module({
  controllers: [DaoController, AuditController, ReviewController, WalletController],
  providers: [DaoFactoryService, AuditEscrowService, ReviewSubmissionService, WalletService],
  exports: [DaoFactoryService, AuditEscrowService, ReviewSubmissionService, WalletService],
})
export class ContractsModule {}
