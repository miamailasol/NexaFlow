// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ComplianceRegistry {
    mapping(address => bool) public isSanctioned;
    mapping(address => bool) public isGuardian;

    event SanctionStatusUpdated(address indexed target, bool status);
    event GuardianStatusUpdated(address indexed guardian, bool status);

    modifier onlyGuardian() {
        require(isGuardian[msg.sender], "Registry: Caller is not a guardian");
        _;
    }

    constructor() {
        isGuardian[msg.sender] = true;
        emit GuardianStatusUpdated(msg.sender, true);
    }

    function setSanctionStatus(address target, bool status) external onlyGuardian {
        isSanctioned[target] = status;
        emit SanctionStatusUpdated(target, status);
    }

    function setGuardianStatus(address guardian, bool status) external onlyGuardian {
        isGuardian[guardian] = status;
        emit GuardianStatusUpdated(guardian, status);
    }
}
