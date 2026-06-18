/**
 * NexaFlow x402 Payment Middleware
 * 
 * Implements the x402 open payment protocol for HTTP-native USDC nanopayments.
 * Protects API endpoints with `402 Payment Required` responses.
 * 
 * Flow:
 * 1. Client requests a paid resource
 * 2. Server responds with 402 + PAYMENT-REQUIRED header (base64 encoded JSON)
 * 3. Client signs an EIP-3009 authorization (offchain, zero gas)
 * 4. Client retries with PAYMENT-SIGNATURE header (base64 encoded JSON)
 * 5. Server verifies and settles via Circle Gateway
 * 6. Resource is served
 * 
 * @see https://developers.circle.com/gateway/nanopayments/concepts/x402
 */

import { keccak256, toHex } from "viem";
import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import { getX402Ledger, addX402Record, getX402Balance, setX402Balance, depositX402 } from "../database.js";

// ─── Circle Nanopayments Client ──────────────────────────────────────
const facilitator = new BatchFacilitatorClient();

const ARC_TESTNET_NETWORK = "eip155:5042002";
const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000";
const ARC_TESTNET_GATEWAY_WALLET = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";

/**
 * Build payment requirements for Circle Gateway
 */
function buildPaymentRequirements(priceUsdc, sellerAddress) {
  const amountAtomic = Math.round(priceUsdc * 1_000_000);
  return {
    scheme: "exact",
    network: ARC_TESTNET_NETWORK,
    asset: ARC_TESTNET_USDC,
    amount: amountAtomic.toString(),
    payTo: sellerAddress,
    maxTimeoutSeconds: 345600,
    extra: {
      name: "GatewayWalletBatched",
      version: "1",
      verifyingContract: ARC_TESTNET_GATEWAY_WALLET,
    },
  };
}

/**
 * Record a deposit event in the in-memory ledger
 */
export async function depositNanopaymentBalance(buyerAddress, amountUsdc) {
  await depositX402(buyerAddress, amountUsdc);
  
  const entry = {
    type: "DEPOSIT",
    buyer: buyerAddress,
    amount: amountUsdc,
    timestamp: new Date().toISOString(),
  };
  await addX402Record(entry);
  return entry;
}

/**
 * Get the nanopayment ledger (for UI display)
 */
export async function getNanopaymentLedger() {
  const ledger = await getX402Ledger();
  return ledger.slice(-100); // Last 100 transactions
}

/**
 * Get a buyer's remaining nanopayment balance from Circle Gateway API
 */
export async function getNanopaymentBalance(buyerAddress) {
  try {
    const response = await fetch("https://gateway-api-testnet.circle.com/v1/balances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "USDC",
        sources: [{ domain: 26, depositor: buyerAddress }],
      }),
    });
    if (!response.ok) {
      // Fallback to in-memory balance if API fails
      return await getX402Balance(buyerAddress);
    }
    const data = await response.json();
    const bal = data.balances?.find(b => b.domain === 26);
    const raw = bal?.balance ?? "0";
    const balance = raw.includes(".") ? parseFloat(raw) : parseFloat(raw) / 1000000;
    
    // Sync cache
    await setX402Balance(buyerAddress, balance);
    return balance;
  } catch (err) {
    console.error("Failed to fetch gateway balance for address:", buyerAddress, err);
    return await getX402Balance(buyerAddress);
  }
}

/**
 * Get total nanopayment stats
 */
export async function getNanopaymentStats() {
  const ledger = await getX402Ledger();
  const totalPayments = ledger.filter((p) => p.type === "PAYMENT").length;
  const totalVolume = ledger
    .filter((p) => p.type === "PAYMENT")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalDeposits = ledger
    .filter((p) => p.type === "DEPOSIT")
    .reduce((sum, p) => sum + p.amount, 0);
  const uniqueBuyers = new Set(
    ledger.filter((p) => p.type === "PAYMENT").map((p) => p.buyer)
  ).size;

  return {
    totalPayments,
    totalVolumeUsdc: totalVolume,
    totalDepositsUsdc: totalDeposits,
    uniqueBuyers,
    averagePaymentUsdc: totalPayments > 0 ? totalVolume / totalPayments : 0,
    ledgerSize: ledger.length,
  };
}

/**
 * x402 Payment Middleware Factory
 * 
 * @param {Object} options
 * @param {number} options.priceUsdc - Price in USDC (e.g., 0.001 for $0.001)
 * @param {string} options.resourceDescription - Description of the paid resource
 * @param {string} options.sellerAddress - USDC destination address
 * @param {string} options.network - Blockchain network (default: "arc-testnet")
 */
export function x402PaymentRequired({
  priceUsdc = 0.001,
  resourceDescription = "Protected API resource",
  sellerAddress = "0xCA2DE969C3266f530a27bE3B46EC0550cF609c67",
  network = "arc-testnet",
} = {}) {
  return async (req, res, next) => {
    // Check for PAYMENT-SIGNATURE header
    const paymentSignature = req.headers["payment-signature"] || req.headers["x-payment-signature"];

    if (!paymentSignature) {
      // No payment provided — return 402 Payment Required with base64 encoded requirements
      const requirements = buildPaymentRequirements(priceUsdc, sellerAddress);
      
      const paymentRequired = {
        x402Version: 2,
        resource: {
          url: req.originalUrl || req.url,
          description: `${resourceDescription} (${priceUsdc} USDC)`,
          mimeType: "application/json",
        },
        accepts: [requirements],
      };

      const paymentRequiredB64 = Buffer.from(JSON.stringify(paymentRequired)).toString("base64");

      res.setHeader("PAYMENT-REQUIRED", paymentRequiredB64);
      res.setHeader("Content-Type", "application/json");

      return res.status(402).json({
        error: "Payment Required",
        message: `This resource costs ${priceUsdc} USDC. Include a base64 encoded PAYMENT-SIGNATURE header.`,
        protocol: "x402",
        paymentRequiredB64,
      });
    }

    // Verify and settle payment via Circle Gateway
    try {
      let paymentPayload;
      try {
        paymentPayload = JSON.parse(
          Buffer.from(paymentSignature, "base64").toString("utf-8")
        );
      } catch (err) {
        // Fallback for direct JSON strings
        paymentPayload = JSON.parse(paymentSignature);
      }

      const requirements = buildPaymentRequirements(priceUsdc, sellerAddress);

      // 1. Verify payment signature and message parameters
      const verifyResult = await facilitator.verify(
        paymentPayload,
        requirements
      );

      if (!verifyResult.isValid) {
        return res.status(402).json({
          error: "Payment verification failed",
          reason: verifyResult.invalidReason || "Invalid signature or requirements mismatch",
        });
      }

      // 2. Settle the payment via Circle Gateway
      const settleResult = await facilitator.settle(
        paymentPayload,
        requirements
      );

      if (!settleResult.success) {
        console.error(`[x402] Settlement failed: ${settleResult.errorReason}`);
        return res.status(402).json({
          error: "Payment settlement failed",
          reason: settleResult.errorReason || "Failed to settle payment on Gateway",
        });
      }

      const payer = settleResult.payer || verifyResult.payer || paymentPayload.buyer || "unknown";

      // 3. Record in local memory ledger for dashboard real-time statistics
      const paymentRecord = {
        type: "PAYMENT",
        buyer: payer,
        seller: sellerAddress,
        amount: priceUsdc,
        resource: resourceDescription,
        signature: settleResult.transaction || paymentPayload.signature || keccak256(toHex(`${payer}-${Date.now()}`)),
        timestamp: new Date().toISOString(),
        settled: true,
      };
      await addX402Record(paymentRecord);

      // Attach payment info to request
      req.x402Payment = paymentRecord;

      // 4. Set PAYMENT-RESPONSE header
      const responseHeader = Buffer.from(
        JSON.stringify({
          success: true,
          transaction: settleResult.transaction,
          network: requirements.network,
          payer,
        })
      ).toString("base64");

      res.setHeader("PAYMENT-RESPONSE", responseHeader);

      next();
    } catch (error) {
      console.error("[x402] Payment processing error:", error);
      return res.status(400).json({
        error: "Invalid Payment Signature",
        message: "Could not parse or verify PAYMENT-SIGNATURE header",
        details: error.message,
      });
    }
  };
}

export default {
  x402PaymentRequired,
  depositNanopaymentBalance,
  getNanopaymentLedger,
  getNanopaymentBalance,
  getNanopaymentStats,
};
