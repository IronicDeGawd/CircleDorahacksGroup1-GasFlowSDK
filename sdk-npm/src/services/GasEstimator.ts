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
    private useTestnet: boolean = true,
    private coinGeckoApiKey?: string
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

  private priceCache = new Map<string, { price: number; timestamp: number }>();
  private readonly PRICE_CACHE_DURATION = 60000; // 60 seconds (matches CoinGecko update frequency)

  private async getAllPrices(): Promise<{ eth: number; avax: number; matic: number }> {
    if (this.useTestnet) {
      console.log('🎭 [MOCK] Using testnet fallback prices (reason: testnet mode avoids external API calls)');
      return { eth: 2000, avax: 30, matic: 0.8 };
    }

    try {
      const baseUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,avalanche-2,matic-network&vs_currencies=usd';
      const url = this.coinGeckoApiKey ? `${baseUrl}&x_cg_demo_api_key=${this.coinGeckoApiKey}` : baseUrl;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate response structure
      if (!data.ethereum?.usd || !data['avalanche-2']?.usd || !data['matic-network']?.usd) {
        throw new Error('Invalid response format from CoinGecko API');
      }
      
      const prices = {
        eth: data.ethereum.usd,
        avax: data['avalanche-2'].usd,
        matic: data['matic-network'].usd
      };
      
      const apiType = this.coinGeckoApiKey ? 'Pro API' : 'Public API';
      console.log(`✅ [REAL] All prices fetched from CoinGecko ${apiType}: ETH $${prices.eth}, AVAX $${prices.avax}, MATIC $${prices.matic}`);
      
      // Cache the prices
      const timestamp = Date.now();
      this.priceCache.set('eth', { price: prices.eth, timestamp });
      this.priceCache.set('avax', { price: prices.avax, timestamp });
      this.priceCache.set('matic', { price: prices.matic, timestamp });
      
      return prices;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`⚠️ [FALLBACK] Using fallback prices (reason: ${errorMsg})`);
      return { eth: 2000, avax: 30, matic: 0.8 };
    }
  }

  private async getCachedPrice(token: 'eth' | 'avax' | 'matic'): Promise<number> {
    const cached = this.priceCache.get(token);
    if (cached && Date.now() - cached.timestamp < this.PRICE_CACHE_DURATION) {
      return cached.price;
    }

    // If cache is stale or missing, fetch all prices
    const prices = await this.getAllPrices();
    return prices[token];
  }

  private async getETHPrice(): Promise<number> {
    return this.getCachedPrice('eth');
  }

  private async getAVAXPrice(): Promise<number> {
    return this.getCachedPrice('avax');
  }

  private async getMATICPrice(): Promise<number> {
    return this.getCachedPrice('matic');
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
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`⚠️ [FALLBACK] Using fallback gas price 20 gwei for chain ${chainId} (reason: ${errorMsg})`);
      
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
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`⚠️ [FALLBACK] Using fallback gas limit 21000 (reason: ${errorMsg})`);
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
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`⚠️ [FALLBACK] Using complete fallback gas estimate for chain ${chainId} (reason: ${errorMsg})`);
      
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