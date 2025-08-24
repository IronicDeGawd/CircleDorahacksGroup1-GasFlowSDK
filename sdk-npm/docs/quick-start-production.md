# Quick Start: Production CCTP Integration

This guide walks you through integrating real Circle CCTP contracts with the GasFlow SDK in just a few steps.

## Prerequisites

### 1. Circle API Key
Sign up at [Circle Developer Console](https://developers.circle.com/) and create an API key:
- Use **testnet** keys for development
- Use **mainnet** keys for production
- Keep your API key secure and never expose it publicly

### 2. Blockchain Wallet
You'll need:
- A wallet with private key for signing transactions
- Test USDC on desired chains
- Native tokens (ETH, MATIC, etc.) for gas fees

### 3. RPC Endpoints
Set up RPC providers for the chains you want to support:
- [Infura](https://infura.io/), [Alchemy](https://alchemy.com/), or [QuickNode](https://quicknode.com/)
- Public RPCs work but may have rate limits

## Installation

```bash
npm install @gasflow/sdk ethers
```

## Basic Usage

### 1. Import Required Components

```typescript
import { 
  GasFlowSDK,
  ProductionCCTPService,
  getCCTPAddresses 
} from '@gasflow/sdk';
import { ethers, Wallet } from 'ethers';
```

### 2. Set Up Providers and Signers

```typescript
// Set up providers for multiple chains
const providers = new Map([
  [11155111, new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_KEY')],
  [421614, new ethers.providers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc')],
]);

// Create signers with your private key
const privateKey = process.env.PRIVATE_KEY!; // Never hardcode!
const signers = new Map([
  [11155111, new Wallet(privateKey, providers.get(11155111))],
  [421614, new Wallet(privateKey, providers.get(421614))],
]);
```

### 3. Initialize SDK with Production CCTP

```typescript
const gasFlowSDK = new GasFlowSDK({
  apiKey: process.env.CIRCLE_API_KEY!,
  supportedChains: [11155111, 421614], // Ethereum & Arbitrum Sepolia
  useProductionCCTP: true,              // Enable real CCTP
  signers: signers                      // Your wallet signers
});
```

### 4. Execute Cross-Chain Transaction

```typescript
const result = await gasFlowSDK.execute({
  to: '0x742C7f0f6b6d43A35556D5F7FAF7a93AC8c3b7B8',
  data: '0x', // Your contract call data
  executeOn: 421614,    // Execute on Arbitrum
  payFromChain: 11155111 // Pay gas from Ethereum
}, userAddress);

console.log(`Transaction: ${result.transactionHash}`);
console.log(`Cost: ${ethers.utils.formatUnits(result.totalCostUSDC, 6)} USDC`);
```

## Direct CCTP Usage

For more control, use `ProductionCCTPService` directly:

```typescript
// Create service
const cctpService = new ProductionCCTPService(
  process.env.CIRCLE_API_KEY!,
  true // useTestnet
);

// Set signers for chains you'll use
cctpService.setSigner(11155111, ethereumSigner);
cctpService.setSigner(421614, arbitrumSigner);

// Bridge USDC between chains
const bridgeResult = await cctpService.initiateBridge({
  amount: ethers.utils.parseUnits('10', 6), // 10 USDC
  fromChain: 11155111,  // Ethereum Sepolia
  toChain: 421614,      // Arbitrum Sepolia
  recipient: userAddress,
  useFastTransfer: true // Use Fast Transfer if available
});

// Wait for completion (requires signer on destination chain)
const destinationTx = await cctpService.waitForCompletion(
  bridgeResult.transactionHash,
  11155111,
  421614,
  bridgeResult.transferObject
);

console.log(`Bridge completed: ${destinationTx}`);
```

## Environment Configuration

Create a `.env` file:

```bash
# Circle API Configuration
CIRCLE_API_KEY=your-circle-testnet-api-key

# Wallet Configuration (TEST ONLY - use secure key management in production)
PRIVATE_KEY=your-wallet-private-key

# RPC Endpoints
INFURA_KEY=your-infura-project-id
ALCHEMY_KEY=your-alchemy-api-key
```

## Testing on Testnets

### 1. Get Test Tokens

**USDC Testnet Faucets:**
- Ethereum Sepolia: https://faucet.circle.com/
- Other chains: Bridge USDC from Ethereum Sepolia

**ETH Testnet Faucets:**
- Ethereum Sepolia: https://sepoliafaucet.com/
- Arbitrum Sepolia: https://faucet.quicknode.com/arbitrum/sepolia
- Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### 2. Verify Balances

```typescript
import { USDC__factory } from '@gasflow/sdk';

const checkBalance = async (chainId: number, userAddress: string) => {
  const addresses = getCCTPAddresses(chainId, true);
  const provider = providers.get(chainId)!;
  const usdc = USDC__factory.connect(addresses.usdc, provider);
  
  const balance = await usdc.balanceOf(userAddress);
  console.log(`USDC balance on ${chainId}: ${ethers.utils.formatUnits(balance, 6)}`);
};

await checkBalance(11155111, userAddress);
await checkBalance(421614, userAddress);
```

### 3. Test Transfer

```typescript
// Start with small amounts for testing
const testAmount = ethers.utils.parseUnits('1', 6); // 1 USDC

const result = await cctpService.initiateBridge({
  amount: testAmount,
  fromChain: 11155111,
  toChain: 421614,
  recipient: userAddress,
  useFastTransfer: true
});

console.log('Test bridge initiated:', result.transactionHash);
```

## Production Considerations

### 1. Security
- **Never hardcode private keys** - use AWS KMS, Azure Key Vault, or similar
- **Validate all inputs** before signing transactions
- **Implement proper error handling** and retry logic
- **Monitor transaction status** and handle failures gracefully

### 2. Gas Management
```typescript
// Estimate costs before execution
const fee = await cctpService.estimateBridgeFee(amount, fromChain, toChain);
const time = await cctpService.estimateTransferTime(amount, fromChain, toChain);

console.log(`Bridge will cost ${ethers.utils.formatUnits(fee, 6)} USDC`);
console.log(`Estimated time: ${time} seconds`);
```

### 3. Error Handling
```typescript
try {
  const result = await gasFlowSDK.execute(transaction, userAddress);
  // Handle success
} catch (error) {
  if (error.message.includes('insufficient balance')) {
    // Handle insufficient funds
  } else if (error.message.includes('attestation timeout')) {
    // Handle Circle attestation delays
  } else {
    // Handle other errors
    console.error('Transaction failed:', error);
  }
}
```

### 4. Monitoring
```typescript
// Track bridge status
const status = await cctpService.getBridgeStatus(
  bridgeResult.transactionHash,
  fromChain
);

console.log(`Bridge status: ${status}`);
// 'pending' | 'attested' | 'completed' | 'failed'
```

## Troubleshooting

### Common Issues

1. **"No signer available"**
   - Ensure you call `setSigner()` for all chains you'll use
   - Verify signers have the correct provider attached

2. **"CCTP not supported"**
   - Check that both source and destination chains support CCTP
   - Verify you're using correct chain IDs

3. **"Attestation timeout"**
   - Circle attestations can take up to 15 minutes for standard transfers
   - Use Fast Transfer for sub-minute transfers when available

4. **"Insufficient allowance"**
   - The SDK automatically handles USDC approvals
   - Ensure signer has enough USDC balance

5. **"Invalid recipient address"**
   - Verify recipient address is valid Ethereum address
   - Make sure it's not a contract address unless intended

### Debug Mode

Enable detailed logging:

```typescript
// Set environment variable
process.env.DEBUG = 'gasflow:*';

// Or enable in code
const gasFlowSDK = new GasFlowSDK({
  // ... other config
  analytics: true // Enables detailed logging
});
```

## Next Steps

- Review [Complete Examples](../examples/production-cctp-usage.ts)
- Check [Production Integration Guide](./production-integration.md)
- Explore [Contract Addresses Reference](../src/contracts/addresses.ts)
- Read [Security Best Practices](./cctp-implementation-plan.md#security-considerations)