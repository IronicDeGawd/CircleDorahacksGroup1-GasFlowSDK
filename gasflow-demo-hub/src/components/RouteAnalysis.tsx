import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Zap, ArrowRight, Shuffle } from 'lucide-react';
import { RouteAnalysis as RouteAnalysisType, CHAIN_NAMES } from '../types';

interface RouteAnalysisProps {
  analysis: RouteAnalysisType;
}

export function RouteAnalysis({ analysis }: RouteAnalysisProps) {
  const formatCost = (cost: bigint) => `${(Number(cost) / 1e6).toFixed(4)}`;
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const bestRoute = analysis.bestRoute;
  const otherRoutes = analysis.allRoutes.slice(1);

  const getRouteIcon = (isCrossChain: boolean) => {
    return isCrossChain ? <Shuffle className="h-4 w-4" /> : <Zap className="h-4 w-4" />;
  };

  const getRouteTypeLabel = (isCrossChain: boolean) => {
    return isCrossChain ? 'Cross-chain' : 'Direct';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle className="h-5 w-5 text-success" />
        <h3 className="text-lg font-semibold">Route Analysis Complete</h3>
      </div>

      {/* Recommended Route */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="default" className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Recommended
          </Badge>
          {analysis.recommendedExecution.estimatedSavings && (
            <Badge variant="secondary">
              Save ${formatCost(analysis.recommendedExecution.estimatedSavings)}
            </Badge>
          )}
        </div>
        
        <div className="p-4 border-2 border-success/20 bg-success-bg rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                {getRouteIcon(bestRoute.executeOnChain !== bestRoute.payFromChain)}
                <span className="font-medium">{getRouteTypeLabel(bestRoute.executeOnChain !== bestRoute.payFromChain)} Route</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{CHAIN_NAMES[bestRoute.payFromChain]}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-medium">{CHAIN_NAMES[bestRoute.executeOnChain]}</span>
              </div>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Cost</div>
              <div className="font-semibold text-lg">${formatCost(bestRoute.totalCost)}</div>
              <div className="text-xs text-muted-foreground">
                Gas: ${formatCost(bestRoute.gasCost)}
                {bestRoute.bridgeCost && ` • Bridge: $${formatCost(bestRoute.bridgeCost)}`}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Est. Time</div>
              <div className="font-semibold text-lg flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(bestRoute.estimatedTime)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Routes */}
      {otherRoutes.length > 0 && (
        <div>
          <h4 className="font-medium text-muted-foreground mb-3">Alternative Routes</h4>
          <div className="space-y-3">
            {otherRoutes.map((route, index) => (
              <div key={index} className="p-4 border rounded-lg bg-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      {getRouteIcon(route.executeOnChain !== route.payFromChain)}
                      <span className="font-medium">{getRouteTypeLabel(route.executeOnChain !== route.payFromChain)} Route</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{CHAIN_NAMES[route.payFromChain]}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{CHAIN_NAMES[route.executeOnChain]}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Cost</div>
                    <div className="font-semibold">${formatCost(route.totalCost)}</div>
                    <div className="text-xs text-muted-foreground">
                      Gas: ${formatCost(route.gasCost)}
                      {route.bridgeCost && ` • Bridge: $${formatCost(route.bridgeCost)}`}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Est. Time</div>
                    <div className="font-semibold flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(route.estimatedTime)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="text-sm text-muted-foreground">
          <strong>Note:</strong> Route analysis considers current gas prices, bridge availability, 
          and your selected priority level to recommend the most cost-effective path.
        </div>
      </div>
    </Card>
  );
}
