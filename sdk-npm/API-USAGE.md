# API Usage Documentation

This document catalogs all external API endpoints used in the GasFlow SDK.

## Circle APIs (CCTP - Cross-Chain Transfer Protocol)

### Base URLs
- **Testnet**: `https://iris-api-sandbox.circle.com`
- **Mainnet**: `https://iris-api.circle.com`

### Authentication
- Uses Bearer token authentication
- API key passed in Authorization header: `Authorization: Bearer ${apiKey}`

### Endpoints Used

#### 1. Burn Fees Endpoint ❌ INCORRECT IMPLEMENTATION
- **File**: `src/services/ProductionCCTPService.ts:64`
- **Current SDK**: `/v2/burn/USDC/fees` (POST with JSON body)
- **Correct API**: `/v2/burn/USDC/fees/{sourceDomainId}/{destDomainId}` (GET)
- **Method**: GET (not POST)
- **Purpose**: Get transfer fees for USDC cross-chain burns
- **Path Parameters**:
  - `sourceDomainId`: Source domain identifier
  - `destDomainId`: Destination domain identifier
- **Correct Response**:
  ```json
  {
    "data": {
      "finalityThreshold": 1000,
      "minimumFee": 1
    }
  }
  ```
- **Usage**: Called in `estimateBridgeFee()` method

#### 2. Fast Burn Allowance Endpoint ❌ INCORRECT IMPLEMENTATION
- **File**: `src/services/ProductionCCTPService.ts:106`
- **Current SDK**: `/v2/fastBurn/USDC/allowance` (POST with JSON body)
- **Correct API**: `/v2/fastBurn/USDC/allowance` (GET)
- **Method**: GET (not POST)
- **Purpose**: Check available Fast Transfer allowance for cross-chain transfers
- **No Parameters Required**
- **Correct Response**:
  ```json
  {
    "allowance": 123999.999999,
    "lastUpdated": "2025-01-23T10:00:00Z"
  }
  ```
- **Usage**: Called in `canUseFastTransfer()` method

#### 3. Attestation Status Endpoint
- **File**: `src/services/ProductionCCTPService.ts:438,476`
- **Endpoint**: `/v1/attestations/{messageHash}`
- **Method**: GET
- **Purpose**: Get attestation status and signature for cross-chain message
- **Parameters**: 
  - `messageHash`: Message hash from burn transaction
- **Response**: 
  ```json
  {
    "status": "complete" | "pending",
    "attestation": string,
    "message": string
  }
  ```
- **Usage**: Called in `pollForAttestation()` and `getAttestationStatus()` methods

## Available Circle API Endpoints (Not Currently Used)

### 1. Public Keys V2 Endpoint
- **Endpoint**: `/v2/publicKeys`
- **Method**: GET
- **Purpose**: Returns public keys for validating attestations across all supported CCTP versions
- **Authentication**: None
- **Response**:
  ```json
  {
    "publicKeys": [
      {
        "publicKey": "0x04fc192351b97838713...",
        "cctpVersion": "1" | "2"
      }
    ]
  }
  ```

### 2. Messages V2 Endpoint  
- **Endpoint**: `/v2/messages/{sourceDomainId}`
- **Method**: GET
- **Purpose**: Retrieves messages and attestations for a given transaction or nonce
- **Path Parameters**:
  - `sourceDomainId`: Source domain identifier
- **Query Parameters** (at least one required):
  - `transactionHash`: Transaction hash to filter messages
  - `nonce`: Nonce to filter messages
- **Response**:
  ```json
  {
    "messages": [
      {
        "message": "hex-encoded message",
        "eventNonce": "nonce",
        "attestation": "attestation",
        "decodedMessage": {
          "sourceDomain": number,
          "destinationDomain": number,
          "sender": "address",
          "recipient": "address",
          "messageBody": "hex",
          "burnToken": "address", 
          "amount": "string"
        },
        "cctpVersion": "1" | "2",
        "status": "status"
      }
    ]
  }
  ```

### 3. Re-attest Message Endpoint
- **Endpoint**: `/v2/reattest/{nonce}`
- **Method**: POST
- **Purpose**: Re-attest a V2 pre-finality message to achieve higher finality
- **Path Parameters**:
  - `nonce`: The nonce of the V2 pre-finality message to re-attest
- **Authentication**: None
- **Response**:
  ```json
  {
    "message": "string",
    "nonce": "string"
  }
  ```

## Third-Party APIs

### CoinGecko API
- **Base URL**: `https://api.coingecko.com/api/v3`
- **Purpose**: Cryptocurrency price data for gas cost calculations
- **Authentication**: None (public API)

#### Price Endpoints Used

1. **Ethereum Price**
   - **Files**: 
     - `src/services/GasEstimator.ts:42`
     - `src/services/PaymasterService.ts:190`
     - `src/services/RealPaymasterService.ts:412`
   - **Endpoint**: `/simple/price?ids=ethereum&vs_currencies=usd`
   - **Method**: GET
   - **Purpose**: Get ETH price in USD for gas cost calculations

2. **Avalanche Price**
   - **File**: `src/services/GasEstimator.ts:59`
   - **Endpoint**: `/simple/price?ids=avalanche-2&vs_currencies=usd`
   - **Method**: GET
   - **Purpose**: Get AVAX price in USD for gas cost calculations

3. **Polygon Price**
   - **File**: `src/services/GasEstimator.ts:76`
   - **Endpoint**: `/simple/price?ids=matic-network&vs_currencies=usd`
   - **Method**: GET
   - **Purpose**: Get MATIC price in USD for gas cost calculations

## API Error Handling

### Circle API
- **Fallback Strategy**: All Circle API calls include fallback logic
- **Fee API**: Falls back to chain-specific calculation if API fails
- **Allowance API**: Falls back to threshold-based logic
- **Attestation API**: Uses polling with timeout (5 minutes default)

### CoinGecko API
- **Fallback Strategy**: Uses hardcoded fallback prices when API fails
- **Fallback Prices**:
  - ETH: $2000 USD
  - AVAX: $30 USD  
  - MATIC: $0.8 USD
- **Testnet**: Always uses fallback prices to avoid unnecessary API calls

## Rate Limiting

### Circle API
- **Documented Limit**: 35 requests per second
- **Implementation**: No explicit rate limiting in SDK
- **Attestation Polling**: 10-second intervals to avoid excessive requests

### CoinGecko API
- **Documented Limit**: Not specified in code
- **Implementation**: Uses caching in GasEstimator (10-second cache duration)
- **Testnet**: Disabled to reduce API calls

## Security Considerations

### API Keys
- Circle API key is passed as constructor parameter
- No hardcoded API keys in the codebase
- API key used in Authorization header

### Request Validation
- All fetch requests include proper error handling
- Request bodies are validated before sending
- Response data is validated before use

## Dependencies

### Circle API Integration
- **Smart Contracts**: Uses Circle's official CCTP V2 contracts
- **Domain Mapping**: Maps chain IDs to Circle domain IDs
- **Message Parsing**: Extracts message hashes from transaction receipts

### Price Feed Integration  
- **Gas Estimation**: Integrates with multiple price feeds for accurate gas cost calculation
- **Multi-Chain Support**: Handles different native tokens (ETH, AVAX, MATIC)
- **Conversion Logic**: Converts native token costs to USDC equivalents