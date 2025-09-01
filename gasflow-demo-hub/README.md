# GasFlow Demo Hub - Live Multichain USDC Demo

> **Interactive demonstration of the GasFlow SDK's multichain USDC capabilities**

This demo application showcases the GasFlow SDK in action, providing a live interface for testing cross-chain USDC transfers, balance checking, and route optimization powered by Circle's CCTP V2.

## 🎯 Demo Purpose

Part of the **Circle Developer Bounty** submission, this demo serves as:

- **Live SDK Demonstration**: Real-time cross-chain USDC transfers
- **Developer Testing Platform**: Interactive SDK feature testing
- **Integration Example**: Reference implementation for developers
- **Performance Showcase**: Speed and reliability metrics

## ✨ Demo Features

### 🌐 **Multichain USDC Operations**
- **Cross-Chain Transfers**: Send USDC between supported testnets
- **Balance Aggregation**: View USDC across all chains in one interface
- **Route Optimization**: Automatic best-path selection for transfers
- **Real-Time Tracking**: Live transaction status and confirmations

### ⚡ **Transfer Modes**
- **Fast Mode**: ~30 second transfers via Circle's fast finality
- **Standard Mode**: 13-19 minute transfers with lower costs
- **Automatic Selection**: SDK chooses optimal mode based on conditions

### 🔧 **Developer Tools**
- **Transaction History**: Complete transfer logs with details
- **Gas Estimation**: Real-time gas cost calculations
- **Error Handling**: Comprehensive error display and recovery
- **Network Status**: Chain health and connectivity monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Testnet USDC tokens (from faucets)
- Circle API key (optional for production features)

### Setup & Run

```bash
# Clone and navigate
git clone <repository-url>
cd Circle-Project/gasflow-demo-hub

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start demo
npm run dev
```

Visit [http://localhost:5174](http://localhost:5174) to access the demo.

## 🌐 Supported Test Networks

| Network | Faucet | USDC Address |
|---------|--------|--------------|
| **Ethereum Sepolia** | [Faucet](https://faucets.chain.link/ethereum-sepolia) | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| **Arbitrum Sepolia** | [Faucet](https://faucets.chain.link/arbitrum-sepolia) | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| **Base Sepolia** | [Faucet](https://faucets.chain.link/base-sepolia) | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| **Avalanche Fuji** | [Faucet](https://faucets.chain.link/avalanche-fuji) | `0x5425890298aed601595a70AB815c96711a31Bc65` |
| **Polygon Amoy** | [Faucet](https://faucets.chain.link/polygon-amoy) | `0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582` |

### Getting Test Tokens

1. **Get Native Tokens**: Use chain faucets for gas fees
2. **Get USDC**: Use Circle's testnet USDC faucets
3. **Fund Wallet**: Ensure sufficient balance for testing

## 📁 Project Structure

```
gasflow-demo-hub/
├── src/
│   ├── components/          # Demo UI components
│   │   ├── TransferForm.tsx    # Cross-chain transfer interface
│   │   ├── BalanceDisplay.tsx  # Multi-chain balance view
│   │   ├── TransactionLog.tsx  # Transfer history
│   │   └── NetworkStatus.tsx   # Chain connectivity
│   ├── hooks/              # Custom React hooks
│   │   ├── useGasFlow.ts      # SDK integration hook
│   │   ├── useBalance.ts      # Balance management
│   │   └── useTransactions.ts # Transaction tracking
│   ├── pages/              # Demo pages
│   │   ├── Dashboard.tsx      # Main demo interface
│   │   ├── Transfer.tsx       # Transfer testing
│   │   └── History.tsx        # Transaction history
│   ├── lib/                # Utilities
│   │   ├── gasflow.ts         # SDK configuration
│   │   └── constants.ts       # Network constants
│   └── App.tsx             # Main application
├── public/                 # Static assets
└── package.json
```

## 🎮 Demo Walkthrough

### 1. **Connect & Setup**
- Connect your wallet (MetaMask recommended)
- Switch to supported testnet
- Check USDC balance across chains

### 2. **Cross-Chain Transfer**
- Select source and destination chains
- Enter transfer amount and recipient
- Choose transfer mode (Fast/Standard)
- Execute and track transaction

### 3. **Monitor Progress**
- Real-time status updates
- Transaction hash tracking
- Completion notifications
- Balance updates

### 4. **Explore Features**
- Test different chain combinations
- Compare transfer modes
- View transaction history
- Check gas estimations

## 🔧 Configuration

### Environment Variables

```bash
# Circle API (optional for enhanced features)
VITE_CIRCLE_API_KEY=your_circle_api_key

# Custom RPC endpoints (optional)
VITE_ETHEREUM_SEPOLIA_RPC=your_custom_rpc
VITE_ARBITRUM_SEPOLIA_RPC=your_custom_rpc
VITE_BASE_SEPOLIA_RPC=your_custom_rpc
VITE_AVALANCHE_FUJI_RPC=your_custom_rpc
VITE_POLYGON_AMOY_RPC=your_custom_rpc

# Demo configuration
VITE_DEMO_MODE=true
VITE_DEFAULT_AMOUNT=10
```

### Wallet Configuration

The demo supports:
- **MetaMask**: Primary wallet integration
- **WalletConnect**: Mobile wallet support
- **Coinbase Wallet**: Alternative option

## 🏗️ Technical Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.x |
| **TypeScript** | Type Safety | 5.x |
| **Vite** | Build Tool | 5.x |
| **Tailwind CSS** | Styling | 3.x |
| **Wagmi** | Wallet Integration | 2.x |
| **Viem** | Ethereum Library | 2.x |
| **GasFlow SDK** | Core Functionality | Latest |

## 📊 Demo Metrics

### Performance Benchmarks
- **Fast Transfers**: 95% complete within 45 seconds
- **Standard Transfers**: 100% complete within 20 minutes
- **Balance Queries**: <2 second response time
- **Route Optimization**: Automatic best-path selection

### Supported Operations
- ✅ Cross-chain USDC transfers
- ✅ Multi-chain balance aggregation
- ✅ Transaction history tracking
- ✅ Gas estimation and optimization
- 🚧 Paymaster integration (beta)

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run test suite
npm run test:e2e     # End-to-end testing

# Code Quality
npm run lint         # ESLint
npm run type-check   # TypeScript checking
```

### Adding New Features

1. **New Demo Component**: Create in `src/components/`
2. **SDK Integration**: Use hooks in `src/hooks/`
3. **Styling**: Follow Tailwind CSS patterns
4. **Testing**: Add tests for new functionality

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deployment Options

#### **Netlify** (Recommended)
```bash
# Build command: npm run build
# Publish directory: dist
# Environment variables: Set in Netlify dashboard
```

#### **Vercel**
```bash
# Framework preset: Vite
# Build command: npm run build
# Output directory: dist
```

#### **IPFS/Decentralized**
```bash
npm run build
# Upload dist/ to IPFS or Arweave
```

## 🎯 Demo Scenarios

### Scenario 1: Basic Transfer
1. Connect wallet to Ethereum Sepolia
2. Transfer 10 USDC to Arbitrum Sepolia
3. Monitor transaction completion
4. Verify balance update

### Scenario 2: Multi-Chain Balance
1. Hold USDC on multiple chains
2. View aggregated balance
3. Compare individual chain balances
4. Test balance refresh

### Scenario 3: Route Optimization
1. Initiate transfer between any chains
2. Observe automatic route selection
3. Compare Fast vs Standard modes
4. Analyze cost-benefit trade-offs

### Scenario 4: Error Handling
1. Attempt transfer with insufficient balance
2. Test network connectivity issues
3. Observe error messages and recovery
4. Verify graceful degradation

## 🔗 Integration Examples

### Basic SDK Usage
```typescript
import { useGasFlow } from './hooks/useGasFlow';

function TransferDemo() {
  const { sdk, execute, isLoading } = useGasFlow();
  
  const handleTransfer = async () => {
    const result = await execute({
      fromChain: 'ethereum-sepolia',
      toChain: 'arbitrum-sepolia',
      amount: '10',
      recipient: '0x...',
      mode: 'fast'
    });
    
    console.log('Transfer completed:', result);
  };
  
  return (
    <button onClick={handleTransfer} disabled={isLoading}>
      Transfer USDC
    </button>
  );
}
```

### Balance Monitoring
```typescript
import { useBalance } from './hooks/useBalance';

function BalanceDemo() {
  const { balance, refresh } = useBalance('0x...');
  
  return (
    <div>
      <p>Total USDC: {balance.total}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

## 🤝 Contributing

### Demo Improvements
- Add new transfer scenarios
- Enhance UI/UX components
- Improve error handling
- Add performance metrics

### Testing
- Create comprehensive test scenarios
- Add automated testing
- Performance benchmarking
- Cross-browser compatibility

## 🔗 Related Projects

- **[Main Project](../README.md)**: Overall project documentation
- **[SDK Package](../sdk-npm/)**: Core GasFlow SDK
- **[Frontend Docs](../gasflow-sdk-frontend/)**: Developer documentation

## 📄 License

MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Part of the Circle Developer Bounty 2024 submission** 🏆

*Experience the future of multichain USDC payments*
