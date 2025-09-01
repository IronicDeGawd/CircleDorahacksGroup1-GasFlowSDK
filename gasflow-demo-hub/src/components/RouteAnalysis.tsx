import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Zap, ArrowRight, Shuffle } from 'lucide-react';
import { RouteAnalysis as RouteAnalysisType, CHAIN_NAMES } from '../types';

interface RouteAnalysisProps {
  analysis: RouteAnalysisType;
  selectedRouteIndex?: number;
  onRouteSelect?: (index: number) => void;
}

export function RouteAnalysis({ analysis, selectedRouteIndex = 0, onRouteSelect }: RouteAnalysisProps) {
  const formatCost = (cost: bigint) => `${(Number(cost) / 1e6).toFixed(4)}`;
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const selectedRoute = analysis.allRoutes[selectedRouteIndex];
  const isSelectedRoute = (index: number) => index === selectedRouteIndex;

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

      {/* All Routes */}
      <div className="mb-6">
        <h4 className="font-medium text-muted-foreground mb-4">Select Route</h4>
        <div className="space-y-3">
          {analysis.allRoutes.map((route, index) => {
            const isSelected = isSelectedRoute(index);
            const isRecommended = index === 0;
            
            return (
              <div 
                key={index} 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-success/40 bg-success/5' 
                    : 'border-border bg-muted/20 hover:bg-muted/40'
                }`}
                onClick={() => onRouteSelect?.(index)}
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      {isRecommended && (
                        <Badge variant="default" className="bg-success text-success-foreground mr-2">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                      {getRouteIcon(route.executeOnChain !== route.payFromChain)}
                      <span className="font-medium">{getRouteTypeLabel(route.executeOnChain !== route.payFromChain)} Route</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">{CHAIN_NAMES[route.payFromChain]}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-medium">{CHAIN_NAMES[route.executeOnChain]}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Cost</div>
                    <div className="font-semibold text-lg">${formatCost(route.totalCost)}</div>
                    <div className="text-xs text-muted-foreground">
                      Gas: ${formatCost(route.gasCost)}
                      {route.bridgeCost && ` • Bridge: $${formatCost(route.bridgeCost)}`}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Est. Time</div>
                    <div className="font-semibold text-lg flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(route.estimatedTime)}
                    </div>
                    {route.estimatedTime > 300 && (
                      <div className="text-xs text-amber-600 mt-1">
                        ⏳ Standard CCTP: {Math.floor(route.estimatedTime/60)}min attestation
                      </div>
                    )}
                    {route.estimatedTime > 60 && route.estimatedTime <= 300 && (
                      <div className="text-xs text-blue-600 mt-1">
                        🚀 Fast CCTP: ~{route.estimatedTime}s attestation
                      </div>
                    )}
                    {route.estimatedTime <= 60 && (
                      <div className="text-xs text-green-600 mt-1">
                        ⚡ Same-chain execution
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-end">
                    {onRouteSelect && (
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={isSelected ? "bg-success hover:bg-success/90" : ""}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="text-sm text-muted-foreground">
          <strong>Note:</strong> Route analysis considers current gas prices, bridge availability, 
          transfer mode selection, and your selected priority level to recommend the most cost-effective path.
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          <strong>Transfer Modes:</strong> Fast (8-30s, higher fees) • Standard (2-19min, lower fees) • Auto (optimized selection)
        </div>
        {selectedRoute && selectedRoute.executeOnChain !== selectedRoute.payFromChain && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="text-sm text-amber-800">
              <strong>⚠️ Gas Required:</strong> You need {
                selectedRoute.executeOnChain === 11155111 ? "ETH" :
                selectedRoute.executeOnChain === 421614 ? "ETH" :
                selectedRoute.executeOnChain === 84532 ? "ETH" :
                selectedRoute.executeOnChain === 43113 ? "AVAX" :
                selectedRoute.executeOnChain === 80002 ? "MATIC" : "native tokens"
              } on {CHAIN_NAMES[selectedRoute.executeOnChain]} to complete the CCTP minting process.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
