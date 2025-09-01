# GasFlow SDK

> **Universal Cross-Chain Gas Payment SDK powered by Circle CCTP V2 and Paymaster**

[![NPM Version](https://img.shields.io/npm/v/gasflow-sdk.svg)](https://www.npmjs.com/package/gasflow-sdk)
[![GitHub](https://img.shields.io/github/license/IronicDeGawd/CircleDorahacksGroup1-GasFlowSDK)](https://github.com/IronicDeGawd/CircleDorahacksGroup1-GasFlowSDK)
[![Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://gasflow-sdk.vercel.app)

A universal cross-chain gas payment SDK that enables seamless USDC transfers and gas payments across multiple blockchains using Circle's CCTP V2 and Paymaster technology.

## 🚀 Features

- **Cross-Chain USDC Transfers**: Native USDC transfers using Circle's CCTP V2 burn-and-mint protocol
- **Multi-Chain Balance Aggregation**: View USDC balances across all supported chains in one call
- **Gas Payment with USDC**: Pay transaction fees using USDC via Circle Paymaster (Beta)
- **Route Optimization**: Automatic selection of optimal transfer routes based on cost and speed
- **Real-Time Tracking**: Monitor cross-chain transfers with detailed status updates
- **Developer Friendly**: TypeScript support with comprehensive documentation

## 📦 Installation

```bash
npm install gasflow-sdk
```

## 🚀 Quick Start

```typescript
import { GasFlowSDK } from 'gasflow-sdk';

// Initialize the SDK
const sdk = new GasFlowSDK({
  apiKey: 'your-circle-api-key',
  environment: 'testnet' // or 'mainnet'
});

// Execute a cross-chain transfer
const result = await sdk.execute({
  fromChain: 'ethereum-sepolia',
  toChain: 'arbitrum-sepolia',
  amount: '100', // 100 USDC
  recipient: '0x...',
  mode: 'fast' // or 'standard'
});

console.log('Transfer completed:', result.transactionHash);
```

### Check Unified Balance

```typescript
// Get USDC balance across all supported chains
const balance = await sdk.getUnifiedBalance('0x...');
console.log(`Total USDC: ${balance.total}`);
console.log('Per chain:', balance.chains);
```

### Estimate Transaction

```typescript
// Estimate costs before executing
const estimate = await sdk.estimateTransaction({
  fromChain: 'ethereum-sepolia',
  toChain: 'arbitrum-sepolia',
  amount: '100'
});

console.log('Estimated cost:', estimate.totalCost);
console.log('Estimated time:', estimate.estimatedTime);
```

## 🌐 Supported Networks

| Network | Chain ID | USDC Address | Status |
|---------|----------|--------------|--------|
| Ethereum Sepolia | 11155111 | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | ✅ Active |
| Arbitrum Sepolia | 421614 | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` | ✅ Active |
| Base Sepolia | 84532 | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | ✅ Active |
| Avalanche Fuji | 43113 | `0x5425890298aed601595a70AB815c96711a31Bc65` | ✅ Active |
| Polygon Amoy | 80002 | `0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582` | ✅ Active |

## 🔧 Configuration

### Environment Variables

```bash
# Required for production CCTP
CIRCLE_API_KEY=your_circle_api_key

# Optional: Custom RPC endpoints
ETHEREUM_SEPOLIA_RPC=your_custom_rpc
ARBITRUM_SEPOLIA_RPC=your_custom_rpc
# ... other chains
```

### Circle API Setup

1. Sign up at [Circle Console](https://console.circle.com/signup)
2. Create a new project
3. Generate API key for CCTP V2
4. Use the API key in your SDK configuration

## 📊 Transfer Modes

| Mode | Speed | Cost | Use Case |
|------|-------|------|----------|
| **Fast** | ~30 seconds | Higher gas | Time-sensitive transfers |
| **Standard** | 13-19 minutes | Lower gas | Cost-optimized transfers |

## 🛡️ Security Features

- **Official Circle Contracts**: Only verified CCTP V2 addresses
- **Permit-based Approvals**: No unlimited token approvals
- **Private Key Security**: Secure key management recommendations
- **Transaction Validation**: Multi-layer verification before execution

## 📚 Documentation & Examples

- **📖 Complete Documentation**: [gasflow-sdk.vercel.app](https://gasflow-sdk.vercel.app)
- **🎮 Live Demo**: Interactive examples and testing
- **💻 GitHub Repository**: [Source code and examples](https://github.com/IronicDeGawd/CircleDorahacksGroup1-GasFlowSDK)

## 🤝 Contributing

We welcome contributions! Please see our [contributing guidelines](https://github.com/IronicDeGawd/CircleDorahacksGroup1-GasFlowSDK/blob/main/CONTRIBUTING.md) and join our development community.

## 📄 License

MIT License - see [LICENSE](https://github.com/IronicDeGawd/CircleDorahacksGroup1-GasFlowSDK/blob/main/LICENSE) file for details.

## 🔗 Links

- **🚀 Live Demo**: [gasflow-sdk.vercel.app](https://gasflow-sdk.vercel.app)
- **📦 NPM Package**: [npmjs.com/package/gasflow-sdk](https://www.npmjs.com/package/gasflow-sdk)
- **💻 GitHub**: [github.com/IronicDeGawd/CircleDorahacksGroup1-GasFlowSDK](https://github.com/IronicDeGawd/CircleDorahacksGroup1-GasFlowSDK)
- **Circle Docs**: [developers.circle.com](https://developers.circle.com/)

---

**Built for Circle Developer Bounty 2024** 🏆

*Simplifying multichain USDC payments for the next generation of dApps*