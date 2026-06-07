import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("Co-op Mutual Pool Staking & Underwriting", function () {
    let mockUSDC;
    let mockYieldVault;
    let microBenefitsVault;
    let streamingPayroll;
    let owner;
    let employee;
    let lp1;
    let lp2;
    let provider;
    let verifier;

    beforeEach(async function () {
        [owner, employee, lp1, lp2, provider, verifier] = await ethers.getSigners();

        // 1. Deploy Mock USDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();
        await mockUSDC.waitForDeployment();
        const usdcAddr = await mockUSDC.getAddress();

        // 2. Deploy MockYieldVault
        const MockYieldVault = await ethers.getContractFactory("MockYieldVault");
        mockYieldVault = await MockYieldVault.deploy(usdcAddr);
        await mockYieldVault.waitForDeployment();
        const yieldVaultAddr = await mockYieldVault.getAddress();

        // 3. Deploy MicroBenefitsVault
        const MicroBenefitsVault = await ethers.getContractFactory("MicroBenefitsVault");
        microBenefitsVault = await MicroBenefitsVault.deploy(usdcAddr, verifier.address, yieldVaultAddr);
        await microBenefitsVault.waitForDeployment();
        const vaultAddr = await microBenefitsVault.getAddress();

        // 4. Deploy StreamingPayroll
        const StreamingPayroll = await ethers.getContractFactory("StreamingPayroll");
        streamingPayroll = await StreamingPayroll.deploy(usdcAddr);
        await streamingPayroll.waitForDeployment();
        const payrollAddr = await streamingPayroll.getAddress();

        // 5. Connect contracts
        await streamingPayroll.setBenefitsVault(vaultAddr);

        // 6. Register member
        await microBenefitsVault.registerMember(employee.address);

        // 7. Fund LPs and Employee
        await mockUSDC.transfer(lp1.address, ethers.parseUnits("1000", 6));
        await mockUSDC.transfer(lp2.address, ethers.parseUnits("1000", 6));
        await mockUSDC.transfer(employee.address, ethers.parseUnits("1000", 6));

        // Approvals
        await mockUSDC.connect(lp1).approve(vaultAddr, ethers.MaxUint256);
        await mockUSDC.connect(lp2).approve(vaultAddr, ethers.MaxUint256);
        await mockUSDC.connect(employee).approve(vaultAddr, ethers.MaxUint256);
        await mockUSDC.connect(owner).approve(payrollAddr, ethers.MaxUint256);
    });

    it("should allow LPs to stake USDC and mint coop shares", async function () {
        const stakeAmt = ethers.parseUnits("100", 6);
        
        // Stake LP1
        await expect(microBenefitsVault.connect(lp1).stakeInCoop(stakeAmt))
            .to.emit(microBenefitsVault, "CoopStaked")
            .withArgs(lp1.address, stakeAmt, stakeAmt);

        expect(await microBenefitsVault.coopShares(lp1.address)).to.equal(stakeAmt);
        expect(await microBenefitsVault.totalCoopShares()).to.equal(stakeAmt);
        expect(await microBenefitsVault.insuranceCoopTreasury()).to.equal(stakeAmt);
    });

    it("should mint proportional shares when pool size changes", async function () {
        const stake1 = ethers.parseUnits("100", 6);
        const stake2 = ethers.parseUnits("200", 6);

        await microBenefitsVault.connect(lp1).stakeInCoop(stake1);
        
        // Pool is now 100 USDC, 100 shares. LP2 stakes 200 USDC.
        // Shares minted = 200 * 100 / 100 = 200 shares.
        await microBenefitsVault.connect(lp2).stakeInCoop(stake2);

        expect(await microBenefitsVault.coopShares(lp2.address)).to.equal(stake2);
        expect(await microBenefitsVault.totalCoopShares()).to.equal(stake1 + stake2);
        expect(await microBenefitsVault.insuranceCoopTreasury()).to.equal(stake1 + stake2);
    });

    it("should allow LPs to unstake and redeem pro-rata value", async function () {
        const stakeAmt = ethers.parseUnits("100", 6);
        await microBenefitsVault.connect(lp1).stakeInCoop(stakeAmt);

        const initialBalance = await mockUSDC.balanceOf(lp1.address);
        
        await expect(microBenefitsVault.connect(lp1).unstakeInCoop(stakeAmt))
            .to.emit(microBenefitsVault, "CoopUnstaked")
            .withArgs(lp1.address, stakeAmt, stakeAmt);

        const finalBalance = await mockUSDC.balanceOf(lp1.address);
        expect(finalBalance - initialBalance).to.equal(stakeAmt);
        expect(await microBenefitsVault.coopShares(lp1.address)).to.equal(0n);
        expect(await microBenefitsVault.totalCoopShares()).to.equal(0n);
    });

    it("should route 2% co-op fee from StreamingPayroll stream claims to the vault", async function () {
        // Create payroll stream for employee
        const flowRate = ethers.parseUnits("10", 6); // 10 USDC/sec
        const totalCap = ethers.parseUnits("500", 6); // 500 USDC
        
        const tx = await streamingPayroll.createStream(employee.address, flowRate, totalCap);
        const receipt = await tx.wait();

        const block = await ethers.provider.getBlock(receipt.blockNumber);
        const timestamp = block.timestamp;
        const streamId = ethers.solidityPackedKeccak256(
            ["address", "address", "uint256"],
            [owner.address, employee.address, timestamp]
        );

        // Increase time by 20 seconds -> 200 USDC accrued
        await ethers.provider.send("evm_increaseTime", [20]);
        await ethers.provider.send("evm_mine");

        const initialVaultCoop = await microBenefitsVault.insuranceCoopTreasury();
        const initialEmployeeBal = await mockUSDC.balanceOf(employee.address);

        // Withdraw funds
        const withdrawTx = await streamingPayroll.connect(employee).withdrawFunds(streamId);
        await withdrawTx.wait();

        const stream = await streamingPayroll.streams(streamId);
        const actualClaimed = stream.accruedPaid;
        const expectedFee = (actualClaimed * 2n) / 100n;
        const expectedEmployeePayout = actualClaimed - expectedFee;

        // 2% of actual claimable is routed to benefits vault co-op treasury
        const finalVaultCoop = await microBenefitsVault.insuranceCoopTreasury();
        expect(finalVaultCoop - initialVaultCoop).to.equal(expectedFee);

        // Employee receives actual claimable - fee
        const finalEmployeeBal = await mockUSDC.balanceOf(employee.address);
        expect(finalEmployeeBal - initialEmployeeBal).to.equal(expectedEmployeePayout);
    });

    it("should absorb personal HSA deficits from the co-op mutual pool and distribute LP value drop", async function () {
        // Stake LP1 with 500 USDC
        await microBenefitsVault.connect(lp1).stakeInCoop(ethers.parseUnits("500", 6));

        // Deposit contribution for employee
        // Health: 100 USDC (80 USDC to personal HSA balance, 20 USDC to co-op pool buffer)
        await microBenefitsVault.connect(employee).depositContribution(
            employee.address,
            ethers.parseUnits("100", 6),
            0,
            0
        );

        // Personal health balance: 100 USDC
        // Co-op treasury: 500 (LP1) + 20 (deposit buffer) = 520 USDC
        expect(await microBenefitsVault.insuranceCoopTreasury()).to.equal(ethers.parseUnits("520", 6));

        // Verifier signs a health claim of 300 USDC (exceeds personal HSA balance of 100 USDC by 200 USDC)
        const claimAmt = ethers.parseUnits("300", 6);
        const claimHash = ethers.id("surgery invoice");
        const nonce = 5566n;

        const domain = {
            name: "NexaFlow",
            version: "1",
            chainId: (await ethers.provider.getNetwork()).chainId,
            verifyingContract: await microBenefitsVault.getAddress()
        };

        const types = {
            ClaimDetails: [
                { name: "member", type: "address" },
                { name: "serviceProvider", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "claimType", type: "string" },
                { name: "claimHash", type: "bytes32" },
                { name: "nonce", type: "uint256" }
            ]
        };

        const details = {
            member: employee.address,
            serviceProvider: provider.address,
            amount: claimAmt,
            claimType: "HEALTH",
            claimHash: claimHash,
            nonce: nonce
        };

        const signature = await verifier.signTypedData(domain, types, details);

        // Process claim
        const initialCoopBalance = await microBenefitsVault.insuranceCoopTreasury();
        await expect(microBenefitsVault.connect(employee).processClaim(details, signature))
            .to.emit(microBenefitsVault, "DeficitAbsorbed")
            .withArgs(employee.address, ethers.parseUnits("220", 6), ethers.parseUnits("300", 6));

        // Co-op treasury decreased by deficit of 220 USDC to 300 USDC
        expect(await microBenefitsVault.insuranceCoopTreasury()).to.equal(ethers.parseUnits("300", 6));

        // LP1's shares (500 shares) are now redeemable for:
        // (500 * 300) / 500 = 300 USDC (value dropped due to underwriting loss)
        const initialLpBal = await mockUSDC.balanceOf(lp1.address);
        await microBenefitsVault.connect(lp1).unstakeInCoop(ethers.parseUnits("500", 6));
        const finalLpBal = await mockUSDC.balanceOf(lp1.address);
        
        expect(finalLpBal - initialLpBal).to.equal(ethers.parseUnits("300", 6));
    });
});
