import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import * as DAOFactoryABI from './DAOFactory.json';

@Injectable()
export class DaoFactoryService {
  private readonly logger = new Logger(DaoFactoryService.name);
  private provider: ethers.Provider;
  private factory: any;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const factoryAddress = process.env.DAO_FACTORY_ADDRESS;

    if (!factoryAddress) {
      throw new Error('DAO_FACTORY_ADDRESS environment variable is required');
    }

    this.factory = new ethers.Contract(factoryAddress, DAOFactoryABI.abi, this.provider);
    this.logger.log(`DAO Factory initialized at ${factoryAddress}`);
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

      const factory = new ethers.Contract(
        process.env.DAO_FACTORY_ADDRESS!,
        DAOFactoryABI.abi,
        this.provider
      );

      const txData = await factory.createDAO.populateTransaction(
        name,
        symbol,
        initialReviewers,
        description
      );

      return {
        to: process.env.DAO_FACTORY_ADDRESS!,
        data: txData.data || '0x',
        from: fromAddress,
        value: '0x0'
      };
    } catch (error) {
      this.logger.error(`Error preparing DAO transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDAOAddress(daoId: number): Promise<string> {
    try {
      const address = await this.factory.getDAOAddress(daoId);
      return address;
    } catch (error) {
      this.logger.error(`Error getting DAO address: ${error.message}`);
      throw error;
    }
  }

  async getAllDAOs(): Promise<string[]> {
    try {
      const daos = await this.factory.getAllDAOs();
      return daos;
    } catch (error) {
      this.logger.error(`Error getting all DAOs: ${error.message}`);
      throw error;
    }
  }
}
