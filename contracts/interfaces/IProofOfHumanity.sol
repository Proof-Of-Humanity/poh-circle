// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

/**
 * @title IProofOfHumanity
 * @dev This interface is a pruned version of https://github.com/Proof-Of-Humanity/proof-of-humanity-v2-contracts/blob/a331e7b6bb0f7a7ad9a905d41032cecc52bf06a6/contracts/ProofOfHumanity.sol.
**/
interface IProofOfHumanity {

    /* Views */

    /**
     * @dev Checks if an address is registered as human.
     * @param _address The address to check.
     * @return Whether the address is registered as human.
     */
    function isHuman(address _address) external view returns (bool);

    /**
     * @dev Gets detailed information about a humanity.
     * @param _humanityId The humanity ID to query.
     * @return vouching Whether the humanity is vouching.
     * @return pendingRevocation Whether the humanity is pending revocation.
     * @return nbPendingRequests Number of pending requests.
     * @return expirationTime When the humanity expires.
     * @return owner The owner of the humanity.
     * @return nbRequests Number of requests.
     */
    function getHumanityInfo(
        bytes20 _humanityId
    )
        external
        view
        returns (
            bool vouching,
            bool pendingRevocation,
            uint48 nbPendingRequests,
            uint40 expirationTime,
            address owner,
            uint256 nbRequests
        );
}
