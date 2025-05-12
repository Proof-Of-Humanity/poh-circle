import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    chiado: {
      chainId: 10200,
      url: process.env.CHIADO_RPC_URL || "https://rpc.chiado.gnosis.gateway.fm",
      accounts: [process.env.PRIVATE_KEY!]
    },
    gnosis: {
      chainId: 100,
      url: process.env.GNOSIS_RPC_URL || "https://rpc.gnosischain.com",
      accounts: [process.env.PRIVATE_KEY!]
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 1000000000,
  },
  etherscan: {
    apiKey: {
      gnosis: process.env.BLOCKSCOUT_API_KEY || "any-string-for-blockscout",
      chiado: process.env.BLOCKSCOUT_API_KEY || "any-string-for-blockscout"
    },
    customChains: [
      {
        network: "gnosis",
        chainId: 100,
        urls: {
          apiURL: "https://gnosis.blockscout.com/api",
          browserURL: "https://gnosis.blockscout.com"
        }
      },
      {
        network: "chiado",
        chainId: 10200,
        urls: {
          apiURL: "https://gnosis-chiado.blockscout.com/api",
          browserURL: "https://gnosis-chiado.blockscout.com"
        }
      }
    ]
  }};

export default config;
