import { Module } from '@nestjs/common';
import { DaoFactoryService } from './dao-factory.service';
import { AuditEscrowService } from './audit-escrow.service';
import { ReviewSubmissionService } from './review-submission.service';
import { DaoController } from './dao.controller';
import { AuditController } from './audit.controller';
import { ReviewController } from './review.controller';

@Module({
  controllers: [DaoController, AuditController, ReviewController],
  providers: [DaoFactoryService, AuditEscrowService, ReviewSubmissionService],
  exports: [DaoFactoryService, AuditEscrowService, ReviewSubmissionService],
})
export class ContractsModule {}
