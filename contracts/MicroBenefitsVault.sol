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

    // USDC Address on Arc Chain: 0x3600000000000000000000000000000000000000
    address public immutable usdcToken;
    address public immutable yieldVault;
    address public owner;
    address public verifierAgent; // Authorized AI Agent/Oracle for validating medical bills
    address public complianceRegistry;

    mapping(address => MemberAccount) public members;
    
    // Treasury holdings for global co-op insurance
    uint256 public insuranceCoopTreasury;


    event MemberRegistered(address indexed member);
    event ContributionDeposited(address indexed member, uint256 health, uint256 retirement, uint256 emergency);
    event ClaimPaid(address indexed member, address indexed serviceProvider, uint256 amount, string claimType);
    event VerifierAgentUpdated(address indexed newVerifier);

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
        acc.healthInsuranceBalance += health;
        acc.totalContributed += total;

        // Route health portion partially to co-op pool to hedge risks
        uint256 coopPortion = health * 20 / 100; // 20% to global pooling
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
        address member,
        address serviceProvider, // e.g., partner hospital
        uint256 amount,
        string calldata claimType, // "HEALTH" or "PENSION" or "EMERGENCY"
        bytes32 claimHash // IPFS hash of invoice details
    ) external onlyVerifier onlyCleared(member) {
        require(members[member].isRegistered, "Member not registered");
        MemberAccount storage acc = members[member];

        if (keccak256(abi.encodePacked(claimType)) == keccak256(abi.encodePacked("HEALTH"))) {
            // Can use individual health insurance balance + co-op treasury if needed
            uint256 available = acc.healthInsuranceBalance;
            if (amount > available) {
                uint256 deficit = amount - available;
                require(insuranceCoopTreasury >= deficit, "Co-op Treasury insufficient");
                insuranceCoopTreasury -= deficit;
                acc.healthInsuranceBalance = 0;
            } else {
                acc.healthInsuranceBalance -= amount;
            }
            // Payout health claim from this contract's USDC
            require(
                IERC20(usdcToken).transfer(serviceProvider, amount),
                "USDC transfer to provider failed"
            );
        } else if (keccak256(abi.encodePacked(claimType)) == keccak256(abi.encodePacked("PENSION"))) {
            uint256 balanceVal = IERC4626(yieldVault).convertToAssets(acc.retirementShares);
            require(balanceVal >= amount, "Insufficient pension balance");
            uint256 shares = IERC4626(yieldVault).withdraw(amount, address(this), address(this));
            acc.retirementShares -= shares;
            require(
                IERC20(usdcToken).transfer(serviceProvider, amount),
                "USDC transfer to provider failed"
            );
        } else {
            uint256 balanceVal = IERC4626(yieldVault).convertToAssets(acc.emergencyShares);
            require(balanceVal >= amount, "Insufficient emergency balance");
            uint256 shares = IERC4626(yieldVault).withdraw(amount, address(this), address(this));
            acc.emergencyShares -= shares;
            require(
                IERC20(usdcToken).transfer(serviceProvider, amount),
                "USDC transfer to provider failed"
            );
        }

        emit ClaimPaid(member, serviceProvider, amount, claimType);
    }
}
