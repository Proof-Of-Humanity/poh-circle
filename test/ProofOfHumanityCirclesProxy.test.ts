import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { 
  ProofOfHumanityCirclesProxy, 
  ProofOfHumanityMock, 
  CoreMembersGroupMock, 
  CrossChainProofOfHumanityMock, 
  HubMock 
} from "../typechain-types";

describe("ProofOfHumanityCirclesProxy", function () {
  let proofOfHumanityCirclesProxy: ProofOfHumanityCirclesProxy;
  let proofOfHumanityMock: ProofOfHumanityMock;
  let coreMembersGroupMock: CoreMembersGroupMock;
  let crossChainProofOfHumanityMock: CrossChainProofOfHumanityMock;
  let hubMock: HubMock;
  let owner: SignerWithAddress;
  let governor: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let humanityID: string;
  let expirationTime: number;
  let humanityID2: string;
  let user2Expiration: number;
  let circlesAccount: string;

  async function deployFixture() {
    const [owner, governor, user1, user2] = await ethers.getSigners();

    const ProofOfHumanityMockFactory = await ethers.getContractFactory("ProofOfHumanityMock");
    proofOfHumanityMock = await ProofOfHumanityMockFactory.deploy();

    const CoreMembersGroupMockFactory = await ethers.getContractFactory("CoreMembersGroupMock");
    coreMembersGroupMock = await CoreMembersGroupMockFactory.deploy();

    const CrossChainProofOfHumanityMockFactory = await ethers.getContractFactory("CrossChainProofOfHumanityMock");
    crossChainProofOfHumanityMock = await CrossChainProofOfHumanityMockFactory.deploy();

    const HubMockFactory = await ethers.getContractFactory("HubMock");
    hubMock = await HubMockFactory.deploy();

    const ProofOfHumanityCirclesProxyFactory = await ethers.getContractFactory("ProofOfHumanityCirclesProxy");
    proofOfHumanityCirclesProxy = await ProofOfHumanityCirclesProxyFactory.deploy(
      await proofOfHumanityMock.getAddress(),
      await coreMembersGroupMock.getAddress(),
      await crossChainProofOfHumanityMock.getAddress(),
      await hubMock.getAddress(),
      30 // Default MaximumBatchSize
    );

    await (coreMembersGroupMock as CoreMembersGroupMock).setHub(await hubMock.getAddress()); 

    humanityID = "0x" + ethers.keccak256(ethers.toUtf8Bytes("test")).substring(2, 42);
    expirationTime = Math.floor(Date.now() / 1000) + 3600;

    humanityID2 = "0x" + ethers.keccak256(ethers.toUtf8Bytes("test2")).substring(2, 42);
    user2Expiration = expirationTime + 7200;

    return { proofOfHumanityCirclesProxy, proofOfHumanityMock, coreMembersGroupMock, crossChainProofOfHumanityMock, hubMock, owner, governor, user1, user2 };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployFixture);
    proofOfHumanityCirclesProxy = fixture.proofOfHumanityCirclesProxy;
    proofOfHumanityMock = fixture.proofOfHumanityMock;
    coreMembersGroupMock = fixture.coreMembersGroupMock;
    crossChainProofOfHumanityMock = fixture.crossChainProofOfHumanityMock;
    hubMock = fixture.hubMock;
    owner = fixture.owner;
    governor = fixture.governor;
    user1 = fixture.user1;
    user2 = fixture.user2;

    await crossChainProofOfHumanityMock.mockBoundTo(humanityID, user1.address);
    await proofOfHumanityMock.mockIsHuman(user1.address, true);

    const humanityInfo = {
      vouching: false,
      pendingRevocation: false,
      nbPendingRequests: 0,
      expirationTime: expirationTime,
      owner: user1.address,
      nbRequests: 1
    };
    await proofOfHumanityMock.mockGetHumanityInfo(humanityID, humanityInfo);

    const crossChainHumanityData = {
      owner: user1.address,
      expirationTime: expirationTime,
      lastTransferTime: Math.floor(Date.now() / 1000) - 86400,
      isHomeChain: true
    };
    await crossChainProofOfHumanityMock.mockHumanityData(humanityID, crossChainHumanityData);

    await coreMembersGroupMock.reset();
  });

  describe("Constructor", function () {
    it("Should initialize with correct values", async function () {
      expect(await proofOfHumanityCirclesProxy.proofOfHumanity()).to.equal(await proofOfHumanityMock.getAddress());
      expect(await proofOfHumanityCirclesProxy.coreMembersGroup()).to.equal(await coreMembersGroupMock.getAddress());
      expect(await proofOfHumanityCirclesProxy.crossChainProofOfHumanity()).to.equal(await crossChainProofOfHumanityMock.getAddress());
      expect(await proofOfHumanityCirclesProxy.hub()).to.equal(await hubMock.getAddress());
      expect(await proofOfHumanityCirclesProxy.governor()).to.equal(owner.address);
      expect(await proofOfHumanityCirclesProxy.MaximumBatchSize()).to.equal(30);
    });
  });

  describe("Governance Functions", function () {
    it("Should allow governor to change Proof of Humanity address", async function () {
      const newPoHMock = await (await ethers.getContractFactory("ProofOfHumanityMock")).deploy();
      
      await proofOfHumanityCirclesProxy.connect(owner).changeProofOfHumanity(await newPoHMock.getAddress());
      
      expect(await proofOfHumanityCirclesProxy.proofOfHumanity()).to.equal(await newPoHMock.getAddress());
    });

    it("Should allow governor to change Core Members Group address", async function () {
      const newCoreMembersGroupMock = await (await ethers.getContractFactory("CoreMembersGroupMock")).deploy();
      
      await proofOfHumanityCirclesProxy.connect(owner).changeCoreMembersGroup(await newCoreMembersGroupMock.getAddress());
      
      expect(await proofOfHumanityCirclesProxy.coreMembersGroup()).to.equal(await newCoreMembersGroupMock.getAddress());
    });

    it("Should allow governor to change CrossChainProofOfHumanity address", async function () {
      const newCrossChainPoHMock = await (await ethers.getContractFactory("CrossChainProofOfHumanityMock")).deploy();
      
      await proofOfHumanityCirclesProxy.connect(owner).changeCrossChainProofOfHumanity(await newCrossChainPoHMock.getAddress());
      
      expect(await proofOfHumanityCirclesProxy.crossChainProofOfHumanity()).to.equal(await newCrossChainPoHMock.getAddress());
    });

    it("Should allow governor to change Hub address", async function () {
      const newHubMock = await (await ethers.getContractFactory("HubMock")).deploy();
      
      await proofOfHumanityCirclesProxy.changeHub(await newHubMock.getAddress());
      
      expect(await proofOfHumanityCirclesProxy.hub()).to.equal(await newHubMock.getAddress());
    });

    it("Should allow governor to change MaximumBatchSize", async function () {
      const newBatchSize = 50;
      
      await proofOfHumanityCirclesProxy.changeMaximumBatchSize(newBatchSize);
      
      expect(await proofOfHumanityCirclesProxy.MaximumBatchSize()).to.equal(newBatchSize);
    });

    it("Should allow governor to transfer governorship", async function () {
      await proofOfHumanityCirclesProxy.connect(owner).transferGovernorship(user1.address);
      
      expect(await proofOfHumanityCirclesProxy.governor()).to.equal(user1.address);
    });

    it("Should revert when non-governor tries to change Proof of Humanity address", async function () {
      const newPoHMock = await (await ethers.getContractFactory("ProofOfHumanityMock")).deploy();
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).changeProofOfHumanity(await newPoHMock.getAddress())
      ).to.be.revertedWith("Only governor can call this function");
    });

    it("Should revert when non-governor tries to change Core Members Group address", async function () {
      const newCoreMembersGroupMock = await (await ethers.getContractFactory("CoreMembersGroupMock")).deploy();
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).changeCoreMembersGroup(await newCoreMembersGroupMock.getAddress())
      ).to.be.revertedWith("Only governor can call this function");
    });

    it("Should revert when non-governor tries to change CrossChainProofOfHumanity address", async function () {
      const newCrossChainPoHMock = await (await ethers.getContractFactory("CrossChainProofOfHumanityMock")).deploy();
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).changeCrossChainProofOfHumanity(await newCrossChainPoHMock.getAddress())
      ).to.be.revertedWith("Only governor can call this function");
    });

    it("Should revert when non-governor tries to change Hub address", async function () {
      const newHubMock = await (await ethers.getContractFactory("HubMock")).deploy();
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).changeHub(await newHubMock.getAddress())
      ).to.be.revertedWith("Only governor can call this function");
    });

    it("Should revert when non-governor tries to change MaximumBatchSize", async function () {
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).changeMaximumBatchSize(40)
      ).to.be.revertedWith("Only governor can call this function");
    });

    it("Should revert when non-governor tries to transfer governorship", async function () {
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).transferGovernorship(user2.address)
      ).to.be.revertedWith("Only governor can call this function");
    });
  });

  describe("Register", function () {
    it("Should register a new account successfully when owner isHuman on POH", async function () {
      circlesAccount = user1.address;

      const tx = await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount);

      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "AccountRegistered")
        .withArgs(humanityID, circlesAccount, expirationTime,expirationTime);
  
      expect(await proofOfHumanityCirclesProxy.humanityIDToCirclesAccount(humanityID)).to.equal(circlesAccount);
      
      const [, expiry] = await hubMock.trustMarkers(await coreMembersGroupMock.getAddress(), circlesAccount);
      expect(expiry).to.equal(expirationTime);
    });

    it("Should register a new account successfully when owner isHuman on CCPOH (using cross-chain data)", async function () {
      const tx = await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount);

      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "AccountRegistered")
        .withArgs(humanityID, circlesAccount,expirationTime ,expirationTime);
  
      expect(await proofOfHumanityCirclesProxy.humanityIDToCirclesAccount(humanityID)).to.equal(circlesAccount);
      const [, expiry] = await hubMock.trustMarkers(await coreMembersGroupMock.getAddress(), circlesAccount);
      expect(expiry).to.equal(expirationTime);
    });

    it("Should revert if caller is not the owner of the humanity", async function () {
 
      await expect(
        proofOfHumanityCirclesProxy.connect(user2).register(humanityID, user2.address)
      ).to.be.revertedWith("You are not the owner of this humanity ID");
    });

    it("Should revert when humanity ID is set as homeChain in cross-chain data", async function () {
      await proofOfHumanityMock.mockIsHuman(user1.address, false);
      await crossChainProofOfHumanityMock.mockBoundTo(humanityID, user1.address);

      const crossChainData = {
        owner: user1.address,
        expirationTime: expirationTime,
        isRegistered: true, 
        isHomeChain: true,
        lastTransferTime: 0
      };
      await crossChainProofOfHumanityMock.mockHumanityData(humanityID, crossChainData);

      await expect(
        proofOfHumanityCirclesProxy.connect(user1).register(humanityID, user1.address)
      ).to.be.revertedWith("Humanity ID is not claimed");
    });

    it("Should revert if account is already registered", async function () {
      await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, user1.address); 
 
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).register(humanityID, user2.address)
      ).to.be.revertedWith("Account is already registered");
    });

    it("Should not decrease trust expiry when registering humanity with lower expiration", async function () {
      await crossChainProofOfHumanityMock.mockBoundTo(humanityID2, user2.address);
      await proofOfHumanityMock.mockIsHuman(user2.address, true);
  
      const humanityInfo = {
        vouching: false,
        pendingRevocation: false,
        nbPendingRequests: 0,
        expirationTime: user2Expiration,
        owner: user2.address,
        nbRequests: 1
      };
      await proofOfHumanityMock.mockGetHumanityInfo(humanityID2, humanityInfo);
      
      await proofOfHumanityCirclesProxy.connect(user2).register(humanityID2, circlesAccount);

      let [, hubExpiry] = await hubMock.trustMarkers(await coreMembersGroupMock.getAddress(), circlesAccount);
      expect(hubExpiry).to.equal(user2Expiration);

      const tx = await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount);
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "AccountRegistered")
        .withArgs(humanityID, circlesAccount, expirationTime, user2Expiration);
      [, hubExpiry] = await hubMock.trustMarkers(await coreMembersGroupMock.getAddress(), circlesAccount);
      expect(hubExpiry).to.equal(user2Expiration);
      expect(hubExpiry).to.not.equal(expirationTime);
    });
  });

  describe("RenewTrust", function () {
    let circlesAccount: string;
    beforeEach(async function () {
      circlesAccount = user1.address; 
      await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount);
      await coreMembersGroupMock.reset();
    });
    
    it("Should renew trust successfully when owner isHuman on POH", async function () {
      const newExpirationTime = expirationTime + 3600;
      const updatedHumanityInfo = {
          vouching: false,
          pendingRevocation: false,
          nbPendingRequests: 0,
          expirationTime: newExpirationTime,
          owner: user1.address,
          nbRequests: 1
      };
      await proofOfHumanityMock.mockGetHumanityInfo(humanityID, updatedHumanityInfo);

      const tx = await proofOfHumanityCirclesProxy.connect(user1).renewTrust(humanityID);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "TrustRenewed")
        .withArgs(humanityID, circlesAccount, newExpirationTime);
      

    });

    it("Should renew trust successfully when owner is human in cross-chain", async function () {
      const newCrossChainExpirationTime = expirationTime + 7200;

      await crossChainProofOfHumanityMock.mockBoundTo(humanityID, user1.address);
      await proofOfHumanityMock.mockIsHuman(user1.address, false);

      const updatedCrossChainData = {
          owner: user1.address,
          expirationTime: newCrossChainExpirationTime,
          lastTransferTime: Math.floor(Date.now() / 1000) - 1000,
          isHomeChain: false
      };
      await crossChainProofOfHumanityMock.mockHumanityData(humanityID, updatedCrossChainData);

      const tx = await proofOfHumanityCirclesProxy.connect(user1).renewTrust(humanityID);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "TrustRenewed")
        .withArgs(humanityID, circlesAccount, newCrossChainExpirationTime);
    });
    
    it("Should revert if humanity ID is not bound to an address", async function () {
        await crossChainProofOfHumanityMock.mockBoundTo(humanityID, ethers.ZeroAddress); 
        
        await expect(
          proofOfHumanityCirclesProxy.connect(user1).renewTrust(humanityID)
        ).to.be.revertedWith("Humanity ID is not claimed");
    });

    it("Should revert when humanity ID is set as homeChain in cross-chain data", async function () {
      await crossChainProofOfHumanityMock.mockBoundTo(humanityID, user1.address);
      await proofOfHumanityMock.mockIsHuman(user1.address, false);
      
      const crossChainHumanityData = {
        owner: user1.address,
        expirationTime: expirationTime,
        lastTransferTime: Math.floor(Date.now() / 1000) - 86400,
        isHomeChain: true 
      };
      await crossChainProofOfHumanityMock.mockHumanityData(humanityID, crossChainHumanityData);
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).renewTrust(humanityID)
      ).to.be.revertedWith("Humanity ID is not claimed");
    });

    it("Should revert if new expiry is lower than existing", async function () {

      const humanityInfo2 = {
        vouching:false, 
        pendingRevocation:false, 
        nbPendingRequests:0, 
        expirationTime:expirationTime -1, 
        owner:user2.address, 
        nbRequests:1 
      };
      await proofOfHumanityMock.mockGetHumanityInfo(humanityID2, humanityInfo2);
      await crossChainProofOfHumanityMock.mockBoundTo(humanityID2, user2.address);
      await proofOfHumanityMock.mockIsHuman(user2.address, true);
      await proofOfHumanityCirclesProxy.connect(user2).register(humanityID2, circlesAccount);
      
      const [, initialExpirationTime] = await hubMock.trustMarkers(await proofOfHumanityCirclesProxy.getAddress(), circlesAccount);
       
      await proofOfHumanityCirclesProxy.connect(user2).renewTrust(humanityID2);
 
      const [, expiryAfterRenew] = await hubMock.trustMarkers(await proofOfHumanityCirclesProxy.getAddress(), circlesAccount);
      expect(expiryAfterRenew).to.equal(initialExpirationTime, "Expiry should not have decreased");
    });
  });

  describe("ReEvaluateTrust", function () {
    let circlesAccount: string;

    beforeEach(async function () {
      circlesAccount = user1.address;
      await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount);
      await coreMembersGroupMock.reset();
    });

    it("Should re-evaluate trust correctly when the single ID is revoked", async function () { 
      await crossChainProofOfHumanityMock.mockBoundTo(humanityID, ethers.ZeroAddress); 
      const tx1 = await proofOfHumanityCirclesProxy.reEvaluateTrust(circlesAccount);

      await expect(tx1).to.emit(proofOfHumanityCirclesProxy, "TrustReEvaluationBatchProcessed").withArgs(circlesAccount, 1, 1);

      await expect(tx1).to.emit(proofOfHumanityCirclesProxy, "TrustReEvaluationCompleted").withArgs(circlesAccount,0);
      const [, finalExpiry] = await hubMock.trustMarkers(await proofOfHumanityCirclesProxy.getAddress(), circlesAccount);
      expect(finalExpiry).to.equal(0); 
    });

    it("Should correctly determine max expiration between local and cross-chain", async function () {
      
      await proofOfHumanityCirclesProxy.reEvaluateTrust(circlesAccount);
      let [, expiry] = await hubMock.trustMarkers(await coreMembersGroupMock.getAddress(), circlesAccount);
      expect(expiry).to.equal(expirationTime); 

      
      const crossChainExpiration = expirationTime + 5000; 
      await proofOfHumanityMock.mockIsHuman(user1.address, false); 
      const crossChainData = {
        owner: user1.address,
        expirationTime: crossChainExpiration,
        isRegistered: true,
        isHomeChain: false,
        lastTransferTime: 0
      };
      await crossChainProofOfHumanityMock.mockHumanityData(humanityID, crossChainData);
      await crossChainProofOfHumanityMock.mockBoundTo(humanityID, user1.address); 

      await proofOfHumanityCirclesProxy.reEvaluateTrust(circlesAccount);
      [, expiry] = await hubMock.trustMarkers(await coreMembersGroupMock.getAddress(), circlesAccount);
      expect(expiry).to.equal(crossChainExpiration); 
    });

    it("should correctly evalute expiry time when multiple humanites ID are registered to same account", async function () {

      await proofOfHumanityMock.mockIsHuman(user1.address, true);
      let maxExpiry =0;
      const numOfHumanities = 2;
      for (let i = 1; i < numOfHumanities; i++) {
        const newHumanityID = ethers.Wallet.createRandom().address;
        const expiry = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 100000);
        maxExpiry = Math.max(maxExpiry, expiry);
        proofOfHumanityMock.mockGetHumanityInfo(newHumanityID, {
          vouching:false, 
          pendingRevocation:false, 
          nbPendingRequests:0, 
          expirationTime:expiry,
          owner:user1.address, 
          nbRequests:1 
        });
        await crossChainProofOfHumanityMock.mockBoundTo(newHumanityID, user1.address); 
        
        await proofOfHumanityCirclesProxy.connect(user1).register(newHumanityID, circlesAccount);
      }
      const batch_size = 30; // Match the default MaximumBatchSize
      let tx;
      for(let i = 0; i < numOfHumanities/batch_size; i++){
        // Get transaction receipt to calculate gas used
        tx = await proofOfHumanityCirclesProxy.reEvaluateTrust(circlesAccount);
        const receipt = await tx.wait();
        console.log(`Batch ${i+1} gas used: ${receipt?.gasUsed.toString()}`);

        await expect(tx).to.emit(proofOfHumanityCirclesProxy, "TrustReEvaluationBatchProcessed").withArgs(circlesAccount,Math.min((i+1)*batch_size,numOfHumanities ),numOfHumanities);
      }
      await expect(tx).to.emit(proofOfHumanityCirclesProxy, "TrustReEvaluationCompleted").withArgs(circlesAccount,maxExpiry);
    })
  });
});   