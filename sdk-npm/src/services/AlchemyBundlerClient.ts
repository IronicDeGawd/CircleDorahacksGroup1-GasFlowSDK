import { ChainId } from '../types';
import { getChainConfig } from '../config/chains';

export interface AlchemyBundlerConfig {
  apiKey: string;
  useTestnet: boolean;
}

export interface UserOperationResponse {
  result: string; // userOpHash
}

export interface AlchemyErrorResponse {
  code: number;
  message: string;
  data?: any;
}

export interface AlchemyResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: AlchemyErrorResponse;
}

export class AlchemyBundlerClient {
  private apiKey: string;
  private useTestnet: boolean;

  constructor(config: AlchemyBundlerConfig) {
    this.apiKey = config.apiKey;
    this.useTestnet = config.useTestnet;
  }

  private getBundlerUrl(chainId: ChainId): string {
    const config = getChainConfig(chainId, this.useTestnet);
    if (!config.bundlerUrl) {
      throw new Error(`Bundler URL not configured for chain ${chainId}`);
    }
    return `${config.bundlerUrl}/${this.apiKey}`;
  }

  private getEntryPointAddress(chainId: ChainId): string {
    const config = getChainConfig(chainId, this.useTestnet);
    // Use v0.8 EntryPoint (Circle Paymaster requirement)
    return config.entryPointV08 || config.entryPointV07 || '0x0000000071727De22E5E9d8BAf0edAc6f37da032';
  }

  async sendUserOperation(
    userOperation: any,
    chainId: ChainId
  ): Promise<string> {
    const bundlerUrl = this.getBundlerUrl(chainId);
    const entryPointAddress = this.getEntryPointAddress(chainId);

    const request = {
      jsonrpc: '2.0' as const,
      method: 'eth_sendUserOperation',
      params: [userOperation, entryPointAddress],
      id: 1,
    };

    console.log(`[ALCHEMY] Sending UserOperation to ${bundlerUrl}`);
    console.log('[ALCHEMY] Request:', JSON.stringify(request, null, 2));

    try {
      const response = await fetch(bundlerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AlchemyResponse = await response.json();
      console.log('[ALCHEMY] Response:', JSON.stringify(data, null, 2));

      if (data.error) {
        throw new Error(`Alchemy Bundler Error ${data.error.code}: ${data.error.message}`);
      }

      if (!data.result) {
        throw new Error('No userOpHash returned from bundler');
      }

      return data.result;
    } catch (error) {
      console.error('[ALCHEMY] Failed to send UserOperation:', error);
      throw new Error(`Bundler submission failed: ${error}`);
    }
  }

  async estimateUserOperationGas(
    userOperation: any,
    chainId: ChainId
  ): Promise<{
    preVerificationGas: string;
    verificationGasLimit: string;
    callGasLimit: string;
  }> {
    const bundlerUrl = this.getBundlerUrl(chainId);
    const entryPointAddress = this.getEntryPointAddress(chainId);

    const request = {
      jsonrpc: '2.0' as const,
      method: 'eth_estimateUserOperationGas',
      params: [userOperation, entryPointAddress],
      id: 2,
    };

    console.log(`[ALCHEMY] Estimating gas for UserOperation on chain ${chainId}`);

    try {
      const response = await fetch(bundlerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AlchemyResponse = await response.json();

      if (data.error) {
        throw new Error(`Alchemy Gas Estimation Error ${data.error.code}: ${data.error.message}`);
      }

      return data.result;
    } catch (error) {
      console.error('[ALCHEMY] Failed to estimate gas:', error);
      throw new Error(`Gas estimation failed: ${error}`);
    }
  }

  async getUserOperationReceipt(
    userOpHash: string,
    chainId: ChainId
  ): Promise<any> {
    const bundlerUrl = this.getBundlerUrl(chainId);

    const request = {
      jsonrpc: '2.0' as const,
      method: 'eth_getUserOperationReceipt',
      params: [userOpHash],
      id: 3,
    };

    console.log(`[ALCHEMY] Getting receipt for UserOperation ${userOpHash}`);

    try {
      const response = await fetch(bundlerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AlchemyResponse = await response.json();

      if (data.error) {
        // Receipt might not be available yet - this is normal
        if (data.error.code === -32601 || data.error.message.includes('not found')) {
          return null;
        }
        throw new Error(`Alchemy Receipt Error ${data.error.code}: ${data.error.message}`);
      }

      return data.result;
    } catch (error) {
      console.error('[ALCHEMY] Failed to get receipt:', error);
      throw new Error(`Receipt retrieval failed: ${error}`);
    }
  }

  async getSupportedEntryPoints(chainId: ChainId): Promise<string[]> {
    const bundlerUrl = this.getBundlerUrl(chainId);

    const request = {
      jsonrpc: '2.0' as const,
      method: 'eth_supportedEntryPoints',
      params: [],
      id: 4,
    };

    try {
      const response = await fetch(bundlerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AlchemyResponse = await response.json();

      if (data.error) {
        throw new Error(`Alchemy EntryPoints Error ${data.error.code}: ${data.error.message}`);
      }

      return data.result || [];
    } catch (error) {
      console.error('[ALCHEMY] Failed to get supported entry points:', error);
      throw new Error(`Supported entry points retrieval failed: ${error}`);
    }
  }
}