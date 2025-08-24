import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import DraggableWindow from "@/components/DraggableWindow";
import {
  FileText,
  Code2,
  Database,
  Settings,
  Zap,
  Shield,
  Coins,
  ArrowUpDown,
  Search,
  Globe,
  Copy,
  Route,
  CreditCard,
  Menu,
  X,
} from "lucide-react";

interface WindowData {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  position: { x: number; y: number };
}

interface APIFunction {
  name: string;
  icon: React.ReactNode;
  category: string;
  description: string;
  content: React.ReactNode;
}

const Documentation = () => {
  const [openWindows, setOpenWindows] = useState<WindowData[]>([]);
  const [windowCounter, setWindowCounter] = useState(0);
  const [focusedWindow, setFocusedWindow] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(!window.innerWidth < 768);
  const { toast } = useToast();

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const apiFunctions: APIFunction[] = [
    {
      name: "new GasFlowSDK()",
      icon: <Settings className="h-4 w-4" />,
      category: "Core",
      description: "Initialize the GasFlow SDK with Circle CCTP V2 integration",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Initialize a new GasFlow SDK instance with Circle API integration
              and cross-chain capabilities.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Syntax</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`import { GasFlowSDK } from '@gasflow/sdk';

const gasFlow = new GasFlowSDK({
  apiKey: 'your-circle-api-key',
  supportedChains: [11155111, 421614, 84532, 43113, 80002],
  useProductionCCTP: true,  // Enable real Circle contracts
  signers: signerMap        // Wallet signers for each chain
});`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Parameters</h4>
            <ul className="text-sm space-y-2">
              <li>
                <code className="text-xs bg-muted px-1 rounded">apiKey</code> -
                Your Circle API key from developers.circle.com
              </li>
              <li>
                <code className="text-xs bg-muted px-1 rounded">
                  supportedChains
                </code>{" "}
                - Array of chain IDs (testnet or mainnet)
              </li>
              <li>
                <code className="text-xs bg-muted px-1 rounded">
                  useProductionCCTP
                </code>{" "}
                - Enable real Circle CCTP contracts
              </li>
              <li>
                <code className="text-xs bg-muted px-1 rounded">signers</code> -
                Map of wallet signers for transaction signing
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      name: "gasFlow.estimateTransaction()",
      icon: <Route className="h-4 w-4" />,
      category: "Core",
      description: "Analyze optimal routes for cross-chain gas payments",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze transaction costs and find the most cost-effective
              execution route across supported chains.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Example</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`const analysis = await gasFlow.estimateTransaction({
  to: '0x742C7f0f6b6d43A35556D5F7FAF7a93AC8c3b7B8',
  data: '0x',
  executeOn: 'optimal',  // or specific chain ID
  payFromChain: 'auto',  // or specific chain ID
  urgency: 'medium'
}, userAddress);

console.log(\`Best route: \${analysis.recommendedExecution.reason}\`);
console.log(\`Total cost: \${analysis.bestRoute.totalCost} USDC\`);`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Return Value</h4>
            <p className="text-sm text-muted-foreground">
              Returns RouteAnalysis with bestRoute, allRoutes, and
              recommendedExecution strategies.
            </p>
          </div>
        </div>
      ),
    },
    {
      name: "gasFlow.execute()",
      icon: <Zap className="h-4 w-4" />,
      category: "Core",
      description:
        "Execute cross-chain transactions with automated gas optimization",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Execute transactions with automatic cross-chain bridging and
              Circle Paymaster integration.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Usage</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`const result = await gasFlow.execute({
  to: '0x742C7f0f6b6d43A35556D5F7FAF7a93AC8c3b7B8',
  data: '0x',
  executeOn: 421614,    // Arbitrum Sepolia
  payFromChain: 11155111, // Ethereum Sepolia
  urgency: 'high'
}, userAddress, userPrivateKey);

console.log(\`Transaction: \${result.transactionHash}\`);
console.log(\`Cost: \${result.totalCostUSDC} USDC\`);`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Features</h4>
            <ul className="text-sm space-y-2">
              <li>• Automatic Circle CCTP bridging when needed</li>
              <li>• Real-time transaction progress updates</li>
              <li>• Circle Paymaster integration for USDC gas payments</li>
              <li>• Comprehensive error handling and retries</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      name: "gasFlow.getUnifiedBalance()",
      icon: <Coins className="h-4 w-4" />,
      category: "Balances",
      description: "Get unified USDC balance across all supported chains",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Retrieve USDC balances from all supported chains and aggregate
              them into a unified view.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Example</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`const balance = await gasFlow.getUnifiedBalance(userAddress);

console.log(\`Total USDC: \${balance.totalUSDValue}\`);
console.log(\`Chains: \${balance.balancesByChain.length}\`);

balance.balancesByChain.forEach(chain => {
  console.log(\`Chain \${chain.chainId}: \${chain.usdValue} USDC\`);
});`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Return Value</h4>
            <ul className="text-sm space-y-2">
              <li>
                <code className="text-xs bg-muted px-1 rounded">totalUSDC</code>{" "}
                - Total USDC balance (BigNumber)
              </li>
              <li>
                <code className="text-xs bg-muted px-1 rounded">
                  totalUSDValue
                </code>{" "}
                - Total USD value as number
              </li>
              <li>
                <code className="text-xs bg-muted px-1 rounded">
                  balancesByChain
                </code>{" "}
                - Per-chain balance breakdown
              </li>
              <li>
                <code className="text-xs bg-muted px-1 rounded">
                  lastUpdated
                </code>{" "}
                - Timestamp of last update
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      name: "ProductionCCTPService",
      icon: <ArrowUpDown className="h-4 w-4" />,
      category: "Classes",
      description:
        "Production Circle CCTP service for real cross-chain USDC transfers",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Class Overview</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Direct integration with Circle's CCTP V2 contracts for production
              cross-chain USDC transfers.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Example Usage</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`import { ProductionCCTPService } from '@gasflow/sdk';

const cctpService = new ProductionCCTPService(
  process.env.CIRCLE_API_KEY,
  true // useTestnet
);

// Set signer for source chain
cctpService.setSigner(11155111, ethereumSigner);

// Bridge USDC using real Circle contracts
const result = await cctpService.initiateBridge({
  amount: ethers.utils.parseUnits('10', 6), // 10 USDC
  fromChain: 11155111,  // Ethereum Sepolia
  toChain: 421614,      // Arbitrum Sepolia
  recipient: userAddress,
  useFastTransfer: true
});`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Key Features</h4>
            <ul className="text-sm space-y-2">
              <li>• Real Circle TokenMessengerV2 integration</li>
              <li>• Circle attestation service polling</li>
              <li>• Fast Transfer support when available</li>
              <li>• Comprehensive error handling and retries</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      name: "Real-time Updates",
      icon: <Globe className="h-4 w-4" />,
      category: "Integration",
      description: "Listen to transaction progress and balance updates",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Set up event listeners for real-time transaction progress and
              balance updates.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Transaction Events</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`// Listen for transaction updates
gasFlow.on('onTransactionUpdate', (update) => {
  console.log(\`Status: \${update.status}\`);
  if (update.transactionHash) {
    console.log(\`Transaction: \${update.transactionHash}\`);
  }
  if (update.bridgeTransactionHash) {
    console.log(\`Bridge: \${update.bridgeTransactionHash}\`);
  }
});`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Balance Updates</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`// Start real-time balance monitoring
gasFlow.startRealTimeBalanceUpdates(
  userAddress,
  (balance) => {
    console.log(\`Updated: \${balance.totalUSDValue} USDC\`);
  },
  30000 // 30 second interval
);

// Stop monitoring when done
gasFlow.stopRealTimeBalanceUpdates();`}
            </pre>
          </div>
        </div>
      ),
    },
    {
      name: "Contract Addresses",
      icon: <Database className="h-4 w-4" />,
      category: "Utilities",
      description:
        "Access Circle CCTP contract addresses and chain configuration",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Utility functions to get Circle CCTP contract addresses and chain
              configurations.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Usage</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`import {
  getCCTPAddresses,
  getCCTPDomain,
  isCCTPSupported
} from '@gasflow/sdk';

// Get contract addresses for a chain
const addresses = getCCTPAddresses(11155111, true); // Ethereum Sepolia testnet
console.log(\`TokenMessenger: \${addresses.tokenMessenger}\`);
console.log(\`USDC: \${addresses.usdc}\`);

// Get CCTP domain ID
const domain = getCCTPDomain(11155111); // Returns 0 for Ethereum

// Check CCTP support
const supported = isCCTPSupported(11155111); // true`}
            </pre>
          </div>
        </div>
      ),
    },
  ];

  const openWindow = (apiFunction: APIFunction) => {
    const windowId = `window-${windowCounter}`;

    // On mobile, open windows fullscreen from top-left
    // On desktop/tablet, stack windows with offset
    const position = isMobile
      ? { x: 0, y: 0 }
      : { x: 120 + windowCounter * 30, y: 120 + windowCounter * 30 };

    const newWindow: WindowData = {
      id: windowId,
      title: apiFunction.name,
      icon: apiFunction.icon,
      content: apiFunction.content,
      position,
    };

    setOpenWindows((prev) => [...prev, newWindow]);
    setWindowCounter((prev) => prev + 1);
    setFocusedWindow(windowId);

    // Close sidebar on mobile after opening window
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const closeWindow = (windowId: string) => {
    setOpenWindows((prev) => prev.filter((window) => window.id !== windowId));
    if (focusedWindow === windowId) {
      setFocusedWindow(null);
    }
  };

  const focusWindow = (windowId: string) => {
    setFocusedWindow(windowId);
  };

  const getWindowZIndex = (windowId: string) => {
    return focusedWindow === windowId ? 1000 : 999;
  };

  const convertJSXToMarkdown = (content: React.ReactNode): string => {
    if (typeof content === "string") return content;
    if (typeof content === "number") return content.toString();
    if (!content) return "";

    // Extract text from JSX elements
    const extractTextFromJSX = (element: any): string => {
      if (typeof element === "string") return element;
      if (typeof element === "number") return element.toString();
      if (!element) return "";

      if (React.isValidElement(element)) {
        const { type, props } = element;

        if (type === "pre") {
          // Handle code blocks
          const codeContent = (props as any).children;
          if (typeof codeContent === "string") {
            return `\`\`\`javascript\n${codeContent.trim()}\n\`\`\`\n\n`;
          }
        } else if (type === "code") {
          // Handle inline code
          return `\`${(props as any).children}\``;
        } else if (type === "h4") {
          // Handle headers
          return `### ${extractTextFromJSX((props as any).children)}\n\n`;
        } else if (type === "p") {
          // Handle paragraphs
          return `${extractTextFromJSX((props as any).children)}\n\n`;
        } else if (type === "ul" || type === "li") {
          // Handle lists
          if (type === "ul") {
            return Array.isArray((props as any).children)
              ? (props as any).children
                  .map((child: any) => extractTextFromJSX(child))
                  .join("")
              : extractTextFromJSX((props as any).children);
          } else if (type === "li") {
            return `- ${extractTextFromJSX((props as any).children)}\n`;
          }
        }

        // Handle other elements by extracting their children
        if ((props as any).children) {
          if (Array.isArray((props as any).children)) {
            return (props as any).children.map(extractTextFromJSX).join("");
          }
          return extractTextFromJSX((props as any).children);
        }
      }

      if (Array.isArray(element)) {
        return element.map(extractTextFromJSX).join("");
      }

      return "";
    };

    return extractTextFromJSX(content);
  };

  const generateMarkdownDocumentation = () => {
    let markdown = `# GasFlow SDK Documentation\n\n`;
    markdown += `Generated on: ${new Date().toISOString().split("T")[0]}\n\n`;
    markdown += `## Overview\n\nThis documentation provides comprehensive information about the GasFlow SDK API functions, classes, and integration methods for cross-chain gas management.\n\n`;

    const categories = Object.keys(groupedFunctions);

    categories.forEach((category) => {
      markdown += `## ${category} Functions\n\n`;

      groupedFunctions[category].forEach((func) => {
        markdown += `### ${func.name}\n\n`;
        markdown += `**Description:** ${func.description}\n\n`;
        markdown += `**Category:** ${category}\n\n`;

        const contentMarkdown = convertJSXToMarkdown(func.content);
        markdown += contentMarkdown;
        markdown += `---\n\n`;
      });
    });

    return markdown;
  };

  const copyDocumentationForLLM = async () => {
    try {
      const markdown = generateMarkdownDocumentation();
      await navigator.clipboard.writeText(markdown);

      toast({
        title: "Documentation copied!",
        description:
          "The complete API documentation has been copied to your clipboard in LLM-friendly markdown format.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description:
          "Failed to copy documentation to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const groupedFunctions = apiFunctions.reduce((acc, func) => {
    if (!acc[func.category]) {
      acc[func.category] = [];
    }
    acc[func.category].push(func);
    return acc;
  }, {} as Record<string, APIFunction[]>);

  return (
    <div className="flex h-screen pt-16 bg-gradient-to-br from-background via-muted/10 to-accent/5">
      {/* Mobile Menu Button */}
      {isMobile && !sidebarOpen && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-20 left-4 z-50 bg-card/95 border-border/50"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Sidebar */}
      <div
        className={`
        ${isMobile ? "fixed inset-y-0 left-0 z-40" : "relative"}
        ${isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"}
        ${isMobile ? "w-full" : "w-96"}
        bg-card/95 border-r border-border/50 glass-effect transition-transform duration-200
        ${isMobile ? "pt-16" : ""}
      `}
      >
        {isMobile && sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-muted-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className="p-6 border-b border-border/50">
          <div className="flex flex-col gap-2 items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gradient mb-2">
                API Reference
              </h2>
              <p className="text-sm text-muted-foreground">
                Click any function to open its documentation window
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyDocumentationForLLM}
              className="shrink-0"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy for LLM
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 space-y-6">
            {Object.entries(groupedFunctions).map(([category, functions]) => (
              <div key={category}>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                  {category}
                </h3>
                <div className="space-y-2">
                  {functions.map((func, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-1 hover:bg-primary/5"
                      onClick={() => openWindow(func)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-left">
                          <div className="font-mono text-sm font-medium">
                            {func.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {func.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Canvas Area */}
      <div
        className={`
        flex-1 relative overflow-hidden
        ${isMobile && sidebarOpen ? "pointer-events-none" : ""}
      `}
      >
        {openWindows.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Card className="p-8 text-center glass-effect shadow-soft max-w-md mx-auto">
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Documentation Canvas
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                {isMobile
                  ? "Tap the menu button to browse API functions and open documentation windows."
                  : "Click on any function or class in the sidebar to open its documentation window. You can open multiple windows and organize them as needed."}
              </p>
              {isMobile && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="mr-2 h-4 w-4" />
                  Browse API Functions
                </Button>
              )}
            </Card>
          </div>
        )}

        {/* Draggable Windows */}
        {openWindows.map((window) => (
          <DraggableWindow
            key={window.id}
            id={window.id}
            title={window.title}
            icon={window.icon}
            initialPosition={window.position}
            onClose={closeWindow}
            onFocus={focusWindow}
            zIndex={getWindowZIndex(window.id)}
          >
            {window.content}
          </DraggableWindow>
        ))}
      </div>
    </div>
  );
};

export default Documentation;
