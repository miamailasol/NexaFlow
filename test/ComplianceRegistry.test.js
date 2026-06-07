import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("ComplianceRegistry and StreamingPayroll integration", function () {
  let mockUSDC;
  let complianceRegistry;
  let streamingPayroll;
  let owner;
  let guardian;
  let employee;
  let nonGuardian;

  beforeEach(async function () {
    [owner, guardian, employee, nonGuardian] = await ethers.getSigners();

    // Deploy mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy ComplianceRegistry
    const ComplianceRegistry = await ethers.getContractFactory("ComplianceRegistry");
    complianceRegistry = await ComplianceRegistry.deploy();
    await complianceRegistry.waitForDeployment();

    // Setup guardian
    await complianceRegistry.setGuardianStatus(guardian.address, true);

    // Deploy StreamingPayroll
    const StreamingPayroll = await ethers.getContractFactory("StreamingPayroll");
    streamingPayroll = await StreamingPayroll.deploy(await mockUSDC.getAddress());
    await streamingPayroll.waitForDeployment();

    // Link compliance registry to payroll
    await streamingPayroll.setComplianceRegistry(await complianceRegistry.getAddress());

    // Mint USDC to owner and approve StreamingPayroll
    await mockUSDC.mint(owner.address, ethers.parseUnits("5000", 6));
    await mockUSDC.approve(await streamingPayroll.getAddress(), ethers.parseUnits("5000", 6));
  });

  it("Should allow guardian to blacklist and un-blacklist addresses", async function () {
    expect(await complianceRegistry.isSanctioned(employee.address)).to.equal(false);

    // Guard blacklist call
    await expect(
      complianceRegistry.connect(nonGuardian).setSanctionStatus(employee.address, true)
    ).to.be.revertedWith("Registry: Caller is not a guardian");

    // Guardians can blacklist
    await expect(complianceRegistry.connect(guardian).setSanctionStatus(employee.address, true))
      .to.emit(complianceRegistry, "SanctionStatusUpdated")
      .withArgs(employee.address, true);

    expect(await complianceRegistry.isSanctioned(employee.address)).to.equal(true);

    // Guardians can un-blacklist
    await complianceRegistry.connect(guardian).setSanctionStatus(employee.address, false);
    expect(await complianceRegistry.isSanctioned(employee.address)).to.equal(false);
  });

  it("Should revert stream creation if employee is blacklisted", async function () {
    // Blacklist employee
    await complianceRegistry.connect(guardian).setSanctionStatus(employee.address, true);

    // Try creating single stream
    await expect(
      streamingPayroll.createStream(employee.address, 100, ethers.parseUnits("1000", 6))
    ).to.be.revertedWith("Registry: Address Blocked");

    // Try batch stream creation
    await expect(
      streamingPayroll.createStreamsBatch(
        [employee.address],
        [100],
        [ethers.parseUnits("1000", 6)]
      )
    ).to.be.revertedWith("Registry: Address Blocked");
  });

  it("Should prevent withdrawals if employee is blacklisted after stream creation", async function () {
    // Create stream while employee is clear
    const tx = await streamingPayroll.createStream(employee.address, 100, ethers.parseUnits("1000", 6));
    const receipt = await tx.wait();

    // Compute streamId locally to match contract
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const timestamp = block.timestamp;
    const streamId = ethers.solidityPackedKeccak256(
      ["address", "address", "uint256"],
      [owner.address, employee.address, timestamp]
    );

    // Fast-forward block time by 100 seconds to accrue balance
    await ethers.provider.send("evm_increaseTime", [100]);
    await ethers.provider.send("evm_mine");

    // Blacklist employee
    await complianceRegistry.connect(guardian).setSanctionStatus(employee.address, true);

    // Try withdrawing single stream
    await expect(
      streamingPayroll.connect(employee).withdrawFunds(streamId)
    ).to.be.revertedWith("Registry: Address Blocked");

    // Try batch stream withdrawal
    await expect(
      streamingPayroll.connect(employee).withdrawFundsBatch([streamId])
    ).to.be.revertedWith("Registry: Address Blocked");
  });
});
