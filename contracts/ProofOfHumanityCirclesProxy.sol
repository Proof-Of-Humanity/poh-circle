// SPDX-License-Identifier: MIT
/**
 *  @authors: [madhurMongia]
 *  @reviewers: []
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

pragma solidity >=0.8.28;

import "./interfaces/IProofOfHumanity.sol";
import "./interfaces/ICoreMembersGroup.sol";
import "./interfaces/IProofOfHumanityCirclesProxy.sol";
import "./interfaces/ICrossChainProofOfHumanity.sol";
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

    /// @notice Mapping to store the Circles account for each humanity ID.
    mapping(bytes20 => address) public humanityIDToCirclesAccount;

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
     */
    event AccountRegistered(bytes20 indexed humanityID, address indexed account);

    /**
     * @dev Emitted when accounts are removed from the Circles Group.
     * @param humanityIDs The humanity IDs of the accounts removed.
     * @param accounts The addresses of the accounts removed.
     * @notice HumanityID at index i corresponds to account at index i.
     */
    event AccountsRemoved(bytes20[] humanityIDs, address[] accounts);

    /**
     * @dev Emitted when an account is renewed in the Circles Group.
     * @param humanityID The humanity ID of the account to re-trust.
     * @param account The account that was renewed.
     */
    event TrustRenewed(bytes20 indexed humanityID, address indexed account);

    /**
     * @dev Initializes the proxy contract with required external contracts.
     * @param _proofOfHumanity Address of the Proof of Humanity registry contract.
     * @param _coreMembersGroup Address of the POH Core Members Group contract.
     * @param _crossChainProofOfHumanity Address of the CrossChainProofOfHumanity contract.
     */
    constructor(address _proofOfHumanity, address _coreMembersGroup, address _crossChainProofOfHumanity) {
        proofOfHumanity = IProofOfHumanity(_proofOfHumanity);
        coreMembersGroup = ICoreMembersGroup(_coreMembersGroup);
        crossChainProofOfHumanity = ICrossChainProofOfHumanity(_crossChainProofOfHumanity);
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
        humanityIDToCirclesAccount[humanityID] = _account;
        // Trust will expire at the same time as the humanity.
        address[] memory accounts = new address[](1);
        accounts[0] = _account;
        // Function will revert if account is a zero address.
        coreMembersGroup.trustBatchWithConditions(accounts, uint96(expirationTime));

        emit AccountRegistered(humanityID, _account);
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
        coreMembersGroup.trustBatchWithConditions(accounts, uint96(expirationTime));
        emit TrustRenewed(humanityID, account);
    }

  
    /**
     * @dev Untrusts/Removes revoked accounts from the Circles Group.
     * @param humanityIDs Humanity IDs of revoked accounts to untrust.
     */
    function revokeTrust(bytes20[] memory humanityIDs) external {
        uint256 length = humanityIDs.length;
        bytes20 humanityID;
        address[] memory accounts = new address[](length);
        for(uint256 i = 0; i < length; i++){
            humanityID = humanityIDs[i];
            bool isHuman = crossChainProofOfHumanity.isHuman(crossChainProofOfHumanity.boundTo(humanityID));
            require(!isHuman, "Account is still registered as human");
            // Mapping of humanityID is not removed, so that we can still renew trust for the account.
            accounts[i] = humanityIDToCirclesAccount[humanityID];
        }
        // Setting the expiry timestamp to 0 or a past timestamp means untrusting the account.
        coreMembersGroup.trustBatchWithConditions(accounts, 0);

        emit AccountsRemoved(humanityIDs, accounts);
    }
}