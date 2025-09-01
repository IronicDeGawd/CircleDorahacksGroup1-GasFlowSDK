import { ChainConfig, ChainId } from '../types';

export const SUPPORTED_CHAINS: Record<ChainId, ChainConfig> = {
  // Ethereum Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    testnetRpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    paymasterAddress: '0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966', // Circle Paymaster v0.8
    cctpDomain: 0,
    gasTokenSymbol: 'ETH',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    entryPointV06: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    entryPointV07: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    entryPointV08: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    bundlerUrl: 'https://eth-sepolia.g.alchemy.com/v2',
  },
  
  // Arbitrum Sepolia Testnet
  421614: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    testnetRpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    paymasterAddress: '0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966', // Circle Paymaster v0.8
    cctpDomain: 3,
    gasTokenSymbol: 'ETH',
    blockExplorerUrl: 'https://sepolia.arbiscan.io',
    entryPointV06: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    entryPointV07: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    entryPointV08: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    bundlerUrl: 'https://arb-sepolia.g.alchemy.com/v2',
  },
  
  // Base Sepolia Testnet
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    testnetRpcUrl: 'https://sepolia.base.org',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    paymasterAddress: '0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966', // Circle Paymaster v0.8
    cctpDomain: 6,
    gasTokenSymbol: 'ETH',
    blockExplorerUrl: 'https://sepolia.basescan.org',
    entryPointV06: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    entryPointV07: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    entryPointV08: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    bundlerUrl: 'https://base-sepolia.g.alchemy.com/v2',
  },
  
  // Avalanche Fuji Testnet
  43113: {
    chainId: 43113,
    name: 'Avalanche Fuji',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    testnetRpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    usdcAddress: '0x5425890298aed601595a70AB815c96711a31Bc65',
    paymasterAddress: '0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966', // Circle Paymaster v0.8
    cctpDomain: 1,
    gasTokenSymbol: 'AVAX',
    blockExplorerUrl: 'https://testnet.snowtrace.io',
    entryPointV06: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    entryPointV07: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    entryPointV08: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    bundlerUrl: 'https://avax-fuji.g.alchemy.com/v2',
  },
  
  // Polygon Amoy Testnet (replacing Mumbai)
  80002: {
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    testnetRpcUrl: 'https://rpc-amoy.polygon.technology',
    usdcAddress: '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582',
    paymasterAddress: '0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966', // Circle Paymaster v0.8
    cctpDomain: 7,
    gasTokenSymbol: 'MATIC',
    blockExplorerUrl: 'https://amoy.polygonscan.com',
    entryPointV06: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    entryPointV07: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    entryPointV08: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    bundlerUrl: 'https://polygon-amoy.g.alchemy.com/v2',
  },
};

export const DEFAULT_SUPPORTED_CHAINS = [
  11155111, // Ethereum Sepolia
  421614,   // Arbitrum Sepolia
  84532,    // Base Sepolia
  43113,    // Avalanche Fuji
  80002,    // Polygon Amoy
];

export const MAINNET_CHAINS: Record<ChainId, ChainConfig> = {
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    testnetRpcUrl: '',
    usdcAddress: '0xA0b86a33E6441929e43c0Bf24E6C2c4a75be2F64',
    cctpDomain: 0,
    gasTokenSymbol: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
    entryPointV06: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    entryPointV07: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    entryPointV08: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    bundlerUrl: 'https://eth-mainnet.g.alchemy.com/v2',
  },
  
  // Arbitrum One
  42161: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
    testnetRpcUrl: '',
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    paymasterAddress: '0x6C973eBe80dCD8660841D4356bf15c32460271C9',
    cctpDomain: 3,
    gasTokenSymbol: 'ETH',
    blockExplorerUrl: 'https://arbiscan.io',
    entryPointV06: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    entryPointV07: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    entryPointV08: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    bundlerUrl: 'https://arb-mainnet.g.alchemy.com/v2',
  },
  
  // Base
  8453: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://base-rpc.publicnode.com',
    testnetRpcUrl: '',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    cctpDomain: 6,
    gasTokenSymbol: 'ETH',
    blockExplorerUrl: 'https://basescan.org',
    entryPointV06: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    entryPointV07: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    entryPointV08: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    bundlerUrl: 'https://base-mainnet.g.alchemy.com/v2',
  },
  
  // Avalanche C-Chain
  43114: {
    chainId: 43114,
    name: 'Avalanche',
    rpcUrl: 'https://avalanche-c-chain-rpc.publicnode.com',
    testnetRpcUrl: '',
    usdcAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    cctpDomain: 1,
    gasTokenSymbol: 'AVAX',
    blockExplorerUrl: 'https://snowtrace.io',
    entryPointV06: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    entryPointV07: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    entryPointV08: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    bundlerUrl: 'https://avax-mainnet.g.alchemy.com/v2',
  },
  
  // Polygon
  137: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    testnetRpcUrl: '',
    usdcAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    cctpDomain: 7,
    gasTokenSymbol: 'MATIC',
    blockExplorerUrl: 'https://polygonscan.com',
  },
};

export function getChainConfig(chainId: ChainId, useTestnet = true): ChainConfig {
  const config = useTestnet ? SUPPORTED_CHAINS[chainId] : MAINNET_CHAINS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
}

export function isTestnetChain(chainId: ChainId): boolean {
  return chainId in SUPPORTED_CHAINS;
}

export function getTestnetChains(): ChainId[] {
  return Object.keys(SUPPORTED_CHAINS).map(Number);
}

export function getMainnetChains(): ChainId[] {
  return Object.keys(MAINNET_CHAINS).map(Number);
}