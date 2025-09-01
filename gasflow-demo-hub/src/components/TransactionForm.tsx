import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Zap, Send, Search, Clock, Gauge } from "lucide-react";
import { DemoGasFlowTransaction, ChainId, CHAIN_NAMES, UnifiedBalance } from "../types";
import { z } from "zod";

// Zod validation schema
const createTransactionSchema = (balance?: UnifiedBalance) => z.object({
  to: z.string()
    .min(1, "Recipient address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format"),
  gasPaymentETH: z.string()
    .min(1, "Gas payment amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Must be a positive number"),
  gasPaymentUSDC: z.bigint().optional(),
}).refine((data) => {
  if (!data.gasPaymentUSDC || !balance) return true;
  
  const requiredUSDC = data.gasPaymentUSDC;
  const availableUSDC = balance.totalUSDC;
  
  return requiredUSDC <= availableUSDC;
}, {
  message: "Insufficient USDC balance for this gas payment amount",
  path: ["gasPaymentETH"],
});

interface TransactionFormProps {
  transaction: DemoGasFlowTransaction;
  onChange: (transaction: DemoGasFlowTransaction) => void;
  onAnalyze: () => void;
  onExecute: () => void;
  isExecuting: boolean;
  isAnalyzing?: boolean;
  hasRouteAnalysis: boolean;
  walletAddress?: string | null;
  balance?: UnifiedBalance | null;
  ethPrice?: number;
}

const CHAINS = [
  { id: 11155111, name: "Ethereum Sepolia", symbol: "ETH" },
  { id: 421614, name: "Arbitrum Sepolia", symbol: "ETH" },
  { id: 84532, name: "Base Sepolia", symbol: "ETH" },
  { id: 43113, name: "Avalanche Fuji", symbol: "AVAX" },
  { id: 80002, name: "Polygon Amoy", symbol: "MATIC" },
];

const URGENCY_LEVELS = [
  {
    value: "low",
    label: "Low Priority",
    description: "Lowest fees, longer execution",
  },
  {
    value: "medium",
    label: "Medium Priority",
    description: "Balanced fees and speed",
  },
  {
    value: "high",
    label: "High Priority",
    description: "Higher fees, faster execution",
  },
];

const TRANSFER_MODES = [
  {
    value: "auto",
    label: "Auto Select",
    description: "Automatically choose best mode",
    icon: Zap,
    timing: "Optimized",
  },
  {
    value: "fast",
    label: "Fast Transfer",
    description: "8-30 seconds, higher fees",
    icon: Gauge,
    timing: "8-30s",
  },
  {
    value: "standard",
    label: "Standard Transfer", 
    description: "2-19 minutes, lower fees",
    icon: Clock,
    timing: "2-19m",
  },
];

export function TransactionForm({
  transaction,
  onChange,
  onAnalyze,
  onExecute,
  isExecuting,
  isAnalyzing = false,
  hasRouteAnalysis,
  walletAddress,
  balance,
  ethPrice = 2400, // Fallback ETH price
}: TransactionFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sendAmountValue, setSendAmountValue] = useState<string>(""); // Local state for send amount
  const [gasBudgetValue, setGasBudgetValue] = useState<string>(""); // Local state for gas budget

  // Auto-fill recipient with connected wallet address
  React.useEffect(() => {
    if (walletAddress && !transaction.to) {
      onChange({ ...transaction, to: walletAddress });
    }
  }, [walletAddress]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!transaction.to) {
      newErrors.to = "Recipient address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(transaction.to)) {
      newErrors.to = "Invalid Ethereum address format";
    }

    // Validate send amount
    if (!transaction.sendAmountETH || Number(transaction.sendAmountETH) <= 0) {
      newErrors.sendAmountETH = "Send amount must be greater than 0";
    }

    // Validate gas budget
    const gasAmount = gasBudgetValue || transaction.gasPaymentETH;
    if (!gasAmount || Number(gasAmount) <= 0) {
      newErrors.gasPaymentETH = "Gas budget must be greater than 0";
    }

    // Validate USDC balance if available
    if (balance && transaction.gasPaymentUSDC) {
      const requiredUSDC = transaction.gasPaymentUSDC;
      const availableUSDC = balance.totalUSDC;
      
      if (requiredUSDC > availableUSDC) {
        const requiredFormatted = (Number(requiredUSDC) / 1e6).toFixed(6);
        const availableFormatted = (Number(availableUSDC) / 1e6).toFixed(6);
        newErrors.gasPaymentETH = `Insufficient USDC. Need ${requiredFormatted} USDC, have ${availableFormatted} USDC`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAnalyzeRoute = () => {
    if (validateForm()) {
      onAnalyze();
    }
  };

  const handleExecuteTransaction = () => {
    if (validateForm()) {
      onExecute();
    }
  };

  const updateTransaction = (field: keyof DemoGasFlowTransaction, value: any) => {
    onChange({ ...transaction, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleSendAmountChange = (value: string) => {
    setSendAmountValue(value);
    updateTransaction("sendAmountETH", value);
    
    if (value && !isNaN(parseFloat(value))) {
      // Convert send amount to wei for the actual transaction
      const weiValue = BigInt(Math.floor(parseFloat(value) * 1e18));
      updateTransaction("value", weiValue);
    } else {
      updateTransaction("value", undefined);
    }
  };

  const handleGasBudgetChange = (value: string) => {
    setGasBudgetValue(value);
    updateTransaction("gasPaymentETH", value);
    
    if (value && !isNaN(parseFloat(value))) {
      // Convert ETH gas budget to USDC using current ETH price
      const ethAmount = parseFloat(value);
      const usdValue = ethAmount * ethPrice; // ETH amount * ETH price = USD value
      const usdcAmount = BigInt(Math.floor(usdValue * 1e6)); // Convert to USDC (6 decimals)
      
      updateTransaction("gasPaymentUSDC", usdcAmount);
    } else {
      updateTransaction("gasPaymentUSDC", undefined);
    }
  };

  // Initialize values from transaction on mount
  React.useEffect(() => {
    if (transaction.sendAmountETH) {
      setSendAmountValue(transaction.sendAmountETH);
    }
    if (transaction.gasPaymentETH) {
      setGasBudgetValue(transaction.gasPaymentETH);
    }
  }, [transaction.sendAmountETH, transaction.gasPaymentETH]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Create Transaction</h3>

      <div className="space-y-6">
        {/* To Address */}
        <div className="space-y-2">
          <Label htmlFor="to">To Address</Label>
          <Input
            id="to"
            placeholder="0x..."
            value={transaction.to}
            onChange={(e) => updateTransaction("to", e.target.value)}
            className={errors.to ? "border-destructive" : ""}
          />
          {errors.to && (
            <div className="flex items-center gap-1 text-destructive text-sm">
              <AlertCircle className="h-3 w-3" />
              {errors.to}
            </div>
          )}
        </div>

        {/* Send Amount */}
        <div className="space-y-2">
          <Label htmlFor="sendAmount">Amount to Send (ETH)</Label>
          <Input
            id="sendAmount"
            type="number"
            step="0.001"
            min="0"
            placeholder="0.001"
            value={sendAmountValue}
            onChange={(e) => handleSendAmountChange(e.target.value)}
            className={errors.sendAmountETH ? "border-destructive" : ""}
          />
          <div className="text-xs text-muted-foreground">
            This ETH amount will be sent to the recipient address
          </div>
          {errors.sendAmountETH && (
            <div className="flex items-center gap-1 text-destructive text-sm">
              <AlertCircle className="h-3 w-3" />
              {errors.sendAmountETH}
            </div>
          )}
        </div>

        {/* Max Gas Budget */}
        <div className="space-y-2">
          <Label htmlFor="gasBudget">Max Gas Budget (ETH equivalent)</Label>
          <Input
            id="gasBudget"
            type="number"
            step="0.001"
            min="0"
            placeholder="0.01"
            value={gasBudgetValue}
            onChange={(e) => handleGasBudgetChange(e.target.value)}
            className={errors.gasPaymentETH ? "border-destructive" : ""}
          />
          {transaction.gasPaymentUSDC && (
            <div className="text-xs text-muted-foreground">
              ≈ {(Number(transaction.gasPaymentUSDC) / 1e6).toFixed(4)} USDC budget (@ ${ethPrice}/ETH)
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Maximum USDC you're willing to spend on gas fees for this transaction
          </div>
          {errors.gasPaymentETH && (
            <div className="flex items-center gap-1 text-destructive text-sm">
              <AlertCircle className="h-3 w-3" />
              {errors.gasPaymentETH}
            </div>
          )}
        </div>

        {/* Execute On Chain */}
        <div className="space-y-2">
          <Label>Execute On</Label>
          <div className="text-xs text-amber-600 mb-2">
            ⚠️ You need {
              typeof transaction.executeOn === "number" 
                ? (transaction.executeOn === 11155111 ? "ETH" :
                   transaction.executeOn === 421614 ? "ETH" :
                   transaction.executeOn === 84532 ? "ETH" :
                   transaction.executeOn === 43113 ? "AVAX" :
                   transaction.executeOn === 80002 ? "MATIC" : "native tokens")
                : "native tokens"
            } on the destination chain for CCTP minting gas fees
          </div>
          <Select
            value={
              typeof transaction.executeOn === "number"
                ? transaction.executeOn.toString()
                : transaction.executeOn || ""
            }
            onValueChange={(value) =>
              updateTransaction(
                "executeOn",
                value === "optimal" ? "optimal" : parseInt(value)
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select execution chain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="optimal">
                <div className="flex items-center gap-2">
                  <span>Optimal Chain</span>
                  <Badge variant="secondary" className="text-xs">
                    AUTO
                  </Badge>
                </div>
              </SelectItem>
              {CHAINS.map((chain) => (
                <SelectItem key={chain.id} value={chain.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{chain.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {chain.symbol}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pay From Chain */}
        <div className="space-y-2">
          <Label>Send USDC From</Label>
          <Select
            value={
              typeof transaction.payFromChain === "number"
                ? transaction.payFromChain.toString()
                : transaction.payFromChain || ""
            }
            onValueChange={(value) =>
              updateTransaction(
                "payFromChain",
                value === "auto" ? "auto" : parseInt(value)
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment chain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                <div className="flex items-center gap-2">
                  <span>Best Balance</span>
                  <Badge variant="secondary" className="text-xs">
                    AUTO
                  </Badge>
                </div>
              </SelectItem>
              {CHAINS.map((chain) => (
                <SelectItem key={chain.id} value={chain.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{chain.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {chain.symbol}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Urgency Level */}
        <div className="space-y-2">
          <Label>Priority Level</Label>
          <Select
            value={transaction.urgency}
            onValueChange={(value) =>
              updateTransaction("urgency", value as "low" | "medium" | "high")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {URGENCY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  <div className="space-y-1">
                    <div className="font-medium">{level.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {level.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transfer Mode */}
        <div className="space-y-2">
          <Label>Cross-Chain Transfer Mode</Label>
          <Select
            value={transaction.transferMode || "auto"}
            onValueChange={(value) =>
              updateTransaction("transferMode", value as "auto" | "fast" | "standard")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSFER_MODES.map((mode) => {
                const IconComponent = mode.icon;
                return (
                  <SelectItem key={mode.value} value={mode.value}>
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-4 w-4" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{mode.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {mode.timing}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mode.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">
            Controls speed and fees for cross-chain USDC transfers via Circle CCTP
          </div>
        </div>

        {/* Smart Execution Info */}
        <div className="p-4 bg-info-bg border border-info/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-info mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-info">Smart Execution</div>
              <div className="text-info-foreground/80 !text-gray-700 mt-1">
                GasFlow will automatically find the most cost-effective route
                for your transaction, potentially using cross-chain bridges to
                optimize gas costs.
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleAnalyzeRoute}
            disabled={isExecuting || isAnalyzing}
            className="flex-1"
          >
            {isAnalyzing ? (
              <>
                <Search className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Analyze Route
              </>
            )}
          </Button>

          <Button
            onClick={handleExecuteTransaction}
            disabled={!hasRouteAnalysis || isExecuting || isAnalyzing}
            className="flex-1"
          >
            {isExecuting ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Execute Transaction
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
