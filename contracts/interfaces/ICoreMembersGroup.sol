// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

/**
 * @title ICoreMembersGroup
 * @dev Interface for the Circles Core Members Group contract.
 * This interface is a pruned version of https://github.com/aboutcircles/circles-groups/blob/74b48efdef6fe22197ca4f7133dc5622a78d4e79/src/core-members-group/CoreMembersGroup.sol.
 */
interface ICoreMembersGroup {
    /**
     * @dev Trusts a batch of members with an expiration condition.
     * @param _coreMembers Array of addresses to trust.
     * @param _expiry Timestamp when the trust expires. Set to 0 to revoke trust.
     * Function will revert if any of the addresses are a zero address. 
     */
    function trustBatchWithConditions(address[] memory _coreMembers, uint96 _expiry) external;
}