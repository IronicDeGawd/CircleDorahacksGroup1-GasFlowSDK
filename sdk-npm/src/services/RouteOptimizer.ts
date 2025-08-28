import { BigNumber } from 'ethers';
import { ChainId, RouteOption, GasFlowTransaction, BalanceInfo } from '../types';
import { BalanceManager } from './BalanceManager';
import { GasEstimator } from './GasEstimator';
import { CCTPService } from './CCTPServiceFactory';

export interface RouteAnalysis {
  bestRoute: RouteOption;
  allRoutes: RouteOption[];
  recommendedExecution: {
    chainId: ChainId;
    reason: string;
    estimatedSavings?: BigNumber;
  };
}

export class RouteOptimizer {
  constructor(
    private balanceManager: BalanceManager,
    private gasEstimator: GasEstimator,
    private cctpService: CCTPService,
    private supportedChains: ChainId[]
  ) {}

  async analyzeOptimalRoute(
    transaction: GasFlowTransaction,
    userAddress: string,
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<RouteAnalysis> {
    const targetChain = transaction.executeOn === 'optimal' 
      ? await this.findOptimalExecutionChain(transaction, urgency)
      : (transaction.executeOn as ChainId);

    const allRoutes = await this.calculateAllRoutes(
      transaction,
      userAddress,
      targetChain,
      urgency
    );

    // Sort routes by total cost
    allRoutes.sort((a, b) => a.totalCost.sub(b.totalCost).toNumber());
    
    const bestRoute = allRoutes[0];
    const recommendedExecution = this.generateRecommendation(allRoutes, targetChain);

    return {
      bestRoute,
      allRoutes,
      recommendedExecution,
    };
  }

  private async findOptimalExecutionChain(
    transaction: GasFlowTransaction,
    urgency: 'low' | 'medium' | 'high'
  ): Promise<ChainId> {
    // Get gas estimates for all chains
    const gasEstimates = await this.gasEstimator.estimateMultiChain(
      transaction,
      this.supportedChains,
      urgency
    );

    // Return the chain with lowest gas cost
    return gasEstimates[0].chainId;
  }

  private async calculateAllRoutes(
    transaction: GasFlowTransaction,
    userAddress: string,
    targetChain: ChainId,
    urgency: 'low' | 'medium' | 'high'
  ): Promise<RouteOption[]> {
    const routes: RouteOption[] = [];

    // Get user balances across all chains
    const unifiedBalance = await this.balanceManager.getUnifiedBalance(userAddress);
    
    // Get gas estimate for target chain
    const gasEstimate = await this.gasEstimator.estimateGas(
      transaction,
      targetChain,
      urgency
    );

    // Calculate direct execution (if user has balance on target chain)
    const targetChainBalance = unifiedBalance.balancesByChain.find(
      b => b.chainId === targetChain
    );

    if (targetChainBalance && targetChainBalance.balance.gte(gasEstimate.gasCostUSDC)) {
      routes.push({
        executeOnChain: targetChain,
        payFromChain: targetChain,
        totalCost: gasEstimate.gasCostUSDC,
        gasCost: gasEstimate.gasCostUSDC,
        estimatedTime: gasEstimate.estimatedTime,
      });
    }

    // Calculate cross-chain routes
    for (const balanceInfo of unifiedBalance.balancesByChain) {
      if (balanceInfo.chainId === targetChain) continue; // Already handled above
      if (balanceInfo.balance.eq(0)) continue; // No balance on this chain

      const requiredAmount = gasEstimate.gasCostUSDC;
      if (balanceInfo.balance.lt(requiredAmount)) continue; // Insufficient balance

      try {
        // Get bridge fee and time
        const bridgeFee = await this.cctpService.estimateBridgeFee(
          requiredAmount,
          balanceInfo.chainId,
          targetChain
        );

        const bridgeTime = await this.cctpService.estimateTransferTime(
          requiredAmount,
          balanceInfo.chainId,
          targetChain
        );

        const totalCost = gasEstimate.gasCostUSDC.add(bridgeFee);
        const totalTime = gasEstimate.estimatedTime + bridgeTime;

        routes.push({
          executeOnChain: targetChain,
          payFromChain: balanceInfo.chainId,
          totalCost,
          bridgeCost: bridgeFee,
          gasCost: gasEstimate.gasCostUSDC,
          estimatedTime: totalTime,
        });
      } catch (error) {
        console.warn(`Failed to calculate route from chain ${balanceInfo.chainId}:`, error);
      }
    }

    // Calculate alternative execution chains (execute on different chain)
    if (transaction.executeOn === 'optimal') {
      for (const chainId of this.supportedChains) {
        if (chainId === targetChain) continue; // Already handled

        try {
          const altGasEstimate = await this.gasEstimator.estimateGas(
            transaction,
            chainId,
            urgency
          );

          const chainBalance = unifiedBalance.balancesByChain.find(
            b => b.chainId === chainId
          );

          // Direct execution on alternative chain
          if (chainBalance && chainBalance.balance.gte(altGasEstimate.gasCostUSDC)) {
            routes.push({
              executeOnChain: chainId,
              payFromChain: chainId,
              totalCost: altGasEstimate.gasCostUSDC,
              gasCost: altGasEstimate.gasCostUSDC,
              estimatedTime: altGasEstimate.estimatedTime,
            });
          }

          // Cross-chain payment for alternative chain execution
          for (const balanceInfo of unifiedBalance.balancesByChain) {
            if (balanceInfo.chainId === chainId) continue;
            if (balanceInfo.balance.lt(altGasEstimate.gasCostUSDC)) continue;

            const bridgeFee = await this.cctpService.estimateBridgeFee(
              altGasEstimate.gasCostUSDC,
              balanceInfo.chainId,
              chainId
            );

            const bridgeTime = await this.cctpService.estimateTransferTime(
              altGasEstimate.gasCostUSDC,
              balanceInfo.chainId,
              chainId
            );

            const totalCost = altGasEstimate.gasCostUSDC.add(bridgeFee);
            const totalTime = altGasEstimate.estimatedTime + bridgeTime;

            routes.push({
              executeOnChain: chainId,
              payFromChain: balanceInfo.chainId,
              totalCost,
              bridgeCost: bridgeFee,
              gasCost: altGasEstimate.gasCostUSDC,
              estimatedTime: totalTime,
            });
          }
        } catch (error) {
          console.warn(`Failed to calculate alternative execution on chain ${chainId}:`, error);
        }
      }
    }

    return routes;
  }

  private generateRecommendation(
    routes: RouteOption[],
    preferredChain: ChainId
  ): { chainId: ChainId; reason: string; estimatedSavings?: BigNumber } {
    if (routes.length === 0) {
      throw new Error(
        'No viable routes found. This may be due to insufficient balances, ' +
        'network connectivity issues, or CCTP service unavailability. ' +
        'Please check your USDC balances and try again.'
      );
    }

    const bestRoute = routes[0];
    const preferredChainRoute = routes.find(r => r.executeOnChain === preferredChain);

    // If best route is on preferred chain, recommend it
    if (bestRoute.executeOnChain === preferredChain) {
      return {
        chainId: preferredChain,
        reason: `Optimal execution on preferred chain ${preferredChain}`,
      };
    }

    // If executing on different chain saves significant money
    if (preferredChainRoute) {
      const savings = preferredChainRoute.totalCost.sub(bestRoute.totalCost);
      const savingsPercentage = savings.mul(100).div(preferredChainRoute.totalCost).toNumber();

      if (savingsPercentage > 20) { // More than 20% savings
        return {
          chainId: bestRoute.executeOnChain,
          reason: `Significant cost savings (${savingsPercentage.toFixed(1)}%) by executing on chain ${bestRoute.executeOnChain}`,
          estimatedSavings: savings,
        };
      }
    }

    // Default to best route
    return {
      chainId: bestRoute.executeOnChain,
      reason: `Most cost-effective execution on chain ${bestRoute.executeOnChain}`,
      estimatedSavings: preferredChainRoute 
        ? preferredChainRoute.totalCost.sub(bestRoute.totalCost)
        : undefined,
    };
  }

  async getQuickEstimate(
    transaction: GasFlowTransaction,
    userAddress: string
  ): Promise<{
    canExecute: boolean;
    estimatedCost: BigNumber;
    recommendedChain: ChainId;
    requiresBridge: boolean;
  }> {
    try {
      // Quick analysis with medium urgency
      const analysis = await this.analyzeOptimalRoute(transaction, userAddress, 'medium');
      
      return {
        canExecute: analysis.allRoutes.length > 0,
        estimatedCost: analysis.bestRoute.totalCost,
        recommendedChain: analysis.bestRoute.executeOnChain,
        requiresBridge: analysis.bestRoute.payFromChain !== analysis.bestRoute.executeOnChain,
      };
    } catch (error) {
      console.error('Quick estimate failed:', error);
      return {
        canExecute: false,
        estimatedCost: BigNumber.from(0),
        recommendedChain: this.supportedChains[0],
        requiresBridge: false,
      };
    }
  }

  async findSufficientBalance(
    userAddress: string,
    requiredAmount: BigNumber
  ): Promise<ChainId[]> {
    return this.balanceManager.findChainsWithSufficientBalance(
      userAddress,
      requiredAmount
    );
  }

  calculateSavingsOpportunity(routes: RouteOption[]): {
    maxSavings: BigNumber;
    optimalRoute: RouteOption;
    baselineRoute: RouteOption;
  } | null {
    if (routes.length < 2) return null;

    const sortedRoutes = [...routes].sort((a, b) => 
      a.totalCost.sub(b.totalCost).toNumber()
    );

    const optimalRoute = sortedRoutes[0];
    const baselineRoute = sortedRoutes[sortedRoutes.length - 1];
    const maxSavings = baselineRoute.totalCost.sub(optimalRoute.totalCost);

    return {
      maxSavings,
      optimalRoute,
      baselineRoute,
    };
  }
}