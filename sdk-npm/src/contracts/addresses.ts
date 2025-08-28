import { ChainId } from '../types';


/**
 * Circle CCTP Contract Addresses
 * Updated: December 2024
 * Source: https://developers.circle.com/stablecoins/evm-smart-contracts
 */

export interface CCTPAddresses {
  tokenMessenger: string;
  messageTransmitter: string;
  tokenMinter: string;
  usdc: string;
}

// Mainnet Addresses - TokenMessengerV2 is consistent across all chains
const MAINNET_TOKEN_MESSENGER = '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d';

// Testnet Addresses - TokenMessengerV2 is consistent across all Sepolia testnets  
const TESTNET_TOKEN_MESSENGER = '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5';

export const CCTP_MAINNET_ADDRESSES: Record<ChainId, CCTPAddresses> = {
  // Ethereum Mainnet
  1: {
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: '0x0a992d191DEeC32aFe36203Ad87D7d289a738F81',
    tokenMinter: '0xc4922d64a24675E16e1586e3e3Aa56C06fABe907',
    usdc: '0xA0b86a33E6417c3b1a3f7C32ec8A35B9A7eFCEa4' // Native USDC
  },

  // Arbitrum One  
  42161: {
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
    tokenMinter: '0xE7Ed1fa7f45D05C508232aa32649D89b73b8bA48',
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' // Native USDC
  },

  // Base Mainnet
  8453: {
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: '0xAD09780d193884d503182aD4588450C416D6F9D4',
    tokenMinter: '0xc4922d64a24675E16e1586e3e3Aa56C06fABe907',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Native USDC
  },

  // Avalanche Mainnet
  43114: {
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: '0x8186359aF5F57FbB40c6b14A588d2A59C0C29880',
    tokenMinter: '0x420f5035fd5dc62a167e7e7f08b604335ae272b8',
    usdc: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' // Native USDC
  },

  // Optimism Mainnet
  10: {
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: '0x4D41f22c5a0e5c74090899E5a8FB597a8842b3e8',
    tokenMinter: '0x33E76C5C31cb928dc6FE6487AB3b2C0769B1A1e3',
    usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' // Native USDC
  },

  // Polygon PoS
  137: {
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: '0xF3be9355363857F3e001be68856A2f96b4C39Ba9',
    tokenMinter: '0x10f7835F4FB2B044C8ddd9f2C33FB64b2c5D6551',
    usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' // Native USDC
  }
};

export const CCTP_TESTNET_ADDRESSES: Record<ChainId, CCTPAddresses> = {
  // Ethereum Sepolia
  11155111: {
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    tokenMinter: '0xE997d7d2F6E065a9A93Fa2175E878Fb9081F1f0A',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Test USDC
  },

  // Arbitrum Sepolia
  421614: {
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    tokenMinter: '0xE997d7d2F6E065a9A93Fa2175E878Fb9081F1f0A',
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' // Test USDC
  },

  // Base Sepolia
  84532: {
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    tokenMinter: '0xE997d7d2F6E065a9A93Fa2175E878Fb9081F1f0A',
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Test USDC
  },

  // Avalanche Fuji
  43113: {
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    tokenMinter: '0xE997d7d2F6E065a9A93Fa2175E878Fb9081F1f0A',
    usdc: '0x5425890298aed601595a70AB815c96711a31Bc65' // Test USDC
  },

  // Polygon Amoy (testnet)
  80002: {
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    tokenMinter: '0xE997d7d2F6E065a9A93Fa2175E878Fb9081F1f0A',
    usdc: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582' // Test USDC
  }
};

/**
 * Get CCTP contract addresses for a specific chain
 */
export function getCCTPAddresses(chainId: ChainId, isTestnet: boolean = true): CCTPAddresses {
  const addresses = isTestnet ? CCTP_TESTNET_ADDRESSES : CCTP_MAINNET_ADDRESSES;
  
  if (!addresses[chainId]) {
    throw new Error(`CCTP not supported on chain ${chainId}`);
  }
  
  return addresses[chainId];
}

/**
 * Check if CCTP is supported on a chain
 */
export function isCCTPSupported(chainId: ChainId, isTestnet: boolean = true): boolean {
  const addresses = isTestnet ? CCTP_TESTNET_ADDRESSES : CCTP_MAINNET_ADDRESSES;
  return chainId in addresses;
}

/**
 * Get all supported CCTP chain IDs
 */
export function getSupportedCCTPChains(isTestnet: boolean = true): ChainId[] {
  const addresses = isTestnet ? CCTP_TESTNET_ADDRESSES : CCTP_MAINNET_ADDRESSES;
  return Object.keys(addresses).map(chainId => parseInt(chainId));
}

/**
 * CCTP Domain mapping (for Circle's internal routing)
 * Domain 0 = Ethereum, 1 = Avalanche, 2 = Noble, 3 = Arbitrum, etc.
 */
export const CCTP_DOMAIN_MAPPING: Record<ChainId, number> = {
  // Mainnet domains
  1: 0,      // Ethereum
  43114: 1,  // Avalanche  
  42161: 3,  // Arbitrum
  10: 2,     // Optimism (domain 2 is shared with Noble)
  8453: 6,   // Base
  137: 7,    // Polygon

  // Testnet domains (same as mainnet)
  11155111: 0, // Ethereum Sepolia
  43113: 1,    // Avalanche Fuji
  421614: 3,   // Arbitrum Sepolia
  84532: 6,    // Base Sepolia
  80002: 7,    // Polygon Amoy
};

/**
 * Get CCTP domain for a chain
 */
export function getCCTPDomain(chainId: ChainId): number {
  if (!(chainId in CCTP_DOMAIN_MAPPING)) {
    throw new Error(`CCTP domain not found for chain ${chainId}`);
  }
  return CCTP_DOMAIN_MAPPING[chainId];
}