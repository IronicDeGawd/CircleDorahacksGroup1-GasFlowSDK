export { GasFlowSDK } from './core/GasFlowSDK';

export type {
  GasFlowConfig,
  GasFlowTransaction,
  GasFlowResult,
  UnifiedBalance,
  ChainId,
  ExecutionMode,
  CCTPTransferMode,
  CCTPTransferParams
} from './types';

export { 
  SUPPORTED_CHAINS, 
  getChainConfig
} from './config/chains';

export const VERSION = '0.6.0';