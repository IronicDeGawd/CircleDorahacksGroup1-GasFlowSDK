import { BigNumber } from 'ethers';
import { ChainId, PaymasterUserOperation, GasFlowTransaction } from '../types';
import { getChainConfig } from '../config/chains';
import { AlchemyBundlerClient } from './AlchemyBundlerClient';

export interface PaymasterQuote {
  paymasterAndData: string;
  preVerificationGas: BigNumber;
  verificationGasLimit: BigNumber;
  callGasLimit: BigNumber;
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
  usdcCost: BigNumber;
  validUntil: number;
}

export class PaymasterService {
  private readonly PAYMASTER_FEE_PERCENTAGE = 10; // 10% markup (after July 2025)
  private bundlerClient?: AlchemyBundlerClient;
  
  constructor(
    private apiKey: string,
    private useTestnet: boolean = true,
    private alchemyApiKey?: string
  ) {
    if (this.alchemyApiKey) {
      this.bundlerClient = new AlchemyBundlerClient({
        apiKey: this.alchemyApiKey,
        useTestnet: this.useTestnet
      });
    }
  }

  async getPaymasterQuote(
    transaction: GasFlowTransaction,
    chainId: ChainId,
    userAddress: string
  ): Promise<PaymasterQuote> {
    const config = getChainConfig(chainId, this.useTestnet);
    
    if (!config.paymasterAddress) {
      throw new Error(`Paymaster not available on chain ${chainId}`);
    }

    try {
      // Mock implementation - in real version this would call Circle's Paymaster API
      console.log(`[MOCK] Getting Paymaster quote for chain ${chainId}`);

      // Estimate gas parameters
      const callGasLimit = transaction.gasLimit || BigNumber.from(21000);
      const verificationGasLimit = BigNumber.from(100000);
      const preVerificationGas = BigNumber.from(21000);
      const maxFeePerGas = BigNumber.from('20000000000'); // 20 gwei
      const maxPriorityFeePerGas = BigNumber.from('2000000000'); // 2 gwei

      // Calculate total gas cost
      const totalGas = callGasLimit.add(verificationGasLimit).add(preVerificationGas);
      const gasCostWei = totalGas.mul(maxFeePerGas);

      // Convert to USDC (assuming ETH price and adding Paymaster fee)
      const ethPriceUSD = this.useTestnet ? 2000 : await this.getETHPrice();
      const gasCostUSD = parseFloat(gasCostWei.toString()) / 1e18 * ethPriceUSD;
      
      // Add Paymaster fee if not testnet
      const feeMultiplier = this.useTestnet ? 1 : (1 + this.PAYMASTER_FEE_PERCENTAGE / 100);
      const finalCostUSD = gasCostUSD * feeMultiplier;
      
      // Convert to USDC (6 decimals)
      const usdcCost = BigNumber.from(Math.ceil(finalCostUSD * 1e6));

      // Generate mock paymaster data
      const paymasterAndData = this.generatePaymasterData(config.paymasterAddress, usdcCost);

      return {
        paymasterAndData,
        preVerificationGas,
        verificationGasLimit,
        callGasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
        usdcCost,
        validUntil: Date.now() + 300000, // Valid for 5 minutes
      };
    } catch (error) {
      console.error(`Failed to get Paymaster quote for chain ${chainId}:`, error);
      throw new Error(`Paymaster quote failed: ${error}`);
    }
  }

  private generatePaymasterData(paymasterAddress: string, usdcCost: BigNumber): string {
    // Mock paymaster data encoding
    // Real implementation would follow ERC-4337 paymaster data format
    const paymasterData = {
      paymaster: paymasterAddress,
      usdcAmount: usdcCost.toString(),
      timestamp: Date.now(),
    };

    // In real implementation, this would be properly encoded
    return paymasterAddress + '000000000000000000000000' + usdcCost.toHexString().slice(2).padStart(64, '0');
  }

  async buildUserOperation(
    transaction: GasFlowTransaction,
    chainId: ChainId,
    userAddress: string,
    nonce?: BigNumber
  ): Promise<PaymasterUserOperation> {
    const quote = await this.getPaymasterQuote(transaction, chainId, userAddress);
    
    // Build the UserOperation
    const userOp: PaymasterUserOperation = {
      sender: userAddress,
      nonce: nonce || BigNumber.from(0),
      initCode: '0x', // For existing accounts
      callData: this.encodeCallData(transaction),
      callGasLimit: quote.callGasLimit,
      verificationGasLimit: quote.verificationGasLimit,
      preVerificationGas: quote.preVerificationGas,
      maxFeePerGas: quote.maxFeePerGas,
      maxPriorityFeePerGas: quote.maxPriorityFeePerGas,
      paymasterAndData: quote.paymasterAndData,
      signature: '0x', // To be filled by wallet
    };

    return userOp;
  }

  private encodeCallData(transaction: GasFlowTransaction): string {
    // Mock call data encoding
    // Real implementation would properly encode the transaction
    if (transaction.data) {
      return transaction.data;
    }

    // Simple transfer encoding
    if (transaction.value && transaction.value.gt(0)) {
      return '0x'; // ETH transfer
    }

    return '0x';
  }

  async submitUserOperation(
    userOp: PaymasterUserOperation,
    chainId: ChainId
  ): Promise<string> {
    if (!this.bundlerClient) {
      // Fallback to mock for development/testing when no Alchemy key provided
      console.warn('[MOCK] No Alchemy API key configured - using mock implementation');
      console.log(`[MOCK] Submitting UserOperation to chain ${chainId}`);
      console.log('UserOperation:', userOp);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return '0x' + Math.random().toString(16).substr(2, 64);
    }

    console.log(`[PAYMASTER] Submitting UserOperation to Alchemy bundler for chain ${chainId}`);
    console.log('UserOperation:', JSON.stringify(userOp, null, 2));

    try {
      const userOpHash = await this.bundlerClient.sendUserOperation(userOp, chainId);
      console.log(`[PAYMASTER] UserOperation submitted successfully: ${userOpHash}`);
      return userOpHash;
    } catch (error) {
      console.error('[PAYMASTER] Failed to submit UserOperation to Alchemy bundler:', error);
      throw new Error(`UserOperation submission failed: ${error}`);
    }
  }

  async getOperationStatus(
    operationHash: string,
    chainId: ChainId
  ): Promise<'pending' | 'included' | 'failed'> {
    // Mock implementation
    console.log(`[MOCK] Checking operation status: ${operationHash}`);
    
    // Simulate random status
    const statuses = ['pending', 'included'] as const;
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  async waitForInclusion(
    operationHash: string,
    chainId: ChainId,
    timeoutMs: number = 60000
  ): Promise<string> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getOperationStatus(operationHash, chainId);
      
      if (status === 'included') {
        // Return mock transaction hash
        return '0x' + Math.random().toString(16).substr(2, 64);
      }
      
      if (status === 'failed') {
        throw new Error('UserOperation failed');
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('UserOperation timeout');
  }

  private async getETHPrice(): Promise<number> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      const data = await response.json();
      return data.ethereum.usd;
    } catch (error) {
      console.warn('Failed to fetch ETH price, using fallback:', error);
      return 2000;
    }
  }

  isPaymasterAvailable(chainId: ChainId): boolean {
    const config = getChainConfig(chainId, this.useTestnet);
    return !!config.paymasterAddress;
  }

  getSupportedChains(): ChainId[] {
    const supportedChains: ChainId[] = [];
    
    if (this.useTestnet) {
      // Testnet chains with Paymaster support
      if (getChainConfig(11155111, true).paymasterAddress) {
        supportedChains.push(11155111); // Ethereum Sepolia
      }
      if (getChainConfig(421614, true).paymasterAddress) {
        supportedChains.push(421614); // Arbitrum Sepolia
      }
      if (getChainConfig(84532, true).paymasterAddress) {
        supportedChains.push(84532); // Base Sepolia
      }
      if (getChainConfig(43113, true).paymasterAddress) {
        supportedChains.push(43113); // Avalanche Fuji
      }
      if (getChainConfig(80002, true).paymasterAddress) {
        supportedChains.push(80002); // Polygon Amoy
      }
    } else {
      // Mainnet chains with Paymaster support
      supportedChains.push(42161); // Arbitrum One
      supportedChains.push(8453);  // Base
    }
    
    return supportedChains;
  }
}