import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseUnits,
  encodeFunctionData,
  keccak256,
  toHex,
  Address
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { BigNumber } from 'ethers';
import { ChainId, PaymasterUserOperation, GasFlowTransaction } from '../types';
import { getChainConfig } from '../config/chains';
import { AlchemyBundlerClient } from './AlchemyBundlerClient';

// USDC permit signature structure
interface PermitSignature {
  r: string;
  s: string;
  v: number;
  deadline: bigint;
}

// Paymaster data structure
interface PaymasterData {
  token: Address;
  amount: bigint;
  signature: PermitSignature;
}

export class RealPaymasterService {
  private clients: Map<ChainId, any> = new Map();
  private bundlerClient?: AlchemyBundlerClient;
  
  constructor(
    private useTestnet: boolean = true,
    private alchemyApiKey?: string
  ) {
    this.initializeClients();
    
    if (this.alchemyApiKey) {
      this.bundlerClient = new AlchemyBundlerClient({
        apiKey: this.alchemyApiKey,
        useTestnet: this.useTestnet
      });
    }
  }

  private initializeClients(): void {
    const supportedChains = this.getSupportedChains();
    
    for (const chainId of supportedChains) {
      const config = getChainConfig(chainId, this.useTestnet);
      
      // Create viem chain configuration
      const viemChain = {
        id: chainId,
        name: config.name,
        network: config.name.toLowerCase().replace(' ', '-'),
        nativeCurrency: {
          name: config.gasTokenSymbol,
          symbol: config.gasTokenSymbol,
          decimals: 18,
        },
        rpcUrls: {
          default: {
            http: [config.testnetRpcUrl || config.rpcUrl],
          },
          public: {
            http: [config.testnetRpcUrl || config.rpcUrl],
          },
        },
        blockExplorers: {
          default: {
            name: 'Explorer',
            url: config.blockExplorerUrl,
          },
        },
      };

      const client = createPublicClient({
        chain: viemChain,
        transport: http(),
      });

      this.clients.set(chainId, { publicClient: client, chain: viemChain });
    }
  }

  async checkUSDCBalance(
    userAddress: Address,
    chainId: ChainId
  ): Promise<bigint> {
    const client = this.clients.get(chainId)?.publicClient;
    if (!client) {
      throw new Error(`Client not available for chain ${chainId}`);
    }

    const config = getChainConfig(chainId, this.useTestnet);
    
    try {
      const balance = await client.readContract({
        address: config.usdcAddress as Address,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ type: 'address' }],
            outputs: [{ type: 'uint256' }],
          },
        ],
        functionName: 'balanceOf',
        args: [userAddress],
      });

      return balance as bigint;
    } catch (error) {
      console.error(`Failed to check USDC balance on chain ${chainId}:`, error);
      return 0n;
    }
  }

  async generatePermitSignature(
    userPrivateKey: string,
    chainId: ChainId,
    amount: bigint,
    deadline: bigint
  ): Promise<PermitSignature> {
    const account = privateKeyToAccount(userPrivateKey as `0x${string}`);
    const config = getChainConfig(chainId, this.useTestnet);
    const client = this.clients.get(chainId);
    
    if (!client || !config.paymasterAddress) {
      throw new Error(`Paymaster not available on chain ${chainId}`);
    }

    // EIP-2612 permit domain
    const domain = {
      name: 'USD Coin',
      version: this.useTestnet ? '2' : '2', // Check actual version
      chainId: BigInt(chainId),
      verifyingContract: config.usdcAddress as Address,
    };

    // Permit type definition
    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    // Get current nonce for the user
    const nonce = await client.publicClient.readContract({
      address: config.usdcAddress as Address,
      abi: [
        {
          name: 'nonces',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ type: 'address' }],
          outputs: [{ type: 'uint256' }],
        },
      ],
      functionName: 'nonces',
      args: [account.address],
    });

    const message = {
      owner: account.address,
      spender: config.paymasterAddress as Address,
      value: amount,
      nonce: nonce as bigint,
      deadline,
    };

    try {
      // Sign the permit message
      const signature = await account.signTypedData({
        domain,
        types,
        primaryType: 'Permit',
        message,
      });

      // Extract r, s, v from signature
      const r = signature.slice(0, 66);
      const s = '0x' + signature.slice(66, 130);
      const v = parseInt(signature.slice(130, 132), 16);

      return {
        r,
        s,
        v,
        deadline,
      };
    } catch (error) {
      console.error('Failed to generate permit signature:', error);
      throw new Error(`Permit signature generation failed: ${error}`);
    }
  }

  async estimateGasWithPaymaster(
    transaction: GasFlowTransaction,
    chainId: ChainId,
    userAddress: Address
  ): Promise<{
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    usdcCost: bigint;
  }> {
    const client = this.clients.get(chainId)?.publicClient;
    if (!client) {
      throw new Error(`Client not available for chain ${chainId}`);
    }

    try {
      // Estimate gas for the transaction
      const gasEstimate = await client.estimateGas({
        to: transaction.to as Address,
        value: transaction.value ? BigInt(transaction.value.toString()) : 0n,
        data: transaction.data as `0x${string}`,
        account: userAddress,
      });

      // Get current gas price
      const gasPrice = await client.getGasPrice();

      // ERC-4337 gas estimates
      const callGasLimit = gasEstimate + (gasEstimate * 10n) / 100n; // Add 10% buffer
      const verificationGasLimit = 100000n; // Standard verification gas
      const preVerificationGas = 21000n; // Standard pre-verification gas
      const maxFeePerGas = gasPrice + (gasPrice * 20n) / 100n; // Add 20% buffer
      const maxPriorityFeePerGas = gasPrice / 10n; // 10% of gas price

      // Calculate total gas cost
      const totalGas = callGasLimit + verificationGasLimit + preVerificationGas;
      const totalCostWei = totalGas * maxFeePerGas;

      // Convert to USD (using mock price for now)
      const ethPriceUSD = this.useTestnet ? 2000 : await this.getETHPrice();
      const totalCostUSD = Number(totalCostWei) / 1e18 * ethPriceUSD;
      
      // Add Paymaster fee (10% after July 2025, free on testnet)
      const feeMultiplier = this.useTestnet ? 1 : 1.1;
      const finalCostUSD = totalCostUSD * feeMultiplier;
      
      // Convert to USDC (6 decimals)
      const usdcCost = BigInt(Math.ceil(finalCostUSD * 1e6));

      return {
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        usdcCost,
      };
    } catch (error) {
      console.error(`Gas estimation failed for chain ${chainId}:`, error);
      throw new Error(`Gas estimation failed: ${error}`);
    }
  }

  private encodePaymasterData(
    tokenAddress: Address,
    amount: bigint,
    signature: PermitSignature
  ): string {
    // Encode paymaster data according to Circle's specification
    // This is a simplified version - real implementation would follow exact format
    const encodedData = encodeFunctionData({
      abi: [
        {
          name: 'validatePaymasterUserOp',
          type: 'function',
          inputs: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'v', type: 'uint8' },
            { name: 'r', type: 'bytes32' },
            { name: 's', type: 'bytes32' },
          ],
        },
      ],
      functionName: 'validatePaymasterUserOp',
      args: [
        tokenAddress,
        amount,
        signature.deadline,
        signature.v,
        signature.r as `0x${string}`,
        signature.s as `0x${string}`,
      ],
    });

    return encodedData;
  }

  async buildUserOperation(
    transaction: GasFlowTransaction,
    chainId: ChainId,
    userAddress: Address,
    userPrivateKey: string
  ): Promise<{
    userOperation: any; // UserOperation object
    paymasterData: string;
    usdcCost: bigint;
  }> {
    const config = getChainConfig(chainId, this.useTestnet);
    
    if (!config.paymasterAddress) {
      throw new Error(`Paymaster not available on chain ${chainId}`);
    }

    // Estimate gas and costs
    const gasEstimate = await this.estimateGasWithPaymaster(
      transaction,
      chainId,
      userAddress
    );

    // Generate permit signature
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
    const permitSignature = await this.generatePermitSignature(
      userPrivateKey,
      chainId,
      gasEstimate.usdcCost,
      deadline
    );

    // Encode paymaster data
    const paymasterData = this.encodePaymasterData(
      config.usdcAddress as Address,
      gasEstimate.usdcCost,
      permitSignature
    );

    // Build UserOperation
    const userOperation = {
      sender: userAddress,
      nonce: 0n, // Should get from EntryPoint
      initCode: '0x', // For existing accounts
      callData: transaction.data || '0x',
      callGasLimit: gasEstimate.callGasLimit,
      verificationGasLimit: gasEstimate.verificationGasLimit,
      preVerificationGas: gasEstimate.preVerificationGas,
      maxFeePerGas: gasEstimate.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
      paymasterAndData: config.paymasterAddress + paymasterData.slice(2),
      signature: '0x', // To be filled by wallet
    };

    return {
      userOperation,
      paymasterData,
      usdcCost: gasEstimate.usdcCost,
    };
  }

  async submitUserOperation(
    userOperation: any,
    chainId: ChainId
  ): Promise<string> {
    if (!this.bundlerClient) {
      throw new Error('Alchemy API key not configured - cannot submit UserOperation to bundler');
    }

    console.log(`[REAL] Submitting UserOperation to Alchemy bundler for chain ${chainId}`);
    console.log('UserOperation:', JSON.stringify(userOperation, null, 2));

    try {
      const userOpHash = await this.bundlerClient.sendUserOperation(userOperation, chainId);
      console.log(`[REAL] UserOperation submitted successfully: ${userOpHash}`);
      return userOpHash;
    } catch (error) {
      console.error('[REAL] Failed to submit UserOperation to Alchemy bundler:', error);
      throw new Error(`UserOperation submission failed: ${error}`);
    }
  }

  async getOperationReceipt(
    operationHash: string,
    chainId: ChainId
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    gasUsed?: bigint;
    actualGasCost?: bigint;
  }> {
    if (!this.bundlerClient) {
      throw new Error('Alchemy API key not configured - cannot get UserOperation receipt');
    }

    console.log(`[REAL] Getting operation receipt from Alchemy: ${operationHash}`);
    
    try {
      const receipt = await this.bundlerClient.getUserOperationReceipt(operationHash, chainId);
      
      if (!receipt) {
        // Receipt not available yet (transaction still pending)
        return {
          success: false,
        };
      }

      return {
        success: receipt.success || true,
        transactionHash: receipt.receipt?.transactionHash,
        gasUsed: receipt.receipt?.gasUsed ? BigInt(receipt.receipt.gasUsed) : undefined,
        actualGasCost: receipt.actualGasCost ? BigInt(receipt.actualGasCost) : undefined,
      };
    } catch (error) {
      console.error('[REAL] Failed to get operation receipt from Alchemy:', error);
      throw new Error(`Receipt retrieval failed: ${error}`);
    }
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

  async validatePaymasterAvailability(chainId: ChainId): Promise<boolean> {
    const config = getChainConfig(chainId, this.useTestnet);
    
    if (!config.paymasterAddress) {
      return false;
    }

    const client = this.clients.get(chainId)?.publicClient;
    if (!client) {
      return false;
    }

    try {
      // Check if paymaster contract exists
      const code = await client.getBytecode({
        address: config.paymasterAddress as Address,
      });
      
      return !!code && code !== '0x';
    } catch (error) {
      console.warn(`Failed to validate paymaster on chain ${chainId}:`, error);
      return false;
    }
  }
}