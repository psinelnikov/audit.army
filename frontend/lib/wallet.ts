/**
 * Wallet utilities for web3 interactions
 */

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  network: string | null;
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
}): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Please install MetaMask');
  }

  try {
    const txHash = await (window as any).ethereum.request({
      method: 'eth_sendTransaction',
      params: [txData],
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
