import { 
  createPublicClient, 
  http, 
  Address,
  encodePacked
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { toCircleSmartAccount } from '@circle-fin/modular-wallets-core';
import { createBundlerClient } from 'viem/account-abstraction';
import { BigNumber } from 'ethers';
import { ChainId, GasFlowTransaction } from '../types';
import { getChainConfig } from '../config/chains';

async function signPermit({
  tokenAddress,
  account,
  client,
  spenderAddress,
  permitAmount,
}: {
  tokenAddress: Address;
  account: any;
  client: any;
  spenderAddress: Address;
  permitAmount: bigint;
}): Promise<string> {
  const nonce = await client.readContract({
    address: tokenAddress,
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

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId: BigInt(client.chain.id),
    verifyingContract: tokenAddress,
  };

  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  const message = {
    owner: account.address,
    spender: spenderAddress,
    value: permitAmount,
    nonce: nonce as bigint,
    deadline,
  };

  const signature = await account.signTypedData({
    domain,
    types,
    primaryType: 'Permit',
    message,
  });

  return signature;
}

export class RealPaymasterService {
  private clients: Map<ChainId, any> = new Map();
  
  constructor(
    private useTestnet: boolean = true,
    private alchemyApiKey?: string
  ) {
    this.initializeClients();
  }

  private initializeClients(): void {
    const supportedChains = this.getSupportedChains();
    
    for (const chainId of supportedChains) {
      const config = getChainConfig(chainId, this.useTestnet);
      
      const viemChain = {
        id: chainId,
        name: config.name,
        network: config.name.toLowerCase().replace(/\s+/g, '-'),
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

  async createSmartAccount(
    privateKey: string,
    chainId: ChainId
  ): Promise<any> {
    const config = getChainConfig(chainId, this.useTestnet);
    const clientData = this.clients.get(chainId);
    
    if (!clientData || !config.paymasterAddress) {
      throw new Error(`Circle Smart Account not supported on chain ${chainId}`);
    }

    try {
      const owner = privateKeyToAccount(privateKey as `0x${string}`);
      const account = await toCircleSmartAccount({ 
        client: clientData.publicClient, 
        owner 
      });
      
      console.log(`[CIRCLE] Created Smart Account: ${account.address}`);
      return account;
    } catch (error) {
      console.error(`Failed to create Circle Smart Account on chain ${chainId}:`, error);
      throw new Error(`Smart account creation failed: ${error}`);
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
      const gasEstimate = await client.estimateGas({
        to: transaction.to as Address,
        value: transaction.value ? BigInt(transaction.value.toString()) : 0n,
        data: transaction.data as `0x${string}`,
        account: userAddress,
      });

      const gasPrice = await client.getGasPrice();

      const callGasLimit = gasEstimate + (gasEstimate * 10n) / 100n;
      const verificationGasLimit = 100000n;
      const preVerificationGas = 21000n;
      const maxFeePerGas = gasPrice + (gasPrice * 20n) / 100n;
      const maxPriorityFeePerGas = gasPrice / 10n;

      const totalGas = callGasLimit + verificationGasLimit + preVerificationGas;
      const totalCostWei = totalGas * maxFeePerGas;

      const ethPriceUSD = this.useTestnet ? 2000 : await this.getETHPrice();
      const totalCostUSD = Number(totalCostWei) / 1e18 * ethPriceUSD;
      
      const feeMultiplier = this.useTestnet ? 1 : 1.1;
      const finalCostUSD = totalCostUSD * feeMultiplier;
      
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

  async executeWithPaymaster(
    transaction: GasFlowTransaction,
    privateKey: string,
    chainId: ChainId
  ): Promise<string> {
    const config = getChainConfig(chainId, this.useTestnet);
    if (!config.paymasterAddress) {
      throw new Error(`Paymaster not available on chain ${chainId}`);
    }

    console.log(`[CIRCLE] Executing transaction with Circle Paymaster v0.8 on chain ${chainId}`);

    try {
      const account = await this.createSmartAccount(privateKey, chainId);
      const clientData = this.clients.get(chainId);
      console.log(`[CIRCLE] Using Smart Account: ${account.address}`);

      const paymaster = {
        async getPaymasterData(parameters: any) {
          const permitAmount = 10000000n;
          
          const permitSignature = await signPermit({
            tokenAddress: config.usdcAddress as Address,
            account,
            client: clientData.publicClient,
            spenderAddress: config.paymasterAddress as Address,
            permitAmount,
          });

          const paymasterData = encodePacked(
            ["uint8", "address", "uint256", "bytes"],
            [0, config.usdcAddress as Address, permitAmount, permitSignature as `0x${string}`]
          );

          return {
            paymaster: config.paymasterAddress as Address,
            paymasterData,
            paymasterVerificationGasLimit: 200000n,
            paymasterPostOpGasLimit: 15000n,
            isFinal: true,
          };
        },
      };

      const bundlerClient = createBundlerClient({
        account,
        client: clientData.publicClient,
        paymaster,
        transport: http(config.bundlerUrl ? `${config.bundlerUrl}/${this.alchemyApiKey}` : undefined),
      });

      const hash = await bundlerClient.sendUserOperation({
        account,
        calls: [
          {
            to: transaction.to as Address,
            value: BigInt(transaction.value?.toString() || '0'),
            data: transaction.data as `0x${string}`,
          },
        ],
      });

      console.log(`[CIRCLE] UserOperation submitted with hash: ${hash}`);
      return hash;
    } catch (error) {
      console.error(`[CIRCLE] Failed to execute with paymaster on chain ${chainId}:`, error);
      throw new Error(`Paymaster execution failed: ${error}`);
    }
  }

  async getTransactionReceipt(
    userOpHash: string,
    chainId: ChainId
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    gasUsed?: bigint;
    actualGasCost?: bigint;
  }> {
    const clientData = this.clients.get(chainId);
    if (!clientData) {
      throw new Error(`Client not available for chain ${chainId}`);
    }

    console.log(`[CIRCLE] Getting transaction receipt: ${userOpHash}`);
    
    try {
      const bundlerClient = createBundlerClient({
        client: clientData.publicClient,
        transport: http(),
      });

      const receipt = await bundlerClient.getUserOperationReceipt({
        hash: userOpHash as `0x${string}`,
      });
      
      if (!receipt) {
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
      console.error('[CIRCLE] Failed to get transaction receipt:', error);
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
        if (getChainConfig(11155111, true).paymasterAddress) {
        supportedChains.push(11155111);
      }
      if (getChainConfig(421614, true).paymasterAddress) {
        supportedChains.push(421614);
      }
      if (getChainConfig(84532, true).paymasterAddress) {
        supportedChains.push(84532);
      }
      if (getChainConfig(43113, true).paymasterAddress) {
        supportedChains.push(43113);
      }
      if (getChainConfig(80002, true).paymasterAddress) {
        supportedChains.push(80002);
      }
    } else {
      supportedChains.push(42161);
      supportedChains.push(8453);
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