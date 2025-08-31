import { Signer } from 'ethers';
import { ChainId } from '../types';
import { ProductionCCTPService } from './ProductionCCTPService';

/**
 * Configuration for CCTP Service creation
 */
export interface CCTPServiceConfig {
  apiKey: string;
  useTestnet?: boolean;
  signers?: Map<ChainId, Signer>;
}

/**
 * Abstract interface for CCTP services
 * Ensures compatibility between SimpleCCTPService and ProductionCCTPService
 */
export interface CCTPService {
  readonly BRIDGE_FEE_USDC: any; // BigNumber
  readonly FAST_TRANSFER_THRESHOLD: any; // BigNumber
  readonly apiKey: string;
  readonly useTestnet?: boolean;
  
  estimateBridgeFee(amount: any, fromChain: ChainId, toChain: ChainId): Promise<any>;
  canUseFastTransfer(amount: any, fromChain: ChainId, toChain: ChainId): Promise<boolean>;
  estimateTransferTime(amount: any, fromChain: ChainId, toChain: ChainId, useFastTransfer?: boolean): Promise<number>;
  initiateBridge(params: any): Promise<any>;
  waitForCompletion(txHash: string, fromChain: ChainId, toChain: ChainId, transferObject?: any): Promise<string>;
  getBridgeStatus(txHash: string, fromChain: ChainId, transferObject?: any): Promise<'pending' | 'attested' | 'completed' | 'failed'>;
  getOptimalRoute(amount: any, fromChains: ChainId[], toChain: ChainId): Promise<any>;
}

/**
 * Factory for creating CCTP services
 * Allows switching between SimpleCCTPService (mock) and ProductionCCTPService (real)
 */
export class CCTPServiceFactory {
  /**
   * Create CCTP service - always uses ProductionCCTPService
   */
  static create(config: CCTPServiceConfig): CCTPService {
    const {
      apiKey,
      useTestnet = true,
      signers
    } = config;

    console.log('🔗 Creating ProductionCCTPService with real Circle contracts');
    
    const service = new ProductionCCTPService(apiKey, useTestnet);
    
    // Set up signers if provided
    if (signers) {
      signers.forEach((signer, chainId) => {
        service.setSigner(chainId, signer);
      });
      console.log(`📝 Configured signers for ${signers.size} chains`);
    } else {
      console.warn('⚠️ No signers provided - you must call setSigner() before using the service');
    }
    
    return service;
  }

  /**
   * Create service - simplified to always use production
   */
  static createAuto(config: CCTPServiceConfig): CCTPService {
    return this.create(config);
  }

  /**
   * Validate configuration for CCTP service
   */
  static validateConfig(config: CCTPServiceConfig): void {
    if (!config.apiKey) {
      throw new Error('Circle API key is required for CCTP service');
    }

    if (!config.signers || config.signers.size === 0) {
      throw new Error('At least one signer is required for CCTP service');
    }

    // Validate each signer
    config.signers.forEach((signer, chainId) => {
      if (!signer.provider) {
        console.warn(`⚠️ Signer for chain ${chainId} has no provider - some operations may fail`);
      }
    });

    console.log('✅ CCTP configuration is valid');
  }
}

/**
 * Utility class for managing CCTP service lifecycle
 */
export class CCTPServiceManager {
  private currentService: CCTPService | null = null;
  private config: CCTPServiceConfig | null = null;

  constructor(config?: CCTPServiceConfig) {
    if (config) {
      this.initialize(config);
    }
  }

  /**
   * Initialize or reinitialize the service
   */
  initialize(config: CCTPServiceConfig): void {
    this.config = config;
    
    // Validate configuration
    CCTPServiceFactory.validateConfig(config);
    
    this.currentService = CCTPServiceFactory.create(config);
    
    console.log(`🚀 CCTP Service initialized with Circle CCTP`);
  }

  /**
   * Get the current service (throws if not initialized)
   */
  getService(): CCTPService {
    if (!this.currentService) {
      throw new Error('CCTP Service not initialized. Call initialize() first.');
    }
    return this.currentService;
  }

  /**
   * Update signers for the service
   */
  updateSigners(signers: Map<ChainId, Signer>): void {
    if (!this.config) {
      throw new Error('Service not initialized');
    }

    this.initialize({
      ...this.config,
      signers
    });
  }

  /**
   * Get service configuration
   */
  getConfig(): CCTPServiceConfig | null {
    return this.config;
  }
}