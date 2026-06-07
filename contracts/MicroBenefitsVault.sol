// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MicroBenefitsVault
 * @dev Manages micro-insurance and micro-pension funds in USDC for remote engineers.
 * Integrates with Circle Developer-Controlled Wallets for autonomous claim verification.
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
}

interface ICompliance {
    function isSanctioned(address target) external view returns (bool);
}

interface IERC4626 {
    function asset() external view returns (address);
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function convertToAssets(uint256 shares) external view returns (uint256 assets);
    function convertToShares(uint256 assets) external view returns (uint256 shares);
}

contract MicroBenefitsVault {
    struct MemberAccount {
        uint256 healthInsuranceBalance;
        uint256 retirementShares;
        uint256 emergencyShares;
        uint256 totalContributed;
        bool isRegistered;
    }

    struct ClaimDetails {
        address member;
        address serviceProvider;
        uint256 amount;
        string claimType;
        bytes32 claimHash;
        uint256 nonce;
    }

    // USDC Address on Arc Chain: 0x3600000000000000000000000000000000000000
    address public immutable usdcToken;
    address public immutable yieldVault;
    address public owner;
    address public verifierAgent; // Authorized AI Agent/Oracle for validating medical bills
    address public complianceRegistry;

    bytes32 public DOMAIN_SEPARATOR;
    bytes32 public constant CLAIM_DETAILS_TYPEHASH = keccak256(
        "ClaimDetails(address member,address serviceProvider,uint256 amount,string claimType,bytes32 claimHash,uint256 nonce)"
    );

    mapping(uint256 => bool) public usedNonces;
    mapping(address => MemberAccount) public members;
    
    // Treasury holdings for global co-op insurance
    uint256 public insuranceCoopTreasury;

    // LP Staking trackers for Co-op Mutual Pool
    uint256 public totalCoopShares;
    mapping(address => uint256) public coopShares;

    event MemberRegistered(address indexed member);
    event ContributionDeposited(address indexed member, uint256 health, uint256 retirement, uint256 emergency);
    event ClaimPaid(address indexed member, address indexed serviceProvider, uint256 amount, string claimType);
    event VerifierAgentUpdated(address indexed newVerifier);
    event CoopStaked(address indexed lp, uint256 amount, uint256 shares);
    event CoopUnstaked(address indexed lp, uint256 amount, uint256 shares);
    event DeficitAbsorbed(address indexed member, uint256 deficit, uint256 remainingTreasury);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner");
        _;
    }

    modifier onlyVerifier() {
        require(msg.sender == verifierAgent || msg.sender == owner, "Only verifier agent");
        _;
    }

    modifier onlyCleared(address account) {
        if (complianceRegistry != address(0)) {
            require(!ICompliance(complianceRegistry).isSanctioned(account), "Registry: Address Blocked");
        }
        _;
    }

    constructor(address _usdcToken, address _verifierAgent, address _yieldVault) {
        usdcToken = _usdcToken;
        owner = msg.sender;
        verifierAgent = _verifierAgent;
        yieldVault = _yieldVault;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("NexaFlow")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function setComplianceRegistry(address _complianceRegistry) external onlyOwner {
        complianceRegistry = _complianceRegistry;
    }

    function updateVerifierAgent(address _newVerifier) external onlyOwner {
        require(_newVerifier != address(0), "Invalid verifier address");
        verifierAgent = _newVerifier;
        emit VerifierAgentUpdated(_newVerifier);
    }

    /**
     * @notice Deposit co-op fee from StreamingPayroll payouts to reward stakers.
     */
    function notifyCoopFee(uint256 amount) external onlyCleared(msg.sender) {
        insuranceCoopTreasury += amount;
    }

    /**
     * @notice Stake USDC in the co-op mutual pool.
     */
    function stakeInCoop(uint256 amount) external onlyCleared(msg.sender) {
        require(amount > 0, "Amount must be positive");
        
        uint256 shares = 0;
        if (totalCoopShares == 0 || insuranceCoopTreasury == 0) {
            shares = amount;
        } else {
            shares = (amount * totalCoopShares) / insuranceCoopTreasury;
        }

        require(
            IERC20(usdcToken).transferFrom(msg.sender, address(this), amount),
            "USDC stake transfer failed"
        );

        coopShares[msg.sender] += shares;
        totalCoopShares += shares;
        insuranceCoopTreasury += amount;

        emit CoopStaked(msg.sender, amount, shares);
    }

    /**
     * @notice Unstake USDC from the co-op mutual pool.
     */
    function unstakeInCoop(uint256 shares) external onlyCleared(msg.sender) {
        require(shares > 0, "Shares must be positive");
        require(coopShares[msg.sender] >= shares, "Insufficient shares");
        require(totalCoopShares > 0, "No shares in pool");

        uint256 withdrawableUSDC = (shares * insuranceCoopTreasury) / totalCoopShares;
        
        coopShares[msg.sender] -= shares;
        totalCoopShares -= shares;
        insuranceCoopTreasury -= withdrawableUSDC;

        require(
            IERC20(usdcToken).transfer(msg.sender, withdrawableUSDC),
            "USDC unstake transfer failed"
        );

        emit CoopUnstaked(msg.sender, withdrawableUSDC, shares);
    }

    /**
     * @notice Register a worker for micro-benefits.
     */
    function registerMember(address member) external {
        require(!members[member].isRegistered, "Member already registered");
        members[member] = MemberAccount({
            healthInsuranceBalance: 0,
            retirementShares: 0,
            emergencyShares: 0,
            totalContributed: 0,
            isRegistered: true
        });
        emit MemberRegistered(member);
    }

    /**
     * @notice Deposit contribution split from salary.
     * @param member The address of the remote employee.
     * @param health Split amount for healthcare.
     * @param retirement Split amount for pension.
     * @param emergency Split amount for emergency savings.
     */
    function depositContribution(
        address member,
        uint256 health,
        uint256 retirement,
        uint256 emergency
    ) external onlyCleared(member) {
        require(members[member].isRegistered, "Member not registered");
        uint256 total = health + retirement + emergency;
        require(total > 0, "Deposit must be greater than 0");

        // Lock USDC from msg.sender (could be the employee or the StreamingPayroll engine)
        require(
            IERC20(usdcToken).transferFrom(msg.sender, address(this), total),
            "USDC deposit failed"
        );

        MemberAccount storage acc = members[member];
        uint256 coopPortion = health * 20 / 100; // 20% to global pooling
        acc.healthInsuranceBalance += health - coopPortion;
        acc.totalContributed += total;

        // Route health portion partially to co-op pool to hedge risks
        insuranceCoopTreasury += coopPortion;

        // Approve and route pension and emergency into yield vault
        if (retirement > 0 || emergency > 0) {
            require(IERC20(usdcToken).approve(yieldVault, retirement + emergency), "USDC approval failed");
        }

        if (retirement > 0) {
            uint256 shares = IERC4626(yieldVault).deposit(retirement, address(this));
            acc.retirementShares += shares;
        }

        if (emergency > 0) {
            uint256 shares = IERC4626(yieldVault).deposit(emergency, address(this));
            acc.emergencyShares += shares;
        }

        emit ContributionDeposited(member, health, retirement, emergency);
    }

    /**
     * @notice Claim a medical expense or retirement payout.
     * Verified by the Circle Developer-Controlled AI Agent.
     */
    function processClaim(
        ClaimDetails calldata details,
        bytes calldata signature
    ) external onlyCleared(details.member) {
        require(members[details.member].isRegistered, "Member not registered");
        require(!usedNonces[details.nonce], "Nonce already used");
        usedNonces[details.nonce] = true;

        bytes32 structHash = keccak256(
            abi.encode(
                CLAIM_DETAILS_TYPEHASH,
                details.member,
                details.serviceProvider,
                details.amount,
                keccak256(bytes(details.claimType)),
                details.claimHash,
                details.nonce
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                structHash
            )
        );

        address recovered = _recoverSigner(digest, signature);
        require(recovered == verifierAgent, "Invalid claim signature");

        MemberAccount storage acc = members[details.member];

        if (keccak256(abi.encodePacked(details.claimType)) == keccak256(abi.encodePacked("HEALTH"))) {
            // Can use individual health insurance balance + co-op treasury if needed
            uint256 available = acc.healthInsuranceBalance;
            if (details.amount > available) {
                uint256 deficit = details.amount - available;
                require(insuranceCoopTreasury >= deficit, "Co-op Treasury insufficient");
                insuranceCoopTreasury -= deficit;
                acc.healthInsuranceBalance = 0;
                emit DeficitAbsorbed(details.member, deficit, insuranceCoopTreasury);
            } else {
                acc.healthInsuranceBalance -= details.amount;
            }
            // Payout health claim from this contract's USDC
            require(
                IERC20(usdcToken).transfer(details.serviceProvider, details.amount),
                "USDC transfer to provider failed"
            );
        } else if (keccak256(abi.encodePacked(details.claimType)) == keccak256(abi.encodePacked("PENSION"))) {
            uint256 balanceVal = IERC4626(yieldVault).convertToAssets(acc.retirementShares);
            require(balanceVal >= details.amount, "Insufficient pension balance");
            uint256 shares = IERC4626(yieldVault).withdraw(details.amount, address(this), address(this));
            acc.retirementShares -= shares;
            require(
                IERC20(usdcToken).transfer(details.serviceProvider, details.amount),
                "USDC transfer to provider failed"
            );
        } else {
            uint256 balanceVal = IERC4626(yieldVault).convertToAssets(acc.emergencyShares);
            require(balanceVal >= details.amount, "Insufficient emergency balance");
            uint256 shares = IERC4626(yieldVault).withdraw(details.amount, address(this), address(this));
            acc.emergencyShares -= shares;
            require(
                IERC20(usdcToken).transfer(details.serviceProvider, details.amount),
                "USDC transfer to provider failed"
            );
        }

        emit ClaimPaid(details.member, details.serviceProvider, details.amount, details.claimType);
    }

    function _recoverSigner(bytes32 digest, bytes memory signature) internal pure returns (address) {
        if (signature.length != 65) {
            return address(0);
        }
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        return ecrecover(digest, v, r, s);
    }
}
