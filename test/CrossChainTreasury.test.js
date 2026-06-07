import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("CrossChainTreasury CCTP Ingestion", function () {
    let mockUSDC;
    let streamingPayroll;
    let mockMessageTransmitter;
    let crossChainTreasury;
    let owner;
    let employer;
    let employee;

    beforeEach(async function () {
        [owner, employer, employee] = await ethers.getSigners();

        // Deploy MockUSDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();
        await mockUSDC.waitForDeployment();

        // Deploy StreamingPayroll
        const StreamingPayroll = await ethers.getContractFactory("StreamingPayroll");
        streamingPayroll = await StreamingPayroll.deploy(await mockUSDC.getAddress());
        await streamingPayroll.waitForDeployment();

        // Deploy MockMessageTransmitter
        const MockMessageTransmitter = await ethers.getContractFactory("MockMessageTransmitter");
        mockMessageTransmitter = await MockMessageTransmitter.deploy(await mockUSDC.getAddress());
        await mockMessageTransmitter.waitForDeployment();

        // Deploy CrossChainTreasury
        const CrossChainTreasury = await ethers.getContractFactory("CrossChainTreasury");
        crossChainTreasury = await CrossChainTreasury.deploy(
            await mockUSDC.getAddress(),
            await mockMessageTransmitter.getAddress(),
            await streamingPayroll.getAddress()
        );
        await crossChainTreasury.waitForDeployment();

        // Fund MockMessageTransmitter with USDC so it can simulate bridge payout
        const fundAmount = ethers.parseUnits("100000", 6);
        await mockUSDC.transfer(await mockMessageTransmitter.getAddress(), fundAmount);
    });

    // Helper to build a CCTP message byte array
    function makeCctpMessage(recipient, amount, sender) {
        const bytes = new Uint8Array(256); // 256 bytes

        // Set recipient (offset 152 to 183)
        const recipientBytes = ethers.getBytes(recipient);
        bytes.set(recipientBytes, 152 + (32 - recipientBytes.length));

        // Set amount (offset 184 to 215)
        const amountHex = ethers.zeroPadValue(ethers.toBeHex(amount), 32);
        bytes.set(ethers.getBytes(amountHex), 184);

        // Set messageSender (offset 216 to 247)
        const senderBytes = ethers.getBytes(sender);
        bytes.set(senderBytes, 216 + (32 - senderBytes.length));

        return ethers.hexlify(bytes);
    }

    it("should successfully ingest CCTP message and credit employer balance in StreamingPayroll", async function () {
        const bridgeAmount = ethers.parseUnits("5000", 6);
        const recipientAddr = await crossChainTreasury.getAddress();
        const senderAddr = employer.address;

        const message = makeCctpMessage(recipientAddr, bridgeAmount, senderAddr);
        const attestation = ethers.hexlify(ethers.randomBytes(65)); // Dummy signature

        // Call claimUSDCFromBridge
        const tx = await crossChainTreasury.claimUSDCFromBridge(message, attestation);
        await tx.wait();

        // Verify StreamingPayroll got the USDC
        const payrollBalance = await mockUSDC.balanceOf(await streamingPayroll.getAddress());
        expect(payrollBalance).to.equal(bridgeAmount);

        // Verify employer balance is credited
        const employerBalance = await streamingPayroll.employerBalances(senderAddr);
        expect(employerBalance).to.equal(bridgeAmount);
    });

    it("should allow employer to create stream using pre-deposited balance without wallet transfer", async function () {
        const bridgeAmount = ethers.parseUnits("5000", 6);
        const recipientAddr = await crossChainTreasury.getAddress();
        const senderAddr = employer.address;

        const message = makeCctpMessage(recipientAddr, bridgeAmount, senderAddr);
        const attestation = ethers.hexlify(ethers.randomBytes(65));

        await crossChainTreasury.claimUSDCFromBridge(message, attestation);

        // Verify employer has 5000 USDC inside StreamingPayroll
        expect(await streamingPayroll.employerBalances(senderAddr)).to.equal(bridgeAmount);

        // Get initial employer USDC wallet balance (should not change after stream setup)
        const initialWalletBalance = await mockUSDC.balanceOf(senderAddr);

        // Set up stream: 10 USDC/sec, totalCap 3000 USDC (which is <= 5000)
        // Connected as employer
        const createTx = await streamingPayroll.connect(employer).createStream(
            employee.address,
            10n,
            ethers.parseUnits("3000", 6)
        );
        await createTx.wait();

        // Check employer's remaining pre-deposited balance
        const remainingBalance = await streamingPayroll.employerBalances(senderAddr);
        expect(remainingBalance).to.equal(ethers.parseUnits("2000", 6));

        // Check employer's wallet balance (should remain unchanged since it used the pre-deposited balance)
        const finalWalletBalance = await mockUSDC.balanceOf(senderAddr);
        expect(finalWalletBalance).to.equal(initialWalletBalance);
    });
});
