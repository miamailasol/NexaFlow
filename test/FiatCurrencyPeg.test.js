import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("Oracle-Based Fiat Currency Salary Pegs", function () {
    let mockUSDC, mockPriceFeedSGD, mockPriceFeedBRL, streamingPayroll;
    let owner, employer, employee, complianceRegistry, other;

    beforeEach(async function () {
        [owner, employer, employee, complianceRegistry, other] = await ethers.getSigners();

        // 1. Deploy Mock USDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();
        await mockUSDC.waitForDeployment();

        // 2. Deploy Mock SGD/USD Feed (1 USD = 1.35 SGD)
        const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
        mockPriceFeedSGD = await MockPriceFeed.deploy("USD/SGD Price Feed", 135000000n, 8); // 8 decimals, 1.35
        await mockPriceFeedSGD.waitForDeployment();

        // 3. Deploy Mock BRL/USD Feed (1 USD = 5.00 BRL)
        mockPriceFeedBRL = await MockPriceFeed.deploy("USD/BRL Price Feed", 500000000n, 8); // 8 decimals, 5.00
        await mockPriceFeedBRL.waitForDeployment();

        // 4. Deploy Streaming Payroll
        const StreamingPayroll = await ethers.getContractFactory("StreamingPayroll");
        streamingPayroll = await StreamingPayroll.deploy(await mockUSDC.getAddress());
        await streamingPayroll.waitForDeployment();

        // Set up Price Feeds on StreamingPayroll
        await streamingPayroll.setPriceFeed("SGD", await mockPriceFeedSGD.getAddress());
        await streamingPayroll.setPriceFeed("BRL", await mockPriceFeedBRL.getAddress());

        // Pre-fund employer with USDC
        await mockUSDC.mint(employer.address, ethers.parseUnits("1000", 6));
        await mockUSDC.connect(employer).approve(await streamingPayroll.getAddress(), ethers.parseUnits("1000", 6));
    });

    it("should allow configuration of price feeds by owner", async function () {
        expect(await streamingPayroll.priceFeeds("SGD")).to.equal(await mockPriceFeedSGD.getAddress());
        expect(await streamingPayroll.priceFeeds("BRL")).to.equal(await mockPriceFeedBRL.getAddress());

        // Owner changes price feed
        await streamingPayroll.setPriceFeed("SGD", other.address);
        expect(await streamingPayroll.priceFeeds("SGD")).to.equal(other.address);

        // Non-owner fails
        await expect(streamingPayroll.connect(other).setPriceFeed("NGN", other.address))
            .to.be.revertedWith("Only owner");
    });

    it("should allow participants to set fiat peg configurations", async function () {
        const flowRate = ethers.parseUnits("1.35", 6); // 1.35 SGD per second
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

        // Default should be empty string
        expect(await streamingPayroll.fiatPegs(streamId)).to.equal("");

        // Set to SGD
        await expect(streamingPayroll.connect(employee).setStreamFiatPeg(streamId, "SGD"))
            .to.emit(streamingPayroll, "FiatPegUpdated")
            .withArgs(streamId, "SGD");

        expect(await streamingPayroll.fiatPegs(streamId)).to.equal("SGD");

        // Fails with unsupported fiat currency
        await expect(streamingPayroll.connect(employee).setStreamFiatPeg(streamId, "NGN"))
            .to.be.revertedWith("Unsupported fiat currency feed");
    });

    it("should calculate getClaimableAmount correctly with exchange rate price shifts", async function () {
        // We set up a stream of 1.35 fiat units per second
        const flowRate = ethers.parseUnits("1.35", 6); 
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

        // Peg to SGD (1 USD = 1.35 SGD)
        await streamingPayroll.connect(employer).setStreamFiatPeg(streamId, "SGD");

        // Advance time by 10 seconds
        await ethers.provider.send("evm_increaseTime", [10]);
        await ethers.provider.send("evm_mine");

        const lastUpdated = (await streamingPayroll.streams(streamId)).lastUpdated;
        const currentBlock = await ethers.provider.getBlock("latest");
        const elapsed = BigInt(currentBlock.timestamp) - lastUpdated;

        // expected USDC: (elapsed * flowRate * 10^8) / (price)
        const expectedUSDC = (elapsed * flowRate * 100000000n) / 135000000n;
        const claimable = await streamingPayroll.getClaimableAmount(streamId);
        expect(claimable).to.equal(expectedUSDC);

        // Let's change the exchange rate to 1 USD = 2.70 SGD (representing a drop in SGD value)
        await mockPriceFeedSGD.updatePrice(270000000n);

        const newClaimable = await streamingPayroll.getClaimableAmount(streamId);
        const currentBlockNew = await ethers.provider.getBlock("latest");
        const elapsedNew = BigInt(currentBlockNew.timestamp) - lastUpdated;
        const expectedUSDCShifted = (elapsedNew * flowRate * 100000000n) / 270000000n;
        expect(newClaimable).to.equal(expectedUSDCShifted);
    });

    it("should withdraw correct amount under active fiat peg and withhold regional taxes", async function () {
        // Let's create a stream with BRL location (BR has 15% withholding tax)
        // 5.00 BRL per second flowRate
        const flowRate = ethers.parseUnits("5.00", 6);
        const totalCap = ethers.parseUnits("200", 6);

        const tx = await streamingPayroll.connect(employer)["createStream(address,uint256,uint256,string)"](
            employee.address,
            flowRate,
            totalCap,
            "BR"
        );
        const receipt = await tx.wait();
        const event = receipt.logs
            .map((log) => {
                try { return streamingPayroll.interface.parseLog(log); } catch (e) { return null; }
            })
            .find((e) => e && e.name === "StreamCreated");
        const streamId = event.args.streamId;

        // Peg to BRL (1 USD = 5.00 BRL)
        await streamingPayroll.connect(employee).setStreamFiatPeg(streamId, "BRL");

        // Advance time by 20 seconds
        await ethers.provider.send("evm_increaseTime", [20]);
        await ethers.provider.send("evm_mine");

        // 20 sec * 5 BRL/sec = 100 BRL accrued.
        // 100 BRL / 5.00 BRL/USD = 20 USDC.
        // Let's claim
        const beforeUSDC = await mockUSDC.balanceOf(employee.address);
        const beforeTaxAuthority = await mockUSDC.balanceOf("0x9e71a3371987d6f26D8251E18a8FdcB59296556e");

        const withdrawTx = await streamingPayroll.connect(employee).withdrawFunds(streamId);
        const withdrawReceipt = await withdrawTx.wait();

        const withdrawEvent = withdrawReceipt.logs
            .map((log) => {
                try { return streamingPayroll.interface.parseLog(log); } catch (e) { return null; }
            })
            .find((e) => e && e.name === "FundsWithdrawn");
        
        const claimableUSDC = withdrawEvent.args.amount;
        
        // Let's check matching amounts
        // 15% tax withheld
        const expectedTax = (claimableUSDC * 1500n) / 10000n;
        const expectedNet = claimableUSDC - expectedTax;

        const afterUSDC = await mockUSDC.balanceOf(employee.address);
        const afterTaxAuthority = await mockUSDC.balanceOf("0x9e71a3371987d6f26D8251E18a8FdcB59296556e");

        expect(afterUSDC - beforeUSDC).to.equal(expectedNet);
        expect(afterTaxAuthority - beforeTaxAuthority).to.equal(expectedTax);
    });
});
