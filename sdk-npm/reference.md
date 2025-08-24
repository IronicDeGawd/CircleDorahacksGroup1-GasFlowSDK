# GasFlow SDK - Reference Documentation

## Official Circle Documentation

### CCTP V2 (Cross-Chain Transfer Protocol)
- **CCTP Overview**: https://developers.circle.com/cctp
  - Purpose: Main landing page for CCTP documentation
  - Relevance: Core technology for cross-chain USDC transfers

- **CCTP V2 Blog Post**: https://www.circle.com/blog/cctp-v2-the-future-of-cross-chain
  - Purpose: Announcement and overview of CCTP V2 features
  - Relevance: Understanding Fast Transfer and new capabilities

- **CCTP Getting Started**: https://developers.circle.com/stablecoins/cctp-getting-started
  - Purpose: Developer onboarding guide for CCTP
  - Relevance: Implementation fundamentals

- **CCTP APIs**: https://developers.circle.com/stablecoins/cctp-apis
  - Purpose: Complete API reference for CCTP integration
  - Relevance: Technical implementation details

- **Generic Message Passing**: https://developers.circle.com/cctp/generic-message-passing
  - Purpose: Documentation for CCTP V2 Hooks functionality
  - Relevance: Advanced cross-chain interactions

- **CCTP V2 Hooks**: https://developers.circle.com/stablecoins/generic-message-passing#hooks
  - Purpose: Atomic execution with USDC transfers
  - Relevance: Enhanced functionality for our SDK

### Circle Paymaster
- **Paymaster Overview**: https://developers.circle.com/stablecoins/paymaster-overview
  - Purpose: Introduction to Circle Paymaster service
  - Relevance: Core technology for USDC gas payments

- **Paymaster Quickstart**: https://developers.circle.com/stablecoins/quickstart-circle-paymaster
  - Purpose: Quick implementation guide
  - Relevance: Implementation reference

- **Arbitrum Paymaster Guide**: https://docs.arbitrum.io/for-devs/third-party-docs/Circle/usdc-paymaster-quickstart
  - Purpose: Arbitrum-specific implementation guide
  - Relevance: Chain-specific integration details

### Testing and Development
- **Circle Testnet Faucet**: https://faucet.circle.com/
  - Purpose: Get testnet USDC for development
  - Relevance: Essential for testing

- **Developer Console Faucet**: https://console.circle.com/faucet
  - Purpose: Additional testnet token source
  - Relevance: Development environment setup

- **USDC Contract Addresses**: https://developers.circle.com/stablecoins/usdc-contract-addresses
  - Purpose: Contract addresses for all supported chains
  - Relevance: Smart contract integration

- **Testnet Transfer Guide**: https://developers.circle.com/cctp/transfer-usdc-on-testnet-from-ethereum-to-avalanche
  - Purpose: Step-by-step testnet transfer tutorial
  - Relevance: Testing our implementation

### Sample Projects and Code Examples
- **Sample Projects Browser**: https://developers.circle.com/sample-projects
  - Purpose: Official sample implementations
  - Relevance: Reference implementations and best practices

- **CCTP Sample App Repository**: https://github.com/circlefin/cctp-sample-app
  - Purpose: Complete sample application for CCTP
  - Relevance: Code structure and implementation patterns

- **Circle GitHub Organization**: https://github.com/circlefin
  - Purpose: All official Circle repositories
  - Relevance: Source code and examples

### Circle SDKs and Tools
- **Circle SDKs**: https://developers.circle.com/sdks
  - Purpose: Official SDK documentation
  - Relevance: Integration approaches and best practices

- **Circle Console**: https://console.circle.com/signup
  - Purpose: Developer dashboard and API key management
  - Relevance: Account setup and API access

- **Web3 APIs & SDKs**: https://www.circle.com/developer
  - Purpose: Complete developer platform overview
  - Relevance: Understanding available tools

## Technical Standards and Specifications

### ERC-4337 (Account Abstraction)
- **ERC-4337 Standard**: https://eips.ethereum.org/EIPS/eip-4337
  - Purpose: Account abstraction specification
  - Relevance: Required for Paymaster integration

### Blockchain Networks
- **Ethereum Sepolia Testnet**: https://sepolia.etherscan.io/
  - Purpose: Ethereum testnet explorer
  - Relevance: Testing and verification

- **Arbitrum Sepolia**: https://sepolia.arbiscan.io/
  - Purpose: Arbitrum testnet explorer
  - Relevance: Testing and verification

- **Base Sepolia**: https://sepolia.basescan.org/
  - Purpose: Base testnet explorer
  - Relevance: Testing and verification

- **Avalanche Fuji**: https://testnet.snowtrace.io/
  - Purpose: Avalanche testnet explorer
  - Relevance: Testing and verification

## Blog Posts and Educational Content

### Circle Blog Posts
- **Introducing Circle Paymaster**: https://www.circle.com/blog/introducing-circle-paymaster
  - Purpose: Announcement and explanation of Paymaster
  - Relevance: Understanding the product vision

- **Build a USDC Payment-Gated App**: https://www.circle.com/blog/build-a-usdc-payment-gated-app-with-circle-sdk
  - Purpose: Practical implementation tutorial
  - Relevance: SDK usage patterns

- **Enabling AI Agents with Blockchain**: https://www.circle.com/blog/enabling-ai-agents-with-blockchain
  - Purpose: Advanced use cases and testnet examples
  - Relevance: Implementation patterns and ideas

- **Native USDC & CCTP V2 on Sonic**: https://www.circle.com/blog/native-usdc-cctp-v2-are-coming-to-sonic-what-you-need-to-know
  - Purpose: CCTP V2 deployment information
  - Relevance: Understanding network support

### Video Tutorials
- **Circle Developer Playlist**: https://www.youtube.com/playlist?list=PLoJwRn8qrG24wgM802HEDGtzfIL6D9PYW
  - Purpose: Video tutorials for Circle developer tools
  - Relevance: Visual learning and implementation guidance

## Community and Support

### Developer Community
- **Circle Discord**: https://circle.com/discord
  - Purpose: Developer community and support
  - Relevance: Getting help and staying updated

- **Circle Developer Blog**: https://www.circle.com/topic/developer
  - Purpose: Latest developer content and updates
  - Relevance: Staying current with best practices

- **Circle Twitter/X**: https://x.com/circle/status/1866121331239969152
  - Purpose: Official announcements and updates
  - Relevance: Real-time updates on new features

## SDK Research Findings (2025-08-22)

### Official Circle SDKs
- **@circle-fin/circle-sdk**: https://www.npmjs.com/package/@circle-fin/circle-sdk
  - Purpose: Node.js SDK for Circle API
  - Version: 2.9.0 (as of research date)
  - Installation: `npm i @circle-fin/circle-sdk`
  - Last Updated: 1 year ago

### CCTP Integration Options
- **@automata-network/cctp-sdk**: https://www.npmjs.com/package/@automata-network/cctp-sdk
  - Purpose: Third-party SDK to integrate with Circle CCTP
  - Version: 1.0.32 (latest as of research)
  - Installation: `npm i @automata-network/cctp-sdk`
  - Last Updated: 7 months ago
  - Features: Complete CCTP transfer flow, testnet/mainnet support
  - Usage: transferUSDC(), approveUSDC(), burnUSDC(), mintUSDC(), etc.

- **Wormhole CCTP SDKs**:
  - @wormhole-foundation/sdk-evm-cctp (for EVM chains) - v1.15.1
  - @wormhole-foundation/sdk-solana-cctp (for Solana) - v3.1.0
  - Purpose: Alternative CCTP integration through Wormhole
  - Usage: Used in conjunction with @wormhole-foundation/sdk

### Circle Sample Implementation
- **CCTP Sample App**: https://github.com/circlefin/cctp-sample-app
  - Purpose: Official reference implementation
  - Tech Stack: React, TypeScript, Ethers.js, Typechain
  - Supported Chains: Ethereum Sepolia, Avalanche Fuji, Arbitrum Sepolia
  - Key Files: src/constants/chains.ts, src/constants/addresses.ts, src/abis/

### Circle Paymaster Integration
- **Quickstart Guide**: https://developers.circle.com/stablecoins/quickstart-circle-paymaster
  - Tech Stack: viem, dotenv
  - Integration: Permit-based USDC spending
  - Bundler: Pimlico bundler RPC
  - Key Steps: Initialize clients, check USDC balance, configure paymaster, submit UserOperation

### API Endpoints Discovered
- **Testnet**: https://iris-api-sandbox.circle.com
- **Mainnet**: https://iris-api.circle.com
- **Rate Limit**: 35 requests per second
- **Key Endpoints**:
  - GET /v2/publicKeys (validation keys)
  - GET /v2/messages (attestations)
  - POST /v2/reattest (re-attestation)
  - GET /v2/fastBurn/USDC/allowance (Fast Transfer limits)
  - GET /v2/burn/USDC/fees (transfer fees)

## Third-Party Tools and Libraries

### Ethereum Libraries
- **Ethers.js v6**: https://docs.ethers.org/v6/
  - Purpose: Ethereum interaction library
  - Relevance: Blockchain interactions in our SDK

- **Viem**: https://viem.sh/
  - Purpose: TypeScript-first Ethereum library
  - Relevance: Alternative to Ethers for type safety

### Development Tools
- **TypeScript**: https://www.typescriptlang.org/
  - Purpose: Type-safe JavaScript development
  - Relevance: SDK development language

- **Jest**: https://jestjs.io/
  - Purpose: JavaScript testing framework
  - Relevance: Unit and integration testing

## Research and Analysis References

### WebSearch Results Used
1. **Circle CCTP V2 SDK implementation examples 2025**
   - Search conducted: 2025-08-22
   - Results: Found official sample projects and implementation guides
   - Key finding: circlefin/cctp-sample-app repository with testnet examples

2. **Circle Paymaster SDK implementation examples testnet 2025**
   - Search conducted: 2025-08-22
   - Results: Found Paymaster overview and quickstart guides
   - Key finding: Testnet contract addresses and implementation tutorials

## Contract Addresses (Testnet)

### Circle Paymaster
- **Arbitrum Sepolia**: `0x31BE08D380A21fc740883c0BC434FcFc88740b58`
- **Base Sepolia**: Available (check latest docs for current address)

### USDC Token Contracts
- Reference: https://developers.circle.com/stablecoins/usdc-contract-addresses
- Note: Testnet addresses are provided in the official documentation

## API Rate Limits and Considerations

### Circle Faucet Limits
- **Rate**: 10 USDC per hour, per address, per blockchain
- **Source**: https://faucet.circle.com/
- **Note**: Can request higher limits if needed for development

### Paymaster Fees
- **Testnet**: Free until July 2025
- **Mainnet**: 10% surcharge on gas fees after July 2025
- **Source**: Circle Paymaster documentation

---

*This reference document is continuously updated as new resources are discovered during development.*