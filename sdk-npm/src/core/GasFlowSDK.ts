import { BigNumber } from 'ethers';
import { 
  GasFlowConfig, 
  GasFlowTransaction, 
  GasFlowResult, 
  UnifiedBalance,
  GasFlowEvents,
  TransactionStatus,
  TransactionUpdate,
  ChainId,
  EventListener
} from '../types';
import { BalanceManager } from '../services/BalanceManager';
import { GasEstimator } from '../services/GasEstimator';
import { CCTPServiceFactory, CCTPService } from '../services/CCTPServiceFactory';
import { RealPaymasterService } from '../services/RealPaymasterService';
import { RouteOptimizer, RouteAnalysis } from '../services/RouteOptimizer';
import { DEFAULT_SUPPORTED_CHAINS } from '../config/chains';

export class GasFlowSDK {
  private balanceManager: BalanceManager;
  private gasEstimator: GasEstimator;
  private cctpService: CCTPService;
  private paymasterService: RealPaymasterService;
  private routeOptimizer: RouteOptimizer;
  private eventListeners: Map<string, EventListener[]> = new Map();
  
  constructor(private config: GasFlowConfig) {
    // Validate configuration
    this.validateConfig(config);
    
    // Initialize services
    const useTestnet = true; // For hackathon, always use testnet
    const supportedChains = config.supportedChains.length > 0 
      ? config.supportedChains 
      : DEFAULT_SUPPORTED_CHAINS;

    this.balanceManager = new BalanceManager(supportedChains, useTestnet);
    this.gasEstimator = new GasEstimator(supportedChains, useTestnet, this.config.coinGeckoApiKey);
    this.cctpService = CCTPServiceFactory.create({
      apiKey: this.config.apiKey,
      useTestnet,
      useProductionCCTP: this.config.useProductionCCTP || false,
      signers: this.config.signers
    });
    this.paymasterService = new RealPaymasterService(useTestnet, this.config.alchemyApiKey);
    this.routeOptimizer = new RouteOptimizer(
      this.balanceManager,
      this.gasEstimator,
      this.cctpService,
      supportedChains
    );
  }

  private validateConfig(config: GasFlowConfig): void {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    
    if (!config.supportedChains || config.supportedChains.length === 0) {
      console.warn('No supported chains specified, using defaults');
    }
  }

  async execute(
    transaction: GasFlowTransaction,
    userAddress: string,
    userPrivateKey?: string
  ): Promise<GasFlowResult> {
    try {
      this.emitUpdate({
        status: TransactionStatus.PENDING,
        estimatedCompletion: new Date(Date.now() + 30000), // 30 seconds estimate
      });

      // Step 1: Analyze optimal route
      const routeAnalysis = await this.routeOptimizer.analyzeOptimalRoute(
        transaction,
        userAddress,
        transaction.urgency || 'medium'
      );

      if (!routeAnalysis.bestRoute) {
        throw new Error('No viable execution route found');
      }

      const { bestRoute } = routeAnalysis;
      
      console.log('Optimal route selected:', {
        executeOn: bestRoute.executeOnChain,
        payFrom: bestRoute.payFromChain,
        totalCost: bestRoute.totalCost.toString(),
        estimatedTime: bestRoute.estimatedTime,
      });

      // Step 2: Handle cross-chain bridging if needed
      let bridgeTransactionHash: string | undefined;
      
      if (bestRoute.payFromChain !== bestRoute.executeOnChain) {
        this.emitUpdate({
          status: TransactionStatus.BRIDGING,
          estimatedCompletion: new Date(Date.now() + bestRoute.estimatedTime * 1000),
        });

        console.log('Cross-chain bridge required');
        
        const bridgeResult = await this.cctpService.initiateBridge({
          amount: bestRoute.gasCost,
          fromChain: bestRoute.payFromChain,
          toChain: bestRoute.executeOnChain,
          recipient: userAddress,
          useFastTransfer: true, // Prefer Fast Transfer
        });

        bridgeTransactionHash = bridgeResult.transactionHash;
        
        // Wait for bridge completion
        const destinationTxHash = await this.cctpService.waitForCompletion(
          bridgeResult.transactionHash,
          bestRoute.payFromChain,
          bestRoute.executeOnChain
        );
        
        console.log('Bridge completed:', destinationTxHash);
      }

      // Step 3: Execute transaction with Paymaster
      this.emitUpdate({
        status: TransactionStatus.EXECUTING,
        bridgeTransactionHash,
      });

      let transactionHash: string;
      let gasUsed: BigNumber;

      if (this.paymasterService.isPaymasterAvailable(bestRoute.executeOnChain)) {
        // Use Paymaster for USDC gas payment
        console.log('Executing with Paymaster');
        
        if (!userPrivateKey) {
          throw new Error('User private key required for Paymaster integration');
        }

        const userOpResult = await this.paymasterService.buildUserOperation(
          transaction,
          bestRoute.executeOnChain,
          userAddress as `0x${string}`,
          userPrivateKey
        );

        const operationHash = await this.paymasterService.submitUserOperation(
          userOpResult.userOperation,
          bestRoute.executeOnChain
        );

        const receipt = await this.paymasterService.getOperationReceipt(
          operationHash,
          bestRoute.executeOnChain
        );

        if (!receipt.success || !receipt.transactionHash) {
          throw new Error('Paymaster transaction failed');
        }

        transactionHash = receipt.transactionHash;
        gasUsed = BigNumber.from(receipt.gasUsed?.toString() || '0');
      } else {
        // Fallback to traditional gas payment (not implemented in this demo)
        throw new Error(`Paymaster not available on chain ${bestRoute.executeOnChain}`);
      }

      // Step 4: Calculate final costs and savings
      const totalCostUSDC = bestRoute.totalCost;
      const estimatedSavings = this.calculateSavings(routeAnalysis, bestRoute);

      this.emitUpdate({
        status: TransactionStatus.COMPLETED,
        transactionHash,
        gasUsed,
      });

      return {
        transactionHash,
        executedOnChain: bestRoute.executeOnChain,
        gasUsed,
        gasPaymentChain: bestRoute.payFromChain,
        totalCostUSDC,
        bridgeTransactionHash,
        estimatedSavings,
      };
    } catch (error) {
      this.emitUpdate({
        status: TransactionStatus.FAILED,
        error: {
          code: 'EXECUTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        },
      });
      throw error;
    }
  }

  async getUnifiedBalance(userAddress: string): Promise<UnifiedBalance> {
    return this.balanceManager.getUnifiedBalance(userAddress);
  }

  async estimateTransaction(
    transaction: GasFlowTransaction,
    userAddress: string
  ): Promise<RouteAnalysis> {
    return this.routeOptimizer.analyzeOptimalRoute(
      transaction,
      userAddress,
      transaction.urgency || 'medium'
    );
  }

  async getOptimalRoute(
    transaction: GasFlowTransaction,
    userAddress: string
  ): Promise<RouteAnalysis> {
    return this.estimateTransaction(transaction, userAddress);
  }

  startRealTimeBalanceUpdates(
    userAddress: string,
    onUpdate: (balance: UnifiedBalance) => void,
    intervalMs: number = 30000
  ): void {
    this.balanceManager.startRealTimeUpdates(userAddress, onUpdate, intervalMs);
  }

  stopRealTimeBalanceUpdates(): void {
    this.balanceManager.stopRealTimeUpdates();
  }

  on(event: keyof GasFlowEvents, listener: EventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off(event: keyof GasFlowEvents, listener: EventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitUpdate(update: TransactionUpdate): void {
    const listeners = this.eventListeners.get('onTransactionUpdate');
    if (listeners) {
      listeners.forEach(listener => listener(update));
    }
  }

  private calculateSavings(
    analysis: RouteAnalysis,
    selectedRoute: typeof analysis.bestRoute
  ): BigNumber | undefined {
    if (analysis.allRoutes.length < 2) {
      return undefined;
    }

    // Find the most expensive route for comparison
    const sortedByPrice = [...analysis.allRoutes].sort((a, b) => 
      b.totalCost.sub(a.totalCost).toNumber()
    );
    
    const mostExpensive = sortedByPrice[0];
    return mostExpensive.totalCost.sub(selectedRoute.totalCost);
  }

  async getSupportedChains(): Promise<ChainId[]> {
    return this.config.supportedChains.length > 0 
      ? this.config.supportedChains 
      : DEFAULT_SUPPORTED_CHAINS;
  }

  async getChainStatus(chainId: ChainId): Promise<{
    available: boolean;
    paymasterSupported: boolean;
    cctpSupported: boolean;
  }> {
    const paymasterSupported = this.paymasterService.isPaymasterAvailable(chainId);
    const cctpSupported = this.config.supportedChains.includes(chainId);
    
    return {
      available: cctpSupported,
      paymasterSupported,
      cctpSupported,
    };
  }

  /**
   * Set signer for a specific chain (useful for dynamic wallet connection)
   */
  setSigner(chainId: ChainId, signer: any): void {
    this.validateSigner(signer);
    this.validateChainId(chainId);
    
    if (this.cctpService && 'setSigner' in this.cctpService) {
      (this.cctpService as any).setSigner(chainId, signer);
      console.log(`✅ Signer configured for chain ${chainId}`);
    } else {
      console.warn(`⚠️ Current CCTP service does not support dynamic signer addition for chain ${chainId}`);
    }
  }

  /**
   * Set signer for all supported chains
   */
  setSignerForAllChains(signer: any): void {
    this.validateSigner(signer);
    
    const supportedChains = this.config.supportedChains.length > 0 
      ? this.config.supportedChains 
      : DEFAULT_SUPPORTED_CHAINS;
      
    supportedChains.forEach(chainId => {
      this.setSigner(chainId, signer);
    });
    
    console.log(`✅ Signer configured for ${supportedChains.length} supported chains`);
  }

  /**
   * Private helper to validate signer objects
   */
  private validateSigner(signer: any): void {
    if (!signer) {
      throw new Error('Signer cannot be null or undefined');
    }
    if (typeof signer.getAddress !== 'function') {
      throw new Error('Invalid signer provided - must implement getAddress() method');
    }
  }

  /**
   * Private helper to validate chain IDs
   */
  private validateChainId(chainId: ChainId): void {
    if (!chainId || typeof chainId !== 'number') {
      throw new Error('Invalid chain ID provided');
    }
    
    const supportedChains = this.config.supportedChains.length > 0 
      ? this.config.supportedChains 
      : DEFAULT_SUPPORTED_CHAINS;
      
    if (!supportedChains.includes(chainId)) {
      console.warn(`⚠️ Chain ${chainId} is not in supported chains list: [${supportedChains.join(', ')}]`);
    }
  }

  destroy(): void {
    this.balanceManager.destroy();
    this.gasEstimator.clearCache();
    this.eventListeners.clear();
  }
}