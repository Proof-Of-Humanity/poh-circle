// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../../contracts/interfaces/ICoreMembersGroup.sol";
import "./HubMock.sol";

contract CoreMembersGroupMock is ICoreMembersGroup {
    bool public trustBatchWasCalled;
    address[] public lastTrustedMembers;
    uint96 public lastTrustExpiry;
    HubMock public hub;
    address[] private _lastCalledMembers;
    uint96 private _lastCalledExpiry;

    function trustBatchWithConditions(address[] memory _coreMembers, uint96 _expiry) external override {
        trustBatchWasCalled = true;
        lastTrustedMembers = _coreMembers;
        lastTrustExpiry = _expiry;
        _lastCalledMembers = _coreMembers;
        _lastCalledExpiry = _expiry;

        if (address(hub) != address(0)) {
            for (uint i = 0; i < _coreMembers.length; i++) {
                hub.setExpiry(address(this), _coreMembers[i], _expiry);
            }
        }
    }

    function reset() external {
        trustBatchWasCalled = false;
        delete lastTrustedMembers;
        lastTrustExpiry = 0;
        delete _lastCalledMembers;
        _lastCalledExpiry = 0;
    }

    function setHub(address _hubAddress) external {
        hub = HubMock(_hubAddress);
    }

    function getLastCalledMembers() external view returns (address[] memory) {
        return _lastCalledMembers;
    }

    function getLastCalledExpiry() external view returns (uint96) {
        return _lastCalledExpiry;
    }
} 