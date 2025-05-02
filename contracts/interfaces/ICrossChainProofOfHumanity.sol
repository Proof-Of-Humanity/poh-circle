// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

/**
 * @title ICrossChainProofOfHumanity
 * @dev Interface for the CrossChainProofOfHumanity contract.
 * This interface is a pruned version of https://github.com/Proof-Of-Humanity/proof-of-humanity-v2-contracts/blob/a331e7b6bb0f7a7ad9a905d41032cecc52bf06a6/contracts/CrossChainProofOfHumanity.sol.
 */
interface ICrossChainProofOfHumanity {

    /**
     * @dev Structure to store cross-chain humanity data.
     */
    struct CrossChainHumanity {
        address owner; // The owner address.
        uint40 expirationTime; // Expiration time at the moment of update.
        uint40 lastTransferTime; // Time of the last received transfer.
        bool isHomeChain; // Whether current chain is considered as home chain by this contract.
    }
  
    /**
     * @dev Returns the data for a specific humanity ID.
     * @param humanityId The ID of the humanity to query.
     * @return The humanity data.
     */
    function humanityData(bytes20 humanityId) external view returns (CrossChainHumanity memory);

    // ========== VIEW FUNCTIONS ==========

    /**
     * @dev Returns the owner address bound to a specific humanity ID.
     * @param _humanityId The ID of the humanity.
     * @return The owner address.
     */
    function boundTo(bytes20 _humanityId) external view returns (address);

    /**
     * @dev Checks if a humanity ID is registered as human.
     * @param _account The address of the account to check.
     * @return Whether the account is registered as human.
     */
    function isHuman(address _account) external view returns (bool);
}
