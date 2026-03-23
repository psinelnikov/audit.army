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

  /**
   * Prepare unsigned transaction for frontend to sign
   */
  async prepareCreateAuditTransaction(
    daoAddress: string,
    ipfsHash: string,
    amount: string,
    fromAddress: string,
  ): Promise<any> {
    try {
      if (!daoAddress) {
        throw new Error('DAO address is required');
      }

      if (!ipfsHash) {
        throw new Error('IPFS hash is required');
      }

      const escrow = this.escrow;
      if (!escrow) {
        throw new Error('Audit Escrow contract is not initialized');
      }

      const txData = await escrow.createAudit.populateTransaction(
        daoAddress,
        ipfsHash
      );

      // Ensure amount is a valid string and not corrupted
      const cleanAmount = String(amount).trim();
      const value = ethers.parseEther(cleanAmount);

      return {
        to: process.env.AUDIT_ESCROW_ADDRESS!,
        data: txData.data || '0x',
        from: fromAddress,
        value: value.toString()
      };
    } catch (error) {
      this.logger.error(`Error preparing audit transaction: ${error.message}`, error.stack);
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

  async getAuditsByDAO(daoAddress: string): Promise<any[]> {
    try {
      const auditCount = await this.getAuditCount();
      const audits = [];
      
      for (let i = 0; i < auditCount; i++) {
        try {
          const audit = await this.getAudit(i.toString());
          if (audit.dao.toLowerCase() === daoAddress.toLowerCase()) {
            audits.push(audit);
          }
        } catch (error) {
          // Skip invalid audits
          continue;
        }
      }
      
      return audits;
    } catch (error) {
      this.logger.error(`Error getting audits by DAO: ${error.message}`);
      throw error;
    }
  }

  async isDAOReviewer(daoAddress: string, userAddress: string): Promise<boolean> {
    try {
      // This would need to be implemented in the DAO contract
      // For now, we'll use a placeholder implementation
      // In a real implementation, you'd call a method like isReviewer() on the DAO contract
      const daoContract = new ethers.Contract(daoAddress, [
        'function isReviewer(address) view returns (bool)'
      ], this.provider);
      
      try {
        return await daoContract.isReviewer(userAddress);
      } catch (error) {
        // If the method doesn't exist, fall back to checking if they're an initial reviewer
        // This is a simplified approach - in production you'd have proper DAO contract integration
        this.logger.warn(`isReviewer method not found on DAO contract, using fallback`);
        return false; // For now, return false until proper implementation
      }
    } catch (error) {
      this.logger.error(`Error checking DAO reviewer status: ${error.message}`);
      return false;
    }
  }
}

