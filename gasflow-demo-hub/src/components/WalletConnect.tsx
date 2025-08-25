import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Zap, AlertCircle, Settings } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { NetworkHelper } from './NetworkHelper';

interface WalletConnectProps {
  onWalletChange?: (address: string | null, signer?: any) => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onWalletChange }) => {
  const { 
    address, 
    signer, 
    isConnected, 
    chainId, 
    connectWallet, 
    disconnectWallet, 
    isConnecting, 
    isMetaMaskInstalled 
  } = useWallet();
  
  const [showNetworkHelper, setShowNetworkHelper] = useState(false);
  
  const SUPPORTED_NETWORKS = [11155111, 421614, 84532, 43113, 80002];
  const isUnsupportedNetwork = chainId && !SUPPORTED_NETWORKS.includes(chainId);

  React.useEffect(() => {
    onWalletChange?.(address, signer);
  }, [address, signer, onWalletChange]);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  const getChainName = (chainId: number) => {
    const chains: { [key: number]: string } = {
      11155111: 'Sepolia',
      421614: 'Arbitrum Sepolia',
      84532: 'Base Sepolia',
      43113: 'Avalanche Fuji',
      80002: 'Polygon Amoy',
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  if (!isMetaMaskInstalled) {
    return (
      <Card className="p-6 border-2 border-destructive/50 bg-destructive/5">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <div>
            <h3 className="text-lg font-semibold text-destructive mb-2">MetaMask Required</h3>
            <p className="text-muted-foreground">
              Please install MetaMask to use the CCTP testnet features.
            </p>
          </div>
          <Button asChild variant="destructive">
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Install MetaMask
            </a>
          </Button>
        </div>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="p-6 border-2 border-dashed border-muted">
        <div className="text-center space-y-4">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
            <p className="text-muted-foreground">
              Connect your MetaMask wallet to use real CCTP testnet features.
            </p>
          </div>
          <Button 
            onClick={connectWallet} 
            disabled={isConnecting}
            className="w-full sm:w-auto"
          >
            {isConnecting ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect MetaMask
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      {isUnsupportedNetwork && (
        <Card className="p-4 mb-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-destructive mb-1">Unsupported Network</h4>
                <p className="text-sm text-muted-foreground">
                  You're on {getChainName(chainId!)}. Switch to a supported testnet for full demo functionality.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNetworkHelper(true)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Networks
            </Button>
          </div>
        </Card>
      )}

      <Card className={`p-6 ${isUnsupportedNetwork ? 'border-destructive/50' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-medium">Wallet Connected</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                <strong>Address:</strong> {formatAddress(address!)}
              </div>
              {chainId && (
                <div className="flex items-center gap-2 text-sm">
                  <strong>Network:</strong> {getChainName(chainId)}
                  {isUnsupportedNetwork && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Unsupported
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowNetworkHelper(true)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Networks
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={disconnectWallet}
            >
              Disconnect
            </Button>
          </div>
        </div>

        {!isUnsupportedNetwork && (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">
                Need testnet USDC?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNetworkHelper(true)}
                className="w-full sm:w-auto border-primary/20 text-primary hover:bg-primary/10"
              >
                Get Faucet Links & Network Info
              </Button>
            </div>
          </div>
        )}
      </Card>

      {showNetworkHelper && (
        <NetworkHelper
          currentChainId={chainId}
          onClose={() => setShowNetworkHelper(false)}
        />
      )}
    </>
  );
};