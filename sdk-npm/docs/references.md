# Circle CCTP v2 Implementation References

## Official Circle Documentation

### CCTP (Cross-Chain Transfer Protocol)
- **Main Documentation**: https://developers.circle.com/cctp
- **API Reference**: https://developers.circle.com/w3s/web3-services-api-client-keys-auth

## Key Concepts

### Transfer Methods
1. **Fast Transfer**: 8-20 seconds (faster-than-finality)
2. **Standard Transfer**: 13-19 minutes (hard finality)

### Core Process Flow
```
Source Chain: Burn USDC → Circle Attestation Service → Destination Chain: Mint USDC
```

### V2 Features
- Native burn and mint mechanism
- Hooks for custom cross-chain logic
- Fast Transfer Allowance for risk management

## Authentication

### API Key Format
```
Authorization: Bearer API_KEY:entity_id:secret
```

### Environment Variables
```bash
CIRCLE_API_KEY=your_api_key_here
CIRCLE_ENVIRONMENT=testnet  # or mainnet
```

### API Endpoints
- **Testnet**: https://iris-api-sandbox.circle.com
- **Mainnet**: https://iris-api.circle.com

## Official Circle SDK

### Implementation Options

#### Option 1: Wormhole SDK (Recommended)
```json
{
  "@wormhole-foundation/sdk": "latest",
  "@wormhole-foundation/sdk/evm": "latest"
}
```

```typescript
import { wormhole, CircleTransfer } from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";

const wh = await wormhole("Testnet", [evm]);
```

#### Option 2: Direct Contract Integration
```json
{
  "ethers": "^5.7.2",
  "@typechain/ethers-v5": "latest"
}
```

```typescript
import { ethers } from 'ethers';
// Contract ABIs and generated types needed
```

#### Option 3: Circle SDK (Server-Side)
```json
{
  "@circle-fin/circle-sdk": "^2.9.0"
}
```

```typescript
// Note: Circle SDK may be for server-side operations
// CCTP transfers typically require direct contract interaction
```

## Supported Chains

### Testnet
- Ethereum Sepolia (11155111)
- Arbitrum Sepolia (421614)  
- Base Sepolia (84532)
- Avalanche Fuji (43113)
- Polygon Amoy (80002)

### Mainnet
- Ethereum (1)
- Arbitrum One (42161)
- Base (8453)
- Avalanche (43114)
- Polygon (137)

## Implementation Guidelines

### Security Best Practices
1. Never expose API keys in client-side code
2. Use separate keys for different environments
3. Rotate keys periodically
4. Implement proper error handling for API calls

### Error Handling
- Handle network failures gracefully
- Implement retry logic for attestation polling
- Validate chain support before operations

### Rate Limits
- Respect Circle's API rate limits
- Implement exponential backoff for retries
- Cache responses where appropriate

## Code Examples

### Basic CCTP Transfer (Wormhole SDK Pattern)
```typescript
import { wormhole, CircleTransfer } from "@wormhole-foundation/sdk";

async function transferUSDC(
  amount: bigint,
  sourceAddress: string,
  destinationAddress: string
) {
  // Initialize Wormhole with CCTP support
  const wh = await wormhole("Testnet", [evm, solana]);
  
  // Create transfer
  const xfer = await wh.circleTransfer(
    amount,
    sourceAddress,
    destinationAddress,
    true // automatic transfer
  );
  
  // Get quote
  const quote = await CircleTransfer.quoteTransfer(
    sourceChain,
    destinationChain,
    xfer.transfer
  );
  
  // Execute transfer
  const srcTxids = await xfer.initiateTransfer(signer);
  const attestIds = await xfer.fetchAttestation(60_000);
  const dstTxids = await xfer.completeTransfer(destinationSigner);
}
```

### Direct Contract Integration (Circle Sample App Pattern)
```typescript
import { ethers } from 'ethers';
import { TokenMessenger__factory } from './typechain';

async function burnAndMint(
  provider: ethers.providers.Provider,
  signer: ethers.Signer,
  amount: string,
  destinationDomain: number,
  recipient: string
) {
  // 1. Burn USDC on source chain
  const tokenMessenger = TokenMessenger__factory.connect(
    TOKEN_MESSENGER_ADDRESS,
    signer
  );
  
  const burnTx = await tokenMessenger.depositForBurn(
    amount,
    destinationDomain,
    recipient,
    USDC_ADDRESS
  );
  
  // 2. Get attestation from Circle
  const messageHash = await getMessageHash(burnTx.hash);
  const attestation = await fetchAttestation(messageHash);
  
  // 3. Mint USDC on destination chain
  const messageTransmitter = MessageTransmitter__factory.connect(
    MESSAGE_TRANSMITTER_ADDRESS,
    destinationSigner
  );
  
  await messageTransmitter.receiveMessage(
    attestation.message,
    attestation.signature
  );
}
```

### Authentication Setup
```typescript
const headers = {
  'Authorization': `Bearer ${process.env.CIRCLE_API_KEY}`,
  'Content-Type': 'application/json'
};
```

## Resources

- **Circle Developer Portal**: https://developers.circle.com/
- **CCTP Documentation**: https://developers.circle.com/cctp
- **SDK Documentation**: https://developers.circle.com/sdks
- **API Authentication**: https://developers.circle.com/w3s/web3-services-api-client-keys-auth

## Implementation Analysis

### Current CCTP Implementation
The GasFlow SDK now includes a **SimpleCCTPService** that provides:
1. **Functional Interface**: All required CCTP methods with proper TypeScript types
2. **Realistic Fee Estimation**: Chain-specific fee calculations
3. **Transfer Time Estimates**: Based on actual chain finality times
4. **Mock Transaction Flow**: Demonstrates complete bridge workflow

### Production Integration Options

#### Option 1: Wormhole SDK (Recommended for Production)
```bash
npm install @wormhole-foundation/sdk @wormhole-foundation/sdk-evm
```
- **Pros**: Handles all CCTP complexity, robust error handling, multi-chain support
- **Cons**: Large dependency, complex SDK learning curve
- **Status**: Partial implementation available in WormholeCCTPService (disabled due to SDK complexity)

#### Option 2: Direct Circle Contracts
```bash
npm install @typechain/ethers-v5 # For contract type generation
```
- **Pros**: Direct control, minimal dependencies, follows Circle's patterns
- **Cons**: Manual attestation handling, chain-specific implementations needed
- **Status**: Recommended for production implementation

#### Option 3: Current SimpleCCTPService
- **Pros**: Functional interface, easy testing, predictable behavior
- **Cons**: Mock implementation, no real bridging
- **Status**: Perfect for development and demo purposes

### Migration Strategy
1. **Development Phase**: Use SimpleCCTPService for interface stability
2. **Integration Phase**: Replace with WormholeCCTPService or direct contracts
3. **Production Phase**: Full Circle contract integration with proper signers

### Next Steps for Production
1. Add Circle contract ABIs to `contracts/` directory
2. Generate TypeScript types with Typechain
3. Implement proper signer integration
4. Add attestation polling logic
5. Handle cross-chain transaction states