import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import DraggableWindow from "@/components/DraggableWindow";
import { DotPattern } from "@/components/magicui/dot-pattern";
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
      name: "🚀 Quick Start Guide",
      icon: <Zap className="h-4 w-4" />,
      category: "Getting Started",
      description: "Complete setup guide for GasFlow SDK integration",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">What GasFlow SDK Offers</h4>
            <p className="text-sm text-muted-foreground mb-4">
              GasFlow SDK is the ultimate toolkit for cross-chain gas management, enabling developers to build dApps where users can pay gas fees with USDC from any supported chain.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-1">🌉 CCTP (Primary Feature)</h5>
                <p className="text-xs text-blue-700 dark:text-blue-300">Cross-chain USDC transfers using Circle's native burn-and-mint protocol</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-1">💳 Paymaster (Under Construction)</h5>
                <p className="text-xs text-amber-700 dark:text-amber-300">Pay gas fees with USDC using Circle Smart Accounts and ERC-4337</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">1. Installation</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`npm install @gasflow/sdk ethers
# or
yarn add @gasflow/sdk ethers`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. Basic Setup (Development)</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`import { GasFlowSDK } from '@gasflow/sdk';

// Development mode - no API key required
const gasFlow = new GasFlowSDK({
  apiKey: 'demo_mode',
  supportedChains: [11155111, 421614, 84532, 43113, 80002], // Testnets
  executionMode: 'traditional' // Start with MetaMask integration
});`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">3. Production Setup (Real CCTP)</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`// Production mode with Circle API
const gasFlow = new GasFlowSDK({
  apiKey: process.env.VITE_CIRCLE_API_KEY, // Get from developers.circle.com
  supportedChains: [11155111, 421614, 84532, 43113, 80002],
  executionMode: 'auto', // Supports both traditional and paymaster
  alchemyApiKey: process.env.ALCHEMY_API_KEY // Required for Paymaster
});`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">4. Environment Variables</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`# .env file
VITE_CIRCLE_API_KEY=your_api_key_from_developers.circle.com
ALCHEMY_API_KEY=your_alchemy_key_for_paymaster_features

# Supported testnet chains
GASFLOW_SUPPORTED_CHAINS=11155111,421614,84532,43113,80002`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">5. What This Simplifies for Developers</h4>
            <ul className="text-sm space-y-2">
              <li>✅ <strong>Cross-chain complexity:</strong> One SDK call handles USDC bridging across 5+ chains</li>
              <li>✅ <strong>Gas payment UX:</strong> Users pay gas with USDC instead of managing native tokens</li>
              <li>✅ <strong>Route optimization:</strong> Automatic selection of cheapest execution path</li>
              <li>✅ <strong>Circle integration:</strong> Production-ready CCTP V2 and Paymaster contracts</li>
              <li>✅ <strong>Real-time tracking:</strong> Built-in transaction and balance monitoring</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Next Steps</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                <span className="font-medium">→ Start with CCTP:</span> Use <code className="text-xs bg-muted px-1 rounded">gasFlow.execute()</code> for cross-chain transfers
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                <span className="font-medium">→ Add Paymaster:</span> Enable USDC gas payments (currently under construction)
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-sm">
                <span className="font-medium">→ Monitor balances:</span> Use <code className="text-xs bg-muted px-1 rounded">getUnifiedBalance()</code> for real-time updates
              </div>
            </div>
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
  to: '0x1A00D9a88fC5ccF7a52E268307F98739f770A956',
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
  to: '0x1A00D9a88fC5ccF7a52E268307F98739f770A956',
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
    {
      name: "Environment Setup",
      icon: <Settings className="h-4 w-4" />,
      category: "Setup",
      description: "Complete environment configuration guide for GasFlow SDK",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Getting Started</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Follow this guide to set up your development environment for both
              mock testing and production use.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">1. Installation</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`npm install @gasflow/sdk ethers
# or
yarn add @gasflow/sdk ethers
# or
bun add @gasflow/sdk ethers`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. Circle API Setup</h4>
            <div className="text-sm space-y-2">
              <p>For production mode, you need a Circle API key:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Visit{" "}
                  <a
                    href="https://developers.circle.com"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    developers.circle.com
                  </a>
                </li>
                <li>Create an account and verify your email</li>
                <li>Navigate to "API Keys" and create a new key</li>
                <li>Select "CCTP" and "Paymaster" permissions</li>
                <li>Copy your API key (format: key:entity:secret)</li>
              </ol>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">3. Environment Variables</h4>
            <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">
              {`# Required for production mode
VITE_CIRCLE_API_KEY=your_api_key:entity_id:secret

# Chain configuration
GASFLOW_SUPPORTED_CHAINS=11155111,421614,84532,43113,80002
CIRCLE_ENVIRONMENT=testnet

# Optional: Custom RPC endpoints
RPC_URL_ETHEREUM_SEPOLIA=https://sepolia.infura.io/v3/YOUR_KEY
RPC_URL_ARBITRUM_SEPOLIA=https://sepolia-rollup.arbitrum.io/rpc
RPC_URL_BASE_SEPOLIA=https://sepolia.base.org

# Required: Alchemy API Key for Paymaster functionality
ALCHEMY_API_KEY=your_alchemy_api_key_here
# Bundler endpoints (Alchemy - SDK default)
BUNDLER_URL_ETHEREUM_SEPOLIA=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
BUNDLER_URL_ARBITRUM_SEPOLIA=https://arb-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
BUNDLER_URL_BASE_SEPOLIA=https://base-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">4. Testnet Tokens</h4>
            <div className="text-sm space-y-2">
              <p>For testing with real contracts:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Get testnet ETH from chain faucets</li>
                <li>
                  Get testnet USDC from{" "}
                  <a
                    href="https://faucet.circle.com"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    faucet.circle.com
                  </a>
                </li>
                <li>
                  Ensure you have tokens on multiple chains to test bridging
                </li>
              </ul>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">5. Development vs Production</h4>
            <div className="text-sm space-y-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Development Mode
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  No API key required, uses simulated CCTP and mock data
                </p>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Production Mode
                </p>
                <p className="text-green-700 dark:text-green-300 text-xs">
                  Requires Circle API key, uses real Circle contracts and CCTP
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const openWindow = (apiFunction: APIFunction) => {
    // Check if window for this function already exists
    const existingWindow = openWindows.find(
      (window) => window.title === apiFunction.name
    );

    if (existingWindow) {
      // If window exists, bring it to front and focus it
      setFocusedWindow(existingWindow.id);

      // Close sidebar on mobile after focusing window
      if (isMobile) {
        setSidebarOpen(false);
      }
      return;
    }

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
    const baseZIndex = 800;
    const focusedZIndex = baseZIndex + 100;

    if (focusedWindow === windowId) {
      return focusedZIndex;
    }

    // Give each window a unique z-index based on order, but keep focused window highest
    const windowIndex = openWindows.findIndex((w) => w.id === windowId);
    return baseZIndex + windowIndex;
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
    <div className="flex h-screen pt-16 bg-gradient-to-br from-background via-muted/10 to-accent/5 relative overflow-hidden">
      {/* Dot Pattern Background */}
      <DotPattern
        className="opacity-30 dark:opacity-20"
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
      />

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
        ${isMobile ? "w-full max-w-sm" : "w-80 xl:w-96"}
        bg-card/95 border-r border-border/50 glass-effect transition-transform duration-200
        ${isMobile ? "pt-16" : ""}
        flex flex-col
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

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6 pb-20">
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
                      className="w-full justify-start h-auto p-3 hover:bg-primary/5 text-left overflow-hidden whitespace-normal"
                      onClick={() => openWindow(func)}
                    >
                      <div className="flex items-start space-x-3 w-full min-w-0">
                        <div className="flex-shrink-0 mt-0.5">{func.icon}</div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="font-mono text-xs font-medium break-words overflow-wrap-anywhere leading-tight">
                            {func.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 break-words overflow-wrap-anywhere leading-relaxed">
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
          <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
            <Card className="p-8 text-center glass-effect shadow-soft max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Zap className="h-8 w-8 text-blue-500" />
                  <FileText className="h-8 w-8 text-primary" />
                  <Coins className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gradient">
                  GasFlow SDK Documentation
                </h2>
                <div className="text-muted-foreground text-sm md:text-base mb-6">
                  <p className="mb-2">
                    <strong>
                      Universal Cross-Chain Gas Payments with USDC
                    </strong>
                  </p>
                  <p>
                    Powered by Circle CCTP V2, ERC-4337 Paymaster, and Alchemy Bundler
                    Account Abstraction
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                  <div className="font-medium">5 Testnet Chains</div>
                  <div className="text-xs text-muted-foreground">
                    Ethereum, Arbitrum, Base, Avalanche, Polygon
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <CreditCard className="h-5 w-5 text-green-600 mx-auto mb-2" />
                  <div className="font-medium">USDC Gas Payments</div>
                  <div className="text-xs text-muted-foreground">
                    Pay gas fees with USDC from any chain
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <Route className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                  <div className="font-medium">Auto Optimization</div>
                  <div className="text-xs text-muted-foreground">
                    AI-powered route analysis & cost optimization
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-muted-foreground text-sm mb-4">
                  {isMobile
                    ? "Tap the menu button to explore API functions and open interactive documentation windows."
                    : "Click any function in the sidebar to open its documentation in an interactive window. Drag, resize, and organize multiple windows to build your perfect development workspace."}
                </p>

                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {isMobile && (
                    <Button
                      variant="outline"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <Menu className="mr-2 h-4 w-4" />
                      Explore API Functions
                    </Button>
                  )}
                  <Button
                    variant="default"
                    onClick={() => openWindow(apiFunctions[0])}
                  >
                    <Code2 className="mr-2 h-4 w-4" />
                    Quick Start Guide
                  </Button>
                </div>
              </div>
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
