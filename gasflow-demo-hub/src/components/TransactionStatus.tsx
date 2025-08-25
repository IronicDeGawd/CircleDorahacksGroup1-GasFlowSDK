import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ExternalLink, Clock, DollarSign, Zap, ArrowRight } from 'lucide-react';
import { GasFlowResult, CHAIN_NAMES } from '../types';

interface TransactionStatusProps {
  result: GasFlowResult;
}

export function TransactionStatus({ result }: TransactionStatusProps) {
  const formatCost = (cost: bigint | any) => {
    const numericCost = typeof cost === 'object' && cost.hex 
      ? parseInt(cost.hex, 16) / 1e6
      : Number(cost) / 1e6;
    return numericCost.toFixed(4);
  };
  
  const formatGas = (gas: bigint | any) => {
    const numericGas = typeof gas === 'object' && gas.hex 
      ? parseInt(gas.hex, 16) 
      : Number(gas);
    return numericGas.toLocaleString();
  };

  const openTxInExplorer = (hash: string) => {
    // This would typically determine the correct explorer based on the chain
    window.open(`https://etherscan.io/tx/${hash}`, '_blank');
  };
  
  const executedChainName = CHAIN_NAMES[result.executedOnChain] || `Chain ${result.executedOnChain}`;
  const paymentChainName = CHAIN_NAMES[result.gasPaymentChain] || `Chain ${result.gasPaymentChain}`;
  const isCrossChain = result.executedOnChain !== result.gasPaymentChain;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Status Header */}
        <div className="flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-success" />
          <div>
            <h3 className="text-xl font-semibold text-success">Transaction Successful</h3>
            <p className="text-muted-foreground">Your transaction has been executed successfully</p>
          </div>
        </div>

        {/* Transaction Hash */}
        {result.transactionHash && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium mb-1">Transaction Hash</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {result.transactionHash.slice(0, 10)}...{result.transactionHash.slice(-8)}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openTxInExplorer(result.transactionHash!)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {result.error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-destructive">Error Details</div>
                <div className="text-sm text-destructive/80 mt-1">{result.error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Success Details */}
        {result.success && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Cost */}
            <div className="p-4 bg-card border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium">Total Cost</div>
              </div>
              <div className="text-2xl font-bold text-primary">
                ${formatCost(result.totalCostUSDC)}
              </div>
              <div className="text-xs text-muted-foreground">USDC</div>
            </div>

            {/* Gas Used */}
            <div className="p-4 bg-card border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-warning" />
                <div className="text-sm font-medium">Gas Used</div>
              </div>
              <div className="text-2xl font-bold">
                {formatGas(result.gasUsed)}
              </div>
              <div className="text-xs text-muted-foreground">units</div>
            </div>

            {/* Execution Time */}
            {result.executionDetails?.executionTime && (
              <div className="p-4 bg-card border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-info" />
                  <div className="text-sm font-medium">Execution Time</div>
                </div>
                <div className="text-2xl font-bold">
                  {result.executionDetails.executionTime}
                </div>
                <div className="text-xs text-muted-foreground">seconds</div>
              </div>
            )}
          </div>
        )}

        {/* Execution Route Details */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Execution Details</h4>
          <div className="space-y-3">
            {/* Route Path */}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Route:</span>
              <Badge variant="secondary">{paymentChainName}</Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="secondary">{executedChainName}</Badge>
            </div>

            {/* Bridge Used */}
            {result.bridgeTransactionHash && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Bridge:</span>
                <Badge variant="outline">Circle CCTP</Badge>
              </div>
            )}
            
            {result.estimatedSavings && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Savings:</span>
                <Badge variant="default" className="bg-success text-success-foreground">
                  ${formatCost(result.estimatedSavings)} USDC
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        <div className="p-4 bg-success-bg border border-success/20 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-success mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-success">Transaction Completed</div>
              <div className="text-success-foreground/80 mt-1">
                Your transaction has been successfully executed using the GasFlow SDK. 
                The optimal route was selected to minimize costs while ensuring reliable execution.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}