// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TreasuryBufferManager {
    address public owner;
    address public usdcToken;
    address public payrollContract;

    // employer => deposited buffer vault balance (USDC, 6 decimals)
    mapping(address => uint256) public employerBuffers;
    
    // employer => monthly commitment rate (USDC, 6 decimals)
    mapping(address => uint256) public totalMonthlyCommitment;

    // streamId => flowRate (per second)
    mapping(bytes32 => uint256) public streamRates;

    // streamId => employer address
    mapping(bytes32 => address) public streamEmployers;

    // streamId => priority (1 = Key Role / High, 2 = Medium, 3 or 0 = Standard / Low)
    mapping(bytes32 => uint256) public streamPriorities;

    event BufferDeposited(address indexed employer, uint256 amount);
    event BufferWithdrawn(address indexed employer, uint256 amount);
    event StreamPriorityUpdated(bytes32 indexed streamId, uint256 priority);
    event PriceFeedOrContractUpdated(address indexed payrollContract);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyPayroll() {
        require(msg.sender == payrollContract, "Only payroll contract");
        _;
    }

    constructor(address _usdcToken) {
        owner = msg.sender;
        usdcToken = _usdcToken;
    }

    function setPayrollContract(address _payrollContract) external onlyOwner {
        payrollContract = _payrollContract;
        emit PriceFeedOrContractUpdated(_payrollContract);
    }

    function depositBuffer(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(
            IERC20(usdcToken).transferFrom(msg.sender, address(this), amount),
            "USDC deposit failed"
        );
        employerBuffers[msg.sender] += amount;
        emit BufferDeposited(msg.sender, amount);
    }

    function withdrawBuffer(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(employerBuffers[msg.sender] >= amount, "Insufficient buffer");
        employerBuffers[msg.sender] -= amount;
        require(
            IERC20(usdcToken).transfer(msg.sender, amount),
            "USDC transfer failed"
        );
        emit BufferWithdrawn(msg.sender, amount);
    }

    function recordStreamCommitment(address employer, bytes32 streamId, uint256 flowRate) external onlyPayroll {
        if (streamEmployers[streamId] == address(0)) {
            streamEmployers[streamId] = employer;
            streamRates[streamId] = flowRate;
            totalMonthlyCommitment[employer] += flowRate * 2592000;
        }
    }

    function removeStreamCommitment(address employer, bytes32 streamId) external onlyPayroll {
        if (streamEmployers[streamId] == employer) {
            uint256 flowRate = streamRates[streamId];
            uint256 monthlyCom = flowRate * 2592000;
            if (totalMonthlyCommitment[employer] >= monthlyCom) {
                totalMonthlyCommitment[employer] -= monthlyCom;
            } else {
                totalMonthlyCommitment[employer] = 0;
            }
            delete streamEmployers[streamId];
            delete streamRates[streamId];
        }
    }

    function setStreamPriority(bytes32 streamId, uint256 priority) external {
        address employer = streamEmployers[streamId];
        require(msg.sender == employer || msg.sender == owner, "Unauthorized");
        streamPriorities[streamId] = priority;
        emit StreamPriorityUpdated(streamId, priority);
    }

    function isWarningState(address employer) public view returns (bool) {
        return employerBuffers[employer] < totalMonthlyCommitment[employer];
    }

    function canCreateStream(address employer) external view returns (bool) {
        return !isWarningState(employer);
    }

    function canClaimStream(bytes32 streamId) external view returns (bool) {
        address employer = streamEmployers[streamId];
        if (employer == address(0)) {
            return true;
        }
        if (!isWarningState(employer)) {
            return true;
        }
        // In warning state, only priority 1 streams are allowed to claim
        return streamPriorities[streamId] == 1;
    }

    function getDaysCovered(address employer) public view returns (uint256) {
        uint256 commitment = totalMonthlyCommitment[employer];
        if (commitment == 0) {
            return 30; // default fully covered
        }
        return (employerBuffers[employer] * 30) / commitment;
    }
}
