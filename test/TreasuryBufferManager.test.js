import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("Treasury Safety Buffers & Commitment Manager", function () {
  let mockUSDC;
  let payroll;
  let bufferManager;
  let owner;
  let employer;
  let employee1;
  let employee2;

  beforeEach(async function () {
    [owner, employer, employee1, employee2] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy StreamingPayroll
    const StreamingPayroll = await ethers.getContractFactory("StreamingPayroll");
    payroll = await StreamingPayroll.deploy(await mockUSDC.getAddress());
    await payroll.waitForDeployment();

    // Deploy TreasuryBufferManager
    const TreasuryBufferManager = await ethers.getContractFactory("TreasuryBufferManager");
    bufferManager = await TreasuryBufferManager.deploy(await mockUSDC.getAddress());
    await bufferManager.waitForDeployment();

    // Setup relationships
    await bufferManager.setPayrollContract(await payroll.getAddress());
    await payroll.setTreasuryBufferManager(await bufferManager.getAddress());

    // Mint USDC and approve for employer
    await mockUSDC.mint(employer.address, ethers.parseUnits("10000000", 6));
    await mockUSDC.connect(employer).approve(await payroll.getAddress(), ethers.parseUnits("10000000", 6));
    await mockUSDC.connect(employer).approve(await bufferManager.getAddress(), ethers.parseUnits("10000000", 6));
  });

  it("should allow employers to deposit and withdraw buffer funds", async function () {
    const depositAmount = ethers.parseUnits("5000", 6);
    await expect(bufferManager.connect(employer).depositBuffer(depositAmount))
      .to.emit(bufferManager, "BufferDeposited")
      .withArgs(employer.address, depositAmount);

    expect(await bufferManager.employerBuffers(employer.address)).to.equal(depositAmount);

    const withdrawAmount = ethers.parseUnits("2000", 6);
    await expect(bufferManager.connect(employer).withdrawBuffer(withdrawAmount))
      .to.emit(bufferManager, "BufferWithdrawn")
      .withArgs(employer.address, withdrawAmount);

    expect(await bufferManager.employerBuffers(employer.address)).to.equal(depositAmount - withdrawAmount);
  });

  it("should track commitments and warn when balance falls below monthly commitment", async function () {
    // Flow rate = 1 USDC/sec (2,592,000 monthly commitment)
    const flowRate = ethers.parseUnits("1", 6);
    const totalCap = ethers.parseUnits("5000", 6);

    // Initial buffer = 1,000,000 USDC
    await bufferManager.connect(employer).depositBuffer(ethers.parseUnits("1000000", 6));

    // Create stream
    const tx = await payroll.connect(employer).createStream(employee1.address, flowRate, totalCap);
    const receipt = await tx.wait();
    
    // Parse streamId from event
    const filter = payroll.filters.StreamCreated;
    const events = await payroll.queryFilter(filter, receipt.blockNumber);
    const streamId = events[0].args.streamId;

    // Monthly commitment should be 1 USDC * 2,592,000 = 2,592,000 USDC
    const expectedCommitment = flowRate * 2592000n;
    expect(await bufferManager.totalMonthlyCommitment(employer.address)).to.equal(expectedCommitment);

    // Under 1,000,000 USDC balance, warning state should be true because buffer < commitment (2,592,000)
    expect(await bufferManager.isWarningState(employer.address)).to.be.true;
    expect(await bufferManager.getDaysCovered(employer.address)).to.equal((ethers.parseUnits("1000000", 6) * 30n) / expectedCommitment);

    // Deposit more buffer to clear warning state: 2,000,000 USDC more (total 3,000,000 USDC)
    await bufferManager.connect(employer).depositBuffer(ethers.parseUnits("2000000", 6));
    expect(await bufferManager.isWarningState(employer.address)).to.be.false;
    expect(await bufferManager.getDaysCovered(employer.address)).to.be.greaterThanOrEqual(30);
  });

  it("should restrict stream creation and claims during a warning state based on priority", async function () {
    const flowRate = ethers.parseUnits("0.5", 6); // 1,296,000 USDC monthly commitment
    const totalCap = ethers.parseUnits("5000", 6);

    // Initial buffer = 100 USDC (warning state triggers immediately)
    await bufferManager.connect(employer).depositBuffer(ethers.parseUnits("100", 6));

    // Create a stream first while warning state is false (commitment starts at 0, buffer is 100)
    expect(await bufferManager.isWarningState(employer.address)).to.be.false;

    const tx1 = await payroll.connect(employer).createStream(employee1.address, flowRate, totalCap);
    const receipt1 = await tx1.wait();
    const events1 = await payroll.queryFilter(payroll.filters.StreamCreated, receipt1.blockNumber);
    const streamId1 = events1[0].args.streamId;

    // Now commitment is 1,296,000 USDC, buffer is 100 USDC -> Warning State is true!
    expect(await bufferManager.isWarningState(employer.address)).to.be.true;

    // Attempting to create another stream should revert
    await expect(
      payroll.connect(employer).createStream(employee2.address, flowRate, totalCap)
    ).to.be.revertedWith("BufferManager: Warning state - stream creation restricted");

    // Fast forward time to build up claimable balance
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine");

    // Attempting to withdraw for employee1 (default priority 0) should revert during warning state
    await expect(
      payroll.connect(employee1).withdrawFunds(streamId1)
    ).to.be.revertedWith("BufferManager: Stream claims restricted - priority roles first");

    // Upgrade stream priority to 1 (Key Role)
    await bufferManager.connect(employer).setStreamPriority(streamId1, 1);

    // Claim should now succeed!
    await expect(payroll.connect(employee1).withdrawFunds(streamId1)).to.emit(payroll, "FundsWithdrawn");

    // Restoring buffer clears warning and standard claims work again
    await bufferManager.connect(employer).depositBuffer(ethers.parseUnits("5000000", 6));
    expect(await bufferManager.isWarningState(employer.address)).to.be.false;

    // Create a new stream now succeeds
    const tx2 = await payroll.connect(employer).createStream(employee2.address, flowRate, totalCap);
    const receipt2 = await tx2.wait();
    const events2 = await payroll.queryFilter(payroll.filters.StreamCreated, receipt2.blockNumber);
    const streamId2 = events2[0].args.streamId;

    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine");

    // Standard stream (priority 0) claim succeeds
    await expect(payroll.connect(employee2).withdrawFunds(streamId2)).to.emit(payroll, "FundsWithdrawn");
  });

  it("should remove commitments when streams are cancelled", async function () {
    const flowRate = ethers.parseUnits("0.2", 6); // 518,400 USDC monthly commitment
    const totalCap = ethers.parseUnits("1000", 6);

    const tx = await payroll.connect(employer).createStream(employee1.address, flowRate, totalCap);
    const receipt = await tx.wait();
    const events = await payroll.queryFilter(payroll.filters.StreamCreated, receipt.blockNumber);
    const streamId = events[0].args.streamId;

    expect(await bufferManager.totalMonthlyCommitment(employer.address)).to.equal(flowRate * 2592000n);

    // Cancel stream
    await payroll.connect(employer).cancelStream(streamId);
    expect(await bufferManager.totalMonthlyCommitment(employer.address)).to.equal(0);
  });
});
