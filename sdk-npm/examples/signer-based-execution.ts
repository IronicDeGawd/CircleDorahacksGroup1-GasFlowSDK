import { GasFlowSDK, TraditionalExecutionService, ExecutionMode } from '@gasflow/sdk';
import { ethers } from 'ethers';

/**
 * Example: Signer-Based Execution with MetaMask Integration
 * Demonstrates how to use the GasFlow SDK with web wallet signers
 */

async function metaMaskIntegrationExample() {
  console.log('🦊 MetaMask Integration Example');
  
  // 1. Connect to MetaMask (simulated for this example)
  // In real frontend, you would use: window.ethereum
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();
  
  console.log(`Connected to wallet: ${userAddress}`);
  
  // 2. Initialize SDK with signer-based execution preference
  const gasFlowSDK = new GasFlowSDK({
    apiKey: process.env.VITE_CIRCLE_API_KEY || 'demo_mode',
    supportedChains: [11155111, 421614, 84532], // Testnet chains
    executionMode: 'traditional', // Prefer traditional gas execution
    preferSignerExecution: true,
    analytics: true
  });
  
  // 3. Configure signers for all supported chains
  // Note: In real MetaMask integration, you'd need to switch networks
  gasFlowSDK.setSignerForAllChains(signer);
  
  // 4. Execute transaction with signer (no private key needed)
  try {
    console.log('🚀 Executing transaction with signer...');
    
    const result = await gasFlowSDK.execute(
      {
        to: '0x1A00D9a88fC5ccF7a52E268307F98739f770A956',
        value: ethers.utils.parseEther('0.01'), // 0.01 ETH
        data: '0x',
        executeOn: 11155111, // Ethereum Sepolia
        payFromChain: 'auto',
        urgency: 'high'
      },
      userAddress,
      undefined, // No private key - MetaMask handles signing
      signer     // Pass MetaMask signer
    );
    
    console.log('✅ Transaction completed with traditional gas!');
    console.log(`Transaction Hash: ${result.transactionHash}`);
    console.log(`Executed on Chain: ${result.executedOnChain}`);
    console.log(`Gas Used: ${result.gasUsed.toString()}`);
    
  } catch (error) {
    console.error('❌ Transaction failed:', error);
  }
}

/**
 * Example: Direct Traditional Execution Service Usage
 */
async function directTraditionalExecutionExample() {
  console.log('🔗 Direct Traditional Execution Example');
  
  // Setup provider and signer
  const provider = new ethers.providers.JsonRpcProvider(
    'https://sepolia.infura.io/v3/YOUR_KEY'
  );
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  // Create traditional execution service
  const executionService = new TraditionalExecutionService(true);
  
  try {
    console.log('💰 Executing direct transaction...');
    
    const result = await executionService.executeTransaction(
      {
        to: '0x1A00D9a88fC5ccF7a52E268307F98739f770A956',
        value: ethers.utils.parseEther('0.01'),
        data: '0x'
      },
      signer,
      11155111 // Ethereum Sepolia
    );
    
    console.log('✅ Direct execution completed!');
    console.log(`Transaction Hash: ${result.transactionHash}`);
    console.log(`Gas Used: ${result.gasUsed.toString()}`);
    console.log(`Gas Price: ${result.gasPrice.toString()}`);
    console.log(`Total Gas Cost: ${ethers.utils.formatEther(result.totalGasCost)} ETH`);
    
  } catch (error) {
    console.error('❌ Direct execution failed:', error);
  }
}

/**
 * Example: Execution Mode Comparison
 */
async function executionModeComparison() {
  console.log('⚖️ Execution Mode Comparison');
  
  const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_KEY');
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const userAddress = await signer.getAddress();
  
  const transaction = {
    to: '0x1A00D9a88fC5ccF7a52E268307F98739f770A956',
    value: ethers.utils.parseEther('0.01'),
    executeOn: 11155111,
    payFromChain: 11155111,
    urgency: 'high' as const
  };
  
  // Test with different execution modes
  const modes: ExecutionMode[] = ['paymaster', 'traditional', 'auto'];
  
  for (const mode of modes) {
    console.log(`\n🧪 Testing execution mode: ${mode}`);
    
    const sdk = new GasFlowSDK({
      apiKey: process.env.CIRCLE_API_KEY || 'demo_mode',
      supportedChains: [11155111],
        executionMode: mode,
      alchemyApiKey: process.env.ALCHEMY_API_KEY
    });
    
    sdk.setSigner(11155111, signer);
    
    try {
      const result = await sdk.execute(
        transaction,
        userAddress,
        mode === 'paymaster' ? process.env.PRIVATE_KEY : undefined,
        signer
      );
      
      console.log(`✅ ${mode} execution successful: ${result.transactionHash}`);
      
    } catch (error) {
      console.log(`❌ ${mode} execution failed:`, error.message);
    }
  }
}

/**
 * Example: Pre-flight Validation
 */
async function preFlightValidationExample() {
  console.log('🔍 Pre-flight Validation Example');
  
  const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_KEY');
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  const executionService = new TraditionalExecutionService(true);
  
  const validation = await executionService.validateExecution(
    {
      to: '0x1A00D9a88fC5ccF7a52E268307F98739f770A956',
      value: ethers.utils.parseEther('0.01'),
      data: '0x'
    },
    signer,
    11155111
  );
  
  console.log('Validation Result:', validation);
  
  if (!validation.canExecute) {
    console.log('❌ Transaction validation failed:');
    validation.issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('✅ Transaction validation passed');
  }
}

// Export examples for testing
export {
  metaMaskIntegrationExample,
  directTraditionalExecutionExample,
  executionModeComparison,
  preFlightValidationExample
};

// Usage instructions
console.log(`
📚 Signer-Based Execution Examples:

1. MetaMask Integration:
   - Uses signer directly from MetaMask
   - No private key required
   - Automatic network switching support

2. Direct Service Usage:
   - Use TraditionalExecutionService directly
   - Full control over transaction execution
   - Comprehensive gas estimation

3. Mode Comparison:
   - Test different execution modes
   - Compare paymaster vs traditional
   - Automatic fallback logic

4. Validation:
   - Pre-flight checks before execution
   - Balance and network validation
   - Error prevention

Usage:
  import { metaMaskIntegrationExample } from './examples/signer-based-execution';
  await metaMaskIntegrationExample();
`);