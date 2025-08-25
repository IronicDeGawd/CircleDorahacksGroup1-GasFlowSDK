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
import { AlertCircle, Zap, Send, Search } from "lucide-react";
import { GasFlowTransaction, ChainId, CHAIN_NAMES } from "../types";

interface TransactionFormProps {
  transaction: GasFlowTransaction;
  onChange: (transaction: GasFlowTransaction) => void;
  onAnalyze: () => void;
  onExecute: () => void;
  isExecuting: boolean;
  isAnalyzing?: boolean;
  hasRouteAnalysis: boolean;
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

export function TransactionForm({
  transaction,
  onChange,
  onAnalyze,
  onExecute,
  isExecuting,
  isAnalyzing = false,
  hasRouteAnalysis,
}: TransactionFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ethValue, setEthValue] = useState<string>(""); // Local state for ETH input

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!transaction.to) {
      newErrors.to = "Recipient address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(transaction.to)) {
      newErrors.to = "Invalid Ethereum address format";
    }

    if (!transaction.value || Number(transaction.value) <= 0) {
      newErrors.value = "Value must be greater than 0";
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

  const updateTransaction = (field: keyof GasFlowTransaction, value: any) => {
    onChange({ ...transaction, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleEthValueChange = (value: string) => {
    setEthValue(value);

    // Update transaction with BigInt value
    if (value && !isNaN(parseFloat(value))) {
      const weiValue = BigInt(Math.floor(parseFloat(value) * 1e18));
      updateTransaction("value", weiValue);
    } else {
      updateTransaction("value", undefined);
    }
  };

  // Initialize ETH value from transaction.value on mount
  React.useEffect(() => {
    if (transaction.value) {
      setEthValue((Number(transaction.value) / 1e18).toString());
    }
  }, [transaction.value]);

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

        {/* Value */}
        <div className="space-y-2">
          <Label htmlFor="value">Value (ETH)</Label>
          <Input
            id="value"
            type="number"
            step="0.001"
            min="0"
            placeholder="0.1"
            value={ethValue}
            onChange={(e) => handleEthValueChange(e.target.value)}
            className={errors.value ? "border-destructive" : ""}
          />
          {errors.value && (
            <div className="flex items-center gap-1 text-destructive text-sm">
              <AlertCircle className="h-3 w-3" />
              {errors.value}
            </div>
          )}
        </div>

        {/* Execute On Chain */}
        <div className="space-y-2">
          <Label>Execute On</Label>
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
          <Label>Pay From</Label>
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

        {/* Smart Execution Info */}
        <div className="p-4 bg-info-bg border border-info/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-info mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-info">Smart Execution</div>
              <div className="text-info-foreground/80 text-gray-700 mt-1">
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
