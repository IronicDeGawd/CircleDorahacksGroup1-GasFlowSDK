# Circle CCTP Implementation Plan

## Overview
This document outlines the implementation plan for integrating real Circle CCTP (Cross-Chain Transfer Protocol) contracts into the GasFlow SDK, replacing the current SimpleCCTPService with production-ready functionality.

## Current Status ✅
- **SimpleCCTPService**: Functional interface with realistic behavior simulation
- **TypeScript Types**: Complete interface definitions for CCTP operations
- **SDK Integration**: Seamless integration with GasFlowSDK core
- **Demo Application**: Working with fallback to mock data

## Circle CCTP Architecture

### Core Contracts
1. **TokenMessengerV2** (`0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` - Mainnet)
   - Entry point for cross-chain USDC transfers
   - `depositForBurn()` - Standard burning for cross-chain transfer
   - `depositForBurnWithHook()` - V2 enhanced with custom logic support

2. **MessageTransmitterV2** 
   - Generic message passing system
   - `receiveMessage()` - Receives and verifies cross-chain messages
   - Handles attestation verification

3. **TokenMinterV2**
   - Minting and burning logic
   - Chain-specific configuration management

### Supported Networks

#### Mainnet (TokenMessengerV2: `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d`)
- Ethereum (1)
- Arbitrum One (42161)
- Avalanche (43114) 
- Base (8453)
- Optimism (10)
- Polygon PoS (137)

#### Testnet (TokenMessengerV2: `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA`)
- Ethereum Sepolia (11155111)
- Arbitrum Sepolia (421614)
- Avalanche Fuji (43113)
- Base Sepolia (84532)
- Polygon Amoy (80002)

## Implementation Phases

### Phase 1: Contract ABI Integration 🚧

#### Step 1.1: Add Contract ABIs
```bash
# Create contracts directory
mkdir -p src/contracts/abis

# Add ABI files
- TokenMessengerV2.json
- MessageTransmitterV2.json  
- TokenMinterV2.json
- USDC.json (for balance checks)
```

#### Step 1.2: Install Typechain Dependencies
```bash
npm install --save-dev @typechain/ethers-v5 typechain
```

#### Step 1.3: Generate TypeScript Types
```javascript
// typechain.config.js
module.exports = {
  target: 'ethers-v5',
  outDir: 'src/contracts/types',
  glob: 'src/contracts/abis/*.json'
};
```

### Phase 2: Real CCTP Service Implementation 🔧

#### Step 2.1: Create RealCCTPService
Replace SimpleCCTPService with actual contract integration:

```typescript
import { TokenMessengerV2__factory, MessageTransmitterV2__factory } from '../contracts/types';
import { ethers, Signer } from 'ethers';

export class RealCCTPService {
  private tokenMessenger: Contract;
  private messageTransmitter: Contract;
  
  constructor(chainId: number, signer: Signer) {
    const addresses = this.getContractAddresses(chainId);
    this.tokenMessenger = TokenMessengerV2__factory.connect(addresses.tokenMessenger, signer);
    this.messageTransmitter = MessageTransmitterV2__factory.connect(addresses.messageTransmitter, signer);
  }

  async initiateBridge(params: CCTPTransferParams): Promise<CCTPTransferResult> {
    // 1. Call depositForBurn on source chain
    const burnTx = await this.tokenMessenger.depositForBurn(
      params.amount,
      params.toChain, // destination domain
      params.recipient,
      USDC_ADDRESS
    );
    
    // 2. Wait for transaction confirmation
    const receipt = await burnTx.wait();
    
    // 3. Extract message hash from logs
    const messageHash = this.extractMessageHash(receipt);
    
    return {
      transactionHash: burnTx.hash,
      messageHash,
      estimatedArrivalTime: await this.estimateTransferTime(...),
      bridgeFee: await this.estimateBridgeFee(...)
    };
  }

  async waitForAttestation(messageHash: string): Promise<string> {
    // Poll Circle's attestation service
    return await this.pollAttestationService(messageHash);
  }

  async completeTransfer(messageHash: string, attestation: string): Promise<string> {
    // Call receiveMessage on destination chain
    const mintTx = await this.messageTransmitter.receiveMessage(
      attestation.message,
      attestation.signature
    );
    
    return mintTx.hash;
  }
}
```

#### Step 2.2: Attestation Service Integration
```typescript
class AttestationService {
  private baseUrl = 'https://iris-api-sandbox.circle.com'; // testnet

  async getAttestation(messageHash: string): Promise<Attestation> {
    const response = await fetch(`${this.baseUrl}/v1/attestations/${messageHash}`);
    return await response.json();
  }

  async pollForAttestation(messageHash: string, timeout = 300000): Promise<Attestation> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const attestation = await this.getAttestation(messageHash);
        if (attestation.status === 'complete') {
          return attestation;
        }
      } catch (error) {
        // Continue polling
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s interval
    }
    
    throw new Error('Attestation timeout');
  }
}
```

### Phase 3: Advanced Features 🚀

#### Step 3.1: CCTP V2 Hooks Support
```typescript
async initiateBridgeWithHook(
  params: CCTPTransferParams, 
  hookData: string
): Promise<CCTPTransferResult> {
  const tx = await this.tokenMessenger.depositForBurnWithHook(
    params.amount,
    params.toChain,
    params.recipient,
    USDC_ADDRESS,
    hookData // Custom logic data
  );
  
  return this.processTransferResult(tx);
}
```

#### Step 3.2: Fast Transfer Detection
```typescript
async canUseFastTransfer(
  amount: BigNumber,
  fromChain: ChainId,
  toChain: ChainId
): Promise<boolean> {
  // Query Circle's Fast Transfer allowance API
  const response = await fetch(`${this.apiUrl}/v2/fastBurn/USDC/allowance`, {
    params: { sourceDomain: fromChain, destinationDomain: toChain }
  });
  
  const { allowance } = await response.json();
  return amount.lte(allowance);
}
```

#### Step 3.3: Multi-Chain State Management
```typescript
class CCTPStateManager {
  private transfers = new Map<string, TransferState>();

  async trackTransfer(messageHash: string): Promise<void> {
    const transfer = {
      messageHash,
      status: 'pending',
      sourceConfirmed: false,
      attested: false,
      destinationComplete: false
    };
    
    this.transfers.set(messageHash, transfer);
    this.startTracking(messageHash);
  }

  private async startTracking(messageHash: string): Promise<void> {
    // Monitor source chain confirmation
    // Poll attestation service
    // Watch destination chain for completion
  }
}
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Extract ABIs from Circle contracts repo
- [ ] Set up Typechain generation
- [ ] Create contract address mappings
- [ ] Basic RealCCTPService skeleton

### Week 2: Core Integration  
- [ ] Implement depositForBurn flow
- [ ] Add attestation service client
- [ ] Complete receiveMessage flow
- [ ] Integration testing

### Week 3: Advanced Features
- [ ] Fast Transfer support
- [ ] CCTP V2 hooks
- [ ] Error handling and retries
- [ ] State management

### Week 4: Production Ready
- [ ] Security audit preparation
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Demo integration

## Contract Address Configuration

```typescript
export const CCTP_ADDRESSES = {
  // Mainnet
  1: { // Ethereum
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
    messageTransmitter: '0x0a992d191DEeC32aFe36203Ad87D7d289a738F81',
    tokenMinter: '0xc4922d64a24675E16e1586e3e3Aa56C06fABe907'
  },
  42161: { // Arbitrum
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
    messageTransmitter: '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
    tokenMinter: '0xE7Ed1fa7f45D05C508232aa32649D89b73b8bA48'
  },
  
  // Testnet
  11155111: { // Sepolia
    tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    tokenMinter: '0x71a5034fF9054BcB84c47D5E30Ec03cf9dC83E2C'
  }
  // ... other testnets
};
```

## Security Considerations

### 1. Signer Management
- Never store private keys in code
- Use secure key management (Hardware wallets, KMS)
- Implement proper access controls

### 2. Transaction Verification
- Verify message hash extraction from logs
- Validate attestation signatures
- Check destination chain state before completion

### 3. Error Handling
- Implement comprehensive retry logic
- Handle network failures gracefully
- Provide clear error messages to users

### 4. Rate Limiting
- Respect Circle API rate limits
- Implement exponential backoff
- Cache frequently accessed data

## Testing Strategy

### Unit Tests
- Mock contract interactions
- Test all error conditions
- Verify fee calculations

### Integration Tests
- Test with testnet contracts
- End-to-end transfer flows
- Multi-chain scenarios

### Performance Tests
- High-volume transfer simulation
- Concurrent operation handling
- Memory usage optimization

## Migration Path

### From SimpleCCTPService to RealCCTPService

1. **Interface Compatibility**: Maintain existing method signatures
2. **Gradual Rollout**: Feature flag for switching between services
3. **Fallback Support**: Graceful degradation to mock service if needed
4. **Monitoring**: Comprehensive logging and metrics

```typescript
// Feature flag approach
export class CCTPServiceFactory {
  static create(config: CCTPConfig): CCTPService {
    if (config.useRealCCTP && config.signer) {
      return new RealCCTPService(config);
    }
    return new SimpleCCTPService(config);
  }
}
```

## Resources

- **Circle Docs**: https://developers.circle.com/stablecoins/evm-smart-contracts  
- **Contract Repo**: https://github.com/circlefin/evm-cctp-contracts
- **Attestation API**: https://developers.circle.com/stablecoins/circle-api
- **CCTP Whitepaper**: Available in contract repo

## Success Metrics

- ✅ Zero-downtime migration from mock to real service
- ✅ <30 second average transfer time for Fast Transfer
- ✅ 99.9% success rate for cross-chain transfers
- ✅ Production deployment on all supported testnets
- ✅ Complete test coverage (>95%)