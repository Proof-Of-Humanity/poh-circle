import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
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
    timeout: 40000,
  },
};

export default config;
