# Proof of Humanity Circles Proxy

A proxy contract that bridges Proof of Humanity verification with Circles UBI, allowing verified humans to register in the Circles ecosystem and manage trust relationships automatically.

## Overview

This contract enables Proof of Humanity users to:
- Register their verified humanity in the Circles Group
- Link multiple humanity IDs to a single Circles account
- Maintain trust relationships based on PoH verification status
- Batch process trust re-evaluations for efficiency

## Environment Setup

### Prerequisites
- Node.js (v22+ recommended)
- npm package manager
- Git

### Installation

1. Clone the repository and install dependencies:
```bash
git clone https://github.com/Proof-Of-Humanity/poh-circle
cd poh-circle
npm install
```

2. Set up your environment file:
```bash
cp .env.example .env
```

3. Edit the `.env` file with your actual values:
```bash
# Required for testnet/mainnet deployment
PRIVATE_KEY=your_private_key_here

# Optional: Custom RPC URLs (defaults provided)
CHIADO_RPC_URL=https://rpc.chiado.gnosis.gateway.fm
GNOSIS_RPC_URL=https://rpc.gnosischain.com

# Optional: For contract verification on Blockscout
BLOCKSCOUT_API_KEY=your_blockscout_api_key

```

### Configuration Files

The project uses JSON configuration files in the `config/` directory:
- `poh-test-circles.json` - Configuration for test circles deployment on Gnosis Chain
- `poh-test-rings.json` - Configuration for test rings deployment on Gnosis Chain  
- `poh-chiado-mocks.json` - Configuration for mock contracts deployment on Chiado testnet

Each config file must contain:
```json
{
    "proofOfHumanity": "0x...",
    "crossChainProofOfHumanity": "0x...",
    "circlesHub": "0x...",
    "baseGroup": "0x...",
    "maximumBatchSize": 30
}
```

### Available Commands

```bash
# Compile contracts and generate TypeChain types
npm run compile

# Run comprehensive test suite
npm test

# Clean build artifacts
npm run clean

# Deploy to Gnosis Chain (test circles config)
npm run deploy:poh-test-circles

# Deploy to Gnosis Chain (test rings config)
npm run deploy:poh-test-rings

# Deploy to Chiado testnet (mock contracts)
npm run deploy:chiado
```

### Development

The project includes:
- **Hardhat** for development and testing
- **TypeScript** support with strict type checking
- **TypeChain** for type-safe contract interactions
- **Mock contracts** for isolated testing

### Network Configuration

Supported networks:
- **Hardhat Local**: `hardhat` (Chain ID: 31337)
- **Localhost**: `localhost` (http://127.0.0.1:8545)
- **Chiado Testnet**: `chiado` (Chain ID: 10200)
- **Gnosis Chain**: `gnosis` (Chain ID: 100)

### Testing

The test suite covers:
- Contract deployment and initialization
- Governance functions and access control
- Registration and trust management
- Batch processing and re-evaluation
- Cross-chain humanity verification
- Edge cases and error conditions

Run tests with coverage:
```bash
npm test
```

### Contract Verification

Contracts are automatically verifiable on Blockscout for both Gnosis Chain and Chiado testnet. The configuration supports custom API endpoints for verification.
