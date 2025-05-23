// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

/**
 * @title IBaseGroup
 * @dev Interface for the Circles Base Group contract.
 * This interface is a pruned version of https://github.com/aboutcircles/circles-groups/blob/6be608cefa3b7eed310fd127246ff4aeae694e3c/src/base-group/BaseGroup.sol#L15C10-L15C19.
 */
interface IBaseGroup {
    /**
     * @dev Trusts a batch of members with an expiration condition.
     * @param _members Array of addresses to trust.
     * @param _expiry Timestamp when the trust expires. Set to 0 to revoke trust.
     * Function will revert if any of the addresses are a zero address. 
     */
     function trustBatchWithConditions(address[] memory _members, uint96 _expiry) external;
}