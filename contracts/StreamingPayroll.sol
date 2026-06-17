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
    function approve(address spender, uint256 value) external returns (bool);
}

interface ICompliance {
    function isSanctioned(address target) external view returns (bool);
}

interface ITreasuryBufferManager {
    function canCreateStream(address employer) external view returns (bool);
    function canClaimStream(bytes32 streamId) external view returns (bool);
    function recordStreamCommitment(address employer, bytes32 streamId, uint256 flowRate) external;
    function removeStreamCommitment(address employer, bytes32 streamId) external;
}

interface IMicroBenefitsVault {
    function notifyCoopFee(uint256 amount) external;
}

struct ExactInputSingleParams {
    address tokenIn;
    address tokenOut;
    uint24 fee;
    address recipient;
    uint256 deadline;
    uint256 amountIn;
    uint256 amountOutMinimum;
    uint160 sqrtPriceLimitX96;
}

interface ISwapRouter {
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function getRoundData(uint80 _roundId) external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
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

    struct PrivateStreamCommitment {
        address employer;
        address employee;
        bytes32 commitmentHash; // keccak256(abi.encode(flowRate, totalCap, salt))
        uint256 startTime;
        uint256 lastUpdated;
        uint256 accruedPaid;
        uint256 totalCap;
        bool isActive;
    }

    // USDC Address on Arc Chain: 0x3600000000000000000000000000000000000000
    address public immutable usdcToken;
    address public owner;
    address public complianceRegistry;
    address public payrollOracle;
    address public benefitsVault;
    address public eurcToken;
    address public swapRouter;
    address public treasuryBufferManager;

    mapping(bytes32 => Stream) public streams;
    mapping(bytes32 => PrivateStreamCommitment) public privateStreams;
    mapping(address => bytes32[]) public employeeStreams;
    mapping(address => bytes32[]) public employerStreams;
    mapping(address => uint256) public employerBalances;
    mapping(bytes32 => address) public targetPayoutTokens;

    // Referral System
    mapping(address => address) public referrers;
    mapping(address => uint32) public referralBonuses; // basis points (e.g. 50 = 0.5%)

    mapping(string => uint256) public taxRates; // basis points (e.g. 1500 = 15%)
    mapping(string => address) public taxAuthorities; // government wallet addresses
    mapping(bytes32 => string) public streamCountries;

    mapping(bytes32 => string) public fiatPegs; // e.g. "SGD", "BRL", "NGN"
    mapping(string => address) public priceFeeds; // e.g. "SGD" => SGD/USD Aggregator address

    // Multi-Sig Configuration
    address[] public multiSigSigners;
    uint256 public requiredConfirmations;
    mapping(address => bool) public isMultiSigSigner;

    struct Proposal {
        string actionType; // "CANCEL_STREAM", "WITHDRAW_TREASURY", "SET_ORACLE"
        bytes32 streamId;
        address targetAddress;
        uint256 amount;
        bool executed;
        uint256 confirmationCount;
    }

    Proposal[] public proposals;
    // proposalId => signer => confirmed
    mapping(uint256 => mapping(address => bool)) public confirmations;

    event ProposalCreated(uint256 indexed proposalId, string actionType, uint256 amount);
    event ProposalConfirmed(uint256 indexed proposalId, address indexed signer);
    event ProposalExecuted(uint256 indexed proposalId);

    event StreamCreated(bytes32 indexed streamId, address indexed employer, address indexed employee, uint256 flowRate, uint256 totalCap);
    event DepositCredited(address indexed employer, uint256 amount);
    event StreamUpdated(bytes32 indexed streamId, uint256 newFlowRate);
    event StreamCancelled(bytes32 indexed streamId, uint256 remainingRefunded);
    event FundsWithdrawn(bytes32 indexed streamId, address indexed employee, uint256 amount);
    event PrivateStreamCreated(bytes32 indexed streamId, address indexed employer, address indexed employee, bytes32 commitmentHash, uint256 totalCap);
    event PrivateFundsWithdrawn(bytes32 indexed streamId, address indexed employee, uint256 amount);
    event TargetPayoutTokenUpdated(bytes32 indexed streamId, address indexed token);
    event FiatPegUpdated(bytes32 indexed streamId, string fiatPeg);
    event PriceFeedUpdated(string fiatCurrency, address oracleAddress);
    event TreasuryBufferManagerUpdated(address indexed bufferManager);
    event ReferralRegistered(address indexed employee, address indexed referrer, uint32 bonusBasisPoints);

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
        payrollOracle = msg.sender;

        eurcToken = 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a;

        taxRates["SG"] = 0;
        taxAuthorities["SG"] = address(0);

        taxRates["BR"] = 1500;
        taxAuthorities["BR"] = 0x9e71a3371987d6f26D8251E18a8FdcB59296556e;

        taxRates["NG"] = 1000;
        taxAuthorities["NG"] = 0x7a30000000000000000000000000000000000000;

        taxRates["TW"] = 1800;
        taxAuthorities["TW"] = 0x8b30000000000000000000000000000000000000;

        // Default Multi-Sig Configuration
        multiSigSigners.push(msg.sender);
        multiSigSigners.push(0x9e71a3371987d6f26D8251E18a8FdcB59296556e);
        multiSigSigners.push(0x7a30000000000000000000000000000000000000);
        isMultiSigSigner[msg.sender] = true;
        isMultiSigSigner[0x9e71a3371987d6f26D8251E18a8FdcB59296556e] = true;
        isMultiSigSigner[0x7a30000000000000000000000000000000000000] = true;
        requiredConfirmations = 2;
    }

    function setComplianceRegistry(address _complianceRegistry) external onlyOwner {
        complianceRegistry = _complianceRegistry;
    }

    function setEurcToken(address _eurcToken) external onlyOwner {
        eurcToken = _eurcToken;
    }

    function setSwapRouter(address _swapRouter) external onlyOwner {
        swapRouter = _swapRouter;
    }

    function setTreasuryBufferManager(address _treasuryBufferManager) external onlyOwner {
        treasuryBufferManager = _treasuryBufferManager;
        emit TreasuryBufferManagerUpdated(_treasuryBufferManager);
    }

    function setReferral(address employee, address referrer, uint32 bonusBasisPoints) external onlyOwner {
        require(employee != address(0), "Invalid employee address");
        require(referrer != address(0), "Invalid referrer address");
        require(referrer != employee, "Cannot refer yourself");
        require(bonusBasisPoints <= 500, "Bonus cannot exceed 5%");
        referrers[employee] = referrer;
        referralBonuses[employee] = bonusBasisPoints;
        emit ReferralRegistered(employee, referrer, bonusBasisPoints);
    }

    function setTargetPayoutToken(bytes32 streamId, address token) external onlyCleared(msg.sender) {
        require(
            streams[streamId].employee == msg.sender || 
            privateStreams[streamId].employee == msg.sender ||
            streams[streamId].employer == msg.sender ||
            privateStreams[streamId].employer == msg.sender,
            "Only stream participant"
        );
        require(token == address(0) || token == usdcToken || token == eurcToken, "Unsupported target token");
        targetPayoutTokens[streamId] = token;
        emit TargetPayoutTokenUpdated(streamId, token);
    }

    function setTaxRate(string calldata country, uint256 rate, address authority) external onlyOwner {
        taxRates[country] = rate;
        taxAuthorities[country] = authority;
    }

    function setPriceFeed(string calldata fiat, address feed) external onlyOwner {
        priceFeeds[fiat] = feed;
        emit PriceFeedUpdated(fiat, feed);
    }

    function setStreamFiatPeg(bytes32 streamId, string calldata fiat) external onlyCleared(msg.sender) {
        require(
            streams[streamId].employee == msg.sender || 
            privateStreams[streamId].employee == msg.sender ||
            streams[streamId].employer == msg.sender ||
            privateStreams[streamId].employer == msg.sender,
            "Only stream participant"
        );
        if (bytes(fiat).length > 0) {
            require(priceFeeds[fiat] != address(0), "Unsupported fiat currency feed");
        }
        fiatPegs[streamId] = fiat;
        emit FiatPegUpdated(streamId, fiat);
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
     * @notice Create a streaming payroll for a remote engineer with country code.
     * @param employee Remote worker address.
     * @param flowRate Amount of USDC (6 decimals) per second.
     * @param totalCap Total amount escrowed for this milestone.
     * @param country Dynamic country code for tax withholding mapping.
     */
    function createStream(
        address employee,
        uint256 flowRate,
        uint256 totalCap,
        string memory country
    ) public onlyCleared(employee) returns (bytes32) {
        if (treasuryBufferManager != address(0)) {
            require(
                ITreasuryBufferManager(treasuryBufferManager).canCreateStream(msg.sender),
                "BufferManager: Warning state - stream creation restricted"
            );
        }

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

        streamCountries[streamId] = country;

        employeeStreams[employee].push(streamId);
        employerStreams[msg.sender].push(streamId);

        if (treasuryBufferManager != address(0)) {
            ITreasuryBufferManager(treasuryBufferManager).recordStreamCommitment(msg.sender, streamId, flowRate);
        }

        emit StreamCreated(streamId, msg.sender, employee, flowRate, totalCap);
        return streamId;
    }

    /**
     * @notice Create a streaming payroll for a remote engineer (default SG).
     */
    function createStream(
        address employee,
        uint256 flowRate,
        uint256 totalCap
    ) external onlyCleared(employee) returns (bytes32) {
        return createStream(employee, flowRate, totalCap, "SG");
    }

    /**
     * @notice View the claimable balance of a stream at the current block timestamp.
     */
    function getClaimableAmount(bytes32 streamId) public view returns (uint256) {
        Stream memory stream = streams[streamId];
        if (!stream.isActive) return 0;

        uint256 duration = block.timestamp - stream.lastUpdated;
        uint256 accrued;

        string memory fiat = fiatPegs[streamId];
        if (bytes(fiat).length > 0 && priceFeeds[fiat] != address(0)) {
            (, int256 price, , , ) = AggregatorV3Interface(priceFeeds[fiat]).latestRoundData();
            require(price > 0, "Invalid oracle price");
            accrued = (duration * stream.flowRate * 10**8) / uint256(price);
        } else {
            accrued = duration * stream.flowRate;
        }

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
        if (treasuryBufferManager != address(0)) {
            require(
                ITreasuryBufferManager(treasuryBufferManager).canClaimStream(streamId),
                "BufferManager: Stream claims restricted - priority roles first"
            );
        }

        Stream storage stream = streams[streamId];
        require(stream.isActive, "Stream is not active");

        uint256 claimable = getClaimableAmount(streamId);
        require(claimable > 0, "No funds available to withdraw");

        stream.accruedPaid += claimable;
        stream.lastUpdated = block.timestamp;

        // If payroll fully completed, mark inactive
        if (stream.accruedPaid >= stream.totalCap) {
            stream.isActive = false;
            if (treasuryBufferManager != address(0)) {
                ITreasuryBufferManager(treasuryBufferManager).removeStreamCommitment(stream.employer, streamId);
            }
        }

        uint256 coopFee = _routeCoopFee(claimable);

        // Calculate tax withholding split
        string memory country = streamCountries[streamId];
        uint256 taxRate = taxRates[country];
        address taxAuthority = taxAuthorities[country];

        // Calculate referral split
        address referrer = referrers[stream.employee];
        uint256 referralBonus = 0;
        if (referrer != address(0) && referralBonuses[stream.employee] > 0) {
            referralBonus = (claimable * referralBonuses[stream.employee]) / 10000;
        }

        uint256 taxAmount = 0;
        uint256 employeeAmount = claimable - coopFee - referralBonus;

        if (taxRate > 0 && taxAuthority != address(0)) {
            taxAmount = (claimable * taxRate) / 10000;
            employeeAmount = claimable - taxAmount - coopFee - referralBonus;
        }

        if (taxAmount > 0) {
            require(
                IERC20(usdcToken).transfer(taxAuthority, taxAmount),
                "USDC tax transfer failed"
            );
        }

        if (referralBonus > 0) {
            require(
                IERC20(usdcToken).transfer(referrer, referralBonus),
                "USDC referral transfer failed"
            );
        }

        address targetToken = targetPayoutTokens[streamId];
        if (targetToken != address(0) && targetToken != usdcToken) {
            require(swapRouter != address(0), "Swap router not set");
            require(
                IERC20(usdcToken).approve(swapRouter, employeeAmount),
                "USDC approval to router failed"
            );
            ExactInputSingleParams memory params = ExactInputSingleParams({
                tokenIn: usdcToken,
                tokenOut: targetToken,
                fee: 3000,
                recipient: stream.employee,
                deadline: block.timestamp + 300,
                amountIn: employeeAmount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
            ISwapRouter(swapRouter).exactInputSingle(params);
        } else {
            require(
                IERC20(usdcToken).transfer(stream.employee, employeeAmount),
                "USDC transfer to employee failed"
            );
        }

        emit FundsWithdrawn(streamId, stream.employee, claimable);
    }

    /**
     * @notice Cancel stream by employer, refunding the remaining unspent escrow.
     */
    function cancelStream(bytes32 streamId) external onlyStreamEmployer(streamId) {
        Stream storage stream = streams[streamId];
        if (stream.totalCap >= 10000 * 10**6) {
            revert("High-value stream requires multi-sig proposal");
        }
        _executeCancelStream(streamId);
    }

    function _executeCancelStream(bytes32 streamId) internal {
        Stream storage stream = streams[streamId];
        require(stream.isActive, "Stream already inactive");

        // Calculate accrued up to now
        uint256 claimable = getClaimableAmount(streamId);
        uint256 spent = stream.accruedPaid + claimable;
        uint256 unspent = stream.totalCap - spent;

        stream.accruedPaid = spent;
        stream.isActive = false;

        if (treasuryBufferManager != address(0)) {
            ITreasuryBufferManager(treasuryBufferManager).removeStreamCommitment(stream.employer, streamId);
        }

        // Send accrued to employee
        if (claimable > 0) {
            uint256 coopFee = _routeCoopFee(claimable);
            address referrer = referrers[stream.employee];
            uint256 referralBonus = 0;
            if (referrer != address(0) && referralBonuses[stream.employee] > 0) {
                referralBonus = (claimable * referralBonuses[stream.employee]) / 10000;
            }
            uint256 employeeAmount = claimable - coopFee - referralBonus;
            address targetToken = targetPayoutTokens[streamId];
            if (targetToken != address(0) && targetToken != usdcToken) {
                require(swapRouter != address(0), "Swap router not set");
                require(
                    IERC20(usdcToken).approve(swapRouter, employeeAmount),
                    "USDC approval to router failed"
                );
                ExactInputSingleParams memory params = ExactInputSingleParams({
                    tokenIn: usdcToken,
                    tokenOut: targetToken,
                    fee: 3000,
                    recipient: stream.employee,
                    deadline: block.timestamp + 300,
                    amountIn: employeeAmount,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                });
                ISwapRouter(swapRouter).exactInputSingle(params);
            } else {
                require(
                    IERC20(usdcToken).transfer(stream.employee, employeeAmount),
                    "USDC transfer to employee failed"
                );
            }
            if (referralBonus > 0) {
                require(
                    IERC20(usdcToken).transfer(referrer, referralBonus),
                    "USDC referral transfer failed"
                );
            }
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

    // Multi-Sig Operational Functions
    function proposeCancelStream(bytes32 streamId) external onlyCleared(msg.sender) returns (uint256) {
        require(streams[streamId].employer == msg.sender, "Only stream employer can propose");
        require(streams[streamId].isActive, "Stream already inactive");
        
        uint256 proposalId = proposals.length;
        proposals.push(Proposal({
            actionType: "CANCEL_STREAM",
            streamId: streamId,
            targetAddress: msg.sender,
            amount: streams[streamId].totalCap,
            executed: false,
            confirmationCount: 0
        }));

        emit ProposalCreated(proposalId, "CANCEL_STREAM", streams[streamId].totalCap);
        
        if (isMultiSigSigner[msg.sender]) {
            _confirmProposal(proposalId, msg.sender);
        }
        
        return proposalId;
    }

    function proposeWithdrawLeftover(uint256 amount) external onlyCleared(msg.sender) returns (uint256) {
        require(employerBalances[msg.sender] >= amount, "Insufficient employer balance");
        
        uint256 proposalId = proposals.length;
        proposals.push(Proposal({
            actionType: "WITHDRAW_TREASURY",
            streamId: bytes32(0),
            targetAddress: msg.sender,
            amount: amount,
            executed: false,
            confirmationCount: 0
        }));

        emit ProposalCreated(proposalId, "WITHDRAW_TREASURY", amount);

        if (isMultiSigSigner[msg.sender]) {
            _confirmProposal(proposalId, msg.sender);
        }

        return proposalId;
    }

    function proposeSetPayrollOracle(address newOracle) external onlyOwner returns (uint256) {
        uint256 proposalId = proposals.length;
        proposals.push(Proposal({
            actionType: "SET_ORACLE",
            streamId: bytes32(0),
            targetAddress: newOracle,
            amount: 0,
            executed: false,
            confirmationCount: 0
        }));

        emit ProposalCreated(proposalId, "SET_ORACLE", 0);

        if (isMultiSigSigner[msg.sender]) {
            _confirmProposal(proposalId, msg.sender);
        }

        return proposalId;
    }

    function confirmProposal(uint256 proposalId) external {
        require(isMultiSigSigner[msg.sender], "Not an authorized signer");
        require(proposalId < proposals.length, "Invalid proposal ID");
        require(!proposals[proposalId].executed, "Proposal already executed");
        require(!confirmations[proposalId][msg.sender], "Already confirmed");

        _confirmProposal(proposalId, msg.sender);
    }

    function _confirmProposal(uint256 proposalId, address signer) internal {
        confirmations[proposalId][signer] = true;
        proposals[proposalId].confirmationCount++;
        emit ProposalConfirmed(proposalId, signer);
    }

    function executeProposal(uint256 proposalId) external {
        require(proposalId < proposals.length, "Invalid proposal ID");
        Proposal storage prop = proposals[proposalId];
        require(!prop.executed, "Proposal already executed");
        require(prop.confirmationCount >= requiredConfirmations, "Insufficient confirmations");

        prop.executed = true;

        if (keccak256(bytes(prop.actionType)) == keccak256(bytes("CANCEL_STREAM"))) {
            _executeCancelStream(prop.streamId);
        } else if (keccak256(bytes(prop.actionType)) == keccak256(bytes("WITHDRAW_TREASURY"))) {
            require(employerBalances[prop.targetAddress] >= prop.amount, "Insufficient employer balance");
            employerBalances[prop.targetAddress] -= prop.amount;
            require(
                IERC20(usdcToken).transfer(prop.targetAddress, prop.amount),
                "USDC transfer failed"
            );
        } else if (keccak256(bytes(prop.actionType)) == keccak256(bytes("SET_ORACLE"))) {
            payrollOracle = prop.targetAddress;
        }

        emit ProposalExecuted(proposalId);
    }

    function setMultiSigSigners(address[] calldata signers, uint256 required) external onlyOwner {
        require(signers.length > 0, "No signers provided");
        require(required > 0 && required <= signers.length, "Invalid required confirmations");
        
        for (uint256 i = 0; i < multiSigSigners.length; i++) {
            isMultiSigSigner[multiSigSigners[i]] = false;
        }
        
        multiSigSigners = signers;
        requiredConfirmations = required;
        
        for (uint256 i = 0; i < signers.length; i++) {
            isMultiSigSigner[signers[i]] = true;
        }
    }

    function getProposalsCount() external view returns (uint256) {
        return proposals.length;
    }

    /**
     * @notice Create multiple streaming payrolls in a single transaction.
     * @param employees Array of remote worker addresses.
     * @param flowRates Array of flow rates (USDC per second).
     * @param totalCaps Array of total caps.
     */
    /**
     * @notice Create multiple streaming payrolls in a single transaction with country codes.
     * @param employees Array of remote worker addresses.
     * @param flowRates Array of flow rates (USDC per second).
     * @param totalCaps Array of total caps.
     * @param countries Array of country codes for each stream.
     */
    function createStreamsBatch(
        address[] calldata employees,
        uint256[] calldata flowRates,
        uint256[] calldata totalCaps,
        string[] memory countries
    ) public returns (bytes32[] memory) {
        require(
            employees.length == flowRates.length && flowRates.length == totalCaps.length && totalCaps.length == countries.length,
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
            string memory country = countries[i];

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

            streamCountries[streamId] = country;

            employeeStreams[employee].push(streamId);
            employerStreams[msg.sender].push(streamId);

            emit StreamCreated(streamId, msg.sender, employee, flowRate, totalCap);
            streamIds[i] = streamId;
        }

        return streamIds;
    }

    /**
     * @notice Create multiple streaming payrolls in a single transaction (default SG).
     */
    function createStreamsBatch(
        address[] calldata employees,
        uint256[] calldata flowRates,
        uint256[] calldata totalCaps
    ) public returns (bytes32[] memory) {
        string[] memory countries = new string[](employees.length);
        for (uint256 i = 0; i < employees.length; i++) {
            countries[i] = "SG";
        }
        return createStreamsBatch(employees, flowRates, totalCaps, countries);
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

            if (treasuryBufferManager != address(0)) {
                ITreasuryBufferManager(treasuryBufferManager).removeStreamCommitment(stream.employer, streamId);
            }

            if (claimable > 0) {
                stream.accruedPaid += claimable;

                uint256 coopFee = _routeCoopFee(claimable);

                string memory country = streamCountries[streamId];
                uint256 taxRate = taxRates[country];
                address taxAuthority = taxAuthorities[country];

                address referrer = referrers[stream.employee];
                uint256 referralBonus = 0;
                if (referrer != address(0) && referralBonuses[stream.employee] > 0) {
                    referralBonus = (claimable * referralBonuses[stream.employee]) / 10000;
                }

                uint256 taxAmount = 0;
                uint256 employeeAmount = claimable - coopFee - referralBonus;

                if (taxRate > 0 && taxAuthority != address(0)) {
                    taxAmount = (claimable * taxRate) / 10000;
                    employeeAmount = claimable - taxAmount - coopFee - referralBonus;
                }

                if (taxAmount > 0) {
                    require(
                        IERC20(usdcToken).transfer(taxAuthority, taxAmount),
                        "USDC tax transfer failed"
                    );
                }

                if (referralBonus > 0) {
                    require(
                        IERC20(usdcToken).transfer(referrer, referralBonus),
                        "USDC referral transfer failed"
                    );
                }

                address targetToken = targetPayoutTokens[streamId];
                if (targetToken != address(0) && targetToken != usdcToken) {
                    require(swapRouter != address(0), "Swap router not set");
                    require(
                        IERC20(usdcToken).approve(swapRouter, employeeAmount),
                        "USDC approval to router failed"
                    );
                    ExactInputSingleParams memory params = ExactInputSingleParams({
                        tokenIn: usdcToken,
                        tokenOut: targetToken,
                        fee: 3000,
                        recipient: stream.employee,
                        deadline: block.timestamp + 300,
                        amountIn: employeeAmount,
                        amountOutMinimum: 0,
                        sqrtPriceLimitX96: 0
                    });
                    ISwapRouter(swapRouter).exactInputSingle(params);
                } else {
                    require(
                        IERC20(usdcToken).transfer(stream.employee, employeeAmount),
                        "USDC transfer to employee failed"
                    );
                }
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

                uint256 coopFee = _routeCoopFee(claimable);

                string memory country = streamCountries[streamId];
                uint256 taxRate = taxRates[country];
                address taxAuthority = taxAuthorities[country];

                address referrer = referrers[stream.employee];
                uint256 referralBonus = 0;
                if (referrer != address(0) && referralBonuses[stream.employee] > 0) {
                    referralBonus = (claimable * referralBonuses[stream.employee]) / 10000;
                }

                uint256 taxAmount = 0;
                uint256 employeeAmount = claimable - coopFee - referralBonus;

                if (taxRate > 0 && taxAuthority != address(0)) {
                    taxAmount = (claimable * taxRate) / 10000;
                    employeeAmount = claimable - taxAmount - coopFee - referralBonus;
                }

                if (taxAmount > 0) {
                    require(
                        IERC20(usdcToken).transfer(taxAuthority, taxAmount),
                        "USDC tax transfer failed"
                    );
                }

                if (referralBonus > 0) {
                    require(
                        IERC20(usdcToken).transfer(referrer, referralBonus),
                        "USDC referral transfer failed"
                    );
                }

                address targetToken = targetPayoutTokens[streamId];
                if (targetToken != address(0) && targetToken != usdcToken) {
                    require(swapRouter != address(0), "Swap router not set");
                    require(
                        IERC20(usdcToken).approve(swapRouter, employeeAmount),
                        "USDC approval to router failed"
                    );
                    ExactInputSingleParams memory params = ExactInputSingleParams({
                        tokenIn: usdcToken,
                        tokenOut: targetToken,
                        fee: 3000,
                        recipient: stream.employee,
                        deadline: block.timestamp + 300,
                        amountIn: employeeAmount,
                        amountOutMinimum: 0,
                        sqrtPriceLimitX96: 0
                    });
                    ISwapRouter(swapRouter).exactInputSingle(params);
                } else {
                    require(
                        IERC20(usdcToken).transfer(stream.employee, employeeAmount),
                        "USDC transfer to employee failed"
                    );
                }

                emit FundsWithdrawn(streamId, stream.employee, claimable);
            }
        }
    }

    function setPayrollOracle(address _oracle) external onlyOwner {
        payrollOracle = _oracle;
    }

    function setBenefitsVault(address _vault) external onlyOwner {
        benefitsVault = _vault;
    }

    function _routeCoopFee(uint256 claimable) internal returns (uint256) {
        if (benefitsVault == address(0) || claimable == 0) {
            return 0;
        }
        uint256 coopFee = (claimable * 2) / 100;
        if (coopFee > 0) {
            // Approve or transfer from this contract to vault
            require(
                IERC20(usdcToken).transfer(benefitsVault, coopFee),
                "USDC co-op fee transfer failed"
            );
            IMicroBenefitsVault(benefitsVault).notifyCoopFee(coopFee);
        }
        return coopFee;
    }

    /**
     * @notice Create a private streaming payroll with masked flow rate and country code.
     * @param employee Remote worker address.
     * @param commitmentHash Hash of keccak256(abi.encode(flowRate, totalCap, salt)).
     * @param totalCap Total amount escrowed for this milestone.
     * @param country Dynamic country code.
     */
    function createPrivateStream(
        address employee,
        bytes32 commitmentHash,
        uint256 totalCap,
        string memory country
    ) public onlyCleared(employee) returns (bytes32) {
        if (treasuryBufferManager != address(0)) {
            require(
                ITreasuryBufferManager(treasuryBufferManager).canCreateStream(msg.sender),
                "BufferManager: Warning state - stream creation restricted"
            );
        }

        require(employee != address(0), "Invalid employee address");
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
            abi.encodePacked(msg.sender, employee, block.timestamp, commitmentHash)
        );

        privateStreams[streamId] = PrivateStreamCommitment({
            employer: msg.sender,
            employee: employee,
            commitmentHash: commitmentHash,
            startTime: block.timestamp,
            lastUpdated: block.timestamp,
            accruedPaid: 0,
            totalCap: totalCap,
            isActive: true
        });

        streamCountries[streamId] = country;

        employeeStreams[employee].push(streamId);
        employerStreams[msg.sender].push(streamId);

        emit PrivateStreamCreated(streamId, msg.sender, employee, commitmentHash, totalCap);
        return streamId;
    }

    /**
     * @notice Create a private streaming payroll (default SG).
     */
    function createPrivateStream(
        address employee,
        bytes32 commitmentHash,
        uint256 totalCap
    ) external onlyCleared(employee) returns (bytes32) {
        return createPrivateStream(employee, commitmentHash, totalCap, "SG");
    }

    /**
     * @notice Withdraw private stream funds using a valid payroll oracle signature.
     */
    function withdrawPrivateFunds(
        bytes32 streamId,
        uint256 claimableAmount,
        uint256 flowRate,
        bytes32 salt,
        bytes calldata signature
    ) external onlyCleared(msg.sender) {
        PrivateStreamCommitment storage stream = privateStreams[streamId];
        require(stream.isActive, "Stream is not active");
        require(stream.employee == msg.sender, "Only stream employee can withdraw");

        // Validate commitment hash
        require(
            keccak256(abi.encode(flowRate, stream.totalCap, salt)) == stream.commitmentHash,
            "Invalid commitment parameters"
        );

        // Verify oracle signature
        bytes32 messageHash = keccak256(abi.encode(streamId, claimableAmount));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address signer = recoverSigner(ethSignedMessageHash, signature);
        require(signer == payrollOracle, "Invalid oracle signature");

        require(claimableAmount > 0, "Claimable amount must be positive");
        uint256 remaining = stream.totalCap - stream.accruedPaid;
        require(claimableAmount > stream.accruedPaid, "No new funds to withdraw");
        uint256 payout = claimableAmount - stream.accruedPaid;

        if (payout > remaining) {
            payout = remaining;
        }

        stream.accruedPaid += payout;
        stream.lastUpdated = block.timestamp;

        if (stream.accruedPaid >= stream.totalCap) {
            stream.isActive = false;
        }

        uint256 coopFee = _routeCoopFee(payout);

        // Calculate tax withholding split
        string memory country = streamCountries[streamId];
        uint256 taxRate = taxRates[country];
        address taxAuthority = taxAuthorities[country];

        address referrer = referrers[stream.employee];
        uint256 referralBonus = 0;
        if (referrer != address(0) && referralBonuses[stream.employee] > 0) {
            referralBonus = (payout * referralBonuses[stream.employee]) / 10000;
        }

        uint256 taxAmount = 0;
        uint256 employeeAmount = payout - coopFee - referralBonus;

        if (taxRate > 0 && taxAuthority != address(0)) {
            taxAmount = (payout * taxRate) / 10000;
            employeeAmount = payout - taxAmount - coopFee - referralBonus;
        }

        if (taxAmount > 0) {
            require(
                IERC20(usdcToken).transfer(taxAuthority, taxAmount),
                "USDC tax transfer failed"
            );
        }

        if (referralBonus > 0) {
            require(
                IERC20(usdcToken).transfer(referrer, referralBonus),
                "USDC referral transfer failed"
            );
        }

        address targetToken = targetPayoutTokens[streamId];
        if (targetToken != address(0) && targetToken != usdcToken) {
            require(swapRouter != address(0), "Swap router not set");
            require(
                IERC20(usdcToken).approve(swapRouter, employeeAmount),
                "USDC approval to router failed"
            );
            ExactInputSingleParams memory params = ExactInputSingleParams({
                tokenIn: usdcToken,
                tokenOut: targetToken,
                fee: 3000,
                recipient: stream.employee,
                deadline: block.timestamp + 300,
                amountIn: employeeAmount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
            ISwapRouter(swapRouter).exactInputSingle(params);
        } else {
            require(
                IERC20(usdcToken).transfer(stream.employee, employeeAmount),
                "USDC transfer to employee failed"
            );
        }

        emit PrivateFundsWithdrawn(streamId, stream.employee, payout);
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}

