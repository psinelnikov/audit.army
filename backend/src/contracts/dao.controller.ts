import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { DaoFactoryService } from './dao-factory.service';
import { ethers } from 'ethers';

class CreateDAODto {
  name: string;
  symbol: string;
  initialReviewers: string[];
  description: string;
  privateKey: string;
}

@Controller('api/dao')
export class DaoController {
  constructor(private readonly daoFactoryService: DaoFactoryService) {}

  @Post('create')
  async createDAO(@Body() createDAODto: CreateDAODto) {
    try {
      const { name, symbol, initialReviewers, description, privateKey } = createDAODto;

      const signer = new ethers.Wallet(privateKey);

      const result = await this.daoFactoryService.createDAO(
        name,
        symbol,
        initialReviewers,
        description,
        signer
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

  @Get('count')
  async getDAOCount() {
    try {
      const count = await this.daoFactoryService.getDAOCount();
      return {
        success: true,
        data: { count }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
