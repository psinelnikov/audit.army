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
}
