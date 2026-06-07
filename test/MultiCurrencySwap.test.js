import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("Multi-Currency Real-Time Streaming Swaps", function () {
    let mockUSDC, mockEURC, mockSwapRouter, streamingPayroll;
    let owner, employer, employee, complianceRegistry, other;

    beforeEach(async function () {
        [owner, employer, employee, complianceRegistry, other] = await ethers.getSigners();

        // 1. Deploy Mock USDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();
        await mockUSDC.waitForDeployment();

        // 2. Deploy Mock EURC
        const MockEURC = await ethers.getContractFactory("MockEURC");
        mockEURC = await MockEURC.deploy();
        await mockEURC.waitForDeployment();

        // 3. Deploy Mock Swap Router
        const MockSwapRouter = await ethers.getContractFactory("MockSwapRouter");
        mockSwapRouter = await MockSwapRouter.deploy(await mockEURC.getAddress());
        await mockSwapRouter.waitForDeployment();

        // 4. Deploy Streaming Payroll
        const StreamingPayroll = await ethers.getContractFactory("StreamingPayroll");
        streamingPayroll = await StreamingPayroll.deploy(await mockUSDC.getAddress());
        await streamingPayroll.waitForDeployment();

        // Set configuration on StreamingPayroll
        await streamingPayroll.setSwapRouter(await mockSwapRouter.getAddress());
        await streamingPayroll.setEurcToken(await mockEURC.getAddress());

        // Pre-fund employer with USDC
        await mockUSDC.mint(employer.address, ethers.parseUnits("1000", 6));
        await mockUSDC.connect(employer).approve(await streamingPayroll.getAddress(), ethers.parseUnits("1000", 6));
    });

    it("should allow configuration of eurcToken and swapRouter by owner", async function () {
        expect(await streamingPayroll.eurcToken()).to.equal(await mockEURC.getAddress());
        expect(await streamingPayroll.swapRouter()).to.equal(await mockSwapRouter.getAddress());

        // Change config
        await streamingPayroll.setEurcToken(other.address);
        await streamingPayroll.setSwapRouter(other.address);

        expect(await streamingPayroll.eurcToken()).to.equal(other.address);
        expect(await streamingPayroll.swapRouter()).to.equal(other.address);
    });

    it("should allow employee to set their target payout token", async function () {
        const flowRate = 100; // 100 microUSDC per second
        const totalCap = ethers.parseUnits("100", 6);
        
        const tx = await streamingPayroll.connect(employer)["createStream(address,uint256,uint256,string)"](
            employee.address,
            flowRate,
            totalCap,
            "SG"
        );
        const receipt = await tx.wait();
        
        // Find streamCreated event to get streamId
        const event = receipt.logs
            .map((log) => {
                try { return streamingPayroll.interface.parseLog(log); } catch (e) { return null; }
            })
            .find((e) => e && e.name === "StreamCreated");
        const streamId = event.args.streamId;

        // Default should be address(0)
        expect(await streamingPayroll.targetPayoutTokens(streamId)).to.equal(ethers.ZeroAddress);

        // Employee sets target token to EURC
        await expect(streamingPayroll.connect(employee).setTargetPayoutToken(streamId, await mockEURC.getAddress()))
            .to.emit(streamingPayroll, "TargetPayoutTokenUpdated")
            .withArgs(streamId, await mockEURC.getAddress());

        expect(await streamingPayroll.targetPayoutTokens(streamId)).to.equal(await mockEURC.getAddress());

        // Employee sets it back to USDC
        await streamingPayroll.connect(employee).setTargetPayoutToken(streamId, await mockUSDC.getAddress());
        expect(await streamingPayroll.targetPayoutTokens(streamId)).to.equal(await mockUSDC.getAddress());

        // Rejects non-registered tokens
        await expect(streamingPayroll.connect(employee).setTargetPayoutToken(streamId, other.address))
            .to.be.revertedWith("Unsupported target token");
    });

    it("should execute swaps dynamically to EURC upon employee withdrawal", async function () {
        const flowRate = ethers.parseUnits("1", 6); // 1 USDC per second
        const totalCap = ethers.parseUnits("100", 6);

        const tx = await streamingPayroll.connect(employer)["createStream(address,uint256,uint256,string)"](
            employee.address,
            flowRate,
            totalCap,
            "SG"
        );
        const receipt = await tx.wait();
        const event = receipt.logs
            .map((log) => {
                try { return streamingPayroll.interface.parseLog(log); } catch (e) { return null; }
            })
            .find((e) => e && e.name === "StreamCreated");
        const streamId = event.args.streamId;

        // Employee configures payout to EURC
        await streamingPayroll.connect(employee).setTargetPayoutToken(streamId, await mockEURC.getAddress());

        // Advance time by 10 seconds
        await ethers.provider.send("evm_increaseTime", [10]);
        await ethers.provider.send("evm_mine");

        // Perform withdrawal
        const beforeUSDC = await mockUSDC.balanceOf(employee.address);
        const beforeEURC = await mockEURC.balanceOf(employee.address);

        const withdrawTx = await streamingPayroll.connect(employee).withdrawFunds(streamId);
        const withdrawReceipt = await withdrawTx.wait();

        // Parse exact claimable amount from the event
        const withdrawEvent = withdrawReceipt.logs
            .map((log) => {
                try { return streamingPayroll.interface.parseLog(log); } catch (e) { return null; }
            })
            .find((e) => e && e.name === "FundsWithdrawn");
        const actualClaimedUSDC = withdrawEvent.args.amount;

        const afterUSDC = await mockUSDC.balanceOf(employee.address);
        const afterEURC = await mockEURC.balanceOf(employee.address);

        // Employee should have received 0 additional USDC
        expect(afterUSDC).to.equal(beforeUSDC);

        // Employee should have received EURC at exchange rate (0.92)
        const expectedEURC = (actualClaimedUSDC * 92n) / 100n;
        expect(afterEURC - beforeEURC).to.equal(expectedEURC);

        // Router should have received the USDC from the stream
        expect(await mockUSDC.balanceOf(await mockSwapRouter.getAddress())).to.equal(actualClaimedUSDC);
    });

    it("should process batch swaps correctly", async function () {
        const flowRate = ethers.parseUnits("1", 6); // 1 USDC per second
        const totalCap = ethers.parseUnits("100", 6);

        // Create two streams
        const tx1 = await streamingPayroll.connect(employer)["createStream(address,uint256,uint256,string)"](employee.address, flowRate, totalCap, "SG");
        const receipt1 = await tx1.wait();
        const event1 = receipt1.logs
            .map((log) => {
                try { return streamingPayroll.interface.parseLog(log); } catch (e) { return null; }
            })
            .find((e) => e && e.name === "StreamCreated");
        const streamId1 = event1.args.streamId;

        const tx2 = await streamingPayroll.connect(employer)["createStream(address,uint256,uint256,string)"](employee.address, flowRate, totalCap, "SG");
        const receipt2 = await tx2.wait();
        const event2 = receipt2.logs
            .map((log) => {
                try { return streamingPayroll.interface.parseLog(log); } catch (e) { return null; }
            })
            .find((e) => e && e.name === "StreamCreated");
        const streamId2 = event2.args.streamId;

        // Set streamId1 to EURC, streamId2 remains USDC
        await streamingPayroll.connect(employee).setTargetPayoutToken(streamId1, await mockEURC.getAddress());

        // Advance time
        await ethers.provider.send("evm_increaseTime", [5]);
        await ethers.provider.send("evm_mine");

        const beforeUSDC = await mockUSDC.balanceOf(employee.address);
        const beforeEURC = await mockEURC.balanceOf(employee.address);

        // Claim batch
        const batchTx = await streamingPayroll.connect(employee).withdrawFundsBatch([streamId1, streamId2]);
        const batchReceipt = await batchTx.wait();

        // Parse exact claimable amounts from the events
        const withdrawEvents = batchReceipt.logs
            .map((log) => {
                try { return streamingPayroll.interface.parseLog(log); } catch (e) { return null; }
            })
            .filter((e) => e && e.name === "FundsWithdrawn");

        const actualClaimed1 = withdrawEvents.find((e) => e.args.streamId === streamId1).args.amount;
        const actualClaimed2 = withdrawEvents.find((e) => e.args.streamId === streamId2).args.amount;

        const afterUSDC = await mockUSDC.balanceOf(employee.address);
        const afterEURC = await mockEURC.balanceOf(employee.address);

        // Should have received USDC only for streamId2 (actualClaimed2)
        expect(afterUSDC - beforeUSDC).to.equal(actualClaimed2);

        // Should have received EURC for streamId1 (actualClaimed1 * 0.92)
        const expectedEURC1 = (actualClaimed1 * 92n) / 100n;
        expect(afterEURC - beforeEURC).to.equal(expectedEURC1);
    });

    it("should process private stream swaps to EURC correctly", async function () {
        const flowRate = ethers.parseUnits("1", 6); // 1 USDC per second
        const totalCap = ethers.parseUnits("100", 6);
        const salt = ethers.keccak256(ethers.toUtf8Bytes("random_salt_123"));
        
        // commitmentHash: keccak256(abi.encode(flowRate, totalCap, salt))
        const coder = new ethers.AbiCoder();
        const commitmentHash = ethers.keccak256(coder.encode(["uint256", "uint256", "bytes32"], [flowRate, totalCap, salt]));

        const tx = await streamingPayroll.connect(employer).createPrivateStream(
            employee.address,
            commitmentHash,
            totalCap
        );
        const receipt = await tx.wait();
        const event = receipt.logs
            .map((log) => {
                try { return streamingPayroll.interface.parseLog(log); } catch (e) { return null; }
            })
            .find((e) => e && e.name === "PrivateStreamCreated");
        const streamId = event.args.streamId;

        // Employee configures payout to EURC
        await streamingPayroll.connect(employee).setTargetPayoutToken(streamId, await mockEURC.getAddress());

        // Withdraw 10 USDC after 10 seconds, verified by oracle signature
        const claimableAmount = ethers.parseUnits("10", 6);
        const messageHash = ethers.solidityPackedKeccak256(
            ["bytes32", "uint256"],
            [streamId, claimableAmount]
        );

        // Sign with owner (default oracle)
        const signature = await owner.signMessage(ethers.toBeArray(messageHash));

        const beforeUSDC = await mockUSDC.balanceOf(employee.address);
        const beforeEURC = await mockEURC.balanceOf(employee.address);

        await streamingPayroll.connect(employee).withdrawPrivateFunds(
            streamId,
            claimableAmount,
            flowRate,
            salt,
            signature
        );

        const afterUSDC = await mockUSDC.balanceOf(employee.address);
        const afterEURC = await mockEURC.balanceOf(employee.address);

        // Received 0 USDC
        expect(afterUSDC).to.equal(beforeUSDC);

        // Received EURC: 10 * 0.92 = 9.2 EURC
        const expectedEURC = (claimableAmount * 92n) / 100n;
        expect(afterEURC - beforeEURC).to.equal(expectedEURC);
    });
});
