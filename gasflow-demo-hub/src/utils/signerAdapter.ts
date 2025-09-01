import { ethers as ethersV6 } from 'ethers';

/**
 * Adapter to make ethers v6 signers compatible with ethers v5 SDK
 * This bridges the compatibility gap between versions
 */
export class SignerV5Adapter {
  constructor(private v6Signer: ethersV6.Signer) {}

  async getAddress(): Promise<string> {
    return await this.v6Signer.getAddress();
  }

  async signMessage(message: string): Promise<string> {
    return await this.v6Signer.signMessage(message);
  }

  async signTransaction(transaction: any): Promise<string> {
    return await this.v6Signer.signTransaction(transaction);
  }

  async sendTransaction(transaction: any): Promise<any> {
    // Convert v5 BigNumber objects to v6-compatible formats
    const v6Transaction = this.convertTransactionToV6Format(transaction);
    const tx = await this.v6Signer.sendTransaction(v6Transaction);
    return {
      hash: tx.hash,
      wait: () => tx.wait(),
      ...tx
    };
  }

  // Handle contract calls - critical for SDK compatibility
  async call(transaction: any): Promise<any> {
    const v6Transaction = this.convertTransactionToV6Format(transaction);
    return await this.v6Signer.call(v6Transaction);
  }

  async estimateGas(transaction: any): Promise<any> {
    const v6Transaction = this.convertTransactionToV6Format(transaction);
    const result = await this.v6Signer.estimateGas(v6Transaction);
    // Convert v6 BigInt back to v5 BigNumber for SDK compatibility
    return {
      toString: () => result.toString(),
      mul: (factor: any) => ({ 
        div: (divisor: any) => ({
          toString: () => (BigInt(result.toString()) * BigInt(factor.toString()) / BigInt(divisor.toString())).toString()
        })
      }),
      _isBigNumber: true
    };
  }

  private convertTransactionToV6Format(transaction: any): any {
    const converted: any = { ...transaction };
    
    // Convert v5 BigNumber objects to v6 BigInt or number strings
    if (transaction.gasLimit && this.isBigNumber(transaction.gasLimit)) {
      converted.gasLimit = BigInt(transaction.gasLimit.toString());
    }
    
    if (transaction.gasPrice && this.isBigNumber(transaction.gasPrice)) {
      converted.gasPrice = BigInt(transaction.gasPrice.toString());
    }
    
    if (transaction.value && this.isBigNumber(transaction.value)) {
      converted.value = BigInt(transaction.value.toString());
    }
    
    if (transaction.maxFeePerGas && this.isBigNumber(transaction.maxFeePerGas)) {
      converted.maxFeePerGas = BigInt(transaction.maxFeePerGas.toString());
    }
    
    if (transaction.maxPriorityFeePerGas && this.isBigNumber(transaction.maxPriorityFeePerGas)) {
      converted.maxPriorityFeePerGas = BigInt(transaction.maxPriorityFeePerGas.toString());
    }

    return converted;
  }

  private isBigNumber(value: any): boolean {
    // Check if it's an ethers v5 BigNumber
    return value && 
           typeof value === 'object' && 
           value._isBigNumber === true &&
           typeof value.toString === 'function';
  }

  // Make the adapter compatible with ethers v5 contract connection
  get provider() {
    return this.v6Signer.provider;
  }

  // Connect method for contract factories
  connect(addressOrContract: string): any {
    // Return the adapter itself but connected to the address
    return this;
  }

  // Static method to check if we need adaptation
  static isV6Signer(signer: any): boolean {
    // Check if it's an ethers v6 signer by looking for v6-specific properties
    return signer && typeof signer.getAddress === 'function' && 
           signer.constructor.name.includes('Signer') && 
           !signer._isSigner; // v5 signers have _isSigner property
  }

  // Convert v6 signer to v5-compatible format
  static adapt(v6Signer: ethersV6.Signer): any {
    if (!v6Signer) {
      throw new Error('Cannot adapt null or undefined signer');
    }
    
    if (!SignerV5Adapter.isV6Signer(v6Signer)) {
      console.warn('⚠️ Attempting to adapt a non-v6 signer - this may cause unexpected behavior');
    }
    
    try {
      // Create a proxy that mimics v5 signer behavior
      const adapter = new SignerV5Adapter(v6Signer);
      
      // Create a proxy to handle all the ethers v5 signer properties and methods
      return new Proxy(adapter, {
        get(target, prop, receiver) {
          try {
            // Handle specific v5 properties
            if (prop === '_isSigner') {
              return true; // Identify as v5 signer
            }
            if (prop === 'provider') {
              return v6Signer.provider;
            }
            
            // CRITICAL FIX: Handle contract method calls properly
            // When SDK calls contract.estimateGas.receiveMessage(), we need to proxy this correctly
            if (prop === 'estimateGas' || prop === 'call' || prop === 'sendTransaction') {
              const value = Reflect.get(target, prop, receiver);
              return typeof value === 'function' ? value.bind(target) : value;
            }
            
            // For all other properties, try the adapter first, then the original v6 signer
            if (prop in target) {
              const value = Reflect.get(target, prop, receiver);
              return typeof value === 'function' ? value.bind(target) : value;
            }
            
            if (prop in v6Signer) {
              const value = Reflect.get(v6Signer, prop);
              return typeof value === 'function' ? value.bind(v6Signer) : value;
            }
            
            return undefined;
          } catch (error) {
            console.error(`Error accessing property '${String(prop)}' on adapted signer:`, error);
            throw error;
          }
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create signer adapter: ${errorMessage}`);
    }
  }
}

// Cache for adapted signers to prevent infinite re-creation
const signerCache = new WeakMap();

/**
 * Ethers.js Version Compatibility Adapter
 * 
 * This utility bridges the compatibility gap between ethers v6 signers (used in frontend)
 * and ethers v5 signers (expected by the SDK). This is necessary because:
 * 
 * 1. The SDK was built with ethers v5 contracts and expects v5 signer interface
 * 2. Modern wallet libraries (like wagmi, rainbow-kit) provide ethers v6 signers
 * 3. The proxy pattern maintains full compatibility while being transparent to SDK usage
 * 
 * The adapter uses WeakMap caching to prevent memory leaks and ensure singleton behavior.
 * 
 * @param signer - The ethers signer object (v5 or v6)
 * @returns A v5-compatible signer object
 * @throws Error if signer validation fails
 */
export function ensureV5Compatibility(signer: any): any {
  if (!signer) {
    throw new Error('Signer cannot be null or undefined');
  }
  
  // Validate basic signer interface
  if (typeof signer.getAddress !== 'function') {
    throw new Error('Invalid signer provided - must implement getAddress() method');
  }
  
  // If it's already a v5 signer, return as-is
  if (signer._isSigner) {
    console.log('✅ Signer is already ethers v5 compatible');
    return signer;
  }
  
  // Check cache first to avoid re-creating adapters
  if (signerCache.has(signer)) {
    console.log('✅ Using cached v5 adapter for signer');
    return signerCache.get(signer);
  }
  
  // If it's a v6 signer, adapt it
  if (SignerV5Adapter.isV6Signer(signer)) {
    try {
      console.log('🔄 Adapting ethers v6 signer for v5 SDK compatibility');
      const adaptedSigner = SignerV5Adapter.adapt(signer);
      signerCache.set(signer, adaptedSigner);
      console.log('✅ v6 → v5 adapter created and cached');
      return adaptedSigner;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to adapt ethers v6 signer: ${errorMessage}`);
    }
  }
  
  // Unknown signer type - issue warning but allow SDK to handle it
  console.warn('⚠️ Unknown signer type detected - passing through to SDK without adaptation');
  console.warn('Signer details:', {
    hasGetAddress: typeof signer.getAddress === 'function',
    hasProvider: !!signer.provider,
    constructor: signer.constructor?.name,
    _isSigner: signer._isSigner
  });
  
  return signer;
}