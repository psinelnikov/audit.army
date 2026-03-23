import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  /**
   * Get connected wallet address
   */
  async getWalletAddress(): Promise<string> {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        return accounts[0];
      } catch (error) {
        this.logger.error('Error getting wallet address:', error);
        throw new Error('Failed to get wallet address');
      }
    }
    throw new Error('MetaMask not installed');
  }

  /**
   * Get chain ID
   */
  async getChainId(): Promise<number> {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const chainId = await (window as any).ethereum.request({
          method: 'eth_chainId',
        });
        return parseInt(chainId, 16);
      } catch (error) {
        this.logger.error('Error getting chain ID:', error);
        throw new Error('Failed to get chain ID');
      }
    }
    throw new Error('MetaMask not installed');
  }

  /**
   * Switch to Sepolia network
   */
  async switchToSepolia(): Promise<void> {
    const targetChainId = '0xaa36a7'; // Sepolia in hex

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        });
      } catch (error: any) {
        if (error.code === 4902) {
          await this.addSepoliaNetwork();
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Add Sepolia network if not already added
   */
  private async addSepoliaNetwork(): Promise<void> {
    const networkParams = {
      chainId: '0xaa36a7',
      chainName: 'Sepolia test network',
      nativeCurrency: {
        name: 'SepoliaETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://rpc.sepolia.org'],
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
    };

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      await (window as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkParams],
      });
    }
  }

  /**
   * Sign transaction with wallet
   */
  async signTransaction(tx: any): Promise<string> {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [tx],
        });
        return txHash;
      } catch (error) {
        this.logger.error('Error signing transaction:', error);
        throw new Error('Failed to sign transaction');
      }
    }
    throw new Error('MetaMask not installed');
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return typeof window !== 'undefined' && (window as any).ethereum;
  }
}
