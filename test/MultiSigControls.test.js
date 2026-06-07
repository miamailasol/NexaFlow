import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("Multi-Sig Controls", function () {
  let mockUSDC;
  let payroll;
  let owner;
  let signer2;
  let signer3;
  let employer;
  let employee;

  beforeEach(async function () {
    [owner, signer2, signer3, employer, employee] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy StreamingPayroll
    const StreamingPayroll = await ethers.getContractFactory("StreamingPayroll");
    payroll = await StreamingPayroll.deploy(await mockUSDC.getAddress());
    await payroll.waitForDeployment();

    // Set multi-sig signers: owner, signer2, signer3 with 2 required confirmations
    await payroll.setMultiSigSigners(
      [owner.address, signer2.address, signer3.address],
      2
    );

    // Deposit funds for employer
    await mockUSDC.mint(employer.address, ethers.parseUnits("200000", 6));
    await mockUSDC.connect(employer).approve(await payroll.getAddress(), ethers.parseUnits("200000", 6));
    await payroll.connect(employer).creditEmployerBalance(employer.address, ethers.parseUnits("150000", 6));
  });

  it("should initialize default multi-sig settings correctly", async function () {
    expect(await payroll.requiredConfirmations()).to.equal(2);
    expect(await payroll.isMultiSigSigner(owner.address)).to.be.true;
    expect(await payroll.isMultiSigSigner(signer2.address)).to.be.true;
    expect(await payroll.isMultiSigSigner(signer3.address)).to.be.true;
    expect(await payroll.isMultiSigSigner(employer.address)).to.be.false;
  });

  it("should allow a high-value stream cancellation only via multi-sig proposals", async function () {
    // Create standard stream: totalCap = 15000 USDC (high-value >= 10000 USDC)
    const flowRate = ethers.parseUnits("0.01", 6);
    const totalCap = ethers.parseUnits("15000", 6);
    
    const tx = await payroll.connect(employer)["createStream(address,uint256,uint256,string)"](
      employee.address,
      flowRate,
      totalCap,
      "SG"
    );
    const receipt = await tx.wait();
    const filter = payroll.filters.StreamCreated;
    const events = await payroll.queryFilter(filter, receipt.blockNumber);
    const streamId = events[0].args.streamId;

    // Standard cancelStream should revert
    await expect(
      payroll.connect(employer).cancelStream(streamId)
    ).to.be.revertedWith("High-value stream requires multi-sig proposal");

    // Propose cancellation
    const proposeTx = await payroll.connect(employer).proposeCancelStream(streamId);
    await proposeTx.wait();

    expect(await payroll.getProposalsCount()).to.equal(1);
    const proposal = await payroll.proposals(0);
    expect(proposal.actionType).to.equal("CANCEL_STREAM");
    expect(proposal.confirmationCount).to.equal(0); // Proposer employer is not a multi-sig signer

    // Signer 1 confirms
    await payroll.connect(owner).confirmProposal(0);
    expect((await payroll.proposals(0)).confirmationCount).to.equal(1);

    // Try executing with only 1 confirmation - should fail
    await expect(
      payroll.connect(owner).executeProposal(0)
    ).to.be.revertedWith("Insufficient confirmations");

    // Signer 2 confirms
    await payroll.connect(signer2).confirmProposal(0);
    expect((await payroll.proposals(0)).confirmationCount).to.equal(2);

    // Execute proposal
    await expect(
      payroll.connect(owner).executeProposal(0)
    ).to.emit(payroll, "ProposalExecuted").withArgs(0);

    // Stream should be inactive now
    const streamAfter = await payroll.streams(streamId);
    expect(streamAfter.isActive).to.be.false;
  });

  it("should cancel standard low-value streams immediately without proposal", async function () {
    // Create standard stream: totalCap = 50 USDC (< 10000 USDC)
    const flowRate = ethers.parseUnits("0.01", 6);
    const totalCap = ethers.parseUnits("50", 6);

    const tx = await payroll.connect(employer)["createStream(address,uint256,uint256,string)"](
      employee.address,
      flowRate,
      totalCap,
      "SG"
    );
    const receipt = await tx.wait();
    const filter = payroll.filters.StreamCreated;
    const events = await payroll.queryFilter(filter, receipt.blockNumber);
    const streamId = events[0].args.streamId;

    // Standard cancel should succeed immediately
    await expect(
      payroll.connect(employer).cancelStream(streamId)
    ).to.emit(payroll, "StreamCancelled");
  });

  it("should allow withdrawing leftover treasury funds via proposals", async function () {
    // Propose leftover withdraw of 100 USDC
    const proposeTx = await payroll.connect(employer).proposeWithdrawLeftover(ethers.parseUnits("100", 6));
    await proposeTx.wait();

    // Signers confirm proposal
    await payroll.connect(owner).confirmProposal(0);
    await payroll.connect(signer2).confirmProposal(0);

    // Execute withdrawal
    const balanceBefore = await mockUSDC.balanceOf(employer.address);
    await payroll.connect(owner).executeProposal(0);
    const balanceAfter = await mockUSDC.balanceOf(employer.address);

    expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("100", 6));
  });

  it("should allow setting payrollOracle address via proposals", async function () {
    // Propose setting payrollOracle to signer3
    const proposeTx = await payroll.connect(owner).proposeSetPayrollOracle(signer3.address);
    await proposeTx.wait();

    // Since owner proposed and is a signer, should auto-confirm to 1 count
    expect((await payroll.proposals(0)).confirmationCount).to.equal(1);

    // Signer 2 confirms
    await payroll.connect(signer2).confirmProposal(0);

    // Execute proposal
    await payroll.connect(owner).executeProposal(0);

    expect(await payroll.payrollOracle()).to.equal(signer3.address);
  });
});
