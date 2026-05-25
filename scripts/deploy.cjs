const hre = require("hardhat");

async function main() {
  const usdcTokenAddress = "0x3600000000000000000000000000000000000000";
  // Default verifier agent is set to the deployer address
  const verifierAgentAddress = "0xCA2DE969C3266f530a27bE3B46EC0550cF609c67";

  console.log("Starting deployment on Arc Testnet...");

  const StreamingPayroll = await hre.ethers.getContractFactory("StreamingPayroll");
  const streamingPayroll = await StreamingPayroll.deploy(usdcTokenAddress);
  await streamingPayroll.waitForDeployment();
  const streamingPayrollAddr = await streamingPayroll.getAddress();
  console.log("StreamingPayroll deployed to:", streamingPayrollAddr);

  const MicroBenefitsVault = await hre.ethers.getContractFactory("MicroBenefitsVault");
  const microBenefitsVault = await MicroBenefitsVault.deploy(usdcTokenAddress, verifierAgentAddress);
  await microBenefitsVault.waitForDeployment();
  const microBenefitsVaultAddr = await microBenefitsVault.getAddress();
  console.log("MicroBenefitsVault deployed to:", microBenefitsVaultAddr);
  
  console.log("Deployment finished successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
