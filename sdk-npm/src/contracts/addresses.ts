import { ChainId } from '../types';


/**
 * Circle CCTP V2 Contract Addresses
 * Updated: August 2025
 * Source: https://developers.circle.com/cctp/evm-smart-contracts
 * 
 * IMPORTANT: These are the official Circle CCTP V2 contract addresses.
 * DO NOT modify these addresses without verifying against Circle's official documentation.
 * 
 * V2 Addresses are consistent across all supported chains:
 * - TokenMessengerV2: Same address across all mainnet/testnet chains
 * - MessageTransmitterV2: Same address across all mainnet/testnet chains  
 * - TokenMinterV2: Same address across all mainnet/testnet chains
 * - USDC: Native USDC addresses (chain-specific)
 */

export interface CCTPAddresses {
  tokenMessenger: string;
  messageTransmitter: string;
  tokenMinter: string;
  usdc: string;
}

// Official Circle CCTP V2 Mainnet Addresses (consistent across all chains)
const MAINNET_TOKEN_MESSENGER = '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d';
const MAINNET_MESSAGE_TRANSMITTER = '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64';
const MAINNET_TOKEN_MINTER = '0xfd78EE919681417d192449715b2594ab58f5D002';

// Official Circle CCTP V2 Testnet Addresses (consistent across all testnets)
const TESTNET_TOKEN_MESSENGER = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA';
const TESTNET_MESSAGE_TRANSMITTER = '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275';

// Legacy working testnet addresses (for compatibility reference)
// These were working in previous implementation but may be older CCTP version
const LEGACY_TESTNET_TOKEN_MESSENGER = '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5';
const LEGACY_TESTNET_MESSAGE_TRANSMITTER = '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD';
const TESTNET_TOKEN_MINTER = '0xb43db544E2c27092c107639Ad201b3dEfAbcF192';

export const CCTP_MAINNET_ADDRESSES: Record<ChainId, CCTPAddresses> = {
  // Ethereum Mainnet
  1: {
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
    tokenMinter: MAINNET_TOKEN_MINTER,
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // Native USDC (corrected)
  },

  // Arbitrum One  
  42161: {
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
    tokenMinter: MAINNET_TOKEN_MINTER,
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' // Native USDC
  },

  // Base Mainnet
  8453: {
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
    tokenMinter: MAINNET_TOKEN_MINTER,
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Native USDC
  },

  // Avalanche Mainnet
  43114: {
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
    tokenMinter: MAINNET_TOKEN_MINTER,
    usdc: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' // Native USDC
  },

  // Optimism Mainnet
  10: {
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
    tokenMinter: MAINNET_TOKEN_MINTER,
    usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' // Native USDC
  },

  // Polygon PoS
  137: {
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
    tokenMinter: MAINNET_TOKEN_MINTER,
    usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' // Native USDC
  }
};

export const CCTP_TESTNET_ADDRESSES: Record<ChainId, CCTPAddresses> = {
  // Ethereum Sepolia
  11155111: {
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
    tokenMinter: TESTNET_TOKEN_MINTER,
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Test USDC
  },

  // Arbitrum Sepolia
  421614: {
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
    tokenMinter: TESTNET_TOKEN_MINTER,
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' // Test USDC
  },

  // Base Sepolia
  84532: {
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
    tokenMinter: TESTNET_TOKEN_MINTER,
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Test USDC
  },

  // Avalanche Fuji
  43113: {
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
    tokenMinter: TESTNET_TOKEN_MINTER,
    usdc: '0x5425890298aed601595a70AB815c96711a31Bc65' // Test USDC
  },

  // Optimism Sepolia
  11155420: {
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
    tokenMinter: TESTNET_TOKEN_MINTER,
    usdc: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7' // Test USDC
  },

  // Polygon Amoy (testnet)
  80002: {
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
    tokenMinter: TESTNET_TOKEN_MINTER,
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
  11155420: 2, // Optimism Sepolia
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

/**
 * Validate CCTP contract addresses against known official addresses
 * This helps detect configuration errors and ensures contract integrity
 */
export function validateCCTPAddresses(chainId: ChainId, isTestnet: boolean = true): boolean {
  try {
    const addresses = getCCTPAddresses(chainId, isTestnet);
    const expectedConstants = isTestnet ? {
      tokenMessenger: TESTNET_TOKEN_MESSENGER,
      messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
      tokenMinter: TESTNET_TOKEN_MINTER
    } : {
      tokenMessenger: MAINNET_TOKEN_MESSENGER,
      messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
      tokenMinter: MAINNET_TOKEN_MINTER
    };

    // Validate that consistent addresses are being used
    if (addresses.tokenMessenger !== expectedConstants.tokenMessenger) {
      throw new Error(`Invalid TokenMessenger address for chain ${chainId}. Expected: ${expectedConstants.tokenMessenger}, Got: ${addresses.tokenMessenger}`);
    }
    
    if (addresses.messageTransmitter !== expectedConstants.messageTransmitter) {
      throw new Error(`Invalid MessageTransmitter address for chain ${chainId}. Expected: ${expectedConstants.messageTransmitter}, Got: ${addresses.messageTransmitter}`);
    }
    
    if (addresses.tokenMinter !== expectedConstants.tokenMinter) {
      throw new Error(`Invalid TokenMinter address for chain ${chainId}. Expected: ${expectedConstants.tokenMinter}, Got: ${addresses.tokenMinter}`);
    }

    // Validate address format
    const ethers = require('ethers');
    if (!ethers.utils.isAddress(addresses.usdc)) {
      throw new Error(`Invalid USDC address format for chain ${chainId}: ${addresses.usdc}`);
    }

    return true;
  } catch (error) {
    console.error(`CCTP address validation failed for chain ${chainId}:`, error);
    return false;
  }
}

/**
 * Get official Circle CCTP V2 address constants for verification
 */
export const OFFICIAL_CCTP_V2_ADDRESSES = {
  MAINNET: {
    TOKEN_MESSENGER: MAINNET_TOKEN_MESSENGER,
    MESSAGE_TRANSMITTER: MAINNET_MESSAGE_TRANSMITTER,
    TOKEN_MINTER: MAINNET_TOKEN_MINTER
  },
  TESTNET: {
    TOKEN_MESSENGER: TESTNET_TOKEN_MESSENGER,
    MESSAGE_TRANSMITTER: TESTNET_MESSAGE_TRANSMITTER,
    TOKEN_MINTER: TESTNET_TOKEN_MINTER
  }
} as const;

/**
 * Verify that current configuration matches official Circle CCTP V2 addresses
 */
export function verifyCCTPConfiguration(): { 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[] 
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check all supported chains
  const allChains = [...Object.keys(CCTP_MAINNET_ADDRESSES), ...Object.keys(CCTP_TESTNET_ADDRESSES)]
    .map(Number)
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

  for (const chainId of allChains) {
    // Validate mainnet if supported
    if (chainId in CCTP_MAINNET_ADDRESSES) {
      if (!validateCCTPAddresses(chainId, false)) {
        errors.push(`Mainnet validation failed for chain ${chainId}`);
      }
    }

    // Validate testnet if supported
    if (chainId in CCTP_TESTNET_ADDRESSES) {
      if (!validateCCTPAddresses(chainId, true)) {
        errors.push(`Testnet validation failed for chain ${chainId}`);
      }
    }
  }

  // Additional checks
  if (Object.keys(CCTP_MAINNET_ADDRESSES).length === 0) {
    warnings.push('No mainnet chains configured');
  }

  if (Object.keys(CCTP_TESTNET_ADDRESSES).length === 0) {
    warnings.push('No testnet chains configured');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}