// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

/**
 * @title ICoreMembersGroup
 * @dev Interface for the Circles Core Members Group contract.
 * This interface is a pruned version of https://github.com/aboutcircles/circles-groups/blob/74b48efdef6fe22197ca4f7133dc5622a78d4e79/src/core-members-group/CoreMembersGroup.sol
 */
interface ICoreMembersGroup {
    function trustBatchWithConditions(address[] memory _coreMembers, uint96 _expiry) external;
}