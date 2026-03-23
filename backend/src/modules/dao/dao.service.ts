import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThanOrEqual } from 'typeorm';
import { DAO } from './entities/dao.entity';
import { ethers } from 'ethers';

@Injectable()
export class DAOService {
  private readonly logger = new Logger(DAOService.name);

  constructor(
    @InjectRepository(DAO)
    private readonly daoRepository: Repository<DAO>,
  ) {}

  async findAll(search?: string): Promise<DAO[]> {
    try {
      const queryBuilder = this.daoRepository.createQueryBuilder('dao');
      
      if (search) {
        queryBuilder.where(
          '(dao.name ILIKE :search OR dao.symbol ILIKE :search OR dao.description ILIKE :search)',
          { search: `%${search}%` }
        );
      }
      
      queryBuilder.orderBy('dao.createdAt', 'DESC');
      
      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error(`Error searching DAOs: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: number): Promise<DAO | null> {
    try {
      return await this.daoRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(`Error finding DAO: ${error.message}`);
      throw error;
    }
  }

  async findByAddress(address: string): Promise<DAO | null> {
    try {
      return await this.daoRepository.findOne({ 
        where: { contractAddress: address.toLowerCase() } 
      });
    } catch (error) {
      this.logger.error(`Error finding DAO by address: ${error.message}`);
      throw error;
    }
  }

  async create(daoData: Partial<DAO>): Promise<DAO> {
    try {
      const dao = this.daoRepository.create(daoData);
      return await this.daoRepository.save(dao);
    } catch (error) {
      this.logger.error(`Error creating DAO: ${error.message}`);
      throw error;
    }
  }

  async createDAOWithAuditEscrow(daoData: {
    name: string;
    symbol: string;
    description: string;
    creatorWallet: string;
    daoContractAddress: string;
    auditEscrowAddress: string;
    initialReviewers: string[];
  }): Promise<{ dao: DAO }> {
    try {
      this.logger.log(`Registering DAO with addresses: ${daoData.name}`);
      
      // Validate addresses
      if (!ethers.isAddress(daoData.daoContractAddress)) {
        throw new Error('Invalid DAO contract address');
      }
      
      if (!ethers.isAddress(daoData.auditEscrowAddress)) {
        throw new Error('Invalid AuditEscrow contract address');
      }
      
      // Create DAO record with user-provided addresses
      const dao = await this.create({
        name: daoData.name,
        symbol: daoData.symbol,
        contractAddress: daoData.daoContractAddress,
        auditEscrowAddress: daoData.auditEscrowAddress,
        chainId: 11155111, // Sepolia
        description: daoData.description,
        creatorWallet: daoData.creatorWallet,
      });

      this.logger.log(`DAO registered with ID: ${dao.id}, DAO Address: ${daoData.daoContractAddress}, AuditEscrow: ${daoData.auditEscrowAddress}`);
      
      return {
        dao
      };
    } catch (error) {
      this.logger.error(`Error registering DAO: ${error.message}`);
      throw error;
    }
  }

  async updateContractAddress(id: number, contractAddress: string): Promise<DAO> {
    try {
      await this.daoRepository.update(id, { contractAddress });
      const dao = await this.findOne(id);
      if (!dao) {
        throw new Error('DAO not found');
      }
      return dao;
    } catch (error) {
      this.logger.error(`Error updating DAO contract address: ${error.message}`);
      throw error;
    }
  }

  async getDAOStats(): Promise<{
    total: number;
    thisMonth: number;
    thisWeek: number;
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      
      const [total, thisMonth, thisWeek] = await Promise.all([
        this.daoRepository.count(),
        this.daoRepository.count({ where: { createdAt: MoreThanOrEqual(startOfMonth) } }),
        this.daoRepository.count({ where: { createdAt: MoreThanOrEqual(startOfWeek) } }),
      ]);
      
      return { total, thisMonth, thisWeek };
    } catch (error) {
      this.logger.error(`Error getting DAO stats: ${error.message}`);
      throw error;
    }
  }
}
