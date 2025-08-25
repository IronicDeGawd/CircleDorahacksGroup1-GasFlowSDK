import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, ExternalLink, Copy, CheckCircle, Network, Zap } from 'lucide-react';

interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  faucetUrl?: string;
  bridgeUrl?: string;
}

const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io',
    faucetUrl: 'https://faucet.circle.com/',
  },
  {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io',
    bridgeUrl: 'https://bridge.arbitrum.io/',
  },
  {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    bridgeUrl: 'https://bridge.base.org/',
  },
  {
    chainId: 43113,
    name: 'Avalanche Fuji',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    blockExplorer: 'https://testnet.snowtrace.io',
    faucetUrl: 'https://faucet.avax.network/',
  },
  {
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    blockExplorer: 'https://amoy.polygonscan.com',
    faucetUrl: 'https://faucet.polygon.technology/',
  },
];

interface NetworkHelperProps {
  currentChainId?: number | null;
  onClose: () => void;
}

export const NetworkHelper: React.FC<NetworkHelperProps> = ({ currentChainId, onClose }) => {
  const [isAddingNetwork, setIsAddingNetwork] = useState<number | null>(null);

  const addNetworkToWallet = async (network: NetworkConfig) => {
    if (!window.ethereum) {
      alert('MetaMask not found');
      return;
    }

    setIsAddingNetwork(network.chainId);
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${network.chainId.toString(16)}`,
          chainName: network.name,
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.blockExplorer],
        }],
      });
    } catch (error) {
      console.error('Failed to add network:', error);
    } finally {
      setIsAddingNetwork(null);
    }
  };

  const switchToNetwork = async (chainId: number) => {
    if (!window.ethereum) {
      alert('MetaMask not found');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      // If network is not added, add it first
      if (error.code === 4902) {
        const network = SUPPORTED_NETWORKS.find(n => n.chainId === chainId);
        if (network) {
          await addNetworkToWallet(network);
        }
      } else {
        console.error('Failed to switch network:', error);
      }
    }
  };

  const isCurrentNetwork = (chainId: number) => currentChainId === chainId;
  const isUnsupportedNetwork = currentChainId && !SUPPORTED_NETWORKS.some(n => n.chainId === currentChainId);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Setup Guide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isUnsupportedNetwork && (
            <Card className="p-4 border-destructive/50 bg-destructive/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive mb-1">Unsupported Network</h4>
                  <p className="text-sm text-muted-foreground">
                    You're currently on Chain ID {currentChainId}. Please switch to one of the supported testnets below.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4 border-primary/20 bg-primary/5">
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Requirements for Testing</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Testnet USDC tokens</strong> (not ETH) for gas payments</li>
                <li>• <strong>MetaMask</strong> connected to supported testnets</li>
                <li>• <strong>Small amount of native tokens</strong> for transaction fees</li>
              </ul>
            </div>
          </Card>

          <div>
            <h4 className="font-semibold mb-4">Supported Testnet Networks</h4>
            <div className="grid gap-4">
              {SUPPORTED_NETWORKS.map(network => (
                <Card 
                  key={network.chainId} 
                  className={`p-4 ${isCurrentNetwork(network.chainId) ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{network.name}</h5>
                        {isCurrentNetwork(network.chainId) && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Chain ID: {network.chainId}</p>
                    </div>
                    
                    {!isCurrentNetwork(network.chainId) && (
                      <Button
                        onClick={() => switchToNetwork(network.chainId)}
                        disabled={isAddingNetwork === network.chainId}
                        variant="outline"
                        size="sm"
                      >
                        {isAddingNetwork === network.chainId ? (
                          <>
                            <Zap className="h-4 w-4 mr-1 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Switch Network'
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {network.faucetUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(network.faucetUrl, '_blank')}
                        className="text-xs h-8"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        USDC Faucet
                      </Button>
                    )}
                    {network.bridgeUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(network.bridgeUrl, '_blank')}
                        className="text-xs h-8"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Bridge
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(network.blockExplorer, '_blank')}
                      className="text-xs h-8"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Explorer
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-4 border-primary/20 bg-primary/5">
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Getting Started Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Start with Sepolia:</strong> Get USDC from Circle's faucet first</li>
                <li>• <strong>Bridge to other chains:</strong> Use official bridges to move tokens</li>
                <li>• <strong>Keep some native tokens:</strong> You'll need ETH/AVAX/MATIC for transaction fees</li>
                <li>• <strong>Testnet only:</strong> These are test networks - tokens have no real value</li>
              </ul>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onClose}>
              Got it, thanks!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

declare global {
  interface Window {
    ethereum?: any;
  }
}