import { BigNumber, Signer, Contract } from 'ethers';
import { ChainId, GasFlowTransaction } from '../types';
import { getChainConfig } from '../config/chains';

export interface TraditionalExecutionResult {
  transactionHash: string;
  gasUsed: BigNumber;
  gasPrice: BigNumber;
  totalGasCost: BigNumber;
}

/**
 * Traditional Execution Service
 * Handles direct signer-based transaction execution with native gas payment
 */
export class TraditionalExecutionService {
  constructor(private useTestnet: boolean = true) {}

  /**
   * Execute transaction using signer with native gas payment
   */
  async executeTransaction(
    transaction: GasFlowTransaction,
    signer: Signer,
    chainId: ChainId
  ): Promise<TraditionalExecutionResult> {
    this.validateTransaction(transaction);
    this.validateSigner(signer);
    
    console.log('Executing transaction with traditional gas payment:', {
      chainId,
      to: transaction.to,
      value: transaction.value || '0',
      hasData: !!transaction.data
    });

    try {
      // Prepare transaction object
      const txRequest = await this.buildTransactionRequest(transaction, signer, chainId);
      
      // Execute transaction
      const txResponse = await signer.sendTransaction(txRequest);
      console.log(`Transaction submitted: ${txResponse.hash}`);
      
      // Wait for confirmation
      const receipt = await txResponse.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      return {
        transactionHash: txResponse.hash,
        gasUsed: receipt.gasUsed,
        gasPrice: txResponse.gasPrice || BigNumber.from(0),
        totalGasCost: receipt.gasUsed.mul(txResponse.gasPrice || 0)
      };

    } catch (error) {
      console.error('Traditional execution failed:', error);
      throw new Error(`Transaction execution failed: ${this.parseTransactionError(error)}`);
    }
  }

  /**
   * Estimate gas for transaction execution
   */
  async estimateGas(
    transaction: GasFlowTransaction,
    signer: Signer,
    chainId: ChainId
  ): Promise<BigNumber> {
    try {
      const txRequest = await this.buildTransactionRequest(transaction, signer, chainId);
      return await signer.estimateGas(txRequest);
    } catch (error) {
      console.warn('Gas estimation failed, using default:', error);
      // Return reasonable default gas limit
      return BigNumber.from(21000); // Standard ETH transfer gas
    }
  }

  /**
   * Get current gas price for chain
   */
  async getGasPrice(chainId: ChainId, signer: Signer): Promise<BigNumber> {
    try {
      const provider = signer.provider;
      if (!provider) {
        throw new Error('Signer has no provider attached');
      }

      const gasPrice = await provider.getGasPrice();
      console.log(`Current gas price on chain ${chainId}: ${gasPrice.toString()} wei`);
      return gasPrice;
    } catch (error) {
      console.warn('Failed to get gas price, using default:', error);
      return BigNumber.from('20000000000'); // 20 gwei default
    }
  }

  /**
   * Validate pre-flight conditions for transaction
   */
  async validateExecution(
    transaction: GasFlowTransaction,
    signer: Signer,
    chainId: ChainId
  ): Promise<{ canExecute: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check signer network
      const signerChainId = await signer.getChainId();
      if (signerChainId !== chainId) {
        issues.push(`Signer is on chain ${signerChainId}, but transaction requires chain ${chainId}`);
      }

      // Check signer balance for gas
      const balance = await signer.getBalance();
      const gasEstimate = await this.estimateGas(transaction, signer, chainId);
      const gasPrice = await this.getGasPrice(chainId, signer);
      const gasCost = gasEstimate.mul(gasPrice);

      if (balance.lt(gasCost)) {
        issues.push(`Insufficient balance for gas. Required: ${gasCost.toString()} wei, Available: ${balance.toString()} wei`);
      }

      // Validate transaction parameters
      if (transaction.value && BigNumber.from(transaction.value).gt(balance.sub(gasCost))) {
        issues.push(`Insufficient balance for transaction value + gas`);
      }

    } catch (error) {
      issues.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      canExecute: issues.length === 0,
      issues
    };
  }

  // Private helper methods

  private async buildTransactionRequest(
    transaction: GasFlowTransaction,
    signer: Signer,
    chainId: ChainId
  ): Promise<any> {
    const gasEstimate = await this.estimateGas(transaction, signer, chainId);
    const gasPrice = await this.getGasPrice(chainId, signer);

    return {
      to: transaction.to,
      value: transaction.value || 0,
      data: transaction.data || '0x',
      gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
      gasPrice: gasPrice
    };
  }

  private validateTransaction(transaction: GasFlowTransaction): void {
    if (!transaction.to) {
      throw new Error('Transaction must have a "to" address');
    }

    if (!transaction.to.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid "to" address format');
    }

    if (transaction.value && BigNumber.from(transaction.value).lt(0)) {
      throw new Error('Transaction value cannot be negative');
    }
  }

  private validateSigner(signer: Signer): void {
    if (!signer) {
      throw new Error('Signer cannot be null or undefined');
    }

    if (typeof signer.getAddress !== 'function') {
      throw new Error('Invalid signer - must implement getAddress() method');
    }

    if (typeof signer.sendTransaction !== 'function') {
      throw new Error('Invalid signer - must implement sendTransaction() method');
    }

    if (!signer.provider) {
      throw new Error('Signer must have a provider attached');
    }
  }

  private parseTransactionError(error: any): string {
    if (error.reason) {
      return error.reason;
    }
    if (error.message) {
      return error.message;
    }
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return 'Insufficient funds for transaction + gas costs';
    }
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      return 'Transaction may fail - gas estimation failed';
    }
    return 'Unknown transaction error';
  }
}