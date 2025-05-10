// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IHub.sol";

/// @title HubMock
/// @dev Minimal mock implementing the IHub interface for unit tests. Allows setting arbitrary trust expiries.
contract HubMock is IHub {
    mapping(address => mapping(address => uint96)) public expiries;

    /// @notice Sets expiry for (truster -> trustee) pair.
    function setExpiry(address truster, address trustee, uint96 expiry) external {
        expiries[truster][trustee] = expiry;
    }

    function trustMarkers(address truster, address trustee)
        external
        view
        override
        returns (address previous, uint96 expiry)
    {
        // previous value is irrelevant for tests, return zero
        return (address(0), expiries[truster][trustee]);
    }
}
