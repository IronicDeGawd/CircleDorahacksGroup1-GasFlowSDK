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
    userPrivateKey?: string,
    signer?: any
  ): Promise<GasFlowResult> {
    try {
      this.emitUpdate({
        status: TransactionStatus.PENDING,
        estimatedCompletion: new Date(Date.now() + 30000), // 30 seconds estimate
      });

      // Step 1: Use provided route or analyze optimal route
      let bestRoute: any;
      
      if (transaction.executeOn && typeof transaction.executeOn === 'number' && 
          transaction.payFromChain && transaction.payFromChain !== 'auto') {
        // User has selected a specific route - use it directly
        console.log('Using user-selected route:', {
          executeOn: transaction.executeOn,
          payFrom: transaction.payFromChain
        });
        
        bestRoute = {
          executeOnChain: transaction.executeOn,
          payFromChain: transaction.payFromChain,
          gasCost: BigNumber.from('10000'), // Will be calculated later
          totalCost: BigNumber.from('10000'),
          estimatedTime: transaction.payFromChain === transaction.executeOn ? 120 : 180
        };
      } else {
        // Analyze optimal route
        const routeAnalysis = await this.routeOptimizer.analyzeOptimalRoute(
          transaction,
          userAddress,
          transaction.urgency || 'medium'
        );

        if (!routeAnalysis.bestRoute) {
          throw new Error('No viable execution route found');
        }

        bestRoute = routeAnalysis.bestRoute;
      }
      
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
          transferMode: transaction.transferMode || 'auto', // Use specified mode or auto
          useFastTransfer: false, // Backward compatibility - overridden by transferMode
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

      // Determine execution mode based on available parameters
      const hasPrivateKey = !!userPrivateKey;
      const hasSigner = !!signer;
      const paymasterAvailable = this.paymasterService.isPaymasterAvailable(bestRoute.executeOnChain);

      console.log('Execution mode analysis:', {
        hasPrivateKey,
        hasSigner,
        paymasterAvailable,
        executeOnChain: bestRoute.executeOnChain
      });

      if (paymasterAvailable && hasPrivateKey) {
        // Use Circle Paymaster for USDC gas payment with private key
        console.log('🏦 Executing with Circle Paymaster v0.8 (private key mode)');
        
        const operationHash = await this.paymasterService.executeWithPaymaster(
          transaction,
          userPrivateKey,
          bestRoute.executeOnChain
        );

        // Wait for receipt with improved polling
        let receipt;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max wait
        
        while (attempts < maxAttempts) {
          try {
            receipt = await this.paymasterService.getTransactionReceipt(
              operationHash,
              bestRoute.executeOnChain
            );
            
            if (receipt.success && receipt.transactionHash) {
              break;
            }
          } catch (error) {
            console.log(`[CIRCLE] Receipt attempt ${attempts + 1}/${maxAttempts}: ${error}`);
          }
          
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }

        if (!receipt?.success || !receipt.transactionHash) {
          throw new Error('Circle Paymaster transaction failed or receipt unavailable');
        }

        transactionHash = receipt.transactionHash;
        gasUsed = BigNumber.from(receipt.gasUsed?.toString() || '0');
      } else if (hasSigner) {
        console.log('🔗 Executing with Traditional gas payment (signer mode)');
        
        try {
          const txRequest = {
            to: transaction.to,
            value: transaction.value || 0,
            data: transaction.data || '0x'
          };
          
          const txResponse = await signer.sendTransaction(txRequest);
          console.log(`Transaction submitted: ${txResponse.hash}`);
          
          const receipt = await txResponse.wait();
          console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
          
          transactionHash = txResponse.hash;
          gasUsed = receipt.gasUsed;
        } catch (error) {
          console.error('Traditional execution failed:', error);
          throw new Error(`Transaction execution failed: ${error}`);
        }
      } else {
        // No valid execution method available
        const errorMessage = paymasterAvailable 
          ? 'Paymaster available but requires private key. For MetaMask integration, provide signer parameter.'
          : 'No execution method available. Provide either private key for paymaster or signer for traditional execution.';
        
        throw new Error(errorMessage);
      }

      // Step 4: Calculate final costs and savings
      const totalCostUSDC = bestRoute.totalCost;
      const estimatedSavings = undefined; // Skip savings calculation for user-selected routes

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