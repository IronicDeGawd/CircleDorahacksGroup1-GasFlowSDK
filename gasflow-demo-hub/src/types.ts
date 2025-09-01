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
  EventListener,
  CCTPTransferMode
} from '@gasflow/sdk';

// Extended transaction type for demo UI
export interface DemoGasFlowTransaction extends Omit<GasFlowTransaction, 'to' | 'value'> {
  to: string;
  sendAmountETH?: string; // Amount to send to recipient (user input)
  value?: bigint; // Transaction value in wei (calculated from sendAmountETH)
  gasPaymentETH?: string; // ETH equivalent amount for gas payment (user input)
  gasPaymentUSDC?: bigint; // Calculated USDC amount needed for gas
}

// Local chain names mapping for display
export const CHAIN_NAMES: Record<number, string> = {
  11155111: 'Ethereum Sepolia',
  421614: 'Arbitrum Sepolia',
  84532: 'Base Sepolia',
  43113: 'Avalanche Fuji',
  80002: 'Polygon Amoy',
};