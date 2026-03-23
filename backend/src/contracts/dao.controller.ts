import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { DaoFactoryService } from './dao-factory.service';

class CreateDAODto {
  name: string;
  symbol: string;
  initialReviewers: string[];
  description: string;
  walletAddress: string;
}

@Controller('api/dao')
export class DaoController {
  constructor(private readonly daoFactoryService: DaoFactoryService) {}

  @Post('prepare-transaction')
  async prepareCreateDAOTx(@Body() createDAODto: CreateDAODto) {
    try {
      const { name, symbol, initialReviewers, description, walletAddress } = createDAODto;

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
