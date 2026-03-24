import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import AuditEscrowABI from '../contracts/AuditEscrow.json'; // This will now be V2 ABI

@Injectable()
export class AuditEscrowService {
  private readonly logger = new Logger(AuditEscrowService.name);
  private provider: ethers.Provider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    this.logger.log('Audit Escrow Service initialized with dynamic contract addresses');
  }

  /**
   * Get AuditEscrow contract instance for a specific DAO
   */
  private getAuditEscrowContract(auditEscrowAddress: string): ethers.Contract {
    if (!auditEscrowAddress) {
      throw new Error('AuditEscrow address is required');
    }
    return new ethers.Contract(auditEscrowAddress, AuditEscrowABI.abi, this.provider);
  }

  /**
   * Prepare unsigned transaction for frontend to sign
   */
  async prepareCreateAuditTransaction(
    ipfsHash: string,
    amount: string,
    fromAddress: string,
    auditEscrowAddress: string,
  ): Promise<any> {
    try {
      this.logger.log(`Creating audit transaction - AuditEscrow: ${auditEscrowAddress}`);
      
      if (!ipfsHash) {
        throw new Error('IPFS hash is required');
      }

      const escrow = this.getAuditEscrowContract(auditEscrowAddress);
      if (!escrow) {
        throw new Error('Audit Escrow contract is not initialized');
      }

      this.logger.log(`Using escrow contract at: ${await escrow.getAddress()}`);

      // V2 contract - createAudit no longer needs DAO address parameter
      const txData = await escrow.createAudit.populateTransaction(
        ipfsHash
      );

      // Ensure amount is a valid string and not corrupted
      const cleanAmount = String(amount).trim();
      const value = ethers.parseEther(cleanAmount);

      const result = {
        to: auditEscrowAddress,
        data: txData.data || '0x',
        from: fromAddress,
        value: value.toString()
      };

      this.logger.log(`Transaction prepared - To: ${result.to}, Value: ${result.value}`);
      return result;
    } catch (error) {
      this.logger.error(`Error preparing audit transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  async prepareClaimReviewTransaction(
    auditIndex: string,
    reviewerAddress: string,
    auditEscrowAddress: string,
  ): Promise<any> {
    try {
      if (!auditIndex) {
        throw new Error('Audit index is required');
      }

      if (!reviewerAddress) {
        throw new Error('Reviewer address is required');
      }

      const escrow = this.getAuditEscrowContract(auditEscrowAddress);
      if (!escrow) {
        throw new Error('Audit Escrow contract is not initialized');
      }

      // V2 contract - use claimReview with audit index
      const auditIndexNumber = parseInt(auditIndex, 10);
      const txData = await escrow.claimReview.populateTransaction(auditIndexNumber);

      const result = {
        to: auditEscrowAddress,
        data: txData.data || '0x',
        from: reviewerAddress,
        value: '0x0',
        gas: '200000'
      };

      return result;
    } catch (error) {
      this.logger.error(`Error preparing claim review transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  async prepareAssignReviewerTransaction(
    auditIndex: string,
    reviewerAddress: string,
    auditEscrowAddress: string,
  ): Promise<any> {
    try {
      if (!auditIndex) {
        throw new Error('Audit index is required');
      }

      if (!reviewerAddress) {
        throw new Error('Reviewer address is required');
      }

      const escrow = this.getAuditEscrowContract(auditEscrowAddress);
      if (!escrow) {
        throw new Error('Audit Escrow contract is not initialized');
      }

      // Convert auditIndex to number to ensure correct type
      const auditIndexNumber = parseInt(auditIndex, 10);

      const txData = await escrow.assignReviewer.populateTransaction(
        auditIndexNumber,
        reviewerAddress
      );

      const result = {
        to: auditEscrowAddress,
        data: txData.data || '0x',
        from: reviewerAddress,
        value: '0x0', // No ETH needed for assignment
        gas: '100000' // Set reasonable gas limit
      };

      return result;
    } catch (error) {
      this.logger.error(`Error preparing assign reviewer transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAudit(auditIndex: string, auditEscrowAddress: string): Promise<any> {
    try {
      this.logger.log(`Getting audit ${auditIndex} from contract: ${auditEscrowAddress}`);
      
      // Validate and convert auditIndex to number
      if (!auditIndex || isNaN(Number(auditIndex))) {
        throw new Error(`Invalid audit index: ${auditIndex}. Must be a number.`);
      }
      
      const auditIndexNumber = parseInt(auditIndex, 10);
      
      const escrow = this.getAuditEscrowContract(auditEscrowAddress);
      const audit = await escrow.getAudit(auditIndexNumber);
      
      this.logger.log(`Raw audit data:`, audit);
      
      // V2 contract - audit structure no longer includes id or dao fields
      return {
        id: Number(auditIndex), // Use array index instead of audit id
        requester: audit.requester,
        assignedReviewer: audit.assignedReviewer,
        amount: ethers.formatEther(audit.amount),
        ipfsHash: audit.ipfsHash,
        status: Number(audit.status),
        createdAt: Number(audit.createdAt),
        completedAt: Number(audit.completedAt),
        reviewerPaid: audit.reviewerPaid,
        daoPaid: audit.daoPaid,
        dao: auditEscrowAddress // Add the DAO address as the dao field
      };
    } catch (error) {
      this.logger.error(`Error getting audit: ${error.message}`);
      throw error;
    }
  }

  async getAuditCount(auditEscrowAddress: string): Promise<number> {
    try {
      const escrow = this.getAuditEscrowContract(auditEscrowAddress);
      const count = await escrow.getAuditCount();
      return Number(count);
    } catch (error) {
      this.logger.error(`Error getting audit count: ${error.message}`);
      throw error;
    }
  }

  async getAudits(auditEscrowAddress: string): Promise<any[]> {
    try {
      const escrow = this.getAuditEscrowContract(auditEscrowAddress);
      const audits = await escrow.getAudits(); // New method to get all audits
      
      return audits.map((audit: any, index: number) => ({
        id: index,
        requester: audit.requester,
        assignedReviewer: audit.assignedReviewer,
        amount: ethers.formatEther(audit.amount),
        ipfsHash: audit.ipfsHash,
        status: Number(audit.status),
        createdAt: Number(audit.createdAt),
        completedAt: Number(audit.completedAt),
        reviewerPaid: audit.reviewerPaid,
        daoPaid: audit.daoPaid
      }));
    } catch (error) {
      this.logger.error(`Error getting audits: ${error.message}`);
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

