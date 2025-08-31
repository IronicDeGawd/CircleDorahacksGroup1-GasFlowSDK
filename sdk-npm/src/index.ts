// Main SDK export
export { GasFlowSDK } from './core/GasFlowSDK';

// Type exports
export type {
  GasFlowConfig,
  GasFlowTransaction,
  GasFlowResult,
  UnifiedBalance,
  BalanceInfo,
  GasEstimate,
  RouteOption,
  CCTPTransferParams,
  CCTPTransferResult,
  PaymasterUserOperation,
  GasFlowError,
  GasFlowEvents,
  ChainId,
  ChainConfig,
  TransactionStatus,
  TransactionUpdate,
  EventListener,
  ExecutionMode
} from './types';

// Service exports (for advanced usage)
export { BalanceManager } from './services/BalanceManager';
export { GasEstimator } from './services/GasEstimator';
export { ProductionCCTPService } from './services/ProductionCCTPService';
export { CCTPServiceFactory, CCTPServiceManager } from './services/CCTPServiceFactory';
export { RealPaymasterService } from './services/RealPaymasterService';
export { TraditionalExecutionService } from './services/TraditionalExecutionService';
export { RouteOptimizer } from './services/RouteOptimizer';

// Configuration exports
export { 
  SUPPORTED_CHAINS, 
  MAINNET_CHAINS, 
  DEFAULT_SUPPORTED_CHAINS,
  getChainConfig,
  isTestnetChain,
  getTestnetChains,
  getMainnetChains
} from './config/chains';

// Contract exports
export { 
  getCCTPAddresses,
  isCCTPSupported,
  getSupportedCCTPChains,
  getCCTPDomain,
  CCTP_MAINNET_ADDRESSES,
  CCTP_TESTNET_ADDRESSES
} from './contracts/addresses';

export * from './contracts/types';

// Version
export const VERSION = '0.1.0';