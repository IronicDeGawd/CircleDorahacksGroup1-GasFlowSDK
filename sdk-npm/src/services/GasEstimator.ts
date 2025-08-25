import { ethers, BigNumber } from 'ethers';
import { ChainId, GasEstimate, GasFlowTransaction } from '../types';
import { getChainConfig } from '../config/chains';

interface GasPriceData {
  slow: BigNumber;
  standard: BigNumber;
  fast: BigNumber;
  timestamp: number;
}

export class GasEstimator {
  private providers: Map<ChainId, ethers.providers.JsonRpcProvider> = new Map();
  private gasPriceCache: Map<ChainId, GasPriceData> = new Map();
  private readonly CACHE_DURATION = 10000; // 10 seconds
  private readonly USDC_USD_RATE = 1; // Assuming 1 USDC = 1 USD for now

  constructor(
    private supportedChains: ChainId[],
    private useTestnet: boolean = true
  ) {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    for (const chainId of this.supportedChains) {
      const config = getChainConfig(chainId, this.useTestnet);
      const provider = new ethers.providers.JsonRpcProvider(
        this.useTestnet ? config.testnetRpcUrl : config.rpcUrl
      );
      this.providers.set(chainId, provider);
    }
  }

  private async getETHPrice(): Promise<number> {
    try {
      if (this.useTestnet) {
        console.log('🎭 [MOCK] Using testnet fallback price for ETH: $2000');
        return 2000; // Mock price for testnet
      }
      
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      const data = await response.json();
      return data.ethereum.usd;
    } catch (error) {
      console.warn('⚠️ [FALLBACK] Failed to fetch ETH price, using fallback: $2000', error);
      return 2000; // Fallback price
    }
  }

  private async getAVAXPrice(): Promise<number> {
    try {
      if (this.useTestnet) {
        return 30; // Mock price for testnet
      }
      
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd'
      );
      const data = await response.json();
      return data['avalanche-2'].usd;
    } catch (error) {
      console.warn('Failed to fetch AVAX price, using fallback:', error);
      return 30; // Fallback price
    }
  }

  private async getMATICPrice(): Promise<number> {
    try {
      if (this.useTestnet) {
        return 0.8; // Mock price for testnet
      }
      
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd'
      );
      const data = await response.json();
      return data['matic-network'].usd;
    } catch (error) {
      console.warn('Failed to fetch MATIC price, using fallback:', error);
      return 0.8; // Fallback price
    }
  }

  private async getTokenPrice(chainId: ChainId): Promise<number> {
    const config = getChainConfig(chainId, this.useTestnet);
    
    switch (config.gasTokenSymbol) {
      case 'ETH':
        return this.getETHPrice();
      case 'AVAX':
        return this.getAVAXPrice();
      case 'MATIC':
        return this.getMATICPrice();
      default:
        return 1; // Fallback
    }
  }

  private async fetchGasPrices(chainId: ChainId): Promise<GasPriceData> {
    const cached = this.gasPriceCache.get(chainId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }

    try {
      const provider = this.providers.get(chainId);
      if (!provider) {
        throw new Error(`Provider not found for chain ${chainId}`);
      }

      const gasPrice = await provider.getGasPrice();
      
      // Create tiered pricing
      const slow = gasPrice.mul(80).div(100); // 80% of current
      const standard = gasPrice;
      const fast = gasPrice.mul(120).div(100); // 120% of current

      const gasPriceData: GasPriceData = {
        slow,
        standard,
        fast,
        timestamp: Date.now(),
      };

      this.gasPriceCache.set(chainId, gasPriceData);
      return gasPriceData;
    } catch (error) {
      console.error(`Failed to fetch gas price for chain ${chainId}:`, error);
      
      // Fallback gas prices (in wei)
      const fallbackPrice = BigNumber.from('20000000000'); // 20 gwei
      return {
        slow: fallbackPrice.mul(80).div(100),
        standard: fallbackPrice,
        fast: fallbackPrice.mul(120).div(100),
        timestamp: Date.now(),
      };
    }
  }

  async estimateGas(
    transaction: GasFlowTransaction,
    chainId: ChainId,
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<GasEstimate> {
    try {
      const provider = this.providers.get(chainId);
      if (!provider) {
        throw new Error(`Provider not found for chain ${chainId}`);
      }

      // Estimate gas limit
      let gasLimit: BigNumber;
      if (transaction.gasLimit) {
        gasLimit = transaction.gasLimit;
      } else {
        try {
          // Validate and checksum the address to prevent checksum errors
          const toAddress = ethers.utils.getAddress(transaction.to);
          
          const estimatedGas = await provider.estimateGas({
            to: toAddress,
            value: transaction.value || 0,
            data: transaction.data || '0x',
          });
          gasLimit = estimatedGas.mul(110).div(100); // Add 10% buffer
        } catch (error) {
          console.warn('Gas estimation failed, using fallback:', error);
          gasLimit = BigNumber.from(21000); // Standard transfer
        }
      }

      // Get gas prices
      const gasPrices = await this.fetchGasPrices(chainId);
      let gasPrice: BigNumber;
      
      switch (urgency) {
        case 'low':
          gasPrice = gasPrices.slow;
          break;
        case 'high':
          gasPrice = gasPrices.fast;
          break;
        default:
          gasPrice = gasPrices.standard;
      }

      // Calculate gas cost in native token
      const gasCostETH = gasLimit.mul(gasPrice);

      // Convert to USDC
      const tokenPrice = await this.getTokenPrice(chainId);
      const gasCostUSD = parseFloat(ethers.utils.formatEther(gasCostETH)) * tokenPrice;
      const gasCostUSDC = BigNumber.from(Math.ceil(gasCostUSD * 1e6)); // USDC has 6 decimals

      // Estimate transaction time based on urgency
      let estimatedTime: number;
      switch (urgency) {
        case 'low':
          estimatedTime = 300; // 5 minutes
          break;
        case 'high':
          estimatedTime = 30; // 30 seconds
          break;
        default:
          estimatedTime = 120; // 2 minutes
      }

      return {
        chainId,
        gasLimit,
        gasPrice,
        gasCostETH,
        gasCostUSDC,
        estimatedTime,
      };
    } catch (error) {
      console.error(`Gas estimation failed for chain ${chainId}:`, error);
      
      // Return fallback estimate
      return {
        chainId,
        gasLimit: BigNumber.from(21000),
        gasPrice: BigNumber.from('20000000000'),
        gasCostETH: BigNumber.from('420000000000000'),
        gasCostUSDC: BigNumber.from(1000000), // $1 USDC
        estimatedTime: 120,
      };
    }
  }

  async estimateMultiChain(
    transaction: GasFlowTransaction,
    chains: ChainId[],
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<GasEstimate[]> {
    const estimates = await Promise.all(
      chains.map(chainId => this.estimateGas(transaction, chainId, urgency))
    );
    
    // Sort by gas cost (lowest first)
    return estimates.sort((a, b) => 
      a.gasCostUSDC.sub(b.gasCostUSDC).toNumber()
    );
  }

  async getCheapestChain(
    transaction: GasFlowTransaction,
    chains: ChainId[],
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<GasEstimate> {
    const estimates = await this.estimateMultiChain(transaction, chains, urgency);
    return estimates[0];
  }

  clearCache(): void {
    this.gasPriceCache.clear();
  }
}