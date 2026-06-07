import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// EIP-712 domain name and version configuration
const DOMAIN_NAME = "NexaFlow";
const DOMAIN_VERSION = "1";

/**
 * Simulates the AI parsing of medical invoice text using an LLM prompt.
 * In a production environment, this would call Gemini or OpenAI APIs with PDF image bytes.
 * For demonstration, we simulate the LLM extraction of unstructured text.
 */
async function parseInvoiceWithAI(invoiceText, memberAddress) {
    console.log("🤖 [AI Agent] Parsing invoice text...");
    console.log("-----------------------------------------");
    console.log(invoiceText.trim());
    console.log("-----------------------------------------");

    // Simulate LLM parsing of parameters
    const amountMatch = invoiceText.match(/Total:\s*\$?([0-9.]+)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 135.00;
    
    const providerMatch = invoiceText.match(/Hospital|Clinic|Pharmacy/i);
    const serviceProvider = providerMatch ? "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" : "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    
    const typeMatch = invoiceText.match(/medical|dental|health|clinical/i);
    const claimType = typeMatch ? "HEALTH" : "EMERGENCY";

    // Hash of the invoice contents (simulating IPFS claimHash storage)
    const claimHash = ethers.keccak256(ethers.toUtf8Bytes(invoiceText));

    return {
        member: memberAddress,
        serviceProvider,
        amount: ethers.parseUnits(amount.toFixed(2), 6), // USDC 6 decimals
        claimType,
        claimHash,
        nonce: Math.floor(Math.random() * 1000000)
    };
}

async function main() {
    // 1. Prepare private key and contract details
    const verifierPrivateKey = process.env.VERIFIER_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // default hardhat private key
    const wallet = new ethers.Wallet(verifierPrivateKey);
    
    // Deployed MicroBenefitsVault address (placeholder or read from env)
    const vaultAddress = process.env.MICRO_BENEFITS_VAULT_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 31337;

    console.log(`🤖 AI Agent Signer Address: ${wallet.address}`);
    console.log(`🏛️ Verifying Contract: ${vaultAddress} (Chain: ${chainId})`);

    // 2. Unstructured medical bill mockup
    const mockInvoiceText = `
        ------------------------------------------
        METROPOLITAN HEALTHCARE & CLINIC
        ------------------------------------------
        Patient: Remote Engineer
        Date: June 7, 2026
        Service: Dental Root Canal Therapy
        ------------------------------------------
        Subtotal: $120.00
        Tax: $15.00
        Total: $135.00
        ------------------------------------------
        Paid in full. Hospital partner verification ID: provider_093bb2
    `;

    const memberAddress = process.env.MEMBER_ADDRESS || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // employee
    
    // 3. Run AI parsing
    const claimDetails = await parseInvoiceWithAI(mockInvoiceText, memberAddress);

    // 4. Construct EIP-712 parameters
    const domain = {
        name: DOMAIN_NAME,
        version: DOMAIN_VERSION,
        chainId: chainId,
        verifyingContract: vaultAddress
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

    // 5. Sign structured EIP-712 data
    const signature = await wallet.signTypedData(domain, types, claimDetails);

    console.log("\n✅ [AI Agent] Verification complete! EIP-712 payload generated:");
    console.log("------------------------------------------------------------------");
    console.log("Claim Details Struct:");
    console.log(JSON.stringify({
        member: claimDetails.member,
        serviceProvider: claimDetails.serviceProvider,
        amount: claimDetails.amount.toString(),
        claimType: claimDetails.claimType,
        claimHash: claimDetails.claimHash,
        nonce: claimDetails.nonce
    }, null, 2));
    console.log(`\nSignature:\n${signature}`);
    console.log("------------------------------------------------------------------");
}

main().catch((err) => {
    console.error("Error running AI verification agent:", err);
});
