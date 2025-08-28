import { BigNumber, ethers, Signer, ContractReceipt } from 'ethers';
import { ChainId, CCTPTransferParams, CCTPTransferResult } from '../types';
import { getChainConfig } from '../config/chains';
import { 
  getCCTPAddresses, 
  getCCTPDomain,
  TokenMessengerV2__factory,
  MessageTransmitterV2__factory,
  USDC__factory
} from '../contracts';

/**
 * Production CCTP Service using real Circle contracts
 * Replaces SimpleCCTPService with actual on-chain integration
 */
export class ProductionCCTPService {
  private signers: Map<ChainId, Signer> = new Map();
  private baseApiUrl: string;
  
  // Interface compatibility properties
  public readonly BRIDGE_FEE_USDC = BigNumber.from(100000); // $0.10 USDC (6 decimals)
  public readonly FAST_TRANSFER_THRESHOLD = BigNumber.from(1000000000); // $1000 USDC
  public readonly apiKey: string;
  
  constructor(
    apiKey: string = '',
    public useTestnet: boolean = true
  ) {
    this.apiKey = apiKey;
    this.baseApiUrl = this.useTestnet 
      ? 'https://iris-api-sandbox.circle.com'
      : 'https://iris-api.circle.com';
  }

  /**
   * Set signer for a specific chain
   */
  setSigner(chainId: ChainId, signer: Signer): void {
    this.signers.set(chainId, signer);
  }

  /**
   * Get signer for a chain (throws if not available)
   */
  private getSigner(chainId: ChainId): Signer {
    const signer = this.signers.get(chainId);
    if (!signer) {
      throw new Error(`No signer available for chain ${chainId}. Call setSigner() first.`);
    }
    return signer;
  }

  async estimateBridgeFee(
    amount: BigNumber,
    fromChain: ChainId,
    toChain: ChainId
  ): Promise<BigNumber> {
    try {
      // Validate CCTP domain support first
      const fromDomain = getCCTPDomain(fromChain);
      const toDomain = getCCTPDomain(toChain);
      
      // Add timeout to prevent hanging requests during route analysis
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(
        `${this.baseApiUrl}/v2/burn/USDC/fees/${fromDomain}/${toDomain}`,
        { 
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const feeData = await response.json();
        if (feeData.data && feeData.data.minimumFee) {
          // Convert basis points to USDC units (6 decimals)
          // 1 basis point = 0.01%, so minimumFee * amount / 10000
          const feeInBasisPoints = feeData.data.minimumFee;
          const feeAmount = amount.mul(feeInBasisPoints).div(10000);
          console.log(`✅ Circle API fee: ${ethers.utils.formatUnits(feeAmount, 6)} USDC for ${fromChain}→${toChain}`);
          return feeAmount;
        }
      }
      
      // Fallback to chain-specific calculation
      console.log(`⚠️ Circle API unavailable, using estimated fee for ${fromChain}→${toChain}`);
      return this.calculateEstimatedFee(fromChain, toChain);
      
    } catch (error) {
      // More specific error handling for route analysis
      const err = error as any;
      if (err?.name === 'AbortError') {
        console.warn(`Circle API timeout for ${fromChain}→${toChain}, using estimation`);
      } else {
        console.warn(`Failed to fetch Circle API fees for ${fromChain}→${toChain}:`, err?.message || error);
      }
      return this.calculateEstimatedFee(fromChain, toChain);
    }
  }

  async canUseFastTransfer(
    amount: BigNumber,
    fromChain: ChainId,
    toChain: ChainId
  ): Promise<boolean> {
    try {
      // Check Fast Transfer allowance via Circle API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(
        `${this.baseApiUrl}/v2/fastBurn/USDC/allowance`,
        { 
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const allowanceData = await response.json();
        if (allowanceData.allowance !== undefined) {
          // Convert allowance to USDC units (6 decimals) safely
          try {
            // Handle large numbers by converting to string first
            const allowanceNumber = Number(allowanceData.allowance);
            if (allowanceNumber > Number.MAX_SAFE_INTEGER / 1e6) {
              // If allowance is too large, assume it's effectively unlimited
              return true;
            }
            const remainingAllowance = BigNumber.from(Math.floor(allowanceNumber * 1e6).toString());
            return amount.lte(remainingAllowance);
          } catch (conversionError) {
            console.warn(`Failed to convert allowance for ${fromChain}→${toChain}, using fallback:`, conversionError);
            // Fallback to threshold check
            return amount.lt(this.FAST_TRANSFER_THRESHOLD);
          }
        }
      }
      
      // Fallback: Fast transfer available for amounts under threshold
      return amount.lt(this.FAST_TRANSFER_THRESHOLD);
      
    } catch (error) {
      const err = error as any;
      if (err?.name === 'AbortError') {
        console.warn(`Fast transfer API timeout for ${fromChain}→${toChain}, using threshold fallback`);
      } else {
        console.warn(`Failed to check Fast Transfer allowance for ${fromChain}→${toChain}:`, err?.message || error);
      }
      return amount.lt(this.FAST_TRANSFER_THRESHOLD);
    }
  }

  async estimateTransferTime(
    amount: BigNumber,
    fromChain: ChainId,
    toChain: ChainId,
    useFastTransfer?: boolean
  ): Promise<number> {
    try {
      // If fast transfer preference is not specified, check availability with timeout
      let shouldUseFast = useFastTransfer;
      if (shouldUseFast === undefined) {
        // Add timeout protection for the fast transfer check
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error("Fast transfer check timeout")), 2000);
        });
        
        try {
          shouldUseFast = await Promise.race([
            this.canUseFastTransfer(amount, fromChain, toChain),
            timeoutPromise
          ]);
          console.log(`✅ Fast transfer check for ${fromChain}→${toChain}: ${shouldUseFast}`);
        } catch (error) {
          // If fast transfer check fails/times out, assume standard transfer
          console.warn(`⚠️ Fast transfer check failed for ${fromChain}→${toChain}, using standard timing:`, error);
          shouldUseFast = false;
        }
      }

      if (shouldUseFast) {
        console.log(`🚀 Fast transfer estimated time for ${fromChain}→${toChain}: 30 seconds`);
        return 30; // Fast transfer: ~30 seconds
      }

      // Standard transfer times based on chain finality
      const fromConfig = getChainConfig(fromChain, this.useTestnet);
      const finalityTimes: Record<string, number> = {
        'Ethereum Sepolia': 900,    // 15 minutes
        'Ethereum': 900,            // 15 minutes
        'Arbitrum Sepolia': 120,    // 2 minutes  
        'Arbitrum One': 120,        // 2 minutes
        'Base Sepolia': 120,        // 2 minutes
        'Base': 120,                // 2 minutes
        'Avalanche Fuji': 60,       // 1 minute
        'Avalanche': 60,            // 1 minute
        'Polygon Amoy': 120,        // 2 minutes
        'Polygon': 120,             // 2 minutes
      };

      const fromFinality = finalityTimes[fromConfig.name] || 300;
      const attestationTime = 60; // Circle attestation
      const executionTime = 30;   // Destination execution
      const totalTime = fromFinality + attestationTime + executionTime;

      console.log(`🕒 Standard transfer estimated time for ${fromChain}→${toChain}: ${Math.floor(totalTime/60)} minutes`);
      return totalTime;
      
    } catch (error) {
      // If any error occurs, return a safe default
      console.warn(`⚠️ Transfer time estimation failed for ${fromChain}→${toChain}, using default:`, error);
      return 600; // 10 minutes default
    }
  }

  async initiateBridge(params: CCTPTransferParams): Promise<CCTPTransferResult> {
    const {
      amount,
      fromChain,
      toChain,
      recipient,
      useFastTransfer
    } = params;

    // Validate parameters
    this.validateTransferParams(params);
    
    // Additional amount validation for CCTP requirements
    this.validateBridgeAmount(amount, fromChain, toChain);

    const signer = this.getSigner(fromChain);
    const addresses = getCCTPAddresses(fromChain, this.useTestnet);
    const destinationDomain = getCCTPDomain(toChain);

    console.log(`Initiating CCTP bridge:`, {
      amount: amount.toString(),
      fromChain,
      toChain,
      recipient,
      useFastTransfer,
      destinationDomain
    });

    try {
      // Initialize contracts
      const tokenMessenger = TokenMessengerV2__factory.connect(
        addresses.tokenMessenger,
        signer
      );
      
      const usdc = USDC__factory.connect(addresses.usdc, signer);
      const signerAddress = await signer.getAddress();

      // 1. Check USDC balance
      const usdcBalance = await usdc.balanceOf(signerAddress);
      console.log(`💰 USDC balance check:`, {
        userAddress: signerAddress,
        balance: ethers.utils.formatUnits(usdcBalance, 6) + ' USDC',
        required: ethers.utils.formatUnits(amount, 6) + ' USDC',
        sufficient: usdcBalance.gte(amount)
      });

      if (usdcBalance.lt(amount)) {
        throw new Error(
          `Insufficient USDC balance. Required: ${ethers.utils.formatUnits(amount, 6)} USDC, ` +
          `Available: ${ethers.utils.formatUnits(usdcBalance, 6)} USDC. ` +
          `Please ensure you have sufficient USDC on ${getChainConfig(fromChain, this.useTestnet).name}.`
        );
      }

      // 2. Check and approve USDC if needed
      const currentAllowance = await usdc.allowance(
        signerAddress,
        addresses.tokenMessenger
      );
      
      console.log(`🔐 USDC allowance check:`, {
        currentAllowance: ethers.utils.formatUnits(currentAllowance, 6) + ' USDC',
        required: ethers.utils.formatUnits(amount, 6) + ' USDC',
        needsApproval: currentAllowance.lt(amount)
      });
      
      if (currentAllowance.lt(amount)) {
        console.log('Approving USDC spending...');
        const approveTx = await usdc.approve(
          addresses.tokenMessenger,
          amount,
          { gasLimit: BigNumber.from(100000) } // Reasonable gas limit for approval
        );
        await approveTx.wait();
        console.log('USDC approval completed:', approveTx.hash);
      }

      // 3. Initiate cross-chain burn
      console.log('Initiating depositForBurn...');
      const burnTx = await tokenMessenger.depositForBurn(
        amount,
        destinationDomain,
        this.addressToBytes32(recipient),
        addresses.usdc,
        { gasLimit: BigNumber.from(200000) } // Reasonable gas limit for burn
      );

      const receipt = await burnTx.wait();
      console.log('Burn transaction completed:', burnTx.hash);

      // 3. Extract message hash from events
      const messageHash = this.extractMessageHashFromReceipt(receipt);
      
      const bridgeFee = await this.estimateBridgeFee(amount, fromChain, toChain);
      const estimatedTime = await this.estimateTransferTime(
        amount,
        fromChain,
        toChain,
        useFastTransfer
      );

      return {
        transactionHash: burnTx.hash,
        attestationHash: messageHash,
        estimatedArrivalTime: estimatedTime,
        bridgeFee,
        transferObject: { messageHash, receipt } // For tracking
      };

    } catch (error) {
      console.error('CCTP bridge initiation failed:', error);
      throw new Error(`Bridge initiation failed: ${this.parseContractError(error)}`);
    }
  }

  async waitForCompletion(
    transactionHash: string,
    fromChain: ChainId,
    toChain: ChainId,
    transferObject?: any
  ): Promise<string> {
    try {
      const messageHash = transferObject?.messageHash || 
        await this.getMessageHashFromTransaction(transactionHash, fromChain);

      console.log(`Waiting for attestation: ${messageHash}`);
      
      // 1. Wait for Circle attestation
      const attestation = await this.pollForAttestation(messageHash);
      
      console.log('Attestation received, completing on destination chain...');
      
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

  async getBridgeStatus(
    transactionHash: string,
    fromChain: ChainId,
    transferObject?: any
  ): Promise<'pending' | 'attested' | 'completed' | 'failed'> {
    try {
      const messageHash = transferObject?.messageHash || 
        await this.getMessageHashFromTransaction(transactionHash, fromChain);

      // Check attestation status
      const attestationStatus = await this.getAttestationStatus(messageHash);
      
      if (attestationStatus === 'complete') {
        return 'attested'; // Ready for destination completion
      } else if (attestationStatus === 'pending') {
        return 'pending';
      }
      
      return 'pending';
      
    } catch (error) {
      console.error('Failed to get bridge status:', error);
      return 'failed';
    }
  }

  async getOptimalRoute(
    amount: BigNumber,
    fromChains: ChainId[],
    toChain: ChainId
  ): Promise<{
    fromChain: ChainId;
    bridgeFee: BigNumber;
    estimatedTime: number;
    useFastTransfer: boolean;
  } | null> {
    const routes = await Promise.all(
      fromChains.map(async (fromChain) => {
        try {
          const bridgeFee = await this.estimateBridgeFee(amount, fromChain, toChain);
          const useFastTransfer = await this.canUseFastTransfer(amount, fromChain, toChain);
          const estimatedTime = await this.estimateTransferTime(
            amount,
            fromChain,
            toChain,
            useFastTransfer
          );

          return {
            fromChain,
            bridgeFee,
            estimatedTime,
            useFastTransfer,
            totalCost: bridgeFee,
          };
        } catch (error) {
          console.warn(`Failed to get route for chain ${fromChain}:`, error);
          return null;
        }
      })
    );

    const validRoutes = routes.filter(route => route !== null);
    
    if (validRoutes.length === 0) {
      return null;
    }

    // Sort by total cost, then by time
    validRoutes.sort((a, b) => {
      const costDiff = a!.totalCost.sub(b!.totalCost).toNumber();
      if (costDiff !== 0) return costDiff;
      return a!.estimatedTime - b!.estimatedTime;
    });

    return validRoutes[0];
  }

  // Private helper methods

  private validateTransferParams(params: CCTPTransferParams): void {
    const { amount, fromChain, toChain, recipient } = params;
    
    if (amount.lte(0)) {
      throw new Error('Transfer amount must be greater than 0');
    }
    
    if (!ethers.utils.isAddress(recipient)) {
      throw new Error('Invalid recipient address');
    }
    
    if (fromChain === toChain) {
      throw new Error('Source and destination chains must be different');
    }
    
    try {
      getCCTPAddresses(fromChain, this.useTestnet);
      getCCTPAddresses(toChain, this.useTestnet);
    } catch (error) {
      throw new Error(`CCTP not supported on specified chains: ${error}`);
    }
  }

  private validateBridgeAmount(amount: BigNumber, fromChain: ChainId, toChain: ChainId): void {
    // Minimum transfer amount for Circle CCTP (0.01 USDC = 10,000 with 6 decimals)
    const MIN_CCTP_AMOUNT = BigNumber.from(10000);
    
    if (amount.lt(MIN_CCTP_AMOUNT)) {
      throw new Error(
        `Transfer amount ${ethers.utils.formatUnits(amount, 6)} USDC is below Circle CCTP minimum of 0.01 USDC. ` +
        `This is likely a gas estimation issue. Please check the gas cost calculation.`
      );
    }

    // Maximum reasonable transfer amount check (safety measure)
    const MAX_REASONABLE_AMOUNT = BigNumber.from('1000000000000'); // 1M USDC
    if (amount.gt(MAX_REASONABLE_AMOUNT)) {
      console.warn(
        `⚠️ Large transfer amount detected: ${ethers.utils.formatUnits(amount, 6)} USDC. ` +
        `Verify this is intended.`
      );
    }

    console.log(`✅ Bridge amount validation passed: ${ethers.utils.formatUnits(amount, 6)} USDC from chain ${fromChain} to ${toChain}`);
  }

  private addressToBytes32(address: string): string {
    return ethers.utils.hexZeroPad(address, 32);
  }

  private extractMessageHashFromReceipt(receipt: ContractReceipt): string {
    // Find MessageSent event from MessageTransmitter
    const messageSentEvent = receipt.events?.find(
      event => event.event === 'MessageSent'
    );
    
    if (!messageSentEvent || !messageSentEvent.args) {
      throw new Error('MessageSent event not found in transaction receipt');
    }
    
    // Hash the message to get message hash
    const message = messageSentEvent.args.message;
    return ethers.utils.keccak256(message);
  }

  private async getMessageHashFromTransaction(
    txHash: string, 
    chainId: ChainId
  ): Promise<string> {
    const signer = this.getSigner(chainId);
    const receipt = await signer.provider?.getTransactionReceipt(txHash);
    
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }
    
    return this.extractMessageHashFromReceipt(receipt);
  }

  private async pollForAttestation(
    messageHash: string,
    timeoutMs: number = 300000 // 5 minutes
  ): Promise<{ message: string; signature: string }> {
    const startTime = Date.now();
    
    console.log(`Polling for attestation: ${messageHash}`);
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch(
          `${this.baseApiUrl}/v1/attestations/${messageHash}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'complete' && data.attestation) {
            console.log('Attestation received');
            return {
              message: data.message,
              signature: data.attestation
            };
          }
          console.log(`Attestation status: ${data.status}`);
        } else if (response.status === 404) {
          console.log('Attestation not yet available...');
        } else {
          console.warn(`Attestation API error: ${response.status}`);
        }
        
      } catch (error) {
        console.warn('Attestation polling attempt failed:', error);
      }
      
      // Wait 10 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    throw new Error('Attestation timeout - Circle may still be processing the message');
  }

  private async getAttestationStatus(messageHash: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseApiUrl}/v1/attestations/${messageHash}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.status || 'pending';
      }
      
      return 'pending';
    } catch (error) {
      console.warn('Failed to get attestation status:', error);
      return 'pending';
    }
  }

  private async completeTransferOnDestination(
    attestation: { message: string; signature: string },
    toChain: ChainId
  ): Promise<string> {
    const signer = this.getSigner(toChain);
    const addresses = getCCTPAddresses(toChain, this.useTestnet);
    
    const messageTransmitter = MessageTransmitterV2__factory.connect(
      addresses.messageTransmitter,
      signer
    );
    
    console.log('Submitting attestation to destination chain...');
    
    // Submit attestation to complete the transfer
    const mintTx = await messageTransmitter.receiveMessage(
      attestation.message,
      attestation.signature,
      { gasLimit: BigNumber.from(300000) } // Reasonable gas limit for receive
    );
    
    const receipt = await mintTx.wait();
    console.log('Mint transaction completed:', mintTx.hash);
    
    return mintTx.hash;
  }

  private calculateEstimatedFee(fromChain: ChainId, toChain: ChainId): BigNumber {
    // Chain-specific fee calculation
    const chainFees: Record<ChainId, number> = {
      1: 50000,      // Ethereum - higher fees
      11155111: 50000, // Ethereum Sepolia
      42161: 10000,   // Arbitrum - lower fees
      421614: 10000,  // Arbitrum Sepolia
      8453: 10000,    // Base - lower fees
      84532: 10000,   // Base Sepolia
      43114: 20000,   // Avalanche - medium fees
      43113: 20000,   // Avalanche Fuji
      137: 20000,     // Polygon - medium fees
      80002: 20000,   // Polygon Amoy
    };

    const fromFee = chainFees[fromChain] || 30000;
    const toFee = chainFees[toChain] || 30000;
    const baseFee = 100000; // Base Circle fee
    
    return BigNumber.from(baseFee + fromFee + toFee);
  }

  private parseContractError(error: any): string {
    if (error.reason) {
      return error.reason;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown contract error';
  }
}