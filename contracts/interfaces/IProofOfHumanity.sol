// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

/**
 * @title IProofOfHumanity
 * This interface is a pruned version of https://github.com/Proof-Of-Humanity/proof-of-humanity-v2-contracts/blob/a331e7b6bb0f7a7ad9a905d41032cecc52bf06a6/contracts/ProofOfHumanity.sol
**/
interface IProofOfHumanity {

    /* Views */

    function isHuman(address _address) external view returns (bool);
    
    function isClaimed(bytes20 _humanityId) external view returns (bool);

    function humanityOf(address _account) external view returns (bytes20 humanityId);

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
