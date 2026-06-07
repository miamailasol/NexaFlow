// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NexaPaymaster
 * @dev Employer-funded gas sponsor for gasless passkey-based salary claims.
 * The paymaster verifies that the target call is a legitimate `withdrawFunds`
 * operation on the StreamingPayroll contract for an active stream, then
 * executes it on behalf of the PasskeyAccount.
 *
 * Employers deposit USDC to fund gas sponsorship. The paymaster only
 * sponsors calls that match whitelisted function selectors on approved targets.
 */

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IStreamingPayroll {
    function streams(bytes32 streamId) external view returns (
        address employer,
        address employee,
        uint256 flowRate,
        uint256 startTime,
        uint256 lastUpdated,
        uint256 accruedPaid,
        uint256 totalCap,
        bool isActive
    );
}

interface IPaymasterRulesManager {
    function recordGasUsage(address worker, uint256 gasPaidUSDC) external;
    function workerRules(address worker) external view returns (
        uint256 maxTxPerMonth,
        uint256 maxGasPrice,
        uint256 totalGasPaidUSDC,
        uint256 txCountThisMonth
    );
}

interface IPasskeyAccount {
    function executeFromEntrypoint(
        address target,
        uint256 value,
        bytes calldata data
    ) external returns (bytes memory);
}

contract NexaPaymaster {
    /// @notice Contract owner (deployer)
    address public owner;

    /// @notice USDC token address (gas token on Arc)
    address public immutable usdcToken;

    /// @notice The StreamingPayroll contract address
    address public payrollContract;

    /// @notice The PaymasterRulesManager contract address
    address public paymasterRulesManager;

    /// @notice Employer gas sponsorship balances (in USDC)
    mapping(address => uint256) public sponsorBalances;

    /// @notice Whitelisted target contracts for sponsorship
    mapping(address => bool) public whitelistedTargets;

    /// @notice The `withdrawFunds(bytes32)` function selector
    bytes4 public constant WITHDRAW_SELECTOR = bytes4(keccak256("withdrawFunds(bytes32)"));

    /// @notice The `withdrawFundsBatch(bytes32[])` function selector
    bytes4 public constant WITHDRAW_BATCH_SELECTOR = bytes4(keccak256("withdrawFundsBatch(bytes32[])"));

    /// @notice Flat gas cost per sponsored operation (in USDC, 6 decimals)
    uint256 public gasCostPerOp = 500; // 0.0005 USDC

    /// @notice Total operations sponsored
    uint256 public totalSponsored;

    event SponsorDeposited(address indexed employer, uint256 amount);
    event SponsorWithdrawn(address indexed employer, uint256 amount);
    event OperationSponsored(
        address indexed smartAccount,
        address indexed target,
        bytes4 selector,
        address indexed employer,
        uint256 gasCost
    );
    event TargetWhitelisted(address indexed target, bool status);
    event GasCostUpdated(uint256 newCost);

    modifier onlyOwner() {
        require(msg.sender == owner, "NexaPaymaster: only owner");
        _;
    }

    constructor(address _usdcToken, address _payrollContract) {
        usdcToken = _usdcToken;
        payrollContract = _payrollContract;
        owner = msg.sender;

        // Auto-whitelist the payroll contract
        whitelistedTargets[_payrollContract] = true;
    }

    /**
     * @notice Deposit USDC to sponsor gas for employee claims.
     * @param amount The amount of USDC to deposit.
     */
    function depositSponsor(uint256 amount) external {
        require(amount > 0, "NexaPaymaster: zero amount");
        require(
            IERC20(usdcToken).transferFrom(msg.sender, address(this), amount),
            "NexaPaymaster: USDC transfer failed"
        );
        sponsorBalances[msg.sender] += amount;
        emit SponsorDeposited(msg.sender, amount);
    }

    /**
     * @notice Withdraw unused sponsor balance.
     * @param amount The amount of USDC to withdraw.
     */
    function withdrawSponsor(uint256 amount) external {
        require(sponsorBalances[msg.sender] >= amount, "NexaPaymaster: insufficient balance");
        sponsorBalances[msg.sender] -= amount;
        require(
            IERC20(usdcToken).transfer(msg.sender, amount),
            "NexaPaymaster: USDC transfer failed"
        );
        emit SponsorWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Sponsor and execute a gasless withdrawal on behalf of a PasskeyAccount.
     * @dev Validates that:
     *   1. The target contract is whitelisted
     *   2. The function being called is `withdrawFunds` or `withdrawFundsBatch`
     *   3. The stream is active and the employee matches the smart account
     *   4. The employer has sufficient sponsor balance
     * @param smartAccount The PasskeyAccount executing the withdrawal.
     * @param target The StreamingPayroll contract address.
     * @param data The encoded function call (withdrawFunds/withdrawFundsBatch).
     * @param streamId The stream ID being claimed (for sponsor balance deduction).
     */
    function sponsorWithdrawal(
        address smartAccount,
        address target,
        bytes calldata data,
        bytes32 streamId
    ) external {
        // 1. Validate target is whitelisted
        require(whitelistedTargets[target], "NexaPaymaster: target not whitelisted");

        // 2. Validate function selector
        bytes4 selector = bytes4(data[:4]);
        require(
            selector == WITHDRAW_SELECTOR || selector == WITHDRAW_BATCH_SELECTOR,
            "NexaPaymaster: function not allowed"
        );

        // 3. Validate stream belongs to this smart account
        (
            address employer,
            address employee,
            ,
            ,
            ,
            ,
            ,
            bool isActive
        ) = IStreamingPayroll(target).streams(streamId);

        require(isActive, "NexaPaymaster: stream not active");
        require(employee == smartAccount, "NexaPaymaster: account not stream employee");

        // 4. Validate rules with PaymasterRulesManager if configured
        if (paymasterRulesManager != address(0)) {
            (uint256 maxTx, uint256 maxGas, , uint256 txCount) =
                IPaymasterRulesManager(paymasterRulesManager).workerRules(smartAccount);

            if (maxTx > 0) {
                require(txCount < maxTx, "NexaPaymaster: monthly transaction limit exceeded");
            }
            // Record gas usage
            IPaymasterRulesManager(paymasterRulesManager).recordGasUsage(smartAccount, gasCostPerOp);
        }

        // 4. Deduct gas cost from employer's sponsor balance
        require(
            sponsorBalances[employer] >= gasCostPerOp,
            "NexaPaymaster: employer has insufficient sponsor balance"
        );
        sponsorBalances[employer] -= gasCostPerOp;

        // 5. Execute the withdrawal through the PasskeyAccount
        IPasskeyAccount(smartAccount).executeFromEntrypoint(target, 0, data);

        totalSponsored++;

        emit OperationSponsored(smartAccount, target, selector, employer, gasCostPerOp);
    }

    /**
     * @notice Whitelist or remove a target contract for sponsorship.
     */
    function setWhitelistedTarget(address target, bool status) external onlyOwner {
        whitelistedTargets[target] = status;
        emit TargetWhitelisted(target, status);
    }

    /**
     * @notice Update the gas cost per sponsored operation.
     */
    function setGasCostPerOp(uint256 _newCost) external onlyOwner {
        gasCostPerOp = _newCost;
        emit GasCostUpdated(_newCost);
    }

    /**
     * @notice Update the payroll contract reference.
     */
    function setPayrollContract(address _payrollContract) external onlyOwner {
        payrollContract = _payrollContract;
        whitelistedTargets[_payrollContract] = true;
    }

    /**
     * @notice Set the PaymasterRulesManager contract address.
     */
    function setPaymasterRulesManager(address _rulesManager) external onlyOwner {
        paymasterRulesManager = _rulesManager;
    }

    /**
     * @notice View the sponsor balance for a given employer.
     */
    function getSponsorBalance(address employer) external view returns (uint256) {
        return sponsorBalances[employer];
    }

    /// @notice Allow receiving native tokens
    receive() external payable {}
}
