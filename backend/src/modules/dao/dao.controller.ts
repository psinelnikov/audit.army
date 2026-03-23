import { Controller, Get, Put, Post, Query, Param, Body } from '@nestjs/common';
import { DAOService } from './dao.service';
import { IsString, IsOptional, IsNumber } from 'class-validator';

class SearchDAODto {
  @IsString()
  @IsOptional()
  search?: string;
}

class CreateDAODto {
  @IsString()
  name: string;

  @IsString()
  symbol: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  creatorWallet?: string;

  @IsString()
  daoContractAddress: string;

  @IsString()
  auditEscrowAddress: string;

  @IsString()
  @IsOptional()
  initialReviewers?: string[];
}

@Controller('api/daos')
export class DAOController {
  constructor(private readonly daoService: DAOService) {}

  @Post()
  async createDAO(@Body() createDAODto: CreateDAODto) {
    try {
      const result = await this.daoService.createDAOWithAuditEscrow({
        name: createDAODto.name,
        symbol: createDAODto.symbol,
        description: createDAODto.description || '',
        creatorWallet: createDAODto.creatorWallet || '0x0000000000000000000000000000000000000000',
        daoContractAddress: createDAODto.daoContractAddress,
        auditEscrowAddress: createDAODto.auditEscrowAddress,
        initialReviewers: createDAODto.initialReviewers || []
      });
      
      return {
        success: true,
        data: {
          dao: result.dao
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get()
  async searchDAOs(@Query() query: SearchDAODto) {
    try {
      const daos = await this.daoService.findAll(query.search);
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

  @Get('stats')
  async getDAOStats() {
    try {
      const stats = await this.daoService.getDAOStats();
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

  @Put(':id/address')
  async updateDAOAddress(@Param('id') id: string, @Body() body: { contractAddress: string }) {
    try {
      const dao = await this.daoService.updateContractAddress(Number(id), body.contractAddress);
      return {
        success: true,
        data: dao
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get(':id')
  async getDAOById(@Param('id') id: string) {
    try {
      const dao = await this.daoService.findOne(Number(id));
      if (!dao) {
        return {
          success: false,
          error: 'DAO not found'
        };
      }
      return {
        success: true,
        data: { dao }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('address/:address')
  async getDAOByAddress(@Param('address') address: string) {
    try {
      const dao = await this.daoService.findByAddress(address);
      if (!dao) {
        return {
          success: false,
          error: 'DAO not found'
        };
      }
      return {
        success: true,
        data: { dao }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
