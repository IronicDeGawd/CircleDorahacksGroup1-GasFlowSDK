import { Signer } from 'ethers';
import { ChainId } from '../types';
import { SimpleCCTPService } from './SimpleCCTPService';
import { ProductionCCTPService } from './ProductionCCTPService';

/**
 * Configuration for CCTP Service creation
 */
export interface CCTPServiceConfig {
  apiKey: string;
  useTestnet?: boolean;
  useProductionCCTP?: boolean;
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
   * Create appropriate CCTP service based on configuration
   */
  static create(config: CCTPServiceConfig): CCTPService {
    const {
      apiKey,
      useTestnet = true,
      useProductionCCTP = false,
      signers
    } = config;

    if (useProductionCCTP) {
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
    } else {
      console.log('🎭 Creating SimpleCCTPService with mock implementation');
      return new SimpleCCTPService(apiKey, useTestnet);
    }
  }

  /**
   * Create service with automatic detection based on environment
   */
  static createAuto(config: CCTPServiceConfig): CCTPService {
    // Auto-detect based on environment and signer availability
    const hasSigners = config.signers && config.signers.size > 0;
    const hasApiKey = Boolean(config.apiKey && config.apiKey !== '');
    const isProduction = process.env.NODE_ENV === 'production';
    
    const shouldUseProduction = (
      config.useProductionCCTP === true || 
      (hasSigners && hasApiKey && isProduction)
    );

    return this.create({
      ...config,
      useProductionCCTP: shouldUseProduction
    });
  }

  /**
   * Validate configuration for production use
   */
  static validateProductionConfig(config: CCTPServiceConfig): void {
    if (!config.useProductionCCTP) {
      return; // No validation needed for mock service
    }

    if (!config.apiKey) {
      throw new Error('Circle API key is required for ProductionCCTPService');
    }

    if (!config.signers || config.signers.size === 0) {
      throw new Error('At least one signer is required for ProductionCCTPService');
    }

    // Validate each signer
    config.signers.forEach((signer, chainId) => {
      if (!signer.provider) {
        console.warn(`⚠️ Signer for chain ${chainId} has no provider - some operations may fail`);
      }
    });

    console.log('✅ Production CCTP configuration is valid');
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
    
    // Validate configuration if using production
    if (config.useProductionCCTP) {
      CCTPServiceFactory.validateProductionConfig(config);
    }
    
    this.currentService = CCTPServiceFactory.create(config);
    
    console.log(`🚀 CCTP Service initialized (${config.useProductionCCTP ? 'Production' : 'Mock'})`);
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
   * Switch between production and mock services
   */
  switchToProduction(signers: Map<ChainId, Signer>): void {
    if (!this.config) {
      throw new Error('Service not initialized');
    }

    this.initialize({
      ...this.config,
      useProductionCCTP: true,
      signers
    });
  }

  /**
   * Switch to mock service (useful for testing)
   */
  switchToMock(): void {
    if (!this.config) {
      throw new Error('Service not initialized');
    }

    this.initialize({
      ...this.config,
      useProductionCCTP: false
    });
  }

  /**
   * Check if currently using production service
   */
  isUsingProduction(): boolean {
    return this.currentService instanceof ProductionCCTPService;
  }

  /**
   * Get service configuration
   */
  getConfig(): CCTPServiceConfig | null {
    return this.config;
  }
}