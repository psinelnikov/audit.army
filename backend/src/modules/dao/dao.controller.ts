import { Controller, Get, Query, Param } from '@nestjs/common';
import { DAOService } from './dao.service';
import { IsString, IsOptional, IsNumber } from 'class-validator';

class SearchDAODto {
  @IsString()
  @IsOptional()
  search?: string;
}

@Controller('api/daos')
export class DAOController {
  constructor(private readonly daoService: DAOService) {}

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
