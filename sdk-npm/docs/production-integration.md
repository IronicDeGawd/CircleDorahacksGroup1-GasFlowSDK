# Production CCTP Integration Guide

## Overview
This guide provides step-by-step instructions for integrating real Circle CCTP contracts with the GasFlow SDK, replacing the SimpleCCTPService with production-ready functionality.

## Current Status ✅

The GasFlow SDK now includes all necessary components for production CCTP integration:

- ✅ **Contract ABIs**: TokenMessengerV2, MessageTransmitterV2, USDC
- ✅ **TypeScript Types**: Generated with Typechain for type safety
- ✅ **Contract Addresses**: Complete mapping for all supported chains
- ✅ **Domain Mapping**: Circle's internal domain routing configuration
- ✅ **Utility Functions**: Address helpers and validation

## Quick Start

### 1. Import Required Components

```typescript
import { 
  GasFlowSDK,
  getCCTPAddresses,
  getCCTPDomain,
  TokenMessengerV2__factory,
  MessageTransmitterV2__factory,
  USDC__factory
} from '@gasflow/sdk';
import { ethers } from 'ethers';
```

### 2. Basic CCTP Transfer

```typescript
async function performCCTPTransfer(
  signer: ethers.Signer,
  amount: string,
  fromChainId: number,
  toChainId: number,
  recipient: string
) {
  // Get contract addresses
  const fromAddresses = getCCTPAddresses(fromChainId, true); // testnet
  const toAddresses = getCCTPAddresses(toChainId, true);
  
  // Get domain IDs  
  const destinationDomain = getCCTPDomain(toChainId);
  
  // Initialize contracts
  const tokenMessenger = TokenMessengerV2__factory.connect(
    fromAddresses.tokenMessenger,
    signer
  );
  
  const usdc = USDC__factory.connect(fromAddresses.usdc, signer);
  
  // 1. Approve USDC spending
  const approveTx = await usdc.approve(
    fromAddresses.tokenMessenger,
    amount
  );
  await approveTx.wait();
  
  // 2. Initiate burn on source chain
  const burnTx = await tokenMessenger.depositForBurn(
    amount,
    destinationDomain,
    ethers.utils.formatBytes32String(recipient), // Convert to bytes32
    fromAddresses.usdc
  );
  
  const receipt = await burnTx.wait();
  console.log('Burn completed:', receipt.transactionHash);
  
  // 3. Extract message hash and get attestation
  const messageHash = extractMessageHash(receipt);
  const attestation = await waitForAttestation(messageHash);
  
  // 4. Complete on destination chain (requires destination signer)
  // ... destination chain completion logic
  
  return receipt.transactionHash;
}
```

### 3. Production RealCCTPService Implementation

```typescript
import { 
  CCTPTransferParams, 
  CCTPTransferResult,
  getCCTPAddresses,
  getCCTPDomain,
  TokenMessengerV2__factory,
  MessageTransmitterV2__factory
} from '@gasflow/sdk';
import { ethers, Signer, BigNumber } from 'ethers';

export class ProductionCCTPService {
  private signers: Map<number, Signer> = new Map();
  
  constructor(
    private useTestnet: boolean = true,
    private circleApiKey: string = ''
  ) {}
  
  setSigner(chainId: number, signer: Signer): void {
    this.signers.set(chainId, signer);
  }
  
  async initiateBridge(params: CCTPTransferParams): Promise<CCTPTransferResult> {
    const { amount, fromChain, toChain, recipient } = params;
    
    // Validate inputs
    if (!this.signers.has(fromChain)) {
      throw new Error(`No signer available for chain ${fromChain}`);
    }
    
    const signer = this.signers.get(fromChain)!;
    const addresses = getCCTPAddresses(fromChain, this.useTestnet);
    const destinationDomain = getCCTPDomain(toChain);
    
    // Initialize contracts
    const tokenMessenger = TokenMessengerV2__factory.connect(
      addresses.tokenMessenger,
      signer
    );
    
    const usdc = USDC__factory.connect(addresses.usdc, signer);
    
    try {
      // 1. Check and approve USDC if needed
      const currentAllowance = await usdc.allowance(
        await signer.getAddress(),
        addresses.tokenMessenger
      );
      
      if (currentAllowance.lt(amount)) {
        const approveTx = await usdc.approve(
          addresses.tokenMessenger,
          amount
        );
        await approveTx.wait();
      }
      
      // 2. Initiate cross-chain burn
      const burnTx = await tokenMessenger.depositForBurn(
        amount,
        destinationDomain,
        this.addressToBytes32(recipient),
        addresses.usdc
      );
      
      const receipt = await burnTx.wait();
      
      // 3. Extract message hash from events
      const messageHash = this.extractMessageHashFromReceipt(receipt);
      
      return {
        transactionHash: burnTx.hash,
        attestationHash: messageHash,
        estimatedArrivalTime: await this.estimateTransferTime(amount, fromChain, toChain),
        bridgeFee: await this.estimateBridgeFee(amount, fromChain, toChain)
      };
      
    } catch (error) {
      console.error('CCTP bridge initiation failed:', error);
      throw new Error(`Bridge failed: ${error}`);
    }
  }
  
  async waitForCompletion(
    messageHash: string,
    fromChain: number,
    toChain: number
  ): Promise<string> {
    try {
      // 1. Wait for attestation from Circle
      const attestation = await this.pollForAttestation(messageHash);
      
      // 2. Complete transfer on destination chain
      return await this.completeTransferOnDestination(
        attestation,
        toChain
      );
      
    } catch (error) {
      console.error('Failed to complete CCTP transfer:', error);
      throw error;
    }
  }
  
  private async pollForAttestation(
    messageHash: string,
    timeoutMs: number = 300000 // 5 minutes
  ): Promise<{ message: string; signature: string }> {
    const startTime = Date.now();
    const baseUrl = this.useTestnet 
      ? 'https://iris-api-sandbox.circle.com'
      : 'https://iris-api.circle.com';
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch(
          `${baseUrl}/v1/attestations/${messageHash}`,
          {
            headers: {
              'Authorization': `Bearer ${this.circleApiKey}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'complete') {
            return {
              message: data.message,
              signature: data.attestation
            };
          }
        }
      } catch (error) {
        console.warn('Attestation polling attempt failed:', error);
      }
      
      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Attestation timeout - transfer may still complete');
  }
  
  private async completeTransferOnDestination(
    attestation: { message: string; signature: string },
    toChain: number
  ): Promise<string> {
    if (!this.signers.has(toChain)) {
      throw new Error(`No signer available for destination chain ${toChain}`);
    }
    
    const signer = this.signers.get(toChain)!;
    const addresses = getCCTPAddresses(toChain, this.useTestnet);
    
    const messageTransmitter = MessageTransmitterV2__factory.connect(
      addresses.messageTransmitter,
      signer
    );
    
    // Submit attestation to complete the transfer
    const mintTx = await messageTransmitter.receiveMessage(
      attestation.message,
      attestation.signature
    );
    
    const receipt = await mintTx.wait();
    return receipt.transactionHash;
  }
  
  private extractMessageHashFromReceipt(receipt: ethers.ContractReceipt): string {
    // Find MessageSent event and extract message hash
    // Implementation depends on specific event structure
    const messageSentEvent = receipt.events?.find(
      event => event.event === 'MessageSent'
    );
    
    if (!messageSentEvent) {
      throw new Error('MessageSent event not found in receipt');
    }
    
    // Extract message hash from event data
    return ethers.utils.keccak256(messageSentEvent.args?.message || '0x');
  }
  
  private addressToBytes32(address: string): string {
    return ethers.utils.hexZeroPad(address, 32);
  }
  
  // ... other utility methods
}
```

## Integration with GasFlowSDK

### Replace SimpleCCTPService

```typescript
// src/core/GasFlowSDK.ts
import { ProductionCCTPService } from '../services/ProductionCCTPService';

export class GasFlowSDK {
  private cctpService: ProductionCCTPService;
  
  constructor(private config: GasFlowConfig & { signers?: Map<number, Signer> }) {
    // Initialize with production service
    this.cctpService = new ProductionCCTPService(
      config.useTestnet ?? true,
      config.apiKey
    );
    
    // Set up signers for each supported chain
    if (config.signers) {
      config.signers.forEach((signer, chainId) => {
        this.cctpService.setSigner(chainId, signer);
      });
    }
    
    // ... rest of initialization
  }
}
```

### Usage Example

```typescript
import { GasFlowSDK, getCCTPAddresses } from '@gasflow/sdk';
import { ethers } from 'ethers';

// Set up providers and signers
const providers = new Map([
  [11155111, new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/...')],
  [421614, new ethers.providers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc')],
]);

const signers = new Map([
  [11155111, new ethers.Wallet(privateKey, providers.get(11155111))],
  [421614, new ethers.Wallet(privateKey, providers.get(421614))],
]);

// Initialize SDK with real CCTP
const gasFlowSDK = new GasFlowSDK({
  apiKey: 'your-circle-api-key',
  supportedChains: [11155111, 421614],
  useTestnet: true,
  signers: signers
});

// Execute cross-chain transaction
const result = await gasFlowSDK.execute({
  to: '0xContractAddress',
  data: '0x...',
  executeOn: 421614, // Arbitrum Sepolia
  payFromChain: 11155111 // Ethereum Sepolia
}, userAddress);

console.log('Transaction completed:', result.transactionHash);
```

## Testing Strategy

### Unit Tests with Mock Contracts

```typescript
import { MockContract } from '@ethereum-waffle/mock-contract';
import { TokenMessengerV2__factory } from '@gasflow/sdk';

describe('ProductionCCTPService', () => {
  let mockTokenMessenger: MockContract;
  
  beforeEach(async () => {
    mockTokenMessenger = await deployMockContract(
      signer,
      TokenMessengerV2__factory.abi
    );
  });
  
  it('should initiate bridge transfer', async () => {
    // Mock the depositForBurn function
    await mockTokenMessenger.mock.depositForBurn.returns(1);
    
    const result = await cctpService.initiateBridge({
      amount: BigNumber.from('1000000'),
      fromChain: 11155111,
      toChain: 421614,
      recipient: '0x...'
    });
    
    expect(result.transactionHash).toBeDefined();
  });
});
```

### Integration Tests on Testnets

```typescript
describe('CCTP Integration Tests', () => {
  it('should complete end-to-end transfer on testnets', async function() {
    this.timeout(300000); // 5 minute timeout
    
    const amount = ethers.utils.parseUnits('1', 6); // 1 USDC
    
    const result = await cctpService.initiateBridge({
      amount,
      fromChain: 11155111,
      toChain: 421614,
      recipient: destinationAddress
    });
    
    // Wait for completion
    const destinationTx = await cctpService.waitForCompletion(
      result.attestationHash!,
      11155111,
      421614
    );
    
    expect(destinationTx).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });
});
```

## Security Considerations

### 1. Private Key Management
- Use hardware wallets or secure key management systems
- Never store private keys in code or environment variables
- Consider using AWS KMS or similar for production key storage

### 2. Transaction Verification
```typescript
// Verify transaction parameters before signing
function validateTransferParams(params: CCTPTransferParams): void {
  if (params.amount.lte(0)) {
    throw new Error('Invalid transfer amount');
  }
  
  if (!ethers.utils.isAddress(params.recipient)) {
    throw new Error('Invalid recipient address');
  }
  
  if (!isCCTPSupported(params.fromChain) || !isCCTPSupported(params.toChain)) {
    throw new Error('Unsupported chain for CCTP');
  }
}
```

### 3. Rate Limiting and Error Handling
```typescript
class RateLimitedCCTPService extends ProductionCCTPService {
  private requestCounts = new Map<string, number>();
  private lastResetTime = Date.now();
  private readonly MAX_REQUESTS_PER_HOUR = 100;
  
  async initiateBridge(params: CCTPTransferParams): Promise<CCTPTransferResult> {
    this.checkRateLimit();
    
    try {
      return await super.initiateBridge(params);
    } catch (error) {
      // Implement exponential backoff for retries
      if (this.isRetryableError(error)) {
        return await this.retryWithBackoff(() => super.initiateBridge(params));
      }
      throw error;
    }
  }
  
  private checkRateLimit(): void {
    const now = Date.now();
    if (now - this.lastResetTime > 3600000) { // 1 hour
      this.requestCounts.clear();
      this.lastResetTime = now;
    }
    
    const currentCount = this.requestCounts.get('bridge') || 0;
    if (currentCount >= this.MAX_REQUESTS_PER_HOUR) {
      throw new Error('Rate limit exceeded');
    }
    
    this.requestCounts.set('bridge', currentCount + 1);
  }
}
```

## Migration Checklist

- [ ] Install Typechain dependencies (`@typechain/ethers-v5`)
- [ ] Generate contract types with `npm run typechain`
- [ ] Set up signers for all supported chains
- [ ] Configure Circle API key for attestation service
- [ ] Update GasFlowSDK to use ProductionCCTPService
- [ ] Test on testnets with small amounts
- [ ] Implement comprehensive error handling
- [ ] Set up monitoring and alerting
- [ ] Security audit before mainnet deployment
- [ ] Document operational procedures

## Resources

- **Contract Types**: All generated in `src/contracts/types/`
- **Addresses**: `src/contracts/addresses.ts`
- **Circle API**: https://developers.circle.com/stablecoins/circle-api
- **CCTP Docs**: https://developers.circle.com/stablecoins/evm-smart-contracts
- **Implementation Plan**: `docs/cctp-implementation-plan.md`