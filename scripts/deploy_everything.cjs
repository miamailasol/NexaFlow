const hre = require("hardhat");

async function main() {
  const usdcTokenAddress = "0x3600000000000000000000000000000000000000";
  const verifierAgentAddress = "0xCA2DE969C3266f530a27bE3B46EC0550cF609c67";

  console.log("Starting a fresh deployment of ALL contracts on Arc Testnet...");

  // 1. StreamingPayroll
  const StreamingPayroll = await hre.ethers.getContractFactory("StreamingPayroll");
  const streamingPayroll = await StreamingPayroll.deploy(usdcTokenAddress);
  await streamingPayroll.waitForDeployment();
  const streamingPayrollAddr = await streamingPayroll.getAddress();
  console.log("STREAMING_PAYROLL_ADDRESS:", streamingPayrollAddr);

  // 2. MockYieldVault
  const MockYieldVault = await hre.ethers.getContractFactory("MockYieldVault");
  const mockYieldVault = await MockYieldVault.deploy(usdcTokenAddress);
  await mockYieldVault.waitForDeployment();
  const mockYieldVaultAddr = await mockYieldVault.getAddress();
  console.log("YIELD_VAULT_ADDRESS (MockYieldVault):", mockYieldVaultAddr);

  // 3. MicroBenefitsVault
  const MicroBenefitsVault = await hre.ethers.getContractFactory("MicroBenefitsVault");
  const microBenefitsVault = await MicroBenefitsVault.deploy(usdcTokenAddress, verifierAgentAddress, mockYieldVaultAddr);
  await microBenefitsVault.waitForDeployment();
  const microBenefitsVaultAddr = await microBenefitsVault.getAddress();
  console.log("MICRO_BENEFITS_VAULT_ADDRESS:", microBenefitsVaultAddr);

  // 4. ComplianceRegistry
  const ComplianceRegistry = await hre.ethers.getContractFactory("ComplianceRegistry");
  const complianceRegistry = await ComplianceRegistry.deploy();
  await complianceRegistry.waitForDeployment();
  const complianceRegistryAddr = await complianceRegistry.getAddress();
  console.log("COMPLIANCE_REGISTRY_ADDRESS:", complianceRegistryAddr);

  // 5. PaymasterRulesManager
  const PaymasterRulesManager = await hre.ethers.getContractFactory("PaymasterRulesManager");
  const paymasterRulesManager = await PaymasterRulesManager.deploy();
  await paymasterRulesManager.waitForDeployment();
  const paymasterRulesManagerAddr = await paymasterRulesManager.getAddress();
  console.log("PAYMASTER_RULES_MANAGER_ADDRESS:", paymasterRulesManagerAddr);

  // 6. TreasuryBufferManager
  const TreasuryBufferManager = await hre.ethers.getContractFactory("TreasuryBufferManager");
  const treasuryBufferManager = await TreasuryBufferManager.deploy(usdcTokenAddress);
  await treasuryBufferManager.waitForDeployment();
  const treasuryBufferManagerAddr = await treasuryBufferManager.getAddress();
  console.log("TREASURY_BUFFER_MANAGER_ADDRESS:", treasuryBufferManagerAddr);

  // 7. NexaPaymaster
  const NexaPaymaster = await hre.ethers.getContractFactory("NexaPaymaster");
  const nexaPaymaster = await NexaPaymaster.deploy(usdcTokenAddress, streamingPayrollAddr);
  await nexaPaymaster.waitForDeployment();
  const nexaPaymasterAddr = await nexaPaymaster.getAddress();
  console.log("NEXA_PAYMASTER_ADDRESS:", nexaPaymasterAddr);

  // 8. WebAuthnVerifier
  const WebAuthnVerifier = await hre.ethers.getContractFactory("WebAuthnVerifier");
  const webAuthnVerifier = await WebAuthnVerifier.deploy(false);
  await webAuthnVerifier.waitForDeployment();
  const webAuthnVerifierAddr = await webAuthnVerifier.getAddress();
  console.log("WebAuthnVerifier deployed to:", webAuthnVerifierAddr);

  // 9. PasskeyAccountFactory
  const PasskeyAccountFactory = await hre.ethers.getContractFactory("PasskeyAccountFactory");
  const passkeyAccountFactory = await PasskeyAccountFactory.deploy(webAuthnVerifierAddr, nexaPaymasterAddr);
  await passkeyAccountFactory.waitForDeployment();
  const passkeyAccountFactoryAddr = await passkeyAccountFactory.getAddress();
  console.log("PASSKEY_ACCOUNT_FACTORY_ADDRESS:", passkeyAccountFactoryAddr);

  // 10. MockMessageTransmitter
  const MockMessageTransmitter = await hre.ethers.getContractFactory("MockMessageTransmitter");
  const mockMessageTransmitter = await MockMessageTransmitter.deploy(usdcTokenAddress);
  await mockMessageTransmitter.waitForDeployment();
  const mockMessageTransmitterAddr = await mockMessageTransmitter.getAddress();
  console.log("MockMessageTransmitter deployed to:", mockMessageTransmitterAddr);

  // 11. CrossChainTreasury
  const CrossChainTreasury = await hre.ethers.getContractFactory("CrossChainTreasury");
  const crossChainTreasury = await CrossChainTreasury.deploy(usdcTokenAddress, mockMessageTransmitterAddr, streamingPayrollAddr);
  await crossChainTreasury.waitForDeployment();
  const crossChainTreasuryAddr = await crossChainTreasury.getAddress();
  console.log("CROSS_CHAIN_TREASURY_ADDRESS:", crossChainTreasuryAddr);

  console.log("\n--- Fresh Deployment Complete! ---");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
