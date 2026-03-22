import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import * as AuditEscrowABI from './AuditEscrow.json';

@Injectable()
export class AuditEscrowService {
  private readonly logger = new Logger(AuditEscrowService.name);
  private provider: ethers.Provider;
  private escrow: any;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const escrowAddress = process.env.AUDIT_ESCROW_ADDRESS;

    if (!escrowAddress) {
      throw new Error('AUDIT_ESCROW_ADDRESS environment variable is required');
    }

    this.escrow = new ethers.Contract(escrowAddress, AuditEscrowABI.abi, this.provider);
    this.logger.log(`Audit Escrow initialized at ${escrowAddress}`);
  }

  async createAudit(
    daoAddress: string,
    ipfsHash: string,
    amount: string,
    signer: ethers.Signer
  ): Promise<{ txHash: string; auditId: string }> {
    try {
      this.logger.log(`Creating audit for DAO: ${daoAddress}`);

      const escrowWithSigner = this.escrow.connect(signer);
      const tx = await escrowWithSigner.createAudit(daoAddress, ipfsHash, {
        value: ethers.parseEther(amount)
      });

      this.logger.log(`Audit creation transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();

      this.logger.log(`Audit created successfully`);

      const auditCount = await this.escrow.getAuditCount();
      const auditId = Number(auditCount);

      return { txHash: tx.hash, auditId: auditId.toString() };
    } catch (error) {
      this.logger.error(`Error creating audit: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAudit(auditId: string): Promise<any> {
    try {
      const audit = await this.escrow.getAudit(auditId);
      return {
        id: Number(audit.id),
        dao: audit.dao,
        requester: audit.requester,
        assignedReviewer: audit.assignedReviewer,
        amount: ethers.formatEther(audit.amount),
        ipfsHash: audit.ipfsHash,
        status: Number(audit.status),
        createdAt: Number(audit.createdAt),
        completedAt: Number(audit.completedAt),
        reviewerPaid: audit.reviewerPaid,
        daoPaid: audit.daoPaid
      };
    } catch (error) {
      this.logger.error(`Error getting audit: ${error.message}`);
      throw error;
    }
  }

  async getAuditCount(): Promise<number> {
    try {
      const count = await this.escrow.getAuditCount();
      return Number(count);
    } catch (error) {
      this.logger.error(`Error getting audit count: ${error.message}`);
      throw error;
    }
  }
}
