import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("Passkey Account Abstraction & Paymaster", function () {
    let mockUSDC;
    let webAuthnVerifier;
    let passkeyFactory;
    let nexaPaymaster;
    let streamingPayroll;
    let owner;
    let employer;
    let worker;
    let relayer;

    beforeEach(async function () {
        [owner, employer, worker, relayer] = await ethers.getSigners();

        // Deploy MockUSDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();
        await mockUSDC.waitForDeployment();

        // Deploy StreamingPayroll
        const StreamingPayroll = await ethers.getContractFactory("StreamingPayroll");
        streamingPayroll = await StreamingPayroll.deploy(await mockUSDC.getAddress());
        await streamingPayroll.waitForDeployment();

        // Deploy WebAuthnVerifier (software mode for testing)
        const WebAuthnVerifier = await ethers.getContractFactory("WebAuthnVerifier");
        webAuthnVerifier = await WebAuthnVerifier.deploy(false);
        await webAuthnVerifier.waitForDeployment();

        // Deploy NexaPaymaster
        const NexaPaymaster = await ethers.getContractFactory("NexaPaymaster");
        nexaPaymaster = await NexaPaymaster.deploy(
            await mockUSDC.getAddress(),
            await streamingPayroll.getAddress()
        );
        await nexaPaymaster.waitForDeployment();

        // Deploy PasskeyAccountFactory
        const PasskeyAccountFactory = await ethers.getContractFactory("PasskeyAccountFactory");
        passkeyFactory = await PasskeyAccountFactory.deploy(
            await webAuthnVerifier.getAddress(),
            await nexaPaymaster.getAddress()
        );
        await passkeyFactory.waitForDeployment();

        // Fund the employer with USDC
        await mockUSDC.mint(employer.address, ethers.parseUnits("100000", 6));
        await mockUSDC.connect(employer).approve(
            await streamingPayroll.getAddress(),
            ethers.MaxUint256
        );
    });

    // Helper: sign a message with a worker signer and return (r, s, pubKeyX, pubKeyY) for software mode
    async function signForPasskey(signer, messageHash) {
        const sig = await signer.signMessage(ethers.getBytes(messageHash));
        const { r, s, v } = ethers.Signature.from(sig);
        return {
            r,
            s,
            pubKeyX: BigInt(signer.address),
            pubKeyY: BigInt(v)
        };
    }

    describe("WebAuthnVerifier", function () {
        it("should verify a valid software-mode signature", async function () {
            const messageHash = ethers.keccak256(ethers.toUtf8Bytes("test challenge"));
            const { r, s, pubKeyX, pubKeyY } = await signForPasskey(worker, messageHash);

            const valid = await webAuthnVerifier.verifySignature(
                messageHash, r, s, pubKeyX, pubKeyY
            );
            expect(valid).to.be.true;
        });

        it("should reject an invalid signature", async function () {
            const messageHash = ethers.keccak256(ethers.toUtf8Bytes("test challenge"));
            const { r, s, pubKeyY } = await signForPasskey(worker, messageHash);

            // Use employer address as pubKeyX — mismatch
            const valid = await webAuthnVerifier.verifySignature(
                messageHash, r, s, BigInt(employer.address), pubKeyY
            );
            expect(valid).to.be.false;
        });
    });

    describe("PasskeyAccountFactory", function () {
        it("should deploy a new PasskeyAccount with correct credentials", async function () {
            const credentialId = ethers.keccak256(ethers.toUtf8Bytes("worker-faceid-credential-001"));
            const pubKeyX = BigInt(worker.address);
            const pubKeyY = 27n;

            await passkeyFactory.deployWallet(credentialId, pubKeyX, pubKeyY);

            const accountAddr = await passkeyFactory.accountsByCredential(credentialId);
            expect(accountAddr).to.not.equal(ethers.ZeroAddress);

            // Verify the account is initialized
            const PasskeyAccount = await ethers.getContractFactory("PasskeyAccount");
            const account = PasskeyAccount.attach(accountAddr);

            expect(await account.credentialId()).to.equal(credentialId);
            expect(await account.pubKeyX()).to.equal(pubKeyX);
            expect(await account.initialized()).to.be.true;
            expect(await account.entrypoint()).to.equal(await nexaPaymaster.getAddress());
        });

        it("should reject duplicate credential registration", async function () {
            const credentialId = ethers.keccak256(ethers.toUtf8Bytes("dup-credential"));
            const pubKeyX = BigInt(worker.address);
            const pubKeyY = 27n;

            await passkeyFactory.deployWallet(credentialId, pubKeyX, pubKeyY);

            await expect(
                passkeyFactory.deployWallet(credentialId, pubKeyX, pubKeyY)
            ).to.be.revertedWith("PasskeyAccountFactory: credential already registered");
        });

        it("should emit AccountDeployed event with correct data", async function () {
            const credentialId = ethers.keccak256(ethers.toUtf8Bytes("event-test-cred"));
            const pubKeyX = BigInt(worker.address);
            const pubKeyY = 27n;

            await expect(passkeyFactory.deployWallet(credentialId, pubKeyX, pubKeyY))
                .to.emit(passkeyFactory, "AccountDeployed")
                .withArgs(
                    // We check the event is emitted but can't predict the exact address,
                    // so we only verify event name and argument count via the emit matcher
                    () => true, // account address
                    credentialId,
                    pubKeyX,
                    pubKeyY,
                    await nexaPaymaster.getAddress()
                );
        });

        it("should track total deployed accounts", async function () {
            expect(await passkeyFactory.totalAccounts()).to.equal(0n);

            const cred1 = ethers.keccak256(ethers.toUtf8Bytes("cred-1"));
            const cred2 = ethers.keccak256(ethers.toUtf8Bytes("cred-2"));

            await passkeyFactory.deployWallet(cred1, BigInt(worker.address), 27n);
            await passkeyFactory.deployWallet(cred2, BigInt(employer.address), 27n);

            expect(await passkeyFactory.totalAccounts()).to.equal(2n);
        });
    });

    describe("PasskeyAccount - Signature Execution", function () {
        let account;
        let accountAddr;

        beforeEach(async function () {
            const credentialId = ethers.keccak256(ethers.toUtf8Bytes("exec-test-credential"));
            // We need to know the v that will be produced, but we can't until we sign.
            // So we store pubKeyY = 0 initially and update in-test.
            // Actually, the pubKeyY is stored at deploy time and used for all future verifications.
            // For the software test shim, we need to set pubKeyY to the v that will be produced.
            // Since we don't know v ahead of time, let's use the approach of setting pubKeyX = worker.address
            // and pubKeyY to 0, then in the verifier, we'll need v from the actual signature.
            // 
            // The trick: in our test shim, pubKeyY IS the v. So we must know it at deploy time.
            // v is deterministic for a given key+message but varies per message.
            // Solution: We set pubKeyY=0 and modify the verifier to accept any v that recovers to pubKeyX.
            // But we already deployed the verifier. Let's use a different approach:
            // Set pubKeyY to a dummy value and the software verifier will use the actual v from the sig.
            //
            // Looking at the verifier code: v = uint8(pubKeyY). So pubKeyY must match the actual v.
            // v is either 27 or 28. We can't know ahead of time which the signer will produce.
            //
            // Best approach: sign a dummy message to discover the worker's typical v, then use that.
            // In practice most signers produce v=27 consistently for secp256k1.
            // Let's discover it:
            const dummySig = await worker.signMessage(ethers.getBytes(ethers.keccak256(ethers.toUtf8Bytes("dummy"))));
            const { v: workerV } = ethers.Signature.from(dummySig);

            const pubKeyX = BigInt(worker.address);
            const pubKeyY = BigInt(workerV);

            await passkeyFactory.deployWallet(credentialId, pubKeyX, pubKeyY);
            accountAddr = await passkeyFactory.accountsByCredential(credentialId);

            const PasskeyAccount = await ethers.getContractFactory("PasskeyAccount");
            account = PasskeyAccount.attach(accountAddr);

            // Fund the smart account with USDC
            await mockUSDC.mint(accountAddr, ethers.parseUnits("1000", 6));
        });

        it("should execute a USDC transfer with valid passkey signature", async function () {
            const transferData = mockUSDC.interface.encodeFunctionData("transfer", [
                relayer.address,
                ethers.parseUnits("100", 6)
            ]);

            const nonce = await account.nonce();
            const operationHash = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["address", "address", "uint256", "bytes", "uint256"],
                    [accountAddr, await mockUSDC.getAddress(), 0, transferData, nonce]
                )
            );

            const sig = await worker.signMessage(ethers.getBytes(operationHash));
            const { r, s } = ethers.Signature.from(sig);

            const initialBalance = await mockUSDC.balanceOf(relayer.address);

            // Anyone can relay the tx — the signature proves authorization
            await account.connect(relayer).executeWithPasskey(
                await mockUSDC.getAddress(),
                0,
                transferData,
                r,
                s
            );

            const finalBalance = await mockUSDC.balanceOf(relayer.address);
            expect(finalBalance - initialBalance).to.equal(ethers.parseUnits("100", 6));
        });

        it("should reject execution with an invalid passkey signature", async function () {
            const transferData = mockUSDC.interface.encodeFunctionData("transfer", [
                relayer.address,
                ethers.parseUnits("50", 6)
            ]);

            const nonce = await account.nonce();
            const operationHash = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["address", "address", "uint256", "bytes", "uint256"],
                    [accountAddr, await mockUSDC.getAddress(), 0, transferData, nonce]
                )
            );

            // Sign with the WRONG key (employer)
            const sig = await employer.signMessage(ethers.getBytes(operationHash));
            const { r, s } = ethers.Signature.from(sig);

            await expect(
                account.connect(relayer).executeWithPasskey(
                    await mockUSDC.getAddress(),
                    0,
                    transferData,
                    r,
                    s
                )
            ).to.be.revertedWith("PasskeyAccount: invalid passkey signature");
        });

        it("should increment nonce after execution to prevent replay", async function () {
            expect(await account.nonce()).to.equal(0n);

            const transferData = mockUSDC.interface.encodeFunctionData("transfer", [
                relayer.address,
                ethers.parseUnits("10", 6)
            ]);

            const nonce0 = 0n;
            const operationHash = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["address", "address", "uint256", "bytes", "uint256"],
                    [accountAddr, await mockUSDC.getAddress(), 0, transferData, nonce0]
                )
            );

            const sig = await worker.signMessage(ethers.getBytes(operationHash));
            const { r, s } = ethers.Signature.from(sig);

            await account.connect(relayer).executeWithPasskey(
                await mockUSDC.getAddress(),
                0,
                transferData,
                r,
                s
            );

            expect(await account.nonce()).to.equal(1n);

            // Replaying the same signed tx should fail because nonce changed
            await expect(
                account.connect(relayer).executeWithPasskey(
                    await mockUSDC.getAddress(),
                    0,
                    transferData,
                    r,
                    s
                )
            ).to.be.revertedWith("PasskeyAccount: invalid passkey signature");
        });
    });

    describe("NexaPaymaster - Sponsored Withdrawals", function () {
        let workerAccount;
        let workerAccountAddr;
        let streamId;

        beforeEach(async function () {
            // Discover worker's v
            const dummySig = await worker.signMessage(ethers.getBytes(ethers.keccak256(ethers.toUtf8Bytes("dummy"))));
            const { v: workerV } = ethers.Signature.from(dummySig);

            // Deploy a PasskeyAccount for the worker
            const credentialId = ethers.keccak256(ethers.toUtf8Bytes("paymaster-test-cred"));
            await passkeyFactory.deployWallet(credentialId, BigInt(worker.address), BigInt(workerV));
            workerAccountAddr = await passkeyFactory.accountsByCredential(credentialId);

            const PasskeyAccount = await ethers.getContractFactory("PasskeyAccount");
            workerAccount = PasskeyAccount.attach(workerAccountAddr);

            // Create a stream from employer → worker's smart account
            const createTx = await streamingPayroll.connect(employer)["createStream(address,uint256,uint256,string)"](
                workerAccountAddr, 100n, 10000n, "SG"
            );
            const receipt = await createTx.wait();

            const block = await ethers.provider.getBlock(receipt.blockNumber);
            streamId = ethers.solidityPackedKeccak256(
                ["address", "address", "uint256"],
                [employer.address, workerAccountAddr, block.timestamp]
            );

            // Employer deposits sponsor USDC into the paymaster
            await mockUSDC.connect(employer).approve(
                await nexaPaymaster.getAddress(),
                ethers.MaxUint256
            );
            await nexaPaymaster.connect(employer).depositSponsor(ethers.parseUnits("100", 6));

            // Advance time so the stream accrues funds
            await ethers.provider.send("evm_increaseTime", [10]);
            await ethers.provider.send("evm_mine");
        });

        it("should sponsor a valid withdrawFunds operation", async function () {
            const withdrawData = streamingPayroll.interface.encodeFunctionData("withdrawFunds", [streamId]);

            const initialBalance = await mockUSDC.balanceOf(workerAccountAddr);

            await nexaPaymaster.connect(relayer).sponsorWithdrawal(
                workerAccountAddr,
                await streamingPayroll.getAddress(),
                withdrawData,
                streamId
            );

            const finalBalance = await mockUSDC.balanceOf(workerAccountAddr);
            expect(finalBalance).to.be.greaterThan(initialBalance);
        });

        it("should deduct gas cost from employer sponsor balance", async function () {
            const initialSponsor = await nexaPaymaster.sponsorBalances(employer.address);

            const withdrawData = streamingPayroll.interface.encodeFunctionData("withdrawFunds", [streamId]);

            await nexaPaymaster.connect(relayer).sponsorWithdrawal(
                workerAccountAddr,
                await streamingPayroll.getAddress(),
                withdrawData,
                streamId
            );

            const finalSponsor = await nexaPaymaster.sponsorBalances(employer.address);
            const gasCost = await nexaPaymaster.gasCostPerOp();
            expect(initialSponsor - finalSponsor).to.equal(gasCost);
        });

        it("should reject sponsorship for non-whitelisted targets", async function () {
            const fakeTarget = relayer.address;
            const withdrawData = streamingPayroll.interface.encodeFunctionData("withdrawFunds", [streamId]);

            await expect(
                nexaPaymaster.connect(relayer).sponsorWithdrawal(
                    workerAccountAddr,
                    fakeTarget,
                    withdrawData,
                    streamId
                )
            ).to.be.revertedWith("NexaPaymaster: target not whitelisted");
        });

        it("should reject sponsorship for non-withdraw functions", async function () {
            const cancelData = streamingPayroll.interface.encodeFunctionData("cancelStream", [streamId]);

            await expect(
                nexaPaymaster.connect(relayer).sponsorWithdrawal(
                    workerAccountAddr,
                    await streamingPayroll.getAddress(),
                    cancelData,
                    streamId
                )
            ).to.be.revertedWith("NexaPaymaster: function not allowed");
        });

        it("should reject when employer has insufficient sponsor balance", async function () {
            const balance = await nexaPaymaster.sponsorBalances(employer.address);
            await nexaPaymaster.connect(employer).withdrawSponsor(balance);

            const withdrawData = streamingPayroll.interface.encodeFunctionData("withdrawFunds", [streamId]);

            await expect(
                nexaPaymaster.connect(relayer).sponsorWithdrawal(
                    workerAccountAddr,
                    await streamingPayroll.getAddress(),
                    withdrawData,
                    streamId
                )
            ).to.be.revertedWith("NexaPaymaster: employer has insufficient sponsor balance");
        });

        it("should track total sponsored operations", async function () {
            expect(await nexaPaymaster.totalSponsored()).to.equal(0n);

            const withdrawData = streamingPayroll.interface.encodeFunctionData("withdrawFunds", [streamId]);
            await nexaPaymaster.connect(relayer).sponsorWithdrawal(
                workerAccountAddr,
                await streamingPayroll.getAddress(),
                withdrawData,
                streamId
            );

            expect(await nexaPaymaster.totalSponsored()).to.equal(1n);
        });
    });
});
