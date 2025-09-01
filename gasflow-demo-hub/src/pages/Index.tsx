import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletConnect } from "@/components/WalletConnect";
import { BalanceView } from "@/components/BalanceView";
import { TransactionForm } from "@/components/TransactionForm";
import { RouteAnalysis } from "@/components/RouteAnalysis";
import { TransactionStatus } from "@/components/TransactionStatus";
import { NetworkHelper } from "@/components/NetworkHelper";
import FallbackWarning from "@/components/FallbackWarning";
import { Settings, Info, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GasFlowSDK } from "gasflow-sdk";
import {
  UnifiedBalance,
  DemoGasFlowTransaction,
  GasFlowTransaction,
  RouteAnalysis as RouteAnalysisType,
  GasFlowResult,
  CHAIN_NAMES,
} from "../types";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { ensureV5Compatibility } from "../utils/signerAdapter";


interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error";
}

const Index = () => {
  const { toast } = useToast();

  const [sdk, setSdk] = useState<GasFlowSDK | null>(null);

  // Initialize SDK - always use production CCTP
  useEffect(() => {
    const initializeSDK = () => {
      try {
        addLog("info", "Initializing GasFlow SDK with real Circle CCTP...");
        const apiKey = import.meta.env.VITE_CIRCLE_API_KEY;
        if (!apiKey || apiKey === "your_api_key:your_entity_id:your_secret") {
          throw new Error(
            "Circle API key not configured. Please set VITE_CIRCLE_API_KEY in your .env file."
          );
        }

        // Initialize SDK without signers first - signers will be added when wallet connects
        const coinGeckoApiKey = import.meta.env.VITE_COINGECKO_API_KEY;
        const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
        
        console.log('🔍 SDK Initialization Debug:', {
          apiKey: apiKey ? 'provided' : 'missing',
          coinGeckoApiKey: coinGeckoApiKey ? 'provided' : 'missing',
          coinGeckoApiKeyValue: coinGeckoApiKey,
          alchemyApiKey: alchemyApiKey ? 'provided' : 'missing',
        });
        
        const realSDK = new GasFlowSDK({
          apiKey,
          supportedChains: [11155111, 421614, 84532, 43113, 80002],
          signers: undefined, // Don't pass signers during initialization
          coinGeckoApiKey,
          alchemyApiKey,
          executionMode: 'paymaster', // Use paymaster for USDC gas payment
          preferSignerExecution: false, // Prioritize paymaster over traditional
        });
        setSdk(realSDK);
        addLog("success", "GasFlow SDK initialized with Circle CCTP");
        addLog("info", "Signers will be added when wallet connects");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        addLog("error", `Failed to initialize SDK: ${errorMessage}`);

        toast({
          title: "❌ SDK Initialization Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    initializeSDK();
  }, [toast]);
  const [balance, setBalance] = useState<UnifiedBalance | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletSigner, setWalletSigner] = useState<ethers.Signer | null>(null);
  const [transaction, setTransaction] = useState<DemoGasFlowTransaction>({
    to: "", // Will be auto-filled with wallet address
    sendAmountETH: "0.001", // Default small send amount
    value: undefined,
    data: "0x",
    executeOn: "optimal",
    payFromChain: "auto",
    urgency: "medium",
    gasPaymentETH: "0.01", // Default reasonable gas budget
    gasPaymentUSDC: undefined,
  });
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysisType | null>(
    null
  );
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [executionResult, setExecutionResult] = useState<GasFlowResult | null>(
    null
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ethPrice, setEthPrice] = useState<number>(2400); // Default fallback price
  const [usePrivateKeyMode, setUsePrivateKeyMode] = useState<boolean>(false);
  const [demoPrivateKey, setDemoPrivateKey] = useState<string>("");
  const [logs, setLogs] = useState<
    Array<{
      type: "info" | "success" | "error";
      message: string;
      timestamp: Date;
    }>
  >([]);
  const [showNetworkHelper, setShowNetworkHelper] = useState(false);
  const [activeFallbacks, setActiveFallbacks] = useState<Set<string>>(
    new Set()
  );

  const validatePrivateKey = (key: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(key);
  };

  const addLog = (type: "info" | "success" | "error", message: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: new Date() }]);

    if (
      message.toLowerCase().includes("fallback") ||
      message.toLowerCase().includes("using estimation")
    ) {
      if (message.toLowerCase().includes("gas")) {
        setActiveFallbacks((prev) => new Set([...prev, "gas_estimation"]));
      } else if (message.toLowerCase().includes("transfer")) {
        setActiveFallbacks((prev) => new Set([...prev, "fast_transfer"]));
      } else if (message.toLowerCase().includes("fee")) {
        setActiveFallbacks((prev) => new Set([...prev, "bridge_fee"]));
      } else {
        setActiveFallbacks((prev) => new Set([...prev, "general"]));
      }
    }
  };

  const handleWalletChange = (
    address: string | null,
    signer?: ethers.Signer
  ) => {
    setWalletAddress(address);
    setWalletSigner(signer || null);

    if (address && signer) {
      addLog(
        "success",
        `Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`
      );
      } else {
      setBalance(null);
      addLog("info", "Wallet disconnected");
    }
  };


  useEffect(() => {
    if (sdk && walletSigner) {
      try {
        const compatibleSigner = ensureV5Compatibility(walletSigner);
        sdk.setSignerForAllChains(compatibleSigner);
        addLog(
          "info",
          "Added wallet signer to existing SDK for all supported chains"
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        addLog("error", `Failed to set signer on SDK: ${errorMessage}`);
      }
    }
  }, [walletSigner, sdk]);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        if (data.ethereum?.usd) {
          setEthPrice(data.ethereum.usd);
          addLog("info", `ETH price updated: $${data.ethereum.usd}`);
        }
      } catch (error) {
        console.warn('Failed to fetch ETH price, using fallback:', error);
        addLog("info", "Using fallback ETH price: $2400");
      }
    };

    fetchEthPrice();
    // Update price every 2 minutes
    const interval = setInterval(fetchEthPrice, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadBalance = async () => {
      if (!sdk) {
        setIsLoadingBalance(false);
        return;
      }

      if (!walletAddress) {
        addLog("error", "Wallet connection required");
        toast({
          title: "🔗 Wallet Required",
          description: "Please connect your wallet to use GasFlow SDK",
          variant: "destructive",
          duration: 4000,
        });
        setIsLoadingBalance(false);
        return;
      }

      const userAddress = walletAddress;

      try {
        addLog("info", "Loading USDC balance across all chains...");
        const balanceData = await sdk.getUnifiedBalance(userAddress);
        setBalance(balanceData);
        
        // Debug: Log detailed balance information
        addLog("info", `💰 Balance details: Total ${balanceData.totalUSDValue.toFixed(2)} USDC`);
        balanceData.balancesByChain.forEach(chainBalance => {
          addLog("info", `  Chain ${chainBalance.chainId}: ${chainBalance.usdValue.toFixed(2)} USDC (${typeof chainBalance.balance} ${chainBalance.balance})`);
        });
        
        addLog(
          "success",
          `Loaded balance: $${balanceData.totalUSDValue.toFixed(
            2
          )} USDC across ${balanceData.balancesByChain.length} chains`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        addLog("error", `Failed to load balance: ${errorMessage}`);

        toast({
          title: "❌ Balance Loading Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 4000,
        });
      } finally {
        setIsLoadingBalance(false);
      }
    };

    if (sdk) {
      // Load initial balance
      loadBalance();

      // Set up real-time balance updates
      if (!walletAddress) return;
      const userAddress = walletAddress;
      sdk.startRealTimeBalanceUpdates(userAddress, (newBalance) => {
        setBalance(newBalance);
        addLog(
          "info",
          `Balance updated: $${newBalance.totalUSDValue.toFixed(2)} USDC`
        );
      });

      return () => {
        sdk.stopRealTimeBalanceUpdates();
      };
    }
  }, [sdk, walletAddress, toast]);

  const loadBalance = async () => {
    if (!sdk) return;
    if (!walletAddress) return;
    const userAddress = walletAddress;
    try {
      addLog("info", "Loading USDC balance across all chains...");
      
      const balanceData = await sdk.getUnifiedBalance(userAddress);
      setBalance(balanceData);
      addLog(
        "success",
        `Loaded balance: $${balanceData.totalUSDValue.toFixed(2)} USDC across ${
          balanceData.balancesByChain.length
        } chains`
      );
    } catch (error) {
      addLog("error", `Failed to load balance: ${error}`);
    }
  };

  const analyzeRoute = async () => {
    console.log("🚀 ROUTE ANALYSIS STARTED - analyzeRoute function called");
    
    if (!sdk) {
      console.log("❌ SDK not initialized");
      addLog("error", "SDK not initialized");
      return;
    }

    setIsAnalyzing(true);
    console.log("🔄 Setting isAnalyzing to true");
    
    try {
      addLog("info", "Analyzing optimal execution route...");
      if (!walletAddress) {
        addLog("error", "Wallet connection required");
        return;
      }
      const userAddress = walletAddress;
      
      console.log("🔍 Route Analysis Debug:", {
        userAddress,
        walletAddress,
        transaction,
        sdk: !!sdk
      });
      
      // Convert demo transaction to SDK transaction
      const sdkTransaction: GasFlowTransaction = {
        to: transaction.to,
        value: transaction.value, // Small amount for gas estimation
        data: transaction.data,
        gasLimit: transaction.gasLimit,
        payFromChain: transaction.payFromChain,
        maxGasCost: transaction.gasPaymentUSDC ? BigNumber.from(transaction.gasPaymentUSDC.toString()) : undefined,
        urgency: transaction.urgency,
        executeOn: transaction.executeOn,
      };

      // Add debug logging for route analysis
      addLog("info", `🔍 Starting route analysis for address: ${userAddress.slice(0,6)}...${userAddress.slice(-4)}`);
      addLog("info", `💰 Gas Budget: ${transaction.gasPaymentETH} ETH ≈ ${transaction.gasPaymentUSDC ? (Number(transaction.gasPaymentUSDC) / 1e6).toFixed(4) : '0'} USDC`);
      addLog("info", `📍 Recipient: ${transaction.to?.slice(0,6)}...${transaction.to?.slice(-4)}`);
      addLog("info", `🎯 Execute on: ${transaction.executeOn}, Pay from: ${transaction.payFromChain}, Priority: ${transaction.urgency}`);
      
      console.log("🎯 About to call sdk.estimateTransaction...");
      
      // Check balance before route analysis
      try {
        const unifiedBalance = await sdk.getUnifiedBalance(userAddress);
        const hasBalance = unifiedBalance.totalUSDC.gt(0);
        
        if (!hasBalance) {
          addLog("error", "No USDC balance found on any supported chain");
          return;
        }
        
        addLog("info", `Total USDC balance: ${ethers.formatUnits(unifiedBalance.totalUSDC.toString(), 6)} USDC`);
        
        // Validate sufficient balance for gas payment
        if (transaction.gasPaymentUSDC && unifiedBalance.totalUSDC.lt(BigNumber.from(transaction.gasPaymentUSDC.toString()))) {
          const required = (Number(transaction.gasPaymentUSDC) / 1e6).toFixed(4);
          const available = ethers.formatUnits(unifiedBalance.totalUSDC.toString(), 6);
          addLog("error", `Insufficient USDC: need ${required} USDC, have ${available} USDC`);
          return;
        }
      } catch (balanceError) {
        console.error("❌ Failed to get balance:", balanceError);
        addLog("error", `Balance check failed: ${balanceError}`);
        return;
      }
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Route analysis timed out after 60 seconds")), 60000);
      });
      
      const analysis = await Promise.race([
        sdk.estimateTransaction(sdkTransaction, userAddress),
        timeoutPromise
      ]) as RouteAnalysisType;
      
      console.log("✅ sdk.estimateTransaction completed successfully:", analysis);
      setRouteAnalysis(analysis);
      setSelectedRouteIndex(0); // Reset to recommended route
      addLog(
        "success",
        `✅ Found ${analysis.allRoutes.length} possible routes. Best route: ${analysis.recommendedExecution.reason}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addLog("error", `❌ Route analysis failed: ${errorMessage}`);
      
      // Add more detailed error information
      if (error instanceof Error) {
        addLog("error", `🔧 Error details: ${error.stack?.split('\n')[0] || error.message}`);
      }
      
      toast({
        title: "❌ Route Analysis Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executeTransaction = async () => {
    if (!routeAnalysis || !sdk) return;

    // Validate private key if in paymaster mode
    if (usePrivateKeyMode && (!demoPrivateKey || !validatePrivateKey(demoPrivateKey))) {
      addLog("error", "❌ Valid private key required for Circle Paymaster mode");
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      addLog("info", "Executing transaction with optimal route...");

      // Listen for transaction updates
      sdk.on("onTransactionUpdate", (update) => {
        addLog("info", `Transaction status: ${update.status}`);
      });

      if (!walletAddress || !walletSigner) {
        throw new Error("Wallet connection required");
      }
      const userAddress = walletAddress;

      // Convert signer to v5 compatibility for SDK execution
      const compatibleSigner = walletSigner
        ? ensureV5Compatibility(walletSigner)
        : null;

      // Create transaction with selected route  
      const selectedRoute = routeAnalysis.allRoutes[selectedRouteIndex];
      const routeSpecificTransaction: GasFlowTransaction = {
        to: transaction.to, // Use recipient from form
        value: transaction.value, // Small transaction value for gas estimation
        data: transaction.data,
        gasLimit: transaction.gasLimit,
        executeOn: selectedRoute.executeOnChain,
        payFromChain: selectedRoute.payFromChain === selectedRoute.executeOnChain ? 'auto' : selectedRoute.payFromChain,
        maxGasCost: transaction.gasPaymentUSDC ? BigNumber.from(transaction.gasPaymentUSDC.toString()) : undefined,
        urgency: transaction.urgency,
      };

      addLog("info", `Executing on ${CHAIN_NAMES[selectedRoute.executeOnChain]} using USDC from ${CHAIN_NAMES[selectedRoute.payFromChain]}`);

      // Log execution path being taken
      if (usePrivateKeyMode && demoPrivateKey) {
        addLog("info", "🏦 Using Circle Paymaster v0.8 (USDC gas payment)");
        addLog("info", `💰 Gas will be paid from USDC balance`);
      } else {
        const nativeToken = CHAIN_NAMES[selectedRoute.executeOnChain]?.includes('Ethereum') ? 'ETH' : 
                           CHAIN_NAMES[selectedRoute.executeOnChain]?.includes('Arbitrum') ? 'ETH' :
                           CHAIN_NAMES[selectedRoute.executeOnChain]?.includes('Base') ? 'ETH' :
                           CHAIN_NAMES[selectedRoute.executeOnChain]?.includes('Avalanche') ? 'AVAX' : 'MATIC';
        addLog("info", "🔗 Using Traditional execution (native token gas)");
        addLog("info", `💰 Gas will be paid with ${nativeToken} from MetaMask`);
      }

      // Use private key for paymaster mode, signer for traditional mode
      const result = await sdk.execute(
        routeSpecificTransaction,
        userAddress,
        usePrivateKeyMode && demoPrivateKey ? demoPrivateKey : undefined,
        compatibleSigner
      );
      
      // Log execution mode used
      if (usePrivateKeyMode && demoPrivateKey) {
        addLog("info", "🏦 Executed with Circle Paymaster (USDC gas payment)");
      } else {
        addLog("info", "🔗 Executed with traditional gas payment (ETH gas)");
      }
      setExecutionResult(result);
      addLog(
        "success",
        `✅ Transaction successful! Total cost: $${(
          Number(result.totalCostUSDC) / 1e6
        ).toFixed(4)} USDC`
      );

      // Reload balance after successful transaction
      await loadBalance();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addLog("error", `Execution failed: ${errorMessage}`);
      
      // Check for network-related errors and provide appropriate UX
      if (errorMessage.includes("Network mismatch") && errorMessage.includes("Please switch wallet network")) {
        const requiredChainMatch = errorMessage.match(/but CCTP transfer requires chain (\d+)/);
        const requiredChainId = requiredChainMatch ? parseInt(requiredChainMatch[1]) : null;
        
        if (requiredChainId) {
          toast({
            title: "🔗 Network Switch Required",
            description: (
              <div className="space-y-2">
                <p>{errorMessage}</p>
                <button
                  onClick={async () => {
                    try {
                      await switchChain(requiredChainId);
                      addLog("info", `✅ Switched to chain ${requiredChainId}`);
                      toast({
                        title: "✅ Network Switched",
                        description: `Connected to chain ${requiredChainId}. You can now retry the transaction.`,
                        duration: 3000,
                      });
                    } catch (switchError) {
                      addLog("error", `Failed to switch network: ${switchError}`);
                    }
                  }}
                  className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Switch to Chain {requiredChainId}
                </button>
              </div>
            ),
            variant: "destructive",
            duration: 10000,
          });
        } else {
          toast({
            title: "❌ Transaction Failed",
            description: errorMessage,
            variant: "destructive",
            duration: 5000,
          });
        }
      } else if (errorMessage.includes("network changed") && errorMessage.includes("NETWORK_ERROR")) {
        // Handle ethers v6 network change error - prompt user to refresh
        toast({
          title: "🔄 Page Refresh Required",
          description: (
            <div className="space-y-2">
              <p>Network was changed and the signer needs to be reinitialized.</p>
              <button
                onClick={() => window.location.reload()}
                className="w-full mt-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          ),
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({
          title: "❌ Transaction Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    addLog(
      "info",
      "🎪 GasFlow SDK Demo Hub initialized - Ready for development!"
    );
  }, []);

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-success";
      case "error":
        return "text-destructive";
      default:
        return "text-info";
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-bg)" }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gradient bg-gradient-primary">
            GasFlow SDK Demo
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience seamless cross-chain transactions with Circle CCTP integration.
            Pay gas fees with USDC across multiple chains.
          </p>

          <div className="text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Connected to Circle CCTP
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="mb-8">
          <WalletConnect onWalletChange={handleWalletChange} />
        </div>

        {/* Wallet Connection Required Alert */}
        {!walletAddress && (
          <Card className="p-6 mb-8 text-center border-info bg-info-bg">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Info className="h-5 w-5 text-info" />
                <h3 className="font-semibold text-info">
                  Wallet Connection Required
                </h3>
              </div>
              <p className="text-info-foreground/80 text-gray-700">
                Connect your wallet to use GasFlow SDK with real Circle CCTP.
                You'll need testnet ETH and USDC tokens to test functionality.
              </p>
              <Button
                variant="outline"
                onClick={() => setShowNetworkHelper(true)}
                className="border-info text-info hover:bg-info/10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Setup Testnets
              </Button>
            </div>
          </Card>
        )}

        {/* Fallback Warnings */}
        {activeFallbacks.size > 0 && (
          <div className="mb-6">
            {Array.from(activeFallbacks).map((fallbackType) => (
              <FallbackWarning key={fallbackType} type={fallbackType as 'gas_estimation' | 'fast_transfer' | 'bridge_fee' | 'general'} />
            ))}
          </div>
        )}

        {/* Execution Mode Toggle */}
        {walletAddress && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Gas Payment Mode</h4>
                <p className="text-sm text-muted-foreground">
                  {usePrivateKeyMode 
                    ? "Circle Paymaster: Pay gas with USDC (requires private key)"
                    : "Traditional: Pay gas with native tokens (MetaMask)"
                  }
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant={usePrivateKeyMode ? "outline" : "default"}
                  size="sm"
                  onClick={() => setUsePrivateKeyMode(false)}
                >
                  MetaMask Mode
                </Button>
                <Button
                  variant={usePrivateKeyMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUsePrivateKeyMode(true)}
                >
                  Paymaster Mode
                </Button>
              </div>
            </div>
            
            {usePrivateKeyMode && (
              <div className="mt-4">
                <Label htmlFor="privateKey">Demo Private Key (Testnet Only)</Label>
                <Input
                  id="privateKey"
                  type="password"
                  placeholder="0x..."
                  value={demoPrivateKey}
                  onChange={(e) => setDemoPrivateKey(e.target.value)}
                  className={`mt-2 ${
                    demoPrivateKey && !validatePrivateKey(demoPrivateKey) 
                      ? "border-red-500 focus:border-red-500" 
                      : ""
                  }`}
                />
                {demoPrivateKey && !validatePrivateKey(demoPrivateKey) && (
                  <p className="text-xs text-red-600 mt-1">
                    ❌ Invalid private key format. Must be 64 hex characters with 0x prefix.
                  </p>
                )}
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Only use testnet private keys. This enables Circle Paymaster for USDC gas payment.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Main Demo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Balance View */}
          <BalanceView
            balance={balance}
            isLoading={isLoadingBalance}
            userAddress={walletAddress || ""}
          />

          {/* Transaction Form */}
          <TransactionForm
            transaction={transaction}
            onChange={setTransaction}
            onAnalyze={analyzeRoute}
            onExecute={executeTransaction}
            isExecuting={isExecuting}
            isAnalyzing={isAnalyzing}
            hasRouteAnalysis={!!routeAnalysis}
            walletAddress={walletAddress}
            balance={balance}
            ethPrice={ethPrice}
          />
        </div>

        {/* Route Analysis */}
        {routeAnalysis && (
          <div className="mb-8">
            <RouteAnalysis 
              analysis={routeAnalysis} 
              selectedRouteIndex={selectedRouteIndex}
              onRouteSelect={setSelectedRouteIndex}
            />
          </div>
        )}

        {/* Transaction Status */}
        {executionResult && (
          <div className="mb-8">
            <TransactionStatus result={executionResult} />
          </div>
        )}

        {/* Transaction Log */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Transaction Log</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs.slice(-10).map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded text-sm ${
                  log.type === "error"
                    ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    : log.type === "success"
                    ? "bg-green-50 text-green-700 dark:bg-[rgb(28,28,28)] dark:text-green-400"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                }`}
              >
                <span className="text-xs text-gray-500 mr-2">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                {log.message}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No transactions yet. Start by analyzing a route!
              </div>
            )}
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-muted-foreground text-sm">
          GasFlow SDK Demo - Connected to Circle CCTP
        </div>
      </div>

      {/* Network Helper Modal */}
      {showNetworkHelper && (
        <NetworkHelper
          currentChainId={walletAddress ? undefined : null}
          onClose={() => setShowNetworkHelper(false)}
        />
      )}
    </div>
  );
};

export default Index;
