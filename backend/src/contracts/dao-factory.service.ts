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

  async createDAO(
    name: string,
    symbol: string,
    initialReviewers: string[],
    description: string,
    signer: ethers.Signer
  ): Promise<{ txHash: string; daoAddress: string }> {
    try {
      this.logger.log(`Creating DAO: ${name} (${symbol})`);

      const factoryWithSigner = this.factory.connect(signer);
      const tx = await factoryWithSigner.createDAO(
        name,
        symbol,
        initialReviewers,
        description
      );

      this.logger.log(`DAO creation transaction sent: ${tx.hash}`);

      await tx.wait();

      this.logger.log(`DAO created successfully`);

      const daoCount = await this.factory.getDAOCount();
      const daoAddress = await this.factory.getDAOAddress(daoCount);

      return { txHash: tx.hash, daoAddress };
    } catch (error) {
      this.logger.error(`Error creating DAO: ${error.message}`, error.stack);
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

  async getDAOCount(): Promise<number> {
    try {
      const count = await this.factory.getDAOCount();
      return Number(count);
    } catch (error) {
      this.logger.error(`Error getting DAO count: ${error.message}`);
      throw error;
    }
  }
}
