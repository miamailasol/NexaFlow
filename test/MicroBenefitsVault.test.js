import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("MicroBenefitsVault with ERC-4626 Vault", function () {
    let mockUSDC;
    let mockYieldVault;
    let microBenefitsVault;
    let owner;
    let employee;
    let provider;
    let verifier;

    beforeEach(async function () {
        [owner, employee, provider, verifier] = await ethers.getSigners();

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

        // 4. Fund and approve USDC for employee
        await mockUSDC.transfer(employee.address, ethers.parseUnits("1000", 6));
        await mockUSDC.connect(employee).approve(vaultAddr, ethers.MaxUint256);
        
        // Register member
        await microBenefitsVault.registerMember(employee.address);
    });

    it("should deploy correctly and map core assets", async function () {
        expect(await microBenefitsVault.usdcToken()).to.equal(await mockUSDC.getAddress());
        expect(await microBenefitsVault.yieldVault()).to.equal(await mockYieldVault.getAddress());
    });

    it("should split and deposit contributions to the yield vault", async function () {
        const healthAmt = ethers.parseUnits("100", 6);
        const pensionAmt = ethers.parseUnits("200", 6);
        const emergencyAmt = ethers.parseUnits("300", 6);

        const tx = await microBenefitsVault.connect(employee).depositContribution(
            employee.address,
            healthAmt,
            pensionAmt,
            emergencyAmt
        );
        await tx.wait();

        const member = await microBenefitsVault.members(employee.address);
        expect(member.healthInsuranceBalance).to.equal(healthAmt - (healthAmt * 20n / 100n));
        
        // Initial conversion multiplier is close to 1e18, so shares should be extremely close to assets
        expect(member.retirementShares).to.be.closeTo(pensionAmt, 10n);
        expect(member.emergencyShares).to.be.closeTo(emergencyAmt, 10n);

        // Check USDC holdings of the yield vault
        const yieldVaultUSDC = await mockUSDC.balanceOf(await mockYieldVault.getAddress());
        expect(yieldVaultUSDC).to.equal(pensionAmt + emergencyAmt);
    });

    it("should accrue interest dynamically over time", async function () {
        const pensionAmt = ethers.parseUnits("1000", 6);
        
        // Deposit pension only
        await microBenefitsVault.connect(employee).depositContribution(
            employee.address,
            0,
            pensionAmt,
            0
        );

        // Fast forward 1 year (31536000 seconds)
        await ethers.provider.send("evm_increaseTime", [31536000]);
        await ethers.provider.send("evm_mine");

        // Dynamic conversion calculation from vault
        const shares = (await microBenefitsVault.members(employee.address)).retirementShares;
        const liveAssets = await mockYieldVault.convertToAssets(shares);

        // Expect roughly 5% interest accrued
        const expectedAssets = (pensionAmt * 105n) / 100n;
        expect(liveAssets).to.be.closeTo(expectedAssets, ethers.parseUnits("1", 6));
    });

    it("should process claims by withdrawing from the ERC-4626 vault", async function () {
        const pensionAmt = ethers.parseUnits("500", 6);
        
        await microBenefitsVault.connect(employee).depositContribution(
            employee.address,
            0,
            pensionAmt,
            0
        );

        const providerInitialUSDC = await mockUSDC.balanceOf(provider.address);
        
        // Verifier signs a pension claim of 200 USDC
        const claimAmt = ethers.parseUnits("200", 6);
        const claimHash = ethers.id("some invoice details");
        const nonce = 12345n;

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
            claimType: "PENSION",
            claimHash: claimHash,
            nonce: nonce
        };

        const signature = await verifier.signTypedData(domain, types, details);

        // Process claim (can be submitted by anyone, e.g. employee)
        const tx = await microBenefitsVault.connect(employee).processClaim(
            details,
            signature
        );
        await tx.wait();

        // 1. Verify nonce reuse reverts
        await expect(
            microBenefitsVault.connect(employee).processClaim(details, signature)
        ).to.be.revertedWith("Nonce already used");

        // 2. Verify invalid signature signer reverts
        const badDetails = { ...details, nonce: 99999n };
        const badSignature = await employee.signTypedData(domain, types, badDetails);
        await expect(
            microBenefitsVault.connect(employee).processClaim(badDetails, badSignature)
        ).to.be.revertedWith("Invalid claim signature");


        // Provider receives exactly 200 USDC
        const providerFinalUSDC = await mockUSDC.balanceOf(provider.address);
        expect(providerFinalUSDC - providerInitialUSDC).to.equal(claimAmt);

        // Shares remaining should decrease
        const remainingShares = (await microBenefitsVault.members(employee.address)).retirementShares;
        expect(remainingShares).to.be.closeTo(pensionAmt - claimAmt, 10n);
    });
});
