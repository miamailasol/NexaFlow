import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("Paymaster Rules Manager", function () {
  let mockUSDC;
  let payroll;
  let paymaster;
  let rulesManager;
  let owner;
  let employer;
  let worker1;
  let worker2;

  beforeEach(async function () {
    [owner, employer, worker1, worker2] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy StreamingPayroll
    const StreamingPayroll = await ethers.getContractFactory("StreamingPayroll");
    payroll = await StreamingPayroll.deploy(await mockUSDC.getAddress());
    await payroll.waitForDeployment();

    // Deploy NexaPaymaster
    const NexaPaymaster = await ethers.getContractFactory("NexaPaymaster");
    paymaster = await NexaPaymaster.deploy(await mockUSDC.getAddress(), await payroll.getAddress());
    await paymaster.waitForDeployment();

    // Deploy PaymasterRulesManager
    const PaymasterRulesManager = await ethers.getContractFactory("PaymasterRulesManager");
    rulesManager = await PaymasterRulesManager.deploy();
    await rulesManager.waitForDeployment();

    // Connect them
    await paymaster.setPaymasterRulesManager(await rulesManager.getAddress());
    await rulesManager.setPaymaster(await paymaster.getAddress());

    // Mint and Deposit Sponsor funds
    await mockUSDC.mint(employer.address, ethers.parseUnits("1000", 6));
    await mockUSDC.connect(employer).approve(await paymaster.getAddress(), ethers.parseUnits("1000", 6));
    await paymaster.connect(employer).depositSponsor(ethers.parseUnits("100", 6));
  });

  it("should allow owner to configure gas rules per worker", async function () {
    const maxTx = 5;
    const maxGas = ethers.parseUnits("100", 9); // 100 gwei

    await expect(rulesManager.setWorkerRule(worker1.address, maxTx, maxGas))
      .to.emit(rulesManager, "RuleUpdated")
      .withArgs(worker1.address, maxTx, maxGas);

    const rule = await rulesManager.workerRules(worker1.address);
    expect(rule.maxTxPerMonth).to.equal(maxTx);
    expect(rule.maxGasPrice).to.equal(maxGas);
    expect(rule.txCountThisMonth).to.equal(0);
    expect(rule.totalGasPaidUSDC).to.equal(0);
  });

  it("should validate UserOperation against configured rules", async function () {
    const maxTx = 2;
    const maxGas = ethers.parseUnits("50", 9); // 50 gwei
    await rulesManager.setWorkerRule(worker1.address, maxTx, maxGas);

    // Mock a UserOperation struct passing the checks
    const validOp = {
      sender: worker1.address,
      nonce: 0,
      initCode: "0x",
      callData: "0x",
      callGasLimit: 100000,
      verificationGasLimit: 100000,
      preVerificationGasLimit: 100000,
      maxFeePerGas: ethers.parseUnits("30", 9), // 30 gwei (less than maxGas)
      maxPriorityFeePerGas: ethers.parseUnits("2", 9),
      paymasterAndData: "0x",
      signature: "0x"
    };

    expect(await rulesManager.validatePaymasterUserOp(validOp)).to.be.true;

    // Mock an invalid UserOperation (high gas price)
    const expensiveOp = { ...validOp, maxFeePerGas: ethers.parseUnits("60", 9) };
    await expect(rulesManager.validatePaymasterUserOp(expensiveOp))
      .to.be.revertedWith("PaymasterRules: gas price exceeds limit");

    // Increment transaction count to simulate reaching limit
    await rulesManager.recordGasUsage(worker1.address, 500); // Tx 1
    await rulesManager.recordGasUsage(worker1.address, 500); // Tx 2

    // Third Tx should fail
    await expect(rulesManager.validatePaymasterUserOp(validOp))
      .to.be.revertedWith("PaymasterRules: monthly transaction limit exceeded");
  });

  it("should enforce limits during sponsored claims in NexaPaymaster", async function () {
    // Deploy a mock worker smart account that paymaster can execute calls through
    const PasskeyAccount = await ethers.getContractFactory("PasskeyAccount");
    // Deploy a simple passkey account (using owner address as verifier)
    const smartAccount = await PasskeyAccount.deploy(owner.address);
    await smartAccount.waitForDeployment();
    
    // Initialize the smart account
    await smartAccount.initialize(
      ethers.zeroPadValue("0x01", 32),
      0,
      0,
      await paymaster.getAddress()
    );

    // Create stream on payroll for this worker
    await mockUSDC.mint(employer.address, ethers.parseUnits("500", 6));
    await mockUSDC.connect(employer).approve(await payroll.getAddress(), ethers.parseUnits("500", 6));
    
    const flowRate = ethers.parseUnits("0.1", 6);
    const totalCap = ethers.parseUnits("100", 6);
    const createTx = await payroll.connect(employer).createStream(
      await smartAccount.getAddress(),
      flowRate,
      totalCap
    );
    const receipt = await createTx.wait();
    const filter = payroll.filters.StreamCreated;
    const events = await payroll.queryFilter(filter, receipt.blockNumber);
    const streamId = events[0].args.streamId;

    // Set rule: Max 1 transaction
    await rulesManager.setWorkerRule(await smartAccount.getAddress(), 1, ethers.parseUnits("100", 9));

    // Prepare claim calldata: withdrawFunds(streamId)
    const payrollInterface = payroll.interface;
    const claimData = payrollInterface.encodeFunctionData("withdrawFunds", [streamId]);

    // Execute first sponsored claim - should succeed
    await expect(
      paymaster.connect(employer).sponsorWithdrawal(
        await smartAccount.getAddress(),
        await payroll.getAddress(),
        claimData,
        streamId
      )
    ).to.emit(paymaster, "OperationSponsored");

    // Total sponsored should be incremented
    expect(await paymaster.totalSponsored()).to.equal(1);
    
    // Usage counts should be recorded on the rules manager
    const ruleAfter = await rulesManager.workerRules(await smartAccount.getAddress());
    expect(ruleAfter.txCountThisMonth).to.equal(1);
    expect(ruleAfter.totalGasPaidUSDC).to.equal(500); // default gas cost is 500 (0.0005 USDC)

    // Execute second sponsored claim - should revert because limit is 1
    await expect(
      paymaster.connect(employer).sponsorWithdrawal(
        await smartAccount.getAddress(),
        await payroll.getAddress(),
        claimData,
        streamId
      )
    ).to.be.revertedWith("NexaPaymaster: monthly transaction limit exceeded");
  });
});
