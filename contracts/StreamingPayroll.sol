// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StreamingPayroll
 * @dev Autonomous payroll streaming contract on Arc Chain.
 * Fees are paid in USDC, and finality is sub-second.
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface ICompliance {
    function isSanctioned(address target) external view returns (bool);
}

contract StreamingPayroll {
    struct Stream {
        address employer;
        address employee;
        uint256 flowRate; // USDC (6 decimals) per second
        uint256 startTime;
        uint256 lastUpdated;
        uint256 accruedPaid;
        uint256 totalCap; // Maximum amount for this milestone
        bool isActive;
    }

    // USDC Address on Arc Chain: 0x3600000000000000000000000000000000000000
    address public immutable usdcToken;
    address public owner;
    address public complianceRegistry;

    mapping(bytes32 => Stream) public streams;
    mapping(address => bytes32[]) public employeeStreams;
    mapping(address => bytes32[]) public employerStreams;
    mapping(address => uint256) public employerBalances;

    event StreamCreated(bytes32 indexed streamId, address indexed employer, address indexed employee, uint256 flowRate, uint256 totalCap);
    event DepositCredited(address indexed employer, uint256 amount);
    event StreamUpdated(bytes32 indexed streamId, uint256 newFlowRate);
    event StreamCancelled(bytes32 indexed streamId, uint256 remainingRefunded);
    event FundsWithdrawn(bytes32 indexed streamId, address indexed employee, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyStreamEmployer(bytes32 streamId) {
        require(streams[streamId].employer == msg.sender, "Only stream employer");
        _;
    }

    modifier onlyStreamEmployee(bytes32 streamId) {
        require(streams[streamId].employee == msg.sender, "Only stream employee");
        _;
    }

    modifier onlyCleared(address account) {
        if (complianceRegistry != address(0)) {
            require(!ICompliance(complianceRegistry).isSanctioned(account), "Registry: Address Blocked");
        }
        _;
    }

    constructor(address _usdcToken) {
        usdcToken = _usdcToken;
        owner = msg.sender;
    }

    function setComplianceRegistry(address _complianceRegistry) external onlyOwner {
        complianceRegistry = _complianceRegistry;
    }

    /**
     * @notice Deposit USDC to credit an employer's payroll balance.
     * @param employer The address of the employer to credit.
     * @param amount The amount of USDC to deposit.
     */
    function creditEmployerBalance(address employer, uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(
            IERC20(usdcToken).transferFrom(msg.sender, address(this), amount),
            "USDC deposit failed"
        );
        employerBalances[employer] += amount;
        emit DepositCredited(employer, amount);
    }

    /**
     * @notice Create a streaming payroll for a remote engineer.
     * @param employee Remote worker address.
     * @param flowRate Amount of USDC (6 decimals) per second.
     * @param totalCap Total amount escrowed for this milestone.
     */
    function createStream(
        address employee,
        uint256 flowRate,
        uint256 totalCap
    ) external onlyCleared(employee) returns (bytes32) {
        require(employee != address(0), "Invalid employee address");
        require(flowRate > 0, "Flow rate must be positive");
        require(totalCap > 0, "Total cap must be positive");

        // Lock total cap from employer into contract, using deposited balance if available
        if (employerBalances[msg.sender] >= totalCap) {
            employerBalances[msg.sender] -= totalCap;
        } else {
            uint256 remaining = totalCap - employerBalances[msg.sender];
            employerBalances[msg.sender] = 0;
            require(
                IERC20(usdcToken).transferFrom(msg.sender, address(this), remaining),
                "USDC deposit failed"
            );
        }

        bytes32 streamId = keccak256(
            abi.encodePacked(msg.sender, employee, block.timestamp)
        );

        streams[streamId] = Stream({
            employer: msg.sender,
            employee: employee,
            flowRate: flowRate,
            startTime: block.timestamp,
            lastUpdated: block.timestamp,
            accruedPaid: 0,
            totalCap: totalCap,
            isActive: true
        });

        employeeStreams[employee].push(streamId);
        employerStreams[msg.sender].push(streamId);

        emit StreamCreated(streamId, msg.sender, employee, flowRate, totalCap);
        return streamId;
    }

    /**
     * @notice View the claimable balance of a stream at the current block timestamp.
     */
    function getClaimableAmount(bytes32 streamId) public view returns (uint256) {
        Stream memory stream = streams[streamId];
        if (!stream.isActive) return 0;

        uint256 duration = block.timestamp - stream.lastUpdated;
        uint256 accrued = duration * stream.flowRate;

        // Ensure we don't exceed the capped amount
        uint256 remaining = stream.totalCap - stream.accruedPaid;
        if (accrued > remaining) {
            return remaining;
        }
        return accrued;
    }

    /**
     * @notice Withdraw available USDC stream funds.
     */
    function withdrawFunds(bytes32 streamId) public onlyStreamEmployee(streamId) onlyCleared(streams[streamId].employee) {
        Stream storage stream = streams[streamId];
        require(stream.isActive, "Stream is not active");

        uint256 claimable = getClaimableAmount(streamId);
        require(claimable > 0, "No funds available to withdraw");

        stream.accruedPaid += claimable;
        stream.lastUpdated = block.timestamp;

        // If payroll fully completed, mark inactive
        if (stream.accruedPaid >= stream.totalCap) {
            stream.isActive = false;
        }

        require(
            IERC20(usdcToken).transfer(stream.employee, claimable),
            "USDC transfer failed"
        );

        emit FundsWithdrawn(streamId, stream.employee, claimable);
    }

    /**
     * @notice Cancel stream by employer, refunding the remaining unspent escrow.
     */
    function cancelStream(bytes32 streamId) external onlyStreamEmployer(streamId) {
        Stream storage stream = streams[streamId];
        require(stream.isActive, "Stream already inactive");

        // Calculate accrued up to now
        uint256 claimable = getClaimableAmount(streamId);
        uint256 spent = stream.accruedPaid + claimable;
        uint256 unspent = stream.totalCap - spent;

        stream.accruedPaid = spent;
        stream.isActive = false;

        // Send accrued to employee
        if (claimable > 0) {
            require(
                IERC20(usdcToken).transfer(stream.employee, claimable),
                "USDC transfer to employee failed"
            );
            emit FundsWithdrawn(streamId, stream.employee, claimable);
        }

        // Refund remaining unspent to employer
        if (unspent > 0) {
            require(
                IERC20(usdcToken).transfer(stream.employer, unspent),
                "USDC refund to employer failed"
            );
        }

        emit StreamCancelled(streamId, unspent);
    }

    /**
     * @notice Create multiple streaming payrolls in a single transaction.
     * @param employees Array of remote worker addresses.
     * @param flowRates Array of flow rates (USDC per second).
     * @param totalCaps Array of total caps.
     */
    function createStreamsBatch(
        address[] calldata employees,
        uint256[] calldata flowRates,
        uint256[] calldata totalCaps
    ) external returns (bytes32[] memory) {
        require(
            employees.length == flowRates.length && flowRates.length == totalCaps.length,
            "Mismatched input lengths"
        );
        require(employees.length > 0, "Empty arrays");

        uint256 aggregateCap = 0;
        for (uint256 i = 0; i < totalCaps.length; i++) {
            aggregateCap += totalCaps[i];
        }

        // Lock aggregate cap from employer into contract, using deposited balance if available
        if (employerBalances[msg.sender] >= aggregateCap) {
            employerBalances[msg.sender] -= aggregateCap;
        } else {
            uint256 remaining = aggregateCap - employerBalances[msg.sender];
            employerBalances[msg.sender] = 0;
            require(
                IERC20(usdcToken).transferFrom(msg.sender, address(this), remaining),
                "USDC batch deposit failed"
            );
        }

        bytes32[] memory streamIds = new bytes32[](employees.length);

        for (uint256 i = 0; i < employees.length; i++) {
            address employee = employees[i];
            uint256 flowRate = flowRates[i];
            uint256 totalCap = totalCaps[i];

            require(employee != address(0), "Invalid employee address");
            if (complianceRegistry != address(0)) {
                require(!ICompliance(complianceRegistry).isSanctioned(employee), "Registry: Address Blocked");
            }
            require(flowRate > 0, "Flow rate must be positive");
            require(totalCap > 0, "Total cap must be positive");

            // Salt using array index i to prevent collision
            bytes32 streamId = keccak256(
                abi.encodePacked(msg.sender, employee, block.timestamp, i)
            );

            streams[streamId] = Stream({
                employer: msg.sender,
                employee: employee,
                flowRate: flowRate,
                startTime: block.timestamp,
                lastUpdated: block.timestamp,
                accruedPaid: 0,
                totalCap: totalCap,
                isActive: true
            });

            employeeStreams[employee].push(streamId);
            employerStreams[msg.sender].push(streamId);

            emit StreamCreated(streamId, msg.sender, employee, flowRate, totalCap);
            streamIds[i] = streamId;
        }

        return streamIds;
    }

    /**
     * @notice Pause multiple streams, marking them inactive and distributing any accrued funds up to this timestamp.
     * @param streamIds Array of stream IDs to pause.
     */
    function pauseStreamsBatch(bytes32[] calldata streamIds) external {
        for (uint256 i = 0; i < streamIds.length; i++) {
            bytes32 streamId = streamIds[i];
            Stream storage stream = streams[streamId];
            require(stream.employer == msg.sender, "Only stream employer can pause");
            require(stream.isActive, "Stream is not active");

            uint256 claimable = getClaimableAmount(streamId);
            stream.lastUpdated = block.timestamp;
            stream.isActive = false;

            if (claimable > 0) {
                stream.accruedPaid += claimable;
                require(
                    IERC20(usdcToken).transfer(stream.employee, claimable),
                    "USDC transfer to employee failed"
                );
                emit FundsWithdrawn(streamId, stream.employee, claimable);
            }
            
            emit StreamUpdated(streamId, 0);
        }
    }

    /**
     * @notice Resume multiple paused streams, reactivation accrual from the current timestamp.
     * @param streamIds Array of stream IDs to resume.
     */
    function resumeStreamsBatch(bytes32[] calldata streamIds) external {
        for (uint256 i = 0; i < streamIds.length; i++) {
            bytes32 streamId = streamIds[i];
            Stream storage stream = streams[streamId];
            require(stream.employer == msg.sender, "Only stream employer can resume");
            require(!stream.isActive, "Stream is already active");
            require(stream.accruedPaid < stream.totalCap, "Stream already fully completed");

            stream.lastUpdated = block.timestamp;
            stream.isActive = true;

            emit StreamUpdated(streamId, stream.flowRate);
        }
    }

    /**
     * @notice Withdraw funds from multiple streams where msg.sender is the registered employee.
     * @param streamIds Array of stream IDs to claim from.
     */
    function withdrawFundsBatch(bytes32[] calldata streamIds) external {
        for (uint256 i = 0; i < streamIds.length; i++) {
            bytes32 streamId = streamIds[i];
            Stream storage stream = streams[streamId];
            require(stream.employee == msg.sender, "Only stream employee can withdraw");
            if (complianceRegistry != address(0)) {
                require(!ICompliance(complianceRegistry).isSanctioned(stream.employee), "Registry: Address Blocked");
            }
            require(stream.isActive, "Stream is not active");

            uint256 claimable = getClaimableAmount(streamId);
            if (claimable > 0) {
                stream.accruedPaid += claimable;
                stream.lastUpdated = block.timestamp;

                if (stream.accruedPaid >= stream.totalCap) {
                    stream.isActive = false;
                }

                require(
                    IERC20(usdcToken).transfer(stream.employee, claimable),
                    "USDC transfer failed"
                );

                emit FundsWithdrawn(streamId, stream.employee, claimable);
            }
        }
    }
}

