import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("StreamingPayroll Batch Operations", function () {
    let mockUSDC;
    let streamingPayroll;
    let owner;
    let employee1;
    let employee2;
    let employee3;

    beforeEach(async function () {
        [owner, employee1, employee2, employee3] = await ethers.getSigners();

        // Deploy MockUSDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();
        await mockUSDC.waitForDeployment();

        // Deploy StreamingPayroll
        const StreamingPayroll = await ethers.getContractFactory("StreamingPayroll");
        streamingPayroll = await StreamingPayroll.deploy(await mockUSDC.getAddress());
        await streamingPayroll.waitForDeployment();

        // Mint and approve some USDC for owner (employer)
        await mockUSDC.approve(await streamingPayroll.getAddress(), ethers.MaxUint256);
    });

    it("should successfully create batch streams and verify aggregate lock", async function () {
        const employees = [employee1.address, employee2.address];
        const flowRates = [10, 20]; // 10 USDC/sec, 20 USDC/sec
        const totalCaps = [1000, 2000]; // Total 3000 USDC

        const initialOwnerBalance = await mockUSDC.balanceOf(owner.address);

        const tx = await streamingPayroll.createStreamsBatch(employees, flowRates, totalCaps);
        await tx.wait();

        const finalOwnerBalance = await mockUSDC.balanceOf(owner.address);
        expect(initialOwnerBalance - finalOwnerBalance).to.equal(3000n);

        const contractBalance = await mockUSDC.balanceOf(await streamingPayroll.getAddress());
        expect(contractBalance).to.equal(3000n);
    });

    it("should revert if input arrays have mismatched lengths", async function () {
        await expect(
            streamingPayroll.createStreamsBatch(
                [employee1.address, employee2.address],
                [10],
                [1000, 2000]
            )
        ).to.be.revertedWith("Mismatched input lengths");
    });

    it("should allow batch pausing and distribute accrued funds correctly", async function () {
        const employees = [employee1.address, employee2.address];
        const flowRates = [10, 20];
        const totalCaps = [1000, 2000];

        const tx = await streamingPayroll.createStreamsBatch(employees, flowRates, totalCaps);
        const receipt = await tx.wait();

        // Find the stream ids from logs or compute them
        // Let's compute them locally to match the contract hash
        const block = await ethers.provider.getBlock(receipt.blockNumber);
        const timestamp = block.timestamp;

        // hash parameter signature: (employer, employee, block.timestamp, index)
        const streamId1 = ethers.solidityPackedKeccak256(
            ["address", "address", "uint256", "uint256"],
            [owner.address, employee1.address, timestamp, 0n]
        );
        const streamId2 = ethers.solidityPackedKeccak256(
            ["address", "address", "uint256", "uint256"],
            [owner.address, employee2.address, timestamp, 1n]
        );

        // Increase time by 5 seconds
        await ethers.provider.send("evm_increaseTime", [5]);
        await ethers.provider.send("evm_mine");

        const initialBalance1 = await mockUSDC.balanceOf(employee1.address);
        const initialBalance2 = await mockUSDC.balanceOf(employee2.address);

        // Pause batch
        const pauseTx = await streamingPayroll.pauseStreamsBatch([streamId1, streamId2]);
        await pauseTx.wait();

        const finalBalance1 = await mockUSDC.balanceOf(employee1.address);
        const finalBalance2 = await mockUSDC.balanceOf(employee2.address);

        // Expect about 5 seconds of flow rate accrued
        // flowrate is 10 and 20 per second
        expect(finalBalance1 - initialBalance1).to.be.closeTo(50n, 10n);
        expect(finalBalance2 - initialBalance2).to.be.closeTo(100n, 20n);

        // Verify streams are marked inactive
        const stream1 = await streamingPayroll.streams(streamId1);
        const stream2 = await streamingPayroll.streams(streamId2);
        expect(stream1.isActive).to.be.false;
        expect(stream2.isActive).to.be.false;
    });

    it("should allow batch claiming by employees", async function () {
        const employees = [employee1.address, employee2.address];
        const flowRates = [10, 20];
        const totalCaps = [1000, 2000];

        const tx = await streamingPayroll.createStreamsBatch(employees, flowRates, totalCaps);
        const receipt = await tx.wait();

        const block = await ethers.provider.getBlock(receipt.blockNumber);
        const timestamp = block.timestamp;

        const streamId1 = ethers.solidityPackedKeccak256(
            ["address", "address", "uint256", "uint256"],
            [owner.address, employee1.address, timestamp, 0n]
        );

        // Increase time by 10 seconds
        await ethers.provider.send("evm_increaseTime", [10]);
        await ethers.provider.send("evm_mine");

        // Withdraw batch from employee 1 (only employee 1 can withdraw their stream)
        const initialBalance1 = await mockUSDC.balanceOf(employee1.address);
        const withdrawTx = await streamingPayroll.connect(employee1).withdrawFundsBatch([streamId1]);
        await withdrawTx.wait();

        const finalBalance1 = await mockUSDC.balanceOf(employee1.address);
        expect(finalBalance1 - initialBalance1).to.be.closeTo(100n, 20n);
    });
});
