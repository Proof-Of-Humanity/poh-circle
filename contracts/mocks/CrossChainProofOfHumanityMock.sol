// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../../contracts/interfaces/ICrossChainProofOfHumanity.sol";

contract CrossChainProofOfHumanityMock is ICrossChainProofOfHumanity {
    mapping(bytes20 => CrossChainHumanity) private _humanityData;
    mapping(address => bool) private _isHuman;
    mapping(bytes20 => address) private _boundTo;

    function mockHumanityData(bytes20 _humanityId, CrossChainHumanity memory _data) external {
        _humanityData[_humanityId] = _data;
    }

    function mockBoundTo(bytes20 _humanityId, address _owner) external {
        _boundTo[_humanityId] = _owner;
    }
    
    function mockIsHuman(address _address, bool _status) external {
        _isHuman[_address] = _status;
    }
    
    function humanityData(bytes20 _humanityId) external view override returns (CrossChainHumanity memory) {
        return _humanityData[_humanityId];
    }

    function boundTo(bytes20 _humanityId) external view override returns (address) {
        return _boundTo[_humanityId];
    }
    
    function isHuman(address _address) external view override returns (bool) {
        return _isHuman[_address];
    }
} 