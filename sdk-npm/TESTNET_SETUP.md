# GasFlow SDK - Testnet Setup Guide

## 🧪 Complete Testnet Configuration

This guide will help you set up the GasFlow SDK for real testnet transactions using Circle's infrastructure.

## 📋 Prerequisites Checklist

- [ ] Circle Developer Account
- [ ] API keys for Circle services  
- [ ] Testnet USDC tokens
- [ ] Testnet ETH for transaction fees
- [ ] RPC provider accounts (optional)

## 🔑 Step 1: Get Circle API Keys

### 1.1 Circle Developer Portal
1. **Visit**: https://developers.circle.com/
2. **Sign up** for a Circle developer account
3. **Create a new application**
4. **Generate API keys** for:
   - Circle CCTP V2 API
   - Circle Paymaster API (if available)

### 1.2 API Key Configuration
```bash
# Copy the environment template
cp .env.example .env

# Add your Circle API key
CIRCLE_API_KEY=your_actual_circle_api_key_here
CIRCLE_ENVIRONMENT=testnet
```

## 💰 Step 2: Get Testnet USDC

### 2.1 Circle USDC Faucet
1. **Visit**: https://faucet.circle.com/
2. **Connect your wallet** (MetaMask recommended)
3. **Select testnet networks**:
   - Ethereum Sepolia
   - Arbitrum Sepolia  
   - Base Sepolia
   - Avalanche Fuji
   - Polygon Amoy (if available)
4. **Request USDC** on each network (usually 100-1000 USDC per request)

### 2.2 Alternative USDC Sources
If Circle faucet is unavailable:
```bash
# Bridge from other testnets using Circle CCTP
# Use testnet DEXs to swap other tokens for USDC
# Ask in Discord communities for testnet USDC
```

## ⛽ Step 3: Get Testnet ETH

### 3.1 Testnet Faucets
```bash
# Ethereum Sepolia
https://sepoliafaucet.com/
https://faucet.sepolia.dev/

# Arbitrum Sepolia  
https://faucet.arbitrum.io/

# Base Sepolia
https://faucet.quicknode.com/base/sepolia

# Avalanche Fuji
https://faucet.avax.network/

# Polygon Amoy
https://faucet.polygon.technology/
```

### 3.2 Required Amounts
- **~0.1 ETH per network** for gas fees
- **More if testing many transactions**

## 🌐 Step 4: Configure RPC Providers (Optional)

### 4.1 Public RPCs (Free)
The SDK includes default public RPCs, but for better reliability:

### 4.2 Premium RPC Providers
```bash
# Infura (recommended)
https://infura.io/ -> Create project -> Get API key
RPC_URL_ETHEREUM_SEPOLIA=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Alchemy (alternative)
https://alchemy.com/ -> Create app -> Get API key
RPC_URL_ETHEREUM_SEPOLIA=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Ankr (free tier)
https://ankr.com/ -> Create account -> Get endpoints
```

## 🔧 Step 5: Configure Environment

### 5.1 Main SDK Environment
```bash
# Create .env file in project root
cp .env.example .env

# Edit with your actual values:
CIRCLE_API_KEY=your_circle_api_key_here
CIRCLE_ENVIRONMENT=testnet

# Optional: Add your RPC endpoints
RPC_URL_ETHEREUM_SEPOLIA=https://sepolia.infura.io/v3/YOUR_KEY
RPC_URL_ARBITRUM_SEPOLIA=https://sepolia-rollup.arbitrum.io/rpc
# ... add others as needed
```

### 5.2 Demo App Environment  
```bash
# Create .env.local in demo/ directory
cd demo
cp .env.example .env.local

# For real testnet testing:
VITE_DEMO_MODE=false
VITE_CIRCLE_API_KEY=your_circle_api_key_here
VITE_CIRCLE_ENVIRONMENT=testnet
```

## 🚀 Step 6: Test Real Transactions

### 6.1 SDK Testing Script
```typescript
// test-testnet.ts
import { GasFlowSDK } from './src/core/GasFlowSDK';
import { parseEther } from 'ethers';

async function testRealTransaction() {
  const sdk = new GasFlowSDK({
    apiKey: process.env.CIRCLE_API_KEY!,
    supportedChains: [11155111, 421614, 84532, 43113, 80002],
  });

  // Your testnet wallet
  const userAddress = '0xYourTestnetWalletAddress';
  const userPrivateKey = '0xYourTestnetPrivateKey'; // Keep secure!

  try {
    // 1. Check USDC balance
    console.log('📊 Checking USDC balance...');
    const balance = await sdk.getUnifiedBalance(userAddress);
    console.log(`Total USDC: $${balance.totalUSDValue}`);

    // 2. Estimate transaction
    console.log('🔍 Analyzing routes...');
    const transaction = {
      to: '0x742C7f0f6b6d43A35556D5F7FAF7a93AC8c3b7B8',
      value: parseEther('0.001'), // Small test amount
      data: '0x',
      executeOn: 'optimal' as const,
      payFromChain: 'auto' as const,
    };

    const estimate = await sdk.estimateTransaction(transaction, userAddress);
    console.log(`Best route: ${estimate.recommendedExecution.reason}`);
    console.log(`Estimated cost: ${estimate.bestRoute.totalCost} USDC`);

    // 3. Execute transaction
    console.log('🚀 Executing transaction...');
    const result = await sdk.execute(transaction, userAddress, userPrivateKey);
    console.log(`✅ Success! TX: ${result.transactionHash}`);
    console.log(`💰 Total cost: ${result.totalCostUSDC} USDC`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testRealTransaction();
```

### 6.2 Run the Test
```bash
# Install dependencies if needed
npm install

# Run the test script
npx tsx test-testnet.ts
```

### 6.3 Demo App with Real Data
```bash
cd demo

# Set environment for real testing
echo "VITE_DEMO_MODE=false" > .env.local
echo "VITE_CIRCLE_API_KEY=your_key_here" >> .env.local

# Start demo with real SDK
bun run dev
```

## 🔍 Step 7: Verify Transactions

### 7.1 Block Explorers
Monitor your transactions on:
```bash
# Ethereum Sepolia
https://sepolia.etherscan.io/

# Arbitrum Sepolia
https://sepolia.arbiscan.io/

# Base Sepolia  
https://sepolia.basescan.org/

# Avalanche Fuji
https://testnet.snowtrace.io/

# Polygon Amoy
https://amoy.polygonscan.com/
```

### 7.2 Circle APIs
Check CCTP status:
```bash
# Circle CCTP Explorer
https://iris-api-sandbox.circle.com/v1/attestations/{messageHash}

# Transaction status
https://iris-api-sandbox.circle.com/v1/burns/{burnTxHash}
```

## ⚠️ Troubleshooting Common Issues

### Issue 1: "API Key Invalid"
```bash
# Check API key format
# Ensure using testnet key for testnet environment
# Verify key permissions in Circle dashboard
```

### Issue 2: "Insufficient USDC Balance"
```bash
# Get more USDC from Circle faucet
# Check balance on correct network
# Ensure wallet address is correct
```

### Issue 3: "Transaction Reverts"
```bash
# Check gas limits
# Verify contract addresses
# Ensure sufficient ETH for gas
```

### Issue 4: "CCTP Bridge Fails"
```bash
# Check source/destination chain support
# Verify USDC contract addresses
# Wait for finality before bridge
```

### Issue 5: "Paymaster Rejects"
```bash
# Check USDC approval
# Verify Paymaster contract address
# Ensure UserOperation format is correct
```

## 📞 Getting Help

### Circle Support
- **Docs**: https://developers.circle.com/
- **Discord**: https://discord.gg/circle-developers
- **Support**: support@circle.com

### Community Resources
- **GitHub Issues**: Create issues for SDK bugs
- **Stack Overflow**: Tag questions with `circle-cctp`
- **Twitter**: @circle for updates

## ✅ Success Criteria

You'll know testnet setup is working when:
- [ ] **Balance queries** return real USDC amounts
- [ ] **Route analysis** shows actual gas prices  
- [ ] **CCTP bridges** complete successfully
- [ ] **Paymaster** accepts USDC gas payments
- [ ] **Transactions** appear in block explorers
- [ ] **Demo app** works with real data

## 🎯 Next Steps

Once testnet is working:
1. **Mainnet deployment** (same process, different keys)
2. **Integration testing** with your application
3. **Performance optimization** for production loads
4. **Monitoring setup** for production usage

---

**🔒 Security Reminder**: Never use testnet private keys or API keys in production. Always use separate credentials for different environments.