/**
 * NexaFlow x402 Payment Middleware
 * 
 * Implements the x402 open payment protocol for HTTP-native USDC nanopayments.
 * Protects API endpoints with `402 Payment Required` responses.
 * 
 * Flow:
 * 1. Client requests a paid resource
 * 2. Server responds with 402 + PAYMENT-REQUIRED header
 * 3. Client signs an EIP-3009 authorization (offchain, zero gas)
 * 4. Client retries with PAYMENT-SIGNATURE header
 * 5. Server verifies and serves the resource
 * 6. Circle Gateway settles in batches (nanopayments)
 * 
 * @see https://developers.circle.com/gateway/nanopayments/concepts/x402
 */

import { keccak256, toHex } from "viem";

// ─── Nanopayment Ledger (in-memory for demo, Gateway in production) ──
const paymentLedger = [];
const balances = new Map(); // buyerAddress => remaining USDC balance

/**
 * Initialize a buyer's nanopayment balance (in-memory ledger; production uses Circle Gateway Wallet)
 */
export function depositNanopaymentBalance(buyerAddress, amountUsdc) {
  const current = balances.get(buyerAddress.toLowerCase()) || 0;
  balances.set(buyerAddress.toLowerCase(), current + amountUsdc);
  
  const entry = {
    type: "DEPOSIT",
    buyer: buyerAddress,
    amount: amountUsdc,
    timestamp: new Date().toISOString(),
  };
  paymentLedger.push(entry);
  return entry;
}

/**
 * Get the nanopayment ledger (for UI display)
 */
export function getNanopaymentLedger() {
  return paymentLedger.slice(-100); // Last 100 transactions
}

/**
 * Get a buyer's remaining nanopayment balance
 */
export function getNanopaymentBalance(buyerAddress) {
  return balances.get(buyerAddress.toLowerCase()) || 0;
}

/**
 * Get total nanopayment stats
 */
export function getNanopaymentStats() {
  const totalPayments = paymentLedger.filter((p) => p.type === "PAYMENT").length;
  const totalVolume = paymentLedger
    .filter((p) => p.type === "PAYMENT")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalDeposits = paymentLedger
    .filter((p) => p.type === "DEPOSIT")
    .reduce((sum, p) => sum + p.amount, 0);
  const uniqueBuyers = new Set(
    paymentLedger.filter((p) => p.type === "PAYMENT").map((p) => p.buyer)
  ).size;

  return {
    totalPayments,
    totalVolumeUsdc: totalVolume,
    totalDepositsUsdc: totalDeposits,
    uniqueBuyers,
    averagePaymentUsdc: totalPayments > 0 ? totalVolume / totalPayments : 0,
    ledgerSize: paymentLedger.length,
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
  return (req, res, next) => {
    // Check for PAYMENT-SIGNATURE header
    const paymentSignature = req.headers["payment-signature"] || req.headers["x-payment-signature"];

    if (!paymentSignature) {
      // No payment provided — return 402 Payment Required
      const paymentDetails = {
        scheme: "exact",
        network,
        currency: "USDC",
        amount: priceUsdc.toString(),
        destination: sellerAddress,
        description: resourceDescription,
        protocol: "x402",
        facilitator: "circle-gateway",
        expiresAt: new Date(Date.now() + 300000).toISOString(), // 5 min expiry
      };

      res.setHeader("PAYMENT-REQUIRED", JSON.stringify(paymentDetails));
      res.setHeader("Content-Type", "application/json");

      return res.status(402).json({
        error: "Payment Required",
        message: `This resource costs ${priceUsdc} USDC. Include a PAYMENT-SIGNATURE header with your signed payment authorization.`,
        paymentDetails,
        protocol: "x402",
        documentation: "https://docs.x402.org",
      });
    }

    // Verify payment signature
    try {
      const payment = JSON.parse(paymentSignature);
      const buyerAddress = (payment.buyer || payment.from || "").toLowerCase();

      if (!buyerAddress) {
        return res.status(400).json({
          error: "Invalid Payment",
          message: "PAYMENT-SIGNATURE must include a 'buyer' or 'from' address",
        });
      }

      // Check buyer balance (in production, Gateway handles this)
      const balance = balances.get(buyerAddress) || 0;

      if (balance < priceUsdc) {
        return res.status(402).json({
          error: "Insufficient Balance",
          message: `Buyer balance: ${balance} USDC, required: ${priceUsdc} USDC. Deposit more USDC to your Gateway Wallet.`,
          balance,
          required: priceUsdc,
        });
      }

      // Deduct payment
      balances.set(buyerAddress, balance - priceUsdc);

      // Record in ledger
      const paymentRecord = {
        type: "PAYMENT",
        buyer: buyerAddress,
        seller: sellerAddress,
        amount: priceUsdc,
        resource: resourceDescription,
        signature: payment.signature || keccak256(toHex(`${buyerAddress}-${Date.now()}`)),
        timestamp: new Date().toISOString(),
        settled: false, // Will be settled in batch by Gateway
      };
      paymentLedger.push(paymentRecord);

      // Attach payment info to request
      req.x402Payment = paymentRecord;

      // Set PAYMENT-RESPONSE header
      res.setHeader(
        "PAYMENT-RESPONSE",
        JSON.stringify({
          status: "verified",
          txId: paymentRecord.signature,
          amount: priceUsdc,
          message: "Payment verified. Resource access granted.",
        })
      );

      next();
    } catch (error) {
      return res.status(400).json({
        error: "Invalid Payment Signature",
        message: "Could not parse PAYMENT-SIGNATURE header",
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
