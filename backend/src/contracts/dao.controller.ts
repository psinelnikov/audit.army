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
        
        // Fetch real details for each DAO
        const daoDetailsPromises = daoAddresses.map(async (address, index) => {
          try {
            const details = await this.daoFactoryService.getDAODetails(address);
            return {
              id: index + 1000, // Use high IDs to distinguish from mock data
              name: details.name,
              symbol: details.symbol,
              description: details.description,
              contractAddress: address,
              creatorWallet: details.creator,
              createdAt: details.createdAt,
              logoUrl: null,
              isUserCreated: true // Flag to identify user-created DAOs
            };
          } catch (error) {
            console.error(`Error fetching details for DAO at ${address}:`, error);
            // Fallback to basic data if details fetch fails
            return {
              id: index + 1000,
              name: `DAO ${address.slice(0, 8)}...`,
              symbol: 'UNKNOWN',
              description: 'A decentralized autonomous organization',
              contractAddress: address,
              creatorWallet: '0x0000000000000000000000000000000000000000',
              createdAt: new Date().toISOString(),
              logoUrl: null,
              isUserCreated: true
            };
          }
        });
        
        realDAOs = await Promise.all(daoDetailsPromises);
      } catch (error) {
        console.error('Error fetching real DAOs:', error);
        // Continue with empty array if blockchain fetch fails
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

  @Get('details/:address')
  async getDAODetails(@Param('address') address: string) {
    try {
      const details = await this.daoFactoryService.getDAODetails(address);
      return {
        success: true,
        data: details
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch DAO details'
      };
    }
  }
}
