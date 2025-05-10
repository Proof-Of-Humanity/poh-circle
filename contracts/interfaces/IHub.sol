// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

/// @title IHub (Circles v2)
/// @notice Minimal read-only interface for the Circles Hub v2 contract to fetch trust expiry.
interface IHub {
    /**
     * @notice Public storage getter of Hub.trustMarkers(truster, trustee)
     * @return previous The previous address in the linked-list (unused here)
     * @return expiry   Expiry timestamp (uint96) of the trust relation
     */
    function trustMarkers(address truster, address trustee) external view returns (address previous, uint96 expiry);
}
