// SPDX-License-Identifier: MIT
/**
 *  @authors: [madhurMongia]
 *  @reviewers: [@kemuru]
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

pragma solidity >=0.8.28;

import "./interfaces/IProofOfHumanity.sol";
import "./interfaces/ICoreMembersGroup.sol";
import "./interfaces/IProofOfHumanityCirclesProxy.sol";
import "./interfaces/ICrossChainProofOfHumanity.sol";
import "./interfaces/IHub.sol";
/**
 * @title ProofOfHumanityCirclesProxy
 * @dev A proxy contract that bridges Proof of Humanity verification with Circles.
 * This contract allows Proof of Humanity Users to register in POH Core Members Group.
 */
contract ProofOfHumanityCirclesProxy is IProofOfHumanityCirclesProxy {

    /// @dev Address with administrative privileges.
    address public governor;

    /// @notice Reference to the Proof of Humanity registry contract.
    IProofOfHumanity public proofOfHumanity;

    /// @notice Reference to the Core Members Group contract.
    ICoreMembersGroup public coreMembersGroup;

    /// @notice Reference to the CrossChainProofOfHumanity contract.
    ICrossChainProofOfHumanity public crossChainProofOfHumanity;

    /// @notice Reference to the Circles Hub contract.
    IHub public hub;

    /// @notice Maximum number of accounts to process in a single batch in reEvaluateTrust.
    uint256 public MaximumBatchSize;

    /// @notice Mapping to store the Circles account for each humanity ID.
    mapping(bytes20 => address) public humanityIDToCirclesAccount;

    /// @notice Mapping to store all humanity IDs linked to a Circles account.
    mapping(address => bytes20[]) public circlesAccountToHumanityIDs;

    struct BatchEvaluationState {
        uint256 nextIndexToProcess; // Index of the next humanityID to process
        uint40 currentMaxExpiryTime; // Highest expiry found so far in the current evaluation
    }

    /// @notice Mapping to store the batch processing state for reEvaluateTrust.
    mapping(address => BatchEvaluationState) public batchStates;

    /**
     * @dev Restricts function access to the governor only.
     * Provides administrative protection for sensitive operations.
     */
    modifier onlyGovernor() {
        require(msg.sender == governor, "Only governor can call this function");
        _;
    }

    /**
     * @dev Emitted when an account is added to the Circles Group.
     * @param humanityID The humanity ID of the account added.
     * @param account The address of the account added.
     * @param humanityExpirationTime The expiration time of the humanity.
     * @param trustExpiryTime The expiry time of the trust in Circles.
     */
    event AccountRegistered(bytes20 indexed humanityID, address indexed account, uint40 humanityExpirationTime, uint96 trustExpiryTime);

    /**
     * @dev Emitted when an account is renewed in the Circles Group.
     * @param humanityID The humanity ID of the account to re-trust.
     * @param account The account that was renewed.
     * @param newTrustExpiryTime The new expiry time of the trust.
     */
    event TrustRenewed(bytes20 indexed humanityID, address indexed account, uint96 newTrustExpiryTime);

    /**
     * @dev Emitted when a batch of trust re-evaluation is processed.
     * @param account The account being re-evaluated.
     * @param currentIndex The current index in the batch.
     * @param length The total length of the batch.
     */
    event TrustReEvaluationBatchProcessed(address indexed account, uint256 currentIndex, uint256 length);

    /**
     * @dev Emitted when the trust re-evaluation is completed.
     * @param account The account being re-evaluated.
     * @param expirationTime The new expiration time of the trust.
     */
    event TrustReEvaluationCompleted(address indexed account, uint96 expirationTime);

    /**
     * @dev Initializes the proxy contract with required external contracts.
     * @param _proofOfHumanity Address of the Proof of Humanity registry contract.
     * @param _coreMembersGroup Address of the POH Core Members Group contract.
     * @param _crossChainProofOfHumanity Address of the CrossChainProofOfHumanity contract.
     * @param _hub Address of the Circles Hub contract.
     */
    constructor(address _proofOfHumanity, 
    address _coreMembersGroup, 
    address _crossChainProofOfHumanity, 
    address _hub, 
    uint256 _MaximumBatchSize) {
        proofOfHumanity = IProofOfHumanity(_proofOfHumanity);
        coreMembersGroup = ICoreMembersGroup(_coreMembersGroup);
        crossChainProofOfHumanity = ICrossChainProofOfHumanity(_crossChainProofOfHumanity);
        hub = IHub(_hub);
        MaximumBatchSize = _MaximumBatchSize;
        governor = msg.sender; // Set deployer as initial governor
    }

    /**
     * @dev Updates the address of the Proof of Humanity registry.
     * @param _proofOfHumanity New address for the Proof of Humanity registry.
     * Can only be called by the governor.
     */
    function changeProofOfHumanity(address _proofOfHumanity) external onlyGovernor {
        proofOfHumanity = IProofOfHumanity(_proofOfHumanity);
    }

    /**
     * @dev Updates the address of the POH Core Members Group contract.
     * @param _coreMembersGroup New address for the POH Core Members Group contract.
     * Can only be called by the governor.
     */
    function changeCoreMembersGroup(address _coreMembersGroup) external onlyGovernor {
        coreMembersGroup = ICoreMembersGroup(_coreMembersGroup);
    }

    /**
     * @dev Updates the address of the CrossChainProofOfHumanity contract.
     * @param _crossChainProofOfHumanity New address for the CrossChainProofOfHumanity contract.
     * Can only be called by the governor.
     */
    function changeCrossChainProofOfHumanity(address _crossChainProofOfHumanity) external onlyGovernor {
        crossChainProofOfHumanity = ICrossChainProofOfHumanity(_crossChainProofOfHumanity);
    }

    /**
     * @dev Updates the address of the Circles Hub contract.
     * @param _hub New address for the Circles Hub contract.
     * Can only be called by the governor.
     */
    function changeHub(address _hub) external onlyGovernor {
        hub = IHub(_hub);
    }

    function changeMaximumBatchSize(uint256 _MaximumBatchSize) external onlyGovernor {
        MaximumBatchSize = _MaximumBatchSize;
    }

    /**
     * @dev Transfers governorship to a new address.
     * @param _newGovernor Address of the new governor.
     * Can only be called by the current governor.
     */
    function transferGovernorship(address _newGovernor) external onlyGovernor {
        governor = _newGovernor;
    }

    /**
     * @dev Trusts/Adds an account in the Circles Group.
     * @param humanityID The humanity ID of the account to trust.
     * @param _account Address of the circles account to trust in POH group.
     */
    function register(bytes20 humanityID, address _account) external {
        uint40 expirationTime;
        address owner = crossChainProofOfHumanity.boundTo(humanityID);
        require(owner == msg.sender, "You are not the owner of this humanity ID");

        // Check if the humanity is claimed on the current chain.
        if(proofOfHumanity.isHuman(owner)){
            (,,,expirationTime,,) = proofOfHumanity.getHumanityInfo(humanityID);
        }
        // If the humanity is not claimed or expired on the current chain, humanity info was updated from foreign chain.
        else{
            ICrossChainProofOfHumanity.CrossChainHumanity memory crossChainHumanity = crossChainProofOfHumanity.humanityData(humanityID);
             // If the current chain is the humanity's home chain, CCPOH data can contain stale owner address.
            require(!crossChainHumanity.isHomeChain, "Humanity ID is not claimed");
            expirationTime = crossChainHumanity.expirationTime;
        }

        // Only one account can be registered for a given humanity ID and is permanently bound to it.
        require(humanityIDToCirclesAccount[humanityID] == address(0), "Account is already registered");
        // But multiple humanity IDs can be linked to the same account.
        humanityIDToCirclesAccount[humanityID] = _account;
        circlesAccountToHumanityIDs[_account].push(humanityID);

        // Trust will expire at the same time as the humanity.
        address[] memory accounts = new address[](1);
        accounts[0] = _account;
        // If multiple humanities are linked to the same account, always use the maximum expiration time among them.
        (, uint96 currentHubExpiry) = hub.trustMarkers(address(coreMembersGroup), _account);
        uint96 trustExpiryTime = currentHubExpiry;
        if(uint96(expirationTime) > currentHubExpiry){
            // Function will revert if account is a zero address.
            coreMembersGroup.trustBatchWithConditions(accounts, uint96(expirationTime));
            trustExpiryTime = uint96(expirationTime);
        }
        
        emit AccountRegistered(humanityID, _account, uint40(expirationTime), trustExpiryTime);
    }
    
    /**
     * @dev Re-trusts an account in the Circles Group, after renewing humanity in POH.
     * @param humanityID The humanity ID of the account to re-trust.
     */
    function renewTrust(bytes20 humanityID) external {
        uint40 expirationTime;
        address owner = crossChainProofOfHumanity.boundTo(humanityID);
        require(owner != address(0), "Humanity ID is not claimed");

        if(proofOfHumanity.isHuman(owner)){
            (,,,expirationTime,,) = proofOfHumanity.getHumanityInfo(humanityID);
        }
        else{
            ICrossChainProofOfHumanity.CrossChainHumanity memory crossChainHumanity = crossChainProofOfHumanity.humanityData(humanityID);
            // If the current chain is the humanity's home chain, CCPOH data can contain stale owner address.
            require(!crossChainHumanity.isHomeChain, "Humanity ID is not claimed");
            expirationTime = crossChainHumanity.expirationTime;
        }

        address account = humanityIDToCirclesAccount[humanityID];
        address[] memory accounts = new address[](1);
        accounts[0] = account;
        // Prevent decreasing expiry
        (, uint96 currentHubExpiry) = hub.trustMarkers(address(coreMembersGroup), account);
        if(uint96(expirationTime) > currentHubExpiry){
            coreMembersGroup.trustBatchWithConditions(accounts, uint96(expirationTime));
            emit TrustRenewed(humanityID, account, uint96(expirationTime));
        }
    }

    /**
     * @dev The function is use to re evaluate the trust of an account in the Circles Group after a linked humanity is revoked.
     * Finds the maximum expiry time of all linked humanities and updates the trust of the account.
     * @param account Address of the account to re-evaluate trust for. 
     */
    function reEvaluateTrust(address account) external {
        BatchEvaluationState storage batchState = batchStates[account];
        uint256 length = circlesAccountToHumanityIDs[account].length;

        uint256 startIndex = batchState.nextIndexToProcess;
        uint40 currentMax = batchState.currentMaxExpiryTime;
        uint256 processedInThisBatch = 0;

        for (uint256 i = startIndex; i < length && processedInThisBatch < MaximumBatchSize; i++) {
            bytes20 humanityID = circlesAccountToHumanityIDs[account][i];
            address owner = crossChainProofOfHumanity.boundTo(humanityID);
            uint40 expirationTime = 0;
            if (owner != address(0)) {
                if (proofOfHumanity.isHuman(owner)) {
                    (,,,expirationTime,,) = proofOfHumanity.getHumanityInfo(humanityID);
                }
                else {
                    ICrossChainProofOfHumanity.CrossChainHumanity memory crossChainHumanityData = crossChainProofOfHumanity.humanityData(humanityID);
                    if (!crossChainHumanityData.isHomeChain) {
                        expirationTime = crossChainHumanityData.expirationTime;
                    }
                }
                if (expirationTime > currentMax) {
                    currentMax = expirationTime; 
                }
            }
            processedInThisBatch++;
        }

        uint256 nextIndex = startIndex + processedInThisBatch;

        batchState.currentMaxExpiryTime = currentMax;
        batchState.nextIndexToProcess = nextIndex;

        emit TrustReEvaluationBatchProcessed(account, nextIndex, length);

        if (nextIndex == length) {
            address[] memory accountsToTrust = new address[](1);
            accountsToTrust[0] = account;
            coreMembersGroup.trustBatchWithConditions(accountsToTrust, uint96(currentMax));
            
            delete batchStates[account];
            emit TrustReEvaluationCompleted(account, uint96(currentMax));
        }
    }
}