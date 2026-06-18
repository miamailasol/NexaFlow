const hre = require("hardhat");

async function main() {
  const usdcTokenAddress = "0x3600000000000000000000000000000000000000";
  const streamingPayrollAddress = "0xe366fc3cd96afbde41b0fd8a3096178fac2d1cdf";

  console.log("Starting deployment of remaining contracts on Arc Testnet...");

  // 1. ComplianceRegistry
  const ComplianceRegistry = await hre.ethers.getContractFactory("ComplianceRegistry");
  const complianceRegistry = await ComplianceRegistry.deploy();
  await complianceRegistry.waitForDeployment();
  const complianceRegistryAddr = await complianceRegistry.getAddress();
  console.log("COMPLIANCE_REGISTRY_ADDRESS:", complianceRegistryAddr);

  // 2. PaymasterRulesManager
  const PaymasterRulesManager = await hre.ethers.getContractFactory("PaymasterRulesManager");
  const paymasterRulesManager = await PaymasterRulesManager.deploy();
  await paymasterRulesManager.waitForDeployment();
  const paymasterRulesManagerAddr = await paymasterRulesManager.getAddress();
  console.log("PAYMASTER_RULES_MANAGER_ADDRESS:", paymasterRulesManagerAddr);

  // 3. TreasuryBufferManager
  const TreasuryBufferManager = await hre.ethers.getContractFactory("TreasuryBufferManager");
  const treasuryBufferManager = await TreasuryBufferManager.deploy(usdcTokenAddress);
  await treasuryBufferManager.waitForDeployment();
  const treasuryBufferManagerAddr = await treasuryBufferManager.getAddress();
  console.log("TREASURY_BUFFER_MANAGER_ADDRESS:", treasuryBufferManagerAddr);

  // 4. NexaPaymaster
  const NexaPaymaster = await hre.ethers.getContractFactory("NexaPaymaster");
  const nexaPaymaster = await NexaPaymaster.deploy(usdcTokenAddress, streamingPayrollAddress);
  await nexaPaymaster.waitForDeployment();
  const nexaPaymasterAddr = await nexaPaymaster.getAddress();
  console.log("NEXA_PAYMASTER_ADDRESS:", nexaPaymasterAddr);

  // 5. WebAuthnVerifier
  const WebAuthnVerifier = await hre.ethers.getContractFactory("WebAuthnVerifier");
  const webAuthnVerifier = await WebAuthnVerifier.deploy(false); // false = don't use precompile in testnet environment if not supported
  await webAuthnVerifier.waitForDeployment();
  const webAuthnVerifierAddr = await webAuthnVerifier.getAddress();
  console.log("WebAuthnVerifier deployed to:", webAuthnVerifierAddr);

  // 6. PasskeyAccountFactory
  const PasskeyAccountFactory = await hre.ethers.getContractFactory("PasskeyAccountFactory");
  const passkeyAccountFactory = await PasskeyAccountFactory.deploy(webAuthnVerifierAddr, nexaPaymasterAddr);
  await passkeyAccountFactory.waitForDeployment();
  const passkeyAccountFactoryAddr = await passkeyAccountFactory.getAddress();
  console.log("PASSKEY_ACCOUNT_FACTORY_ADDRESS:", passkeyAccountFactoryAddr);

  console.log("Deployment finished successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
