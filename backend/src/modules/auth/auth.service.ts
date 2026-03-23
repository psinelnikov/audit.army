import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async generateNonce(address: string): Promise<{ nonce: string }> {
    const normalizedAddress = ethers.getAddress(address);
    
    let user = await this.userRepository.findOne({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      user = this.userRepository.create({
        walletAddress: normalizedAddress,
        nonce: this.generateRandomNonce(),
      });
      await this.userRepository.save(user);
    } else {
      user.nonce = this.generateRandomNonce();
      await this.userRepository.save(user);
    }

    return { nonce: user.nonce };
  }

  async verifySignature(message: string, signature: string): Promise<{ token: string; address: string }> {
    try {
      // Parse the message manually instead of using SIWE library parser
      const lines = message.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 6) {
        throw new BadRequestException('Invalid SIWE message format');
      }
      
      // Extract address from line 2
      const addressLine = lines[1];
      const messageAddress = addressLine.trim();
      
      // Extract nonce from the last line
      const nonceLine = lines[lines.length - 1];
      const nonce = nonceLine.replace('Nonce:', '').trim();
      
      const normalizedAddress = ethers.getAddress(messageAddress);
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== normalizedAddress.toLowerCase()) {
        throw new UnauthorizedException('Signature verification failed');
      }
      
      const user = await this.userRepository.findOne({
        where: { walletAddress: normalizedAddress },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.nonce !== nonce) {
        throw new UnauthorizedException('Invalid nonce');
      }

      const sessionToken = uuidv4();
      user.sessionToken = sessionToken;
      user.lastLogin = new Date();
      await this.userRepository.save(user);

      return {
        token: sessionToken,
        address: normalizedAddress,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Invalid SIWE message or signature');
    }
  }

  async verifySession(token: string): Promise<User> {
    console.log('Verifying session token:', token);
    
    const user = await this.userRepository.findOne({
      where: { sessionToken: token },
    });

    console.log('User found for token:', user ? user.walletAddress : 'null');

    if (!user) {
      throw new UnauthorizedException('Invalid session token');
    }

    return user;
  }

  async logout(token: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { sessionToken: token },
    });

    if (user) {
      user.sessionToken = null;
      await this.userRepository.save(user);
    }
  }

  private generateRandomNonce(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private verifyMessageSignature(message: string, signature: string, address: string): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      return false;
    }
  }
}
