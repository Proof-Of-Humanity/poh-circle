import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import fs from "fs"; 
import path from "path"; 

interface ContractAddresses {
  proofOfHumanity: string;
  crossChainProofOfHumanity: string;
  circlesHub: string;
  coreMembersGroup: string;
  maximumBatchSize: number;
}

const configPathEnv = process.env.POH_CIRCLES_PROXY_CONFIG_PATH;
if (!configPathEnv) {
  throw new Error("Error: POH_CIRCLES_PROXY_CONFIG_PATH environment variable is not set.");
}

const absoluteConfigPath = path.resolve(process.cwd(), configPathEnv);

let parameters: ContractAddresses;
try {
  const configFileContent = fs.readFileSync(absoluteConfigPath, 'utf-8');
  parameters = JSON.parse(configFileContent);
} catch (error: any) {
  console.error(`Error reading or parsing config file at ${absoluteConfigPath}: ${error.message}`);
  throw new Error(`Failed to load configuration from ${absoluteConfigPath}`);
}

const ProofOfHumanityCirclesProxyModule = buildModule("ProofOfHumanityCirclesProxyModule", (m) => {
  const deployAddresses = parameters;

  if (!deployAddresses) {
    console.error(`Error: Addresses for network '${hre.network.name}' not found in the config.`);
    throw new Error(`Address configuration for network '${hre.network.name}' not found or invalid.`);
  }

  const {
    proofOfHumanity,
    coreMembersGroup,
    crossChainProofOfHumanity,
    circlesHub,
    maximumBatchSize
  } = deployAddresses;

  if (!proofOfHumanity || !coreMembersGroup || !crossChainProofOfHumanity || !circlesHub) {
    const errorMessage = `Error: One or more dependent contract addresses are missing in config file ${absoluteConfigPath} for network '${hre.network.name}'.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  console.log(`Deploying ProofOfHumanityCirclesProxy on network ${hre.network.name} (via Ignition)`);
  console.log(`Using configuration from: ${absoluteConfigPath}`); 
  console.log('Constructor arguments:');
  console.log(`  _proofOfHumanity: ${proofOfHumanity}`);
  console.log(`  _coreMembersGroup: ${coreMembersGroup}`);
  console.log(`  _crossChainProofOfHumanity: ${crossChainProofOfHumanity}`);
  console.log(`  _hub: ${circlesHub}`);

  const proofOfHumanityCirclesProxy = m.contract("ProofOfHumanityCirclesProxy", [
    proofOfHumanity,
    coreMembersGroup,
    crossChainProofOfHumanity,
    circlesHub,
    maximumBatchSize
  ]);

  return { proofOfHumanityCirclesProxy };
});

export default ProofOfHumanityCirclesProxyModule;
