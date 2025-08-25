import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Coins } from 'lucide-react';
import { UnifiedBalance, CHAIN_NAMES } from '../types';

interface ChainBalance {
  chainId: number;
  chainName: string;
  balance: string;
  symbol: string;
}

interface BalanceData {
  total: string;
  chains: ChainBalance[];
  lastUpdated: Date;
}

interface BalanceViewProps {
  balance: UnifiedBalance | BalanceData | null;
  isLoading: boolean;
  userAddress: string | null;
}

const CHAIN_COLORS: Record<number, string> = {
  11155111: 'bg-blue-100 text-blue-800',
  421614: 'bg-cyan-100 text-cyan-800', 
  84532: 'bg-indigo-100 text-indigo-800',
  43113: 'bg-red-100 text-red-800',
  80002: 'bg-purple-100 text-purple-800',
};

export function BalanceView({ balance, isLoading, userAddress }: BalanceViewProps) {
  if (!userAddress) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Connect your wallet to view USDC balances</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">USDC Balance</h3>
        {isLoading && (
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {balance ? (
        <div className="space-y-6">
          {/* Total Balance */}
          <div className="text-center p-4 bg-gradient-to-r from-primary/5 to-primary-glow/5 rounded-lg border">
            <div className="text-2xl font-bold text-primary">
              ${'totalUSDValue' in balance ? balance.totalUSDValue.toFixed(2) : balance.total}
            </div>
            <div className="text-sm text-muted-foreground">
              Total USDC Balance
            </div>
          </div>

          {/* Per-Chain Breakdown */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Balance by Chain
            </h4>
            <div className="space-y-2">
              {'balancesByChain' in balance ? (
                balance.balancesByChain.map((chain) => (
                  <div 
                    key={chain.chainId}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="secondary"
                        className={CHAIN_COLORS[chain.chainId] || 'bg-gray-100 text-gray-800'}
                      >
                        {CHAIN_NAMES[chain.chainId] || `Chain ${chain.chainId}`}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ${chain.usdValue.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        USDC
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                balance.chains.map((chain) => (
                  <div 
                    key={chain.chainId}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="secondary"
                        className={CHAIN_COLORS[chain.chainId] || 'bg-gray-100 text-gray-800'}
                      >
                        {chain.chainName}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ${chain.balance}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {chain.symbol}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last updated: {balance.lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <Coins className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Loading balance data...</p>
        </div>
      )}
    </Card>
  );
}