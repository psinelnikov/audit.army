import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import * as DAOFactoryABI from './DAOFactory.json';

@Injectable()
export class DaoFactoryService {
  private readonly logger = new Logger(DaoFactoryService.name);
  private provider: ethers.Provider;
  private factory: any;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org');
    const factoryAddress = process.env.DAO_FACTORY_ADDRESS;

    if (!factoryAddress) {
      this.logger.warn('DAO_FACTORY_ADDRESS environment variable is not set. DAO operations will fail.');
      this.factory = null;
      return;
    }

    try {
      this.factory = new ethers.Contract(factoryAddress, DAOFactoryABI.abi, this.provider);
      this.logger.log(`DAO Factory initialized at ${factoryAddress}`);
    } catch (error) {
      this.logger.error(`Failed to initialize DAO Factory: ${error.message}`);
      this.factory = null;
    }
  }

  async prepareCreateDAOTransaction(
    name: string,
    symbol: string,
    initialReviewers: string[],
    description: string,
    fromAddress: string
  ): Promise<{ to: string; data: string; from: string; value: string }> {
    try {
      this.logger.log(`Preparing DAO creation transaction for: ${fromAddress}`);

      const factoryAddress = process.env.DAO_FACTORY_ADDRESS;
      if (!factoryAddress) {
        throw new Error('DAO_FACTORY_ADDRESS environment variable is not set');
      }

      const factory = new ethers.Contract(
        factoryAddress,
        DAOFactoryABI.abi,
        this.provider
      );

      // Check if the method exists
      if (!factory.createDAO) {
        throw new Error('createDAO method not found in contract');
      }

      const txData = await factory.createDAO.populateTransaction(
        name,
        symbol,
        initialReviewers,
        description
      );

      if (!txData || !txData.data) {
        throw new Error('Failed to populate transaction data');
      }

      return {
        to: factoryAddress,
        data: txData.data,
        from: fromAddress,
        value: '0x0'
      };
    } catch (error) {
      this.logger.error(`Error preparing DAO transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDAOAddress(daoId: number): Promise<string> {
    if (!this.factory) {
      throw new Error('DAO Factory is not initialized. Please check DAO_FACTORY_ADDRESS environment variable.');
    }
    
    try {
      const address = await this.factory.getDAOAddress(daoId);
      return address;
    } catch (error) {
      this.logger.error(`Error getting DAO address: ${error.message}`);
      throw error;
    }
  }

  
  async getAllDAOs(): Promise<string[]> {
    if (!this.factory) {
      throw new Error('DAO Factory is not initialized. Please check DAO_FACTORY_ADDRESS environment variable.');
    }
    
    try {
      const daos = await this.factory.getAllDAOs();
      return daos;
    } catch (error) {
      this.logger.error(`Error getting all DAOs: ${error.message}`);
      throw error;
    }
  }

  async getDAODetails(daoAddress: string): Promise<any> {
    if (!this.factory) {
      throw new Error('DAO Factory is not initialized. Please check DAO_FACTORY_ADDRESS environment variable.');
    }
    
    try {
      // Create a contract instance for the specific DAO
      // Use a comprehensive DAO ABI that covers common methods
      const daoABI = [
        'function name() view returns (string)',
        'function symbol() view returns (string)', 
        'function description() view returns (string)',
        'function creator() view returns (address)',
        'function createdAt() view returns (uint256)',
        'function getCreator() view returns (address)', // Alternative method name
        'function getDetails() view returns (string, string, string, address, uint256)' // Batch method
      ];
      
      const daoContract = new ethers.Contract(daoAddress, daoABI, this.provider);
      
      // Try different approaches to get DAO details
      let name, symbol, description, creator, createdAt;
      
      try {
        // First try the batch method if available
        const details = await daoContract.getDetails();
        name = details[0];
        symbol = details[1]; 
        description = details[2];
        creator = details[3];
        createdAt = details[4];
      } catch (batchError) {
        // Fall back to individual method calls
        const results = await Promise.allSettled([
          daoContract.name(),
          daoContract.symbol(),
          daoContract.description(),
          daoContract.creator().catch(() => daoContract.getCreator()), // Try both creator methods
          daoContract.createdAt()
        ]);
        
        name = results[0].status === 'fulfilled' ? results[0].value : `DAO ${daoAddress.slice(0, 8)}...`;
        symbol = results[1].status === 'fulfilled' ? results[1].value : 'UNKNOWN';
        description = results[2].status === 'fulfilled' ? results[2].value : 'A decentralized autonomous organization';
        creator = results[3].status === 'fulfilled' ? results[3].value : '0x0000000000000000000000000000000000000000';
        createdAt = results[4].status === 'fulfilled' ? results[4].value : Date.now();
      }
      
      // Get AuditEscrow address
      let auditEscrowAddress;
      try {
        auditEscrowAddress = await this.factory.getAuditEscrowAddress(daoAddress);
      } catch (error) {
        this.logger.warn(`Failed to get AuditEscrow address for DAO ${daoAddress}: ${error.message}`);
        auditEscrowAddress = '0x0000000000000000000000000000000000000000';
      }
      
      return {
        name: typeof name === 'string' ? name : String(name),
        symbol: typeof symbol === 'string' ? symbol : String(symbol),
        description: typeof description === 'string' ? description : String(description),
        creator: typeof creator === 'string' ? creator : String(creator),
        createdAt: new Date(Number(createdAt) * 1000).toISOString(),
        auditEscrowAddress
      };
    } catch (error) {
      this.logger.error(`Error getting DAO details for ${daoAddress}: ${error.message}`);
      // Return fallback data if contract calls fail
      return {
        name: `DAO ${daoAddress.slice(0, 8)}...`,
        symbol: 'UNKNOWN',
        description: 'A decentralized autonomous organization',
        creator: '0x0000000000000000000000000000000000000000',
        createdAt: new Date().toISOString(),
        auditEscrowAddress: '0x0000000000000000000000000000000000000000'
      };
    }
  }
}
