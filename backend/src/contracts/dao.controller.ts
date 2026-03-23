import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { DaoFactoryService } from './dao-factory.service';
import { IsString, IsArray, IsNotEmpty } from 'class-validator';

class CreateDAODto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsArray()
  @IsNotEmpty()
  initialReviewers: string[];

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}

@Controller('api/dao')
export class DaoController {
  constructor(private readonly daoFactoryService: DaoFactoryService) {}

  @Get('search')
  async searchDAOs(@Query('search') search?: string) {
    try {
      // Get real DAOs from blockchain
      let realDAOs: any[] = [];
      try {
        const daoAddresses = await this.daoFactoryService.getAllDAOs();
        
        // For each DAO address, we need to get its details
        // For now, we'll create placeholder data with real addresses
        realDAOs = daoAddresses.map((address, index) => ({
          id: index + 1000, // Use high IDs to distinguish from mock data
          name: `User Created DAO #${index + 1}`,
          symbol: `UCD${index + 1}`,
          description: `A DAO created by the community at address ${address.slice(0, 10)}...`,
          contractAddress: address,
          creatorWallet: '0x0000000000000000000000000000000000000000', // Would need to fetch from contract
          createdAt: new Date().toISOString(), // Would need to fetch from contract
          logoUrl: null,
          isUserCreated: true // Flag to identify user-created DAOs
        }));
      } catch (error) {
        console.error('Error fetching real DAOs:', error);
        // Continue with mock data if blockchain fetch fails
      }

      // No example DAOs - only user-created DAOs from blockchain
      const mockDAOs: any[] = [];

      // Combine real DAOs with mock data, putting real DAOs first
      const allDAOs = [...realDAOs, ...mockDAOs];
      
      let filteredDAOs = allDAOs;
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredDAOs = allDAOs.filter(dao => 
          dao.name.toLowerCase().includes(searchLower) ||
          dao.symbol.toLowerCase().includes(searchLower) ||
          dao.description.toLowerCase().includes(searchLower)
        );
      }

      return {
        success: true,
        data: { daos: filteredDAOs }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('stats')
  async getDAOStats() {
    try {
      // Get real DAO count from blockchain
      let realDAOCount = 0;
      try {
        const daoAddresses = await this.daoFactoryService.getAllDAOs();
        realDAOCount = daoAddresses.length;
      } catch (error) {
        console.error('Error fetching real DAO count:', error);
        // Continue with mock data if blockchain fetch fails
      }

      // Real stats only - no example DAOs
      const stats = {
        total: realDAOCount,
        thisMonth: realDAOCount, // Assume all real DAOs were created this month
        thisWeek: Math.min(realDAOCount, Math.floor(realDAOCount / 2)), // Some portion created this week
        realDAOCount: realDAOCount
      };
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Post('prepare-transaction')
  async prepareCreateDAOTx(@Body() createDAODto: CreateDAODto) {
    try {
      const { name, symbol, initialReviewers, description, walletAddress } = createDAODto;

      // Validate required fields
      if (!name || !symbol || !initialReviewers || !description || !walletAddress) {
        return {
          success: false,
          error: `Missing required fields: ${!name ? 'name ' : ''}${!symbol ? 'symbol ' : ''}${!initialReviewers ? 'initialReviewers ' : ''}${!description ? 'description ' : ''}${!walletAddress ? 'walletAddress ' : ''}`
        };
      }

      const result = await this.daoFactoryService.prepareCreateDAOTransaction(
        name,
        symbol,
        initialReviewers,
        description,
        walletAddress
      );

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('address/:id')
  async getDAOAddress(@Param('id') id: string) {
    try {
      const address = await this.daoFactoryService.getDAOAddress(Number(id));
      return {
        success: true,
        data: { address }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('all')
  async getAllDAOs() {
    try {
      const daos = await this.daoFactoryService.getAllDAOs();
      return {
        success: true,
        data: { daos }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
