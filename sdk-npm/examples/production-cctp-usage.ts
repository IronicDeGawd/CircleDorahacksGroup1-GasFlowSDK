import {
  GasFlowSDK,
  ProductionCCTPService,
  CCTPServiceFactory,
  getCCTPAddresses,
  getCCTPDomain
} from '@gasflow/sdk';
import { ethers, Wallet } from 'ethers';

/**
 * Example: Using GasFlow SDK with Production CCTP
 * This demonstrates real Circle contract integration
 */

async function main() {
  // 1. Set up providers for multiple chains
  const providers = new Map([
    [11155111, new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_KEY')],
    [421614, new ethers.providers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc')],
    [84532, new ethers.providers.JsonRpcProvider('https://sepolia.base.org')],
  ]);

  // 2. Create signers (use your private key)
  const privateKey = process.env.PRIVATE_KEY!; // NEVER hardcode private keys
  const signers = new Map([
    [11155111, new Wallet(privateKey, providers.get(11155111))],
    [421614, new Wallet(privateKey, providers.get(421614))],
    [84532, new Wallet(privateKey, providers.get(84532))],
  ]);

  // 3. Initialize GasFlow SDK with production CCTP
  const gasFlowSDK = new GasFlowSDK({
    apiKey: process.env.CIRCLE_API_KEY!, // Your Circle API key
    supportedChains: [11155111, 421614, 84532], // Testnets
    useProductionCCTP: true, // Enable real CCTP contracts
    signers: signers,
    analytics: true
  });

  // 4. Execute cross-chain transaction
  try {
    console.log('🚀 Executing cross-chain transaction...');

    const result = await gasFlowSDK.execute({
      to: '0x1A00D9a88fC5ccF7a52E268307F98739f770A956', // Target contract
      data: '0x', // Function call data
      executeOn: 421614, // Execute on Arbitrum Sepolia
      payFromChain: 11155111, // Pay from Ethereum Sepolia
      urgency: 'high' // Prioritize speed
    }, await signers.get(11155111)!.getAddress());

    console.log('✅ Transaction completed!');
    console.log(`Transaction Hash: ${result.transactionHash}`);
    console.log(`Executed on Chain: ${result.executedOnChain}`);
    console.log(`Gas Payment Chain: ${result.gasPaymentChain}`);
    console.log(`Total Cost: ${ethers.utils.formatUnits(result.totalCostUSDC, 6)} USDC`);

    if (result.estimatedSavings) {
      console.log(`Estimated Savings: ${ethers.utils.formatUnits(result.estimatedSavings, 6)} USDC`);
    }

  } catch (error) {
    console.error('❌ Transaction failed:', error);
  }
}

/**
 * Example: Direct ProductionCCTPService Usage
 */
async function directCCTPExample() {
  const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_KEY');
  const signer = new Wallet(process.env.PRIVATE_KEY!, provider);

  // Create production CCTP service directly
  const cctpService = new ProductionCCTPService(
    process.env.CIRCLE_API_KEY!,
    true // useTestnet
  );

  // Set signer for source chain
  cctpService.setSigner(11155111, signer);

  try {
    console.log('🔗 Initiating direct CCTP bridge...');

    const bridgeResult = await cctpService.initiateBridge({
      amount: ethers.utils.parseUnits('10', 6), // 10 USDC
      fromChain: 11155111, // Ethereum Sepolia
      toChain: 421614, // Arbitrum Sepolia
      recipient: await signer.getAddress(),
      useFastTransfer: true
    });

    console.log('🌉 Bridge initiated!');
    console.log(`Source Transaction: ${bridgeResult.transactionHash}`);
    console.log(`Estimated Arrival: ${bridgeResult.estimatedArrivalTime}s`);
    console.log(`Bridge Fee: ${ethers.utils.formatUnits(bridgeResult.bridgeFee, 6)} USDC`);

    // Wait for completion (you need a signer on destination chain)
    // const destinationTx = await cctpService.waitForCompletion(
    //   bridgeResult.transactionHash,
    //   11155111,
    //   421614,
    //   bridgeResult.transferObject
    // );

    // console.log(`Destination Transaction: ${destinationTx}`);

  } catch (error) {
    console.error('❌ CCTP bridge failed:', error);
  }
}

/**
 * Example: Factory Pattern for Switching Services
 */
async function factoryExample() {
  const config = {
    apiKey: process.env.CIRCLE_API_KEY!,
    useTestnet: true,
    signers: new Map() // Add your signers here
  };

  // Start with mock service for testing
  let cctpService = CCTPServiceFactory.create({
    ...config,
    useProductionCCTP: false
  });

  console.log('Using mock service for testing...');
  await testCCTPService(cctpService);

  // Switch to production service
  cctpService = CCTPServiceFactory.create({
    ...config,
    useProductionCCTP: true
  });

  console.log('Switching to production service...');
  // await testCCTPService(cctpService);
}

async function testCCTPService(service: any) {
  const amount = ethers.utils.parseUnits('1', 6);
  const fee = await service.estimateBridgeFee(amount, 11155111, 421614);
  console.log(`Bridge fee: ${ethers.utils.formatUnits(fee, 6)} USDC`);

  const canUseFast = await service.canUseFastTransfer(amount, 11155111, 421614);
  console.log(`Can use Fast Transfer: ${canUseFast}`);

  const time = await service.estimateTransferTime(amount, 11155111, 421614, canUseFast);
  console.log(`Estimated time: ${time} seconds`);
}

/**
 * Example: Contract Address Utilities
 */
function contractAddressExample() {
  console.log('📋 Circle CCTP Contract Addresses:');

  // Get addresses for Ethereum Sepolia
  const ethSepoliaAddresses = getCCTPAddresses(11155111, true);
  console.log('Ethereum Sepolia:');
  console.log(`  TokenMessenger: ${ethSepoliaAddresses.tokenMessenger}`);
  console.log(`  MessageTransmitter: ${ethSepoliaAddresses.messageTransmitter}`);
  console.log(`  USDC: ${ethSepoliaAddresses.usdc}`);

  // Get CCTP domains
  console.log('\n🌐 CCTP Domains:');
  console.log(`Ethereum Sepolia: ${getCCTPDomain(11155111)}`);
  console.log(`Arbitrum Sepolia: ${getCCTPDomain(421614)}`);
  console.log(`Base Sepolia: ${getCCTPDomain(84532)}`);
}

/**
 * Environment Setup Instructions
 */
function setupInstructions() {
  console.log(`
📝 Setup Instructions:

1. Environment Variables:
   export CIRCLE_API_KEY="your-circle-api-key"
   export PRIVATE_KEY="your-private-key-for-testing"
   export INFURA_KEY="your-infura-project-id"

2. Get Testnet USDC:
   - Ethereum Sepolia: https://faucet.circle.com/
   - Arbitrum Sepolia: Bridge from Ethereum Sepolia
   - Base Sepolia: Bridge from Ethereum Sepolia

3. Get ETH for gas:
   - Use testnet faucets for each chain
   - Ethereum Sepolia: https://sepoliafaucet.com/
   - Arbitrum Sepolia: https://faucet.quicknode.com/arbitrum/sepolia
   - Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

4. Circle API Key:
   - Sign up at https://developers.circle.com/
   - Create API key in the dashboard
   - Use testnet endpoint for development

5. Usage:
   npx tsx examples/production-cctp-usage.ts
  `);
}

// Export examples for testing
export {
  main,
  directCCTPExample,
  factoryExample,
  contractAddressExample,
  setupInstructions
};

// Run main example if called directly
if (require.main === module) {
  // Check environment
  if (!process.env.CIRCLE_API_KEY || !process.env.PRIVATE_KEY) {
    console.error('❌ Missing required environment variables');
    setupInstructions();
    process.exit(1);
  }

  main()
    .then(() => console.log('✅ Example completed'))
    .catch(error => {
      console.error('❌ Example failed:', error);
      process.exit(1);
    });
}
