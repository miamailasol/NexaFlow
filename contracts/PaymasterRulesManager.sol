// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PaymasterRulesManager
 * @dev Manages gas sponsorship rules for the employer-sponsored gas station.
 * Allows configuring monthly transaction counts and max gas price parameters per employee.
 */

struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGasLimit;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

contract PaymasterRulesManager {
    address public owner;
    address public paymaster;

    struct GasLimitRule {
        uint256 maxTxPerMonth;
        uint256 maxGasPrice;
        uint256 totalGasPaidUSDC;
        uint256 txCountThisMonth;
    }

    // Mapping from worker smart account address to rules and usage
    mapping(address => GasLimitRule) public workerRules;

    // Track all workers who have configured rules
    address[] public configuredWorkers;
    mapping(address => bool) public isConfigured;

    event RuleUpdated(address indexed worker, uint256 maxTxPerMonth, uint256 maxGasPrice);
    event UsageRecorded(address indexed worker, uint256 txCount, uint256 totalGasPaidUSDC);
    event PaymasterUpdated(address indexed oldPaymaster, address indexed newPaymaster);

    modifier onlyOwner() {
        require(msg.sender == owner, "PaymasterRulesManager: only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Set the paymaster contract allowed to record gas usage
     * @param _paymaster The address of the paymaster contract
     */
    function setPaymaster(address _paymaster) external onlyOwner {
        emit PaymasterUpdated(paymaster, _paymaster);
        paymaster = _paymaster;
    }

    /**
     * @notice Set bounds on gas sponsorship limits per worker
     * @param worker The worker smart account address
     * @param maxTxPerMonth Maximum sponsored claims per calendar month
     * @param maxGasPrice Maximum gas price allowed to be sponsored (in wei)
     */
    function setWorkerRule(
        address worker,
        uint256 maxTxPerMonth,
        uint256 maxGasPrice
    ) external onlyOwner {
        workerRules[worker].maxTxPerMonth = maxTxPerMonth;
        workerRules[worker].maxGasPrice = maxGasPrice;

        if (!isConfigured[worker]) {
            configuredWorkers.push(worker);
            isConfigured[worker] = true;
        }

        emit RuleUpdated(worker, maxTxPerMonth, maxGasPrice);
    }

    /**
     * @notice Log gas consumption and increment transaction count
     * @param worker The worker smart account address
     * @param gasPaidUSDC The gas cost in USDC to add to their sponsored ledger
     */
    function recordGasUsage(address worker, uint256 gasPaidUSDC) external {
        require(
            msg.sender == owner || msg.sender == paymaster || msg.sender == worker,
            "PaymasterRulesManager: unauthorized caller"
        );
        workerRules[worker].txCountThisMonth += 1;
        workerRules[worker].totalGasPaidUSDC += gasPaidUSDC;

        emit UsageRecorded(worker, workerRules[worker].txCountThisMonth, workerRules[worker].totalGasPaidUSDC);
    }

    /**
     * @notice Reset the monthly transaction count for a worker
     */
    function resetMonthlyUsage(address worker) external onlyOwner {
        workerRules[worker].txCountThisMonth = 0;
    }

    /**
     * @notice Validate that the sender's gas consumption has not exceeded their configured rules
     * @param userOp The ERC-4337 standard UserOperation input
     */
    function validatePaymasterUserOp(UserOperation calldata userOp) external view returns (bool) {
        address sender = userOp.sender;
        GasLimitRule memory rule = workerRules[sender];

        // If limits have been configured, check transaction counts and gas price limits
        if (rule.maxTxPerMonth > 0) {
            require(
                rule.txCountThisMonth < rule.maxTxPerMonth,
                "PaymasterRules: monthly transaction limit exceeded"
            );
        }
        if (rule.maxGasPrice > 0) {
            require(
                userOp.maxFeePerGas <= rule.maxGasPrice,
                "PaymasterRules: gas price exceeds limit"
            );
        }

        return true;
    }

    /**
     * @notice Get the list of all workers with rules configured
     */
    function getConfiguredWorkers() external view returns (address[] memory) {
        return configuredWorkers;
    }
}
