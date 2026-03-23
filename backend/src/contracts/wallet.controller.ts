import { Controller, Get, Post, Body } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('api/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('address')
  async getWalletAddress() {
    try {
      const address = await this.walletService.getWalletAddress();
      return {
        success: true,
        data: { address }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('chain-id')
  async getChainId() {
    try {
      const chainId = await this.walletService.getChainId();
      return {
        success: true,
        data: { chainId }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Post('switch-network')
  async switchNetwork() {
    try {
      await this.walletService.switchToSepolia();
      return {
        success: true,
        data: { message: 'Switched to Sepolia' }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('connected')
  async isWalletConnected() {
    try {
      const connected = this.walletService.isWalletConnected();
      return {
        success: true,
        data: { connected }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
