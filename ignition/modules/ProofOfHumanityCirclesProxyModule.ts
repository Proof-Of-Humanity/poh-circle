import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import parameters from "../../config/poh-test-rings.json";

interface ContractAddresses {
  proofOfHumanity: string;
  crossChainProofOfHumanity: string;
  circlesHub: string;
  coreMembersGroup: string;
}

const ProofOfHumanityCirclesProxyModule = buildModule("ProofOfHumanityCirclesProxyModule", (m) => {
  const deployAddresses = parameters as ContractAddresses;
  if (!deployAddresses) {
    console.error(`Error: Addresses for network '${hre.network.name}' not found under the 'gnosis' group in the config.`);
    console.error(`Please ensure an entry for 'gnosis.${deployAddresses}' exists in the configuration.`);
    throw new Error(`Address configuration for network '${deployAddresses}' not found.`);
  }

  const { 
    proofOfHumanity,
    coreMembersGroup,
    crossChainProofOfHumanity,
    circlesHub 
  } = deployAddresses;

  if (!proofOfHumanity || !coreMembersGroup || !crossChainProofOfHumanity || !circlesHub) {
    const errorMessage = `Error: One or more dependent contract addresses are missing for network '${hre.network.name}' in config.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  console.log(`Deploying ProofOfHumanityCirclesProxy on network ${hre.network.name} (via Ignition)`);
  console.log('Constructor arguments:');
  console.log(`  _proofOfHumanity: ${proofOfHumanity}`);
  console.log(`  _coreMembersGroup: ${coreMembersGroup}`);
  console.log(`  _crossChainProofOfHumanity: ${crossChainProofOfHumanity}`);
  console.log(`  _hub: ${circlesHub}`);

  const proxy = m.contract("ProofOfHumanityCirclesProxy", [
    proofOfHumanity,
    coreMembersGroup,
    crossChainProofOfHumanity,
    circlesHub,
  ]);

  return { proxy };
});

export default ProofOfHumanityCirclesProxyModule;
