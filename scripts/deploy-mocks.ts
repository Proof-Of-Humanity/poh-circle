import { ethers } from "hardhat";
import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log(`Deploying mock contracts on network: ${hre.network.name}`);
  console.log(`Chain ID: ${hre.network.config.chainId}`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  const pohAddress = "0x3DED649Cc1E0a5D67614d6742C4919B10F0Aabe9";
  const ccPohAddress = "0xBFb98b8F785dE02F35e4eAa8b83a4c9390f75f99";
  
  console.log(`\n📋 Using existing ProofOfHumanity: ${pohAddress}`);
  console.log(`📋 Using existing CrossChainProofOfHumanity: ${ccPohAddress}`);

  console.log("\n1. Deploying HubMock...");
  const HubMockFactory = await ethers.getContractFactory("HubMock");
  const hubMock = await HubMockFactory.deploy();
  await hubMock.waitForDeployment();
  const hubMockAddress = await hubMock.getAddress();
  console.log(`✅ HubMock deployed to: ${hubMockAddress}`);

  console.log("\n2. Deploying BaseGroupMock...");
  const BaseGroupMockFactory = await ethers.getContractFactory("BaseGroupMock");
  const baseGroupMock = await BaseGroupMockFactory.deploy();
  await baseGroupMock.waitForDeployment();
  const baseGroupMockAddress = await baseGroupMock.getAddress();
  console.log(`✅ BaseGroupMock deployed to: ${baseGroupMockAddress}`);

  console.log("\n3. Configuring BaseGroupMock to use HubMock...");
  const setHubTx = await baseGroupMock.setHub(hubMockAddress);
  await setHubTx.wait();
  console.log(`✅ BaseGroupMock configured with HubMock address`);

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Network: ${hre.network.name} (Chain ID: ${hre.network.config.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("\nContract Addresses:");
  console.log(`ProofOfHumanity (existing):          ${pohAddress}`);
  console.log(`CrossChainProofOfHumanity (existing): ${ccPohAddress}`);
  console.log(`HubMock (newly deployed):            ${hubMockAddress}`);
  console.log(`BaseGroupMock (newly deployed):      ${baseGroupMockAddress}`);

  const configData = {
    "proofOfHumanity": pohAddress,
    "crossChainProofOfHumanity": ccPohAddress,
    "circlesHub": hubMockAddress,
    "baseGroup": baseGroupMockAddress,
    "maximumBatchSize": 30
  };

  const configFileName = `poh-${hre.network.name}-mocks.json`;
  const configPath = path.join(process.cwd(), "config", configFileName);
  
  // Ensure config directory exists
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(`✅ Created config directory: ${configDir}`);
  }

  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  console.log(`✅ Config file created: ${configPath}`);

  console.log("\n" + "=".repeat(60));
  console.log("CONFIG FILE FOR PROXY DEPLOYMENT");
  console.log("=".repeat(60));
  console.log(`Config saved to: ${configPath}`);
  console.log("Content:");
  console.log(JSON.stringify(configData, null, 2));

  // Next steps
  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS");
  console.log("=".repeat(60));
  console.log("1. Deploy the proxy with:");
  console.log(`   export POH_CIRCLES_PROXY_CONFIG_PATH=config/${configFileName}`);
  console.log(`   npx hardhat ignition deploy ignition/modules/ProofOfHumanityCirclesProxyModule.ts --network ${hre.network.name}`);
  console.log("\n2. (Optional) Verify newly deployed contracts on Blockscout:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${hubMockAddress}`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${baseGroupMockAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 