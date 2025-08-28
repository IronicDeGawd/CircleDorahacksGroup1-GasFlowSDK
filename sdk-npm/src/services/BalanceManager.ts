import { ethers, BigNumber } from 'ethers';
import WebSocket from 'ws';
import { ChainId, BalanceInfo, UnifiedBalance, ChainConfig } from '../types';
import { getChainConfig } from '../config/chains';

const USDC_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export class BalanceManager {
  private providers: Map<ChainId, ethers.providers.JsonRpcProvider> = new Map();
  private websockets: Map<ChainId, WebSocket> = new Map();
  private balanceCache: Map<string, BalanceInfo> = new Map();
  private lastUpdate: Date = new Date();
  private updateInterval: NodeJS.Timeout | null = null;
  
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

  async getUSDCBalance(
    address: string,
    chainId: ChainId
  ): Promise<BalanceInfo> {
    const cacheKey = `${address}-${chainId}`;
    
    if (this.balanceCache.has(cacheKey)) {
      const cached = this.balanceCache.get(cacheKey)!;
      if (Date.now() - this.lastUpdate.getTime() < 30000) {
        return cached;
      }
    }

    try {
      const provider = this.providers.get(chainId);
      if (!provider) {
        throw new Error(`Provider not found for chain ${chainId}`);
      }

      const config = getChainConfig(chainId, this.useTestnet);
      const usdcContract = new ethers.Contract(
        config.usdcAddress,
        USDC_ABI,
        provider
      );

      const balance = await usdcContract.balanceOf(address);
      const decimals = await usdcContract.decimals();
      
      // Keep balance in raw USDC units (6 decimals) for SDK calculations
      // The division was causing precision loss for balance comparisons
      const adjustedBalance = balance;
      
      const balanceInfo: BalanceInfo = {
        chainId,
        balance: adjustedBalance,
        usdValue: parseFloat(ethers.utils.formatUnits(balance, decimals)),
      };

      this.balanceCache.set(cacheKey, balanceInfo);
      return balanceInfo;
    } catch (error) {
      console.error(`Failed to fetch USDC balance for chain ${chainId}:`, error);
      return {
        chainId,
        balance: BigNumber.from(0),
        usdValue: 0,
      };
    }
  }

  async getUnifiedBalance(address: string): Promise<UnifiedBalance> {
    const balancePromises = this.supportedChains.map(chainId =>
      this.getUSDCBalance(address, chainId)
    );

    const balancesByChain = await Promise.all(balancePromises);
    
    const totalUSDC = balancesByChain.reduce(
      (sum, balance) => sum.add(balance.balance),
      BigNumber.from(0)
    );

    const totalUSDValue = balancesByChain.reduce(
      (sum, balance) => sum + balance.usdValue,
      0
    );

    this.lastUpdate = new Date();

    return {
      totalUSDC,
      totalUSDValue,
      balancesByChain,
      lastUpdated: this.lastUpdate,
    };
  }

  startRealTimeUpdates(
    address: string,
    onUpdate: (balance: UnifiedBalance) => void,
    intervalMs: number = 30000
  ): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        const balance = await this.getUnifiedBalance(address);
        onUpdate(balance);
      } catch (error) {
        console.error('Failed to update balance:', error);
      }
    }, intervalMs);
  }

  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async hasEnoughBalance(
    address: string,
    chainId: ChainId,
    requiredAmount: BigNumber
  ): Promise<boolean> {
    const balance = await this.getUSDCBalance(address, chainId);
    return balance.balance.gte(requiredAmount);
  }

  async findChainsWithSufficientBalance(
    address: string,
    requiredAmount: BigNumber
  ): Promise<ChainId[]> {
    const balances = await Promise.all(
      this.supportedChains.map(async chainId => ({
        chainId,
        balance: await this.getUSDCBalance(address, chainId),
      }))
    );

    return balances
      .filter(({ balance }) => balance.balance.gte(requiredAmount))
      .map(({ chainId }) => chainId);
  }

  async getOptimalSourceChain(
    address: string,
    requiredAmount: BigNumber,
    targetChain: ChainId
  ): Promise<ChainId | null> {
    if (await this.hasEnoughBalance(address, targetChain, requiredAmount)) {
      return targetChain;
    }

    const chainsWithBalance = await this.findChainsWithSufficientBalance(
      address,
      requiredAmount
    );

    if (chainsWithBalance.length === 0) {
      return null;
    }

    return chainsWithBalance[0];
  }

  clearCache(): void {
    this.balanceCache.clear();
  }

  destroy(): void {
    this.stopRealTimeUpdates();
    this.clearCache();
    
    for (const ws of this.websockets.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
    this.websockets.clear();
  }
}