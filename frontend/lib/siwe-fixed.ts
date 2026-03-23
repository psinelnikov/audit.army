import { ethers } from 'ethers';

export function createSiweMessage(address: string, nonce: string, domain: string, uri: string): string {
  // Convert address to EIP-55 checksum format
  const checksumAddress = ethers.getAddress(address);
  
  // SIWE message format - exactly 7 lines (minimal required fields)
  const message = `${domain} wants you to sign in with your Ethereum account:
${checksumAddress}

URI: ${uri}
Version: 1
Chain ID: 11155111
Nonce: ${nonce}`;

  return message;
}
