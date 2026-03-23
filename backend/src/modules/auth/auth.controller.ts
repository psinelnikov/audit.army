import { Controller, Post, Get, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('nonce')
  async getNonce(@Body() body: { address: string }) {
    try {
      const { nonce } = await this.authService.generateNonce(body.address);
      return {
        success: true,
        data: { nonce }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Post('verify')
  async verifySignature(@Body() body: { message: string; signature: string }) {
    try {
      const result = await this.authService.verifySignature(body.message, body.signature);
      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('me')
  async getProfile(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);
    try {
      const user = await this.authService.verifySession(token);
      return {
        success: true,
        data: {
          address: user.walletAddress,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      };
    } catch (error: any) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('logout')
  async logout(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);
    try {
      await this.authService.logout(token);
      return {
        success: true,
        data: { message: 'Logged out successfully' }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
