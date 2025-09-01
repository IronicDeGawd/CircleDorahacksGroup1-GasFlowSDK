import { BigNumber } from 'ethers';

export type ChainId = number;

export type ExecutionMode = 'paymaster' | 'traditional' | 'auto';

export interface GasFlowConfig {
  apiKey: string;
  supportedChains: ChainId[];
  
  preferredChains?: ChainId[];
  maxBridgeAmount?: BigNumber;
  slippageTolerance?: number;
  gasLimitMultiplier?: number;
  
  customBundler?: string;
  webhookUrl?: string;
  analytics?: boolean;
  
  // Execution Configuration
  executionMode?: ExecutionMode;
  preferSignerExecution?: boolean;
  
  // CCTP Configuration
  signers?: Map<ChainId, any>; // ethers.Signer instances
  
  // Alchemy Bundler Configuration
  alchemyApiKey?: string;
  bundlerUrl?: string;
  
  // CoinGecko API Configuration
  coinGeckoApiKey?: string;
}

export interface GasFlowTransaction {
  to: string;
  value?: BigNumber;
  data?: string;
  gasLimit?: BigNumber;
  
  payFromChain?: ChainId | 'auto';
  maxGasCost?: BigNumber;
  urgency?: 'low' | 'medium' | 'high';
  executeOn?: ChainId | 'optimal';
  transferMode?: CCTPTransferMode; // New: transfer mode for cross-chain bridges
}

export interface GasFlowResult {
  transactionHash: string;
  executedOnChain: ChainId;
  gasUsed: BigNumber;
  gasPaymentChain: ChainId;
  totalCostUSDC: BigNumber;
  bridgeTransactionHash?: string;
  estimatedSavings?: BigNumber;
}

export interface ChainConfig {
  chainId: ChainId;
  name: string;
  rpcUrl: string;
  testnetRpcUrl: string;
  usdcAddress: string;
  paymasterAddress?: string;
  cctpDomain: number;
  gasTokenSymbol: string;
  blockExplorerUrl: string;
  // ERC-4337 Configuration
  entryPointV06?: string;
  entryPointV07?: string;
  entryPointV08?: string;
  bundlerUrl?: string;
}

export interface BalanceInfo {
  chainId: ChainId;
  balance: BigNumber;
  usdValue: number;
}

export interface UnifiedBalance {
  totalUSDC: BigNumber;
  totalUSDValue: number;
  balancesByChain: BalanceInfo[];
  lastUpdated: Date;
}

export interface GasEstimate {
  chainId: ChainId;
  gasLimit: BigNumber;
  gasPrice: BigNumber;
  gasCostETH: BigNumber;
  gasCostUSDC: BigNumber;
  estimatedTime: number;
}

export interface RouteOption {
  executeOnChain: ChainId;
  payFromChain: ChainId;
  totalCost: BigNumber;
  bridgeCost?: BigNumber;
  gasCost: BigNumber;
  estimatedTime: number;
  savings?: BigNumber;
}

export type CCTPTransferMode = 'auto' | 'fast' | 'standard';

export interface CCTPTransferParams {
  amount: BigNumber;
  fromChain: ChainId;
  toChain: ChainId;
  recipient: string;
  transferMode?: CCTPTransferMode; // New: explicit transfer mode selection
  useFastTransfer?: boolean; // Deprecated: kept for backward compatibility
  signer?: any; // Ethers signer for transaction signing
  
  // CCTP V2 optional parameters
  destinationCaller?: string;    // Default: zero address (no restriction)
  maxFee?: BigNumber;           // Default: calculated from bridge fee with buffer
  minFinalityThreshold?: number; // Default: determined by transferMode or useFastTransfer
  hookData?: string;            // Default: '0x' (empty bytes)
}

export interface CCTPTransferResult {
  transactionHash: string;
  attestationHash?: string;
  estimatedArrivalTime: number;
  bridgeFee: BigNumber;
  transferObject?: any; // Transfer object for tracking
}

export interface PaymasterUserOperation {
  sender: string;
  nonce: BigNumber;
  initCode: string;
  callData: string;
  callGasLimit: BigNumber;
  verificationGasLimit: BigNumber;
  preVerificationGas: BigNumber;
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
  paymasterAndData: string;
  signature: string;
}

export interface GasFlowError {
  code: string;
  message: string;
  chainId?: ChainId;
  transactionHash?: string;
  retryable: boolean;
}

export enum TransactionStatus {
  PENDING = 'pending',
  BRIDGING = 'bridging',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface TransactionUpdate {
  status: TransactionStatus;
  transactionHash?: string;
  bridgeTransactionHash?: string;
  estimatedCompletion?: Date;
  gasUsed?: BigNumber;
  error?: GasFlowError;
}

export type EventListener = (update: TransactionUpdate) => void;

export interface GasFlowEvents {
  onTransactionUpdate: EventListener;
  onBalanceUpdate: (balance: UnifiedBalance) => void;
  onError: (error: GasFlowError) => void;
}