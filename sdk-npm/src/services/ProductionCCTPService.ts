import { BigNumber, ethers, Signer, ContractReceipt } from 'ethers';
import { ChainId, CCTPTransferParams, CCTPTransferResult, CCTPTransferMode } from '../types';
import { getChainConfig } from '../config/chains';
import {
  getCCTPAddresses,
  getCCTPDomain,
  TokenMessengerV2__factory,
  MessageTransmitterV2__factory,
  USDC__factory
} from '../contracts';
import { createPublicClient, createWalletClient, http, encodeFunctionData, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia, sepolia, baseSepolia, avalancheFuji, polygonAmoy, optimismSepolia } from 'viem/chains';

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
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const allowanceData = await response.json();
        console.log(`Fast Transfer allowance API response:`, allowanceData);
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

  /**
   * Determine the optimal transfer mode based on amount and availability
   */
  async determineTransferMode(
    amount: BigNumber,
    fromChain: ChainId,
    toChain: ChainId,
    preferredMode?: CCTPTransferMode
  ): Promise<{ mode: 'fast' | 'standard'; canUseFast: boolean; reason: string }> {
    try {
      const canUseFast = await this.canUseFastTransfer(amount, fromChain, toChain);
      console.log(`Fast transfer eligibility for ${fromChain}→${toChain}: ${canUseFast}`);

      if (preferredMode === 'fast') {
        return {
          mode: canUseFast ? 'fast' : 'standard',
          canUseFast,
          reason: canUseFast ? 'Fast transfer requested and available' : 'Fast transfer requested but unavailable, using standard'
        };
      }

      if (preferredMode === 'standard') {
        return {
          mode: 'standard',
          canUseFast,
          reason: 'Standard transfer explicitly requested'
        };
      }

      // Auto mode or backward compatibility
      if (canUseFast && amount.lt(this.FAST_TRANSFER_THRESHOLD)) {
        return {
          mode: 'fast',
          canUseFast: true,
          reason: 'Auto: Fast transfer available for small amount'
        };
      }

      return {
        mode: 'standard',
        canUseFast,
        reason: 'Auto: Using standard transfer for large amount or unavailable fast transfer'
      };

    } catch (error) {
      console.warn(`Transfer mode determination failed for ${fromChain}→${toChain}:`, error);
      return {
        mode: 'standard',
        canUseFast: false,
        reason: 'Error determining mode, defaulting to standard'
      };
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
          setTimeout(() => reject(new Error("Fast transfer check timeout")), 3000);
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
      transferMode,
      useFastTransfer // Backward compatibility
    } = params;

    // Validate parameters
    this.validateTransferParams(params);

    // Additional amount validation for CCTP requirements
    this.validateBridgeAmount(amount, fromChain, toChain);

    const signer = this.getSigner(fromChain);
    const addresses = getCCTPAddresses(fromChain, this.useTestnet);
    const destinationDomain = getCCTPDomain(toChain);

    // Validate addresses before proceeding
    try {
      // Import validation function locally to avoid circular import
      const { validateCCTPAddresses } = await import('../contracts/addresses');
      if (!validateCCTPAddresses(fromChain, this.useTestnet)) {
        throw new Error(`CCTP address validation failed for source chain ${fromChain}`);
      }
      if (!validateCCTPAddresses(toChain, this.useTestnet)) {
        throw new Error(`CCTP address validation failed for destination chain ${toChain}`);
      }
    } catch (validationError) {
      console.warn('CCTP address validation error:', validationError);
    }

    // Determine the actual transfer mode to use
    const preferredMode = transferMode || (useFastTransfer ? 'fast' : 'auto');
    const transferModeResult = await this.determineTransferMode(amount, fromChain, toChain, preferredMode);
    const finalUseFastTransfer = transferModeResult.mode === 'fast';

    console.log(`Initiating CCTP bridge:`, {
      amount: amount.toString(),
      fromChain,
      toChain,
      recipient,
      requestedMode: preferredMode,
      finalTransferMode: transferModeResult.mode,
      reason: transferModeResult.reason,
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

        // Wait for approval with additional confirmations to ensure it's mined
        const approvalReceipt = await approveTx.wait(2); // Wait for 2 confirmations
        console.log('USDC approval completed:', approveTx.hash, 'Block:', approvalReceipt.blockNumber);

        // Add small delay to ensure approval is propagated
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

        // Verify approval was successful
        const newAllowance = await usdc.allowance(signerAddress, addresses.tokenMessenger);
        console.log('Verified new allowance:', ethers.utils.formatUnits(newAllowance, 6), 'USDC');

        if (newAllowance.lt(amount)) {
          throw new Error(`Approval failed: expected ${ethers.utils.formatUnits(amount, 6)} USDC, got ${ethers.utils.formatUnits(newAllowance, 6)} USDC`);
        }
      }

      // 3. Initiate cross-chain burn
      console.log('Initiating depositForBurn...');
      console.log('depositForBurn parameters:', {
        amount: amount.toString(),
        destinationDomain,
        mintRecipient: this.addressToBytes32(recipient),
        burnToken: addresses.usdc,
        tokenMessengerAddress: addresses.tokenMessenger
      });

      // Pre-flight validation checks to identify revert causes
      console.log('🔍 Running pre-flight validation checks...');

      try {
        // Double-check USDC balance and allowance right before the call
        const currentBalance = await usdc.balanceOf(signerAddress);
        const currentAllowance = await usdc.allowance(signerAddress, addresses.tokenMessenger);

        console.log('Final validation:', {
          balance: ethers.utils.formatUnits(currentBalance, 6),
          allowance: ethers.utils.formatUnits(currentAllowance, 6),
          required: ethers.utils.formatUnits(amount, 6),
          balanceSufficient: currentBalance.gte(amount),
          allowanceSufficient: currentAllowance.gte(amount)
        });

        if (currentBalance.lt(amount)) {
          throw new Error(`Insufficient balance: ${ethers.utils.formatUnits(currentBalance, 6)} < ${ethers.utils.formatUnits(amount, 6)}`);
        }

        if (currentAllowance.lt(amount)) {
          throw new Error(`Insufficient allowance: ${ethers.utils.formatUnits(currentAllowance, 6)} < ${ethers.utils.formatUnits(amount, 6)}`);
        }

        console.log('✅ Pre-flight validation passed');

      } catch (validationError) {
        console.error('❌ Pre-flight validation failed:', validationError);
        throw new Error(`Pre-flight validation failed: ${validationError instanceof Error ? validationError.message : validationError}`);
      }

      // Try to estimate gas first to get better error information
      let burnTx: any;
      let receipt: any;

      // Prepare V2 parameters (shared between main try and fallback)
      console.log('Estimating gas for depositForBurn...');
      const bridgeFee = await this.estimateBridgeFee(amount, fromChain, toChain, finalUseFastTransfer);

      // Calculate maxFee separately - this is for destination chain gas costs, not bridge service fees
      const maxFee = await this.calculateDestinationGasFee(toChain, amount);

      // Use Fast Transfer threshold if enabled and available
      const minFinalityThreshold = finalUseFastTransfer ? 1000 : 2000;

      // For V2, use depositForBurn with hookData parameter
      const hookData = '0x0000000000000000000000000000000000000000000000000000000000000000'; // Empty hook data

      try {

        const estimatedGas = await tokenMessenger.estimateGas.depositForBurn(
          amount,
          destinationDomain,
          this.addressToBytes32(recipient),
          addresses.usdc,
          hookData,
          maxFee,
          minFinalityThreshold
        );
        console.log('✅ Gas estimation successful:', estimatedGas.toString());

        // Use estimated gas with 50% buffer
        const gasLimit = BigNumber.from(estimatedGas).mul(150).div(100);
        console.log('Using gas limit:', gasLimit.toString());

      // Validate Fast Transfer eligibility matches threshold
      if (finalUseFastTransfer && minFinalityThreshold > 1000) {
        console.warn('⚠️ Fast Transfer requested but using Standard threshold');
      }
      if (!finalUseFastTransfer && minFinalityThreshold <= 1000) {
        console.warn('⚠️ Standard Transfer requested but using Fast threshold');
      }

      console.log('CCTP V2 Parameters:', {
        hookData,
        maxFee: maxFee.toString(),
        minFinalityThreshold,
        transferMode: transferModeResult.mode,
        finalUseFastTransfer
      });

        burnTx = await tokenMessenger.depositForBurn(
          amount,
          destinationDomain,
          this.addressToBytes32(recipient),
          addresses.usdc,
          hookData,
          maxFee,
          minFinalityThreshold,
          { gasLimit }
        );

        // Wait for transaction confirmation with additional confirmations for reliability
        receipt = await burnTx.wait(2); // Increased confirmations
        console.log('Burn transaction completed:', burnTx.hash);

      } catch (estimationError) {
        console.error('Gas estimation failed:', estimationError);
        console.log('Attempting with static gas limit...');

        // Fallback to static gas limit with detailed error logging

        try {
          burnTx = await tokenMessenger.depositForBurn(
            amount,
            destinationDomain,
            this.addressToBytes32(recipient),
            addresses.usdc,
            hookData,
            maxFee,
            minFinalityThreshold,
            { gasLimit: BigNumber.from(350000) } // Higher static gas limit
          );

          receipt = await burnTx.wait(2);
          console.log('Burn transaction completed with static gas:', burnTx.hash);

        } catch (staticGasError) {
          console.error('Static gas limit also failed:', staticGasError);

          // Additional debugging information
          console.error('Debug info:', {
            tokenMessengerAddress: addresses.tokenMessenger,
            usdcAddress: addresses.usdc,
            amount: amount.toString(),
            destinationDomain,
            recipientBytes32: this.addressToBytes32(recipient),
            signerAddress
          });

          throw new Error(`depositForBurn failed: ${this.parseContractError(staticGasError)}`);
        }
      }

      // Add debugging information
      console.log(`Transaction receipt - blockNumber: ${receipt.blockNumber}, logs: ${receipt.logs.length}`);

      // 3. Extract message hash from events
      const { messageHash, message } = this.extractMessageAndHashFromReceipt(receipt, burnTx.hash);
      const estimatedTime = await this.estimateTransferTime(
        amount,
        fromChain,
        toChain,
        finalUseFastTransfer
      );

      return {
        transactionHash: burnTx.hash,
        attestationHash: messageHash,
        estimatedArrivalTime: estimatedTime,
        bridgeFee,
        transferObject: { messageHash, message, receipt } // For tracking
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
      let messageHash: string;
      let message: string;

      if (transferObject?.messageHash && transferObject?.message) {
        messageHash = transferObject.messageHash;
        message = transferObject.message;
      } else {
        const result = await this.getMessageAndHashFromTransaction(transactionHash, fromChain);
        messageHash = result.messageHash;
        message = result.message;
      }

      console.log(`Waiting for attestation: ${messageHash}`);

      // 1. Wait for Circle attestation
      const sourceDomain = getCCTPDomain(fromChain);
      const attestation = await this.pollForAttestation(messageHash, message, sourceDomain, transactionHash);

      console.log('Attestation received, completing on destination chain...');

      // 2. Complete transfer on destination chain
      return await this.completeTransferOnDestination(
        attestation,
        toChain,
        messageHash
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
        (await this.getMessageAndHashFromTransaction(transactionHash, fromChain)).messageHash;

      // Check attestation status
      const sourceDomain = getCCTPDomain(fromChain);
      const attestationStatus = await this.getAttestationStatus(messageHash, sourceDomain, transactionHash);

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
          const useFastTransfer = await this.canUseFastTransfer(amount, fromChain, toChain);
          const bridgeFee = await this.estimateBridgeFee(amount, fromChain, toChain, useFastTransfer);
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

  private extractMessageAndHashFromReceipt(receipt: ContractReceipt, transactionHash: string): { messageHash: string; message: string } {
    try {
      // Method 1: Try to find MessageSent event directly
      const messageSentEvent = receipt.events?.find(
        event => event.event === 'MessageSent'
      );

      if (messageSentEvent && messageSentEvent.args && messageSentEvent.args.message) {
        const message = messageSentEvent.args.message;
        // Calculate proper message hash using keccak256 of the message
        const messageHash = ethers.utils.keccak256(message);
        console.log('✅ MessageSent event found, calculated message hash:', messageHash);
        return { messageHash, message };
      }

      // Method 2: Parse logs manually using MessageTransmitter interface
      const messageTransmitterInterface = MessageTransmitterV2__factory.createInterface();
      const messageSentTopic = messageTransmitterInterface.getEventTopic('MessageSent');

      for (const log of receipt.logs) {
        if (log.topics[0] === messageSentTopic) {
          try {
            const parsedLog = messageTransmitterInterface.parseLog(log);
            if (parsedLog.name === 'MessageSent' && parsedLog.args.message) {
              const message = parsedLog.args.message;
              // Calculate proper message hash using keccak256 of the message
              const messageHash = ethers.utils.keccak256(message);
              console.log('✅ MessageSent event found via log parsing, calculated message hash:', messageHash);
              return { messageHash, message };
            }
          } catch (parseError) {
            console.warn('Failed to parse log:', parseError);
            continue;
          }
        }
      }

      throw new Error('No usable events found for message hash extraction');

    } catch (error) {
      console.error('Error extracting message hash:', error);
      throw new Error(`MessageSent event not found in transaction receipt. This may indicate a contract interaction issue. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getMessageAndHashFromTransaction(
    txHash: string,
    chainId: ChainId
  ): Promise<{ messageHash: string; message: string }> {
    const signer = this.getSigner(chainId);
    const receipt = await signer.provider?.getTransactionReceipt(txHash);

    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    // Add debugging for transaction receipt
    console.log('Transaction receipt logs:', receipt.logs.length);

    return this.extractMessageAndHashFromReceipt(receipt, txHash);
  }


  private async pollForAttestation(
    messageHash: string,
    extractedMessage: string,
    sourceDomain: number,
    transactionHash: string,
    timeoutMs: number = 1200000 // 20 minutes - covers Standard Transfer attestation time
  ): Promise<{ message: string; signature: string }> {
    const startTime = Date.now();

    console.log(`Polling for attestation using transaction hash: ${transactionHash}`);
    console.log(`Expected message hash: ${messageHash}`);

    while (Date.now() - startTime < timeoutMs) {
      try {
        // Use the exact same endpoint as the working sample project
        const response = await fetch(
          `${this.baseApiUrl}/v2/messages/${sourceDomain}?transactionHash=${transactionHash}`
        );

        if (response.ok) {
          const data = await response.json();
          
          console.log('Messages API response:', {
            totalMessages: data.messages?.length || 0,
            messageFound: !!data.messages?.[0],
            messageStatus: data.messages?.[0]?.status,
            hasAttestation: !!data.messages?.[0]?.attestation
          });

          // Use the exact same logic as the sample project
          if (data.messages?.[0]?.status === 'complete') {
            console.log('Attestation received');
            
            const attestationData = data.messages[0];
            
            // Validate the attestation data format
            if (!attestationData.attestation) {
              throw new Error('Invalid attestation response: missing attestation');
            }

            // Use the message from the API response (not extracted message)
            // This ensures we use the exact message that was attested
            const messageFormatted = attestationData.message.startsWith('0x') ? attestationData.message : `0x${attestationData.message}`;
            const signature = attestationData.attestation.startsWith('0x') ? attestationData.attestation : `0x${attestationData.attestation}`;

            console.log('Formatted attestation data:', {
              messageHex: messageFormatted.slice(0, 66) + '...',
              signatureHex: signature.slice(0, 66) + '...',
              messageValid: ethers.utils.isHexString(messageFormatted),
              signatureValid: ethers.utils.isHexString(signature)
            });

            return { message: messageFormatted, signature };
          }
          console.log(`Attestation status: ${data.messages?.[0]?.status || 'unknown'}`);
        } else if (response.status === 404) {
          console.log('Attestation not yet available...');
        } else {
          console.warn(`Attestation API error: ${response.status}`);
        }

      } catch (error) {
        console.warn('Attestation polling attempt failed:', error);
      }

      // Wait 5 seconds before next poll (matching sample project)
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Attestation timeout - Circle may still be processing the message');
  }

  private async getAttestationStatus(messageHash: string, sourceDomain: number, transactionHash: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseApiUrl}/v2/messages/${sourceDomain}?transactionHash=${transactionHash}`
      );

      if (response.ok) {
        const data = await response.json();
        // Use the same logic as sample project - check first message in array
        return data.messages?.[0]?.status || 'pending';
      }

      return 'pending';
    } catch (error) {
      console.warn('Failed to get attestation status:', error);
      return 'pending';
    }
  }

  private async completeTransferOnDestination(
    attestation: { message: string; signature: string },
    toChain: ChainId,
    originalMessageHash?: string
  ): Promise<string> {
    const signer = this.getSigner(toChain);
    const addresses = getCCTPAddresses(toChain, this.useTestnet);

    // Use manual contract connection to match working sample project approach
    const MESSAGE_TRANSMITTER_ABI = [
      {
        "type": "function",
        "name": "receiveMessage",
        "stateMutability": "nonpayable",
        "inputs": [
          { "name": "message", "type": "bytes" },
          { "name": "attestation", "type": "bytes" }
        ],
        "outputs": []
      }
    ];
    
    const messageTransmitter = new ethers.Contract(
      addresses.messageTransmitter,
      MESSAGE_TRANSMITTER_ABI,
      signer
    );

    console.log('Submitting attestation to destination chain...');

    try {
      // Use raw hex strings directly (no conversion) to match working sample
      console.log('Using raw hex attestation data directly from Circle API');
      
      // Validate hex format
      if (!ethers.utils.isHexString(attestation.message)) {
        throw new Error(`Invalid message format: ${attestation.message}`);
      }
      if (!ethers.utils.isHexString(attestation.signature)) {
        throw new Error(`Invalid signature format: ${attestation.signature}`);
      }

      // Use the exact same approach as working manual script
      try {
        console.log('Estimating gas for receiveMessage...');
        const estimatedGas = await messageTransmitter.estimateGas.receiveMessage(
          attestation.message,    // Raw hex string (no conversion)
          attestation.signature   // Raw hex string (no conversion)
        );
        console.log(`✅ Gas estimation successful: ${estimatedGas.toString()}`);

        // Use same gas buffer as manual script (20%)
        const gasLimit = estimatedGas.mul(120).div(100);
        console.log(`Using gas limit: ${gasLimit.toString()}`);

        const mintTx = await messageTransmitter.receiveMessage(
          attestation.message,    // Raw hex string (no conversion)
          attestation.signature,  // Raw hex string (no conversion)
          { gasLimit }
        );

        console.log('🚀 Mint transaction sent:', mintTx.hash);
        const receipt = await mintTx.wait();
        console.log('✅ Mint completed! Block:', receipt.blockNumber);
        return mintTx.hash;
        
      } catch (gasEstimateError) {
        const errorMessage = gasEstimateError instanceof Error ? gasEstimateError.message : String(gasEstimateError);
        console.error('❌ Gas estimation failed:', errorMessage);
        throw gasEstimateError;
      }

    } catch (error) {
      console.error('Destination completion failed:', error);
      console.error('Attestation details:', {
        message: attestation.message,
        signature: attestation.signature,
        toChain,
        messageTransmitterAddress: addresses.messageTransmitter
      });
      throw error;
    }
  }

  async estimateBridgeFee(
    amount: BigNumber,
    fromChain: ChainId,
    toChain: ChainId,
    useFastTransfer?: boolean
  ): Promise<BigNumber> {
    try {
      // Use Circle's official burn fees API
      const sourceDomain = getCCTPDomain(fromChain);
      const destDomain = getCCTPDomain(toChain);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${this.baseApiUrl}/v2/burn/USDC/fees/${sourceDomain}/${destDomain}`,
        {
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const feeData = await response.json();
        console.log(`Circle fees API response for ${sourceDomain}→${destDomain}:`, feeData);

        // Handle array format: [{finalityThreshold: 1000, minimumFee: 1}, {finalityThreshold: 2000, minimumFee: 0}]
        if (Array.isArray(feeData) && feeData.length > 0) {
          console.log(`🔍 Processing Circle API array response with ${feeData.length} tiers:`, feeData);

          // Select the appropriate tier based on transfer type
          const targetThreshold = useFastTransfer ? 1000 : 2000;
          let selectedTier = feeData.find(tier => tier.finalityThreshold === targetThreshold);

          // Fallback to lowest fee if exact threshold not found
          if (!selectedTier) {
            console.warn(`⚠️ Exact threshold ${targetThreshold} not found, using lowest fee tier`);
            selectedTier = feeData.reduce((min, tier) => {
              if (typeof tier.minimumFee !== 'number' || typeof min.minimumFee !== 'number') {
                return min;
              }
              return tier.minimumFee < min.minimumFee ? tier : min;
            });
          }

          console.log(`🎯 Selected fee tier for ${useFastTransfer ? 'Fast' : 'Standard'} transfer (${targetThreshold}):`, selectedTier);

          if (typeof selectedTier.minimumFee === 'number') {
            const feeInBasisPoints = selectedTier.minimumFee;
            // Convert basis points to actual fee: amount * (bps / 10000)
            const feeAmount = amount.mul(BigNumber.from(feeInBasisPoints)).div(10000);

            console.log(`✅ Circle API fee: ${ethers.utils.formatUnits(feeAmount, 6)} USDC (${feeInBasisPoints} basis points)`);
            return feeAmount;
          } else {
            console.warn('Invalid minimumFee in selected tier:', selectedTier);
          }
        } else {
          console.log(`⚠️ Unexpected Circle API response format:`, typeof feeData, Array.isArray(feeData) ? 'array' : 'object');
        }

        // Legacy data wrapper format fallback
        if (feeData.data && feeData.data.minimumFee !== undefined) {
          // Legacy data wrapper format fallback
          const feeInBasisPoints = feeData.data.minimumFee;
          const feeAmount = amount.mul(BigNumber.from(feeInBasisPoints)).div(10000);

          console.log(`✅ Circle API fee: ${ethers.utils.formatUnits(feeAmount, 6)} USDC (${feeInBasisPoints} basis points)`);
          return feeAmount;
        }
      } else {
        console.warn(`Circle fees API returned ${response.status}: ${await response.text()}`);
      }

      // Fallback to chain-specific calculation
      console.log(`⚠️ Circle API unavailable, using estimated fee for ${fromChain}→${toChain}`);
      return this.calculateEstimatedFee(fromChain, toChain);

    } catch (error) {
      const err = error as any;
      if (err?.name === 'AbortError') {
        console.warn(`Circle API timeout for ${fromChain}→${toChain}, using estimation`);
      } else {
        console.warn(`Failed to fetch Circle API fees for ${fromChain}→${toChain}:`, err?.message || error);
      }
      return this.calculateEstimatedFee(fromChain, toChain);
    }
  }

  private async calculateDestinationGasFee(destinationChain: ChainId, transferAmount: BigNumber): Promise<BigNumber> {
    // Calculate maxFee for destination chain gas costs (for Circle's message execution)
    // CRITICAL: maxFee must be less than transfer amount per Circle contract validation

    const chainGasCosts: Record<ChainId, number> = {
      1: 500000,      // Ethereum mainnet - high gas costs (0.5 USDC)
      11155111: 200000, // Ethereum Sepolia (0.2 USDC)
      42161: 50000,    // Arbitrum - low gas costs (0.05 USDC)
      421614: 50000,   // Arbitrum Sepolia (0.05 USDC)
      8453: 50000,     // Base - low gas costs (0.05 USDC)
      84532: 50000,    // Base Sepolia (0.05 USDC)
      43114: 100000,   // Avalanche - medium gas costs (0.1 USDC)
      43113: 100000,   // Avalanche Fuji (0.1 USDC)
      137: 100000,     // Polygon - medium gas costs (0.1 USDC)
      80002: 100000,   // Polygon Amoy (0.1 USDC)
      10: 100000,      // Optimism (0.1 USDC)
      11155420: 100000, // Optimism Sepolia (0.1 USDC)
    };

    const baseGasCost = chainGasCosts[destinationChain] || 100000; // Default 0.1 USDC

    // Add 50% buffer for gas price fluctuations
    const maxFeeWithBuffer = BigNumber.from(baseGasCost).mul(150).div(100);

    // CRITICAL: Ensure maxFee is always less than transfer amount
    // Circle contract requires: maxFee < amount
    const maxAllowedFee = transferAmount.sub(1); // amount - 1 to ensure strict less than
    const finalMaxFee = maxFeeWithBuffer.gt(maxAllowedFee) ? maxAllowedFee : maxFeeWithBuffer;

    console.log(`Destination gas fee calculation for chain ${destinationChain}:`, {
      idealFee: ethers.utils.formatUnits(maxFeeWithBuffer, 6) + ' USDC',
      transferAmount: ethers.utils.formatUnits(transferAmount, 6) + ' USDC',
      maxAllowedFee: ethers.utils.formatUnits(maxAllowedFee, 6) + ' USDC',
      finalMaxFee: ethers.utils.formatUnits(finalMaxFee, 6) + ' USDC',
      wasCapped: maxFeeWithBuffer.gt(maxAllowedFee)
    });

    return finalMaxFee;
  }

  private calculateEstimatedFee(fromChain: ChainId, toChain: ChainId): BigNumber {
    // Chain-specific fee calculation - increased for testnet reliability
    const chainFees: Record<ChainId, number> = {
      1: 200000,      // Ethereum - higher fees (0.2 USDC)
      11155111: 200000, // Ethereum Sepolia (0.2 USDC)
      42161: 100000,   // Arbitrum - lower fees (0.1 USDC)
      421614: 100000,  // Arbitrum Sepolia (0.1 USDC)
      8453: 100000,    // Base - lower fees (0.1 USDC)
      84532: 100000,   // Base Sepolia (0.1 USDC)
      43114: 150000,   // Avalanche - medium fees (0.15 USDC)
      43113: 150000,   // Avalanche Fuji (0.15 USDC)
      137: 150000,     // Polygon - medium fees (0.15 USDC)
      80002: 150000,   // Polygon Amoy (0.15 USDC)
    };

    const fromFee = chainFees[fromChain] || 100000;
    const toFee = chainFees[toChain] || 100000;
    const baseFee = 500000; // Increased base Circle fee to 0.5 USDC for reliability

    return BigNumber.from(baseFee + fromFee + toFee);
  }

  private getViemChain(chainId: ChainId) {
    const chainMap: Record<ChainId, any> = {
      11155111: sepolia,
      421614: arbitrumSepolia,
      84532: baseSepolia,
      43113: avalancheFuji,
      80002: polygonAmoy,
      11155420: optimismSepolia
    };
    
    const chain = chainMap[chainId];
    if (!chain) {
      throw new Error(`Unsupported chain for viem: ${chainId}`);
    }
    return chain;
  }

  private async extractPrivateKeyFromSigner(signer: Signer): Promise<string> {
    // For demo purposes, try to extract private key from signer
    // In production, this would need proper key management
    if ((signer as any)._signingKey?.privateKey) {
      return (signer as any)._signingKey.privateKey;
    }
    if ((signer as any).privateKey) {
      return (signer as any).privateKey;
    }
    
    // If we can't extract private key, we need to use a different approach
    // For now, throw an error with guidance
    throw new Error(
      'Cannot extract private key from signer for viem integration. ' +
      'This is needed to match the working sample project approach. ' +
      'Consider using a private key-based signer or implementing wallet client integration.'
    );
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
