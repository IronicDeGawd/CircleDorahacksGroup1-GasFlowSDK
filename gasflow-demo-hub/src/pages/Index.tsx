import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WalletConnect } from "@/components/WalletConnect";
import { BalanceView } from "@/components/BalanceView";
import { TransactionForm } from "@/components/TransactionForm";
import { RouteAnalysis } from "@/components/RouteAnalysis";
import { TransactionStatus } from "@/components/TransactionStatus";
import { NetworkHelper } from "@/components/NetworkHelper";
import FallbackWarning from "@/components/FallbackWarning";
import { Settings, Info, AlertCircle } from "lucide-react";
import { GasFlowSDK } from "@gasflow/sdk";
import {
  UnifiedBalance,
  GasFlowTransaction,
  RouteAnalysis as RouteAnalysisType,
  GasFlowResult,
} from "../types";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { ensureV5Compatibility } from "../utils/signerAdapter";

// Demo fallback data - only used in mock mode
const DEMO_USER_ADDRESS =
  import.meta.env.DEMO_USER_ADDRESS ||
  "0x1A00D9a88fC5ccF7a52E268307F98739f770A956";

interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error";
}

const Index = () => {
  const { toast } = useToast();

  // Check if we can use production SDK by default
  const canUseProduction = (() => {
    try {
      const apiKey = import.meta.env.VITE_CIRCLE_API_KEY;
      return apiKey && apiKey !== "your_api_key:your_entity_id:your_secret";
    } catch (error) {
      console.error("Error checking API key:", error);
      return false;
    }
  })();

  const [useTestnetMode, setUseTestnetMode] = useState(canUseProduction);
  const [sdk, setSdk] = useState<GasFlowSDK | null>(null);

  // Initialize SDK immediately for local mode, wait for wallet for testnet mode
  useEffect(() => {
    if (!useTestnetMode) {
      // Initialize local SDK immediately
      try {
        const localSDK = new GasFlowSDK({
          apiKey: "demo_mode",
          supportedChains: [11155111, 421614, 84532, 43113, 80002],
          useProductionCCTP: false,
        });
        setSdk(localSDK);
        addLog(
          "success",
          "🎭 GasFlow SDK initialized in demo mode with mock services"
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        addLog("error", `Failed to initialize demo SDK: ${errorMessage}`);
      }
    }
  }, [useTestnetMode]);
  const [balance, setBalance] = useState<UnifiedBalance | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletSigner, setWalletSigner] = useState<ethers.Signer | null>(null);
  const [transaction, setTransaction] = useState<GasFlowTransaction>({
    to: "0x1A00D9a88fC5ccF7a52E268307F98739f770A956",
    value: undefined,
    data: "0x",
    executeOn: "optimal",
    payFromChain: "auto",
    urgency: "medium",
  });
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysisType | null>(
    null
  );
  const [executionResult, setExecutionResult] = useState<GasFlowResult | null>(
    null
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  const addLog = (type: "info" | "success" | "error", message: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: new Date() }]);

    // Track fallback usage based on log messages
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
      // Signer will be added to SDK automatically via useEffect
    } else {
      setBalance(null);
      addLog("info", "Wallet disconnected");
    }
  };

  // Handle testnet SDK initialization - only when mode changes
  useEffect(() => {
    if (useTestnetMode) {
      const initializeTestnetSDK = () => {
        try {
          addLog("info", "Switching to testnet mode with real Circle CCTP...");
          const apiKey = import.meta.env.VITE_CIRCLE_API_KEY;
          if (!apiKey || apiKey === "your_api_key:your_entity_id:your_secret") {
            throw new Error(
              "Circle API key not configured. Please set VITE_CIRCLE_API_KEY in your .env file."
            );
          }

          // Initialize SDK without signers first - signers will be added when wallet connects
          const realSDK = new GasFlowSDK({
            apiKey,
            supportedChains: [11155111, 421614, 84532, 43113, 80002],
            useProductionCCTP: true,
            signers: undefined, // Don't pass signers during initialization
          });
          setSdk(realSDK);
          addLog("success", "GasFlow SDK initialized with testnet Circle CCTP");
          addLog("info", "Signers will be added when wallet connects");
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          addLog("error", `Failed to initialize testnet SDK: ${errorMessage}`);

          toast({
            title: "❌ SDK Initialization Failed",
            description: errorMessage,
            variant: "destructive",
            duration: 5000,
          });
        }
      };

      initializeTestnetSDK();
    }
  }, [useTestnetMode, toast]); // Removed walletSigner from dependencies

  // Handle adding signer to existing testnet SDK when wallet connects
  useEffect(() => {
    if (useTestnetMode && sdk && walletSigner) {
      try {
        // Add signer to existing SDK
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
  }, [walletSigner, useTestnetMode, sdk]);

  useEffect(() => {
    const loadBalance = async () => {
      if (!sdk) {
        setIsLoadingBalance(false);
        return;
      }

      const userAddress = walletAddress || DEMO_USER_ADDRESS;

      if (!walletAddress) {
        addLog(
          "info",
          `🎭 [DEMO] Using demo address: ${DEMO_USER_ADDRESS.slice(
            0,
            6
          )}...${DEMO_USER_ADDRESS.slice(-4)}`
        );
      }

      if (useTestnetMode && !walletAddress) {
        addLog("error", "Wallet connection required for testnet mode");
        toast({
          title: "🔗 Wallet Required",
          description: "Please connect your wallet to use testnet mode",
          variant: "destructive",
          duration: 4000,
        });
        setIsLoadingBalance(false);
        return;
      }

      try {
        addLog("info", "Loading USDC balance across all chains...");
        const balanceData = await sdk.getUnifiedBalance(userAddress);
        setBalance(balanceData);
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
      const userAddress = walletAddress || DEMO_USER_ADDRESS;
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
  }, [sdk, walletAddress, useTestnetMode, toast]);

  const loadBalance = async () => {
    if (!sdk) return;

    const userAddress = walletAddress || DEMO_USER_ADDRESS;
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
    if (!sdk) {
      addLog("error", "SDK not initialized");
      return;
    }

    setIsAnalyzing(true);
    try {
      addLog("info", "Analyzing optimal execution route...");
      const userAddress = walletAddress || DEMO_USER_ADDRESS;
      const analysis = await sdk.estimateTransaction(transaction, userAddress);
      setRouteAnalysis(analysis);
      addLog(
        "success",
        `Found ${analysis.allRoutes.length} possible routes. Best route: ${analysis.recommendedExecution.reason}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addLog("error", `Route analysis failed: ${errorMessage}`);
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

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      addLog("info", "Executing transaction with optimal route...");

      // Listen for transaction updates
      sdk.on("onTransactionUpdate", (update) => {
        addLog("info", `Transaction status: ${update.status}`);
      });

      const userAddress = walletAddress || DEMO_USER_ADDRESS;

      if (useTestnetMode && !walletSigner) {
        throw new Error("Wallet connection required for testnet mode");
      }

      // Convert signer to v5 compatibility for SDK execution
      const compatibleSigner = walletSigner
        ? ensureV5Compatibility(walletSigner)
        : null;
      const result = await sdk.execute(
        transaction,
        userAddress,
        compatibleSigner
      );
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
      toast({
        title: "❌ Transaction Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
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
        <div className="text-center mb-12">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            GasFlow SDK Demo
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Experience cross-chain gas payments using USDC and Circle CCTP. Pay
            for transactions on any chain using USDC from your preferred
            network.
          </p>

          {/* SDK Mode Toggle */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <Label htmlFor="sdk-mode" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              SDK Mode:
            </Label>
            <div className="flex items-center gap-2">
              <span
                className={
                  !useTestnetMode ? "font-medium" : "text-muted-foreground"
                }
              >
                Local
              </span>
              <Switch
                id="sdk-mode"
                checked={useTestnetMode}
                onCheckedChange={setUseTestnetMode}
              />
              <span
                className={
                  useTestnetMode ? "font-medium" : "text-muted-foreground"
                }
              >
                Testnet
              </span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {useTestnetMode ? (
              <div className="flex items-center justify-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Testnet mode uses real Circle CCTP on testnets
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1">
                <Info className="h-4 w-4" />
                Local mode uses GasFlow SDK with local simulation
              </div>
            )}
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="mb-8">
          <WalletConnect onWalletChange={handleWalletChange} />
        </div>

        {/* Testnet Mode Alert */}
        {useTestnetMode && !walletAddress && (
          <Card className="p-6 mb-8 text-center border-info bg-info-bg">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Info className="h-5 w-5 text-info" />
                <h3 className="font-semibold text-info">
                  Testnet Mode Setup Required
                </h3>
              </div>
              <p className="text-info-foreground/80 text-gray-700">
                To use testnet mode, connect your wallet and ensure you have
                testnet setup completed. You'll need testnet ETH and USDC tokens
                to test real functionality.
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
              <FallbackWarning key={fallbackType} type={fallbackType as any} />
            ))}
          </div>
        )}

        {/* Main Demo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Balance View */}
          <BalanceView
            balance={balance}
            isLoading={isLoadingBalance}
            userAddress={walletAddress || DEMO_USER_ADDRESS}
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
          />
        </div>

        {/* Route Analysis */}
        {routeAnalysis && (
          <div className="mb-8">
            <RouteAnalysis analysis={routeAnalysis} />
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
                    ? "bg-red-50 text-red-700"
                    : log.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-blue-50 text-blue-700"
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
          GasFlow SDK Demo - {useTestnetMode ? "Testnet Mode" : "Local Mode"}
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
