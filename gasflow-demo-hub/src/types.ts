// Re-export types from the real SDK
export type {
  ChainId,
  UnifiedBalance,
  BalanceInfo,
  GasFlowTransaction,
  RouteOption,
  RouteAnalysis,
  GasFlowResult,
  TransactionStatus,
  TransactionUpdate,
  EventListener
} from '@gasflow/sdk';

// Local chain names mapping for display
export const CHAIN_NAMES: Record<number, string> = {
  11155111: 'Ethereum Sepolia',
  421614: 'Arbitrum Sepolia',
  84532: 'Base Sepolia',
  43113: 'Avalanche Fuji',
  80002: 'Polygon Amoy',
};