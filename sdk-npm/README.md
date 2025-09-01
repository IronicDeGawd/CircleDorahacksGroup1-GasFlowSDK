# GasFlow SDK

Cross-chain USDC payment SDK with Circle CCTP V2 and Paymaster integration.

## Installation

```bash
npm install @gasflow/sdk
```

## Quick Start

```typescript
import { GasFlowSDK } from '@gasflow/sdk';

const sdk = new GasFlowSDK({
  apiKey: 'your-circle-api-key',
  executionMode: 'traditional', // or 'paymaster'
  supportedChains: [11155111, 421614, 84532]
});

// Traditional execution (MetaMask)
await sdk.execute(
  { to: "0x...", value: BigNumber.from("1000000"), executeOn: 421614 },
  userAddress,
  undefined,
  signer
);

// Paymaster execution (USDC gas)
await sdk.execute(
  { to: "0x...", value: BigNumber.from("1000000"), executeOn: 421614 },
  userAddress,
  privateKey
);
```

## Features

- Cross-chain USDC transfers via Circle CCTP V2
- USDC gas payments via Circle Paymaster v0.8
- Route optimization and cost estimation
- Multi-chain balance aggregation
- Real-time transaction tracking

## Supported Chains

**Testnets**: Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia, Avalanche Fuji, Polygon Amoy
**Mainnets**: Arbitrum One, Base

## License

MIT