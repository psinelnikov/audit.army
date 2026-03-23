/**
 * Wallet utilities for web3 interactions
 */

import { ethers } from 'ethers';
import { createSiweMessage } from './siwe-fixed';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  network: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  address: string | null;
  token: string | null;
}

/**
 * Connect to MetaMask wallet
 */
export async function connectWallet(): Promise<WalletState> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Please install MetaMask to use this application');
  }

  try {
    const accounts = await (window as any).ethereum.request({
      method: 'eth_requestAccounts',
    });

    const address = accounts[0];
    const chainId = await (window as any).ethereum.request({
      method: 'eth_chainId',
    });
    const chainIdNumber = parseInt(chainId, 16);
    const network = getNetworkName(chainIdNumber);

    return {
      isConnected: true,
      address,
      chainId: chainIdNumber,
      network,
    };
  } catch (error: any) {
    console.error('Error connecting wallet:', error);
    throw new Error(error.message || 'Failed to connect wallet');
  }
}

/**
 * Get current wallet state
 */
export async function getWalletState(): Promise<WalletState> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    return {
      isConnected: false,
      address: null,
      chainId: null,
      network: null,
    };
  }

  try {
    const accounts = await (window as any).ethereum.request({
      method: 'eth_accounts',
    });

    if (accounts.length === 0) {
      return {
        isConnected: false,
        address: null,
        chainId: null,
        network: null,
      };
    }

    const address = accounts[0];
    const chainId = await (window as any).ethereum.request({
      method: 'eth_chainId',
    });
    const chainIdNumber = parseInt(chainId, 16);
    const network = getNetworkName(chainIdNumber);

    return {
      isConnected: true,
      address,
      chainId: chainIdNumber,
      network,
    };
  } catch (error) {
    console.error('Error getting wallet state:', error);
    return {
      isConnected: false,
      address: null,
      chainId: null,
      network: null,
    };
  }
}

/**
 * Switch to Sepolia network
 */
export async function switchToSepolia(): Promise<void> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Please install MetaMask');
  }

  const targetChainId = '0xaa36a7'; // Sepolia in hex

  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      await addSepoliaNetwork();
    } else {
      throw error;
    }
  }
}

/**
 * Add Sepolia network if not already added
 */
async function addSepoliaNetwork(): Promise<void> {
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

  await (window as any).ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [networkParams],
  });
}

/**
 * Sign and send transaction
 */
export async function signAndSendTransaction(txData: {
  to: string;
  data: string;
  from: string;
  value: string;
  gas?: string;
}): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Please install MetaMask');
  }

  try {
    // Convert value to hex string for MetaMask compatibility
    const valueHex = '0x' + BigInt(txData.value).toString(16);
    
    const txDataWithHexValue = {
      ...txData,
      value: valueHex
    };

    // Add gas limit if provided
    if (txData.gas) {
      txDataWithHexValue.gas = txData.gas;
    }

    const txHash = await (window as any).ethereum.request({
      method: 'eth_sendTransaction',
      params: [txDataWithHexValue],
    });

    return txHash;
  } catch (error: any) {
    console.error('Error signing transaction:', error);
    throw new Error(error.message || 'Failed to sign transaction');
  }
}

/**
 * Get network name from chain ID
 */
function getNetworkName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet';
    case 5:
      return 'Goerli Testnet';
    case 11155111:
      return 'Sepolia Testnet';
    case 137:
      return 'Polygon Mainnet';
    case 80001:
      return 'Polygon Mumbai';
    case 42161:
      return 'Arbitrum One';
    case 421613:
      return 'Arbitrum Goerli';
    default:
      return 'Unknown Network';
  }
}

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
}

/**
 * Format address for display
 */
export function formatAddress(address: string, chars = 6): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format date for display
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

/**
 * Wait for transaction to be mined
 */
export async function waitForTransaction(txHash: string, maxAttempts = 60): Promise<void> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Please install MetaMask');
  }

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const receipt = await (window as any).ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      });

      if (receipt && receipt.blockNumber) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error checking transaction:', error);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Transaction timeout: Failed to confirm transaction');
}

/**
 * Get transaction receipt
 */
export async function getTransactionReceipt(txHash: string) {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Please install MetaMask');
  }

  try {
    const receipt = await (window as any).ethereum.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    });

    return receipt;
  } catch (error) {
    console.error('Error getting transaction receipt:', error);
    throw new Error('Failed to get transaction receipt');
  }
}

/**
 * Sign message with MetaMask
 */
export async function signMessage(message: string): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Please install MetaMask');
  }

  try {
    const signature = await (window as any).ethereum.request({
      method: 'personal_sign',
      params: [message, await getConnectedAddress()],
    });

    return signature;
  } catch (error: any) {
    console.error('Error signing message:', error);
    throw new Error(error.message || 'Failed to sign message');
  }
}

/**
 * Get connected address
 */
async function getConnectedAddress(): Promise<string> {
  const accounts = await (window as any).ethereum.request({
    method: 'eth_accounts',
  });

  if (accounts.length === 0) {
    throw new Error('No connected account');
  }

  return accounts[0];
}

/**
 * Authenticate with SIWE
 */
export async function authenticateWithSiwe(): Promise<AuthState> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Please install MetaMask to use this application');
  }

  try {
    // Get current address
    const walletState = await getWalletState();
    if (!walletState.address) {
      throw new Error('No wallet connected');
    }

    // Get nonce from backend
    const nonceResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/nonce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: walletState.address }),
    });

    const nonceData = await nonceResponse.json();
    if (!nonceData.success) {
      throw new Error(nonceData.error || 'Failed to get nonce');
    }

    // Create SIWE message
    const domain = window.location.host;
    const uri = window.location.origin;
    const message = createSiweMessage(walletState.address, nonceData.data.nonce, domain, uri);

    // Sign message
    const signature = await signMessage(message);

    // Verify signature with backend
    const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature }),
    });

    const verifyData = await verifyResponse.json();
    if (!verifyData.success) {
      throw new Error(verifyData.error || 'Failed to verify signature');
    }

    return {
      isAuthenticated: true,
      address: verifyData.data.address,
      token: verifyData.data.token,
    };
  } catch (error: any) {
    console.error('Error authenticating with SIWE:', error);
    throw error;
  }
}

/**
 * Logout from SIWE session
 */
export async function logoutFromSiwe(token: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/logout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to logout');
    }
  } catch (error: any) {
    console.error('Error logging out:', error);
    throw error;
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(token: string): Promise<{ address: string; createdAt: string; lastLogin: string | null }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to get user info');
    }

    return data.data;
  } catch (error: any) {
    console.error('Error getting current user:', error);
    throw error;
  }
}
