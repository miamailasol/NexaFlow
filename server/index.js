/**
 * NexaFlow Agent Server — Multi-Agent Payroll Economy Backend
 * 
 * Express server integrating:
 * - LangGraph multi-agent orchestration (5 specialized agents)
 * - x402 nanopayment-protected endpoints
 * - Circle Gateway nanopayments for agent-to-agent payments
 * - ERC-8004 agent identity & reputation tracking
 * - ERC-8183 job lifecycle management
 * - Circle Developer-Controlled Wallets for settlement
 * 
 * Run: node --env-file=.env server/index.js
 */

import express from "express";
import cors from "cors";
import { createPublicClient, http, formatUnits } from "viem";

import {
  processClaimWithAgents,
  createStreamWithAgents,
  screenAddressWithAgents,
  getAgentActivityLog,
  getAgentRegistry,
} from "./agents/coordinator.js";

import { getAgentBudget } from "./agents/tools.js";

import {
  x402PaymentRequired,
  depositNanopaymentBalance,
  getNanopaymentLedger,
  getNanopaymentBalance,
  getNanopaymentStats,
} from "./middleware/x402.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.AGENT_SERVER_PORT || 3002;

// ─── Arc Testnet Public Client ──────────────────────────────────────
const publicClient = createPublicClient({
  chain: {
    id: 5042002,
    name: "Arc Testnet",
    network: "arc-testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
    rpcUrls: {
      default: { http: ["https://rpc.testnet.arc.network"] },
      public: { http: ["https://rpc.testnet.arc.network"] },
    },
  },
  transport: http(),
});

// ═════════════════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS (No payment required)
// ═════════════════════════════════════════════════════════════════════

/**
 * Health check + system status
 */
app.get("/api/status", (req, res) => {
  res.json({
    service: "NexaFlow Agent Server",
    version: "2.0.0",
    status: "operational",
    agents: {
      coordinator: { status: "active", budget: getAgentBudget("coordinator") },
      payroll: { status: "active", budget: getAgentBudget("payroll") },
      verification: { status: "active", budget: getAgentBudget("verification") },
      compliance: { status: "active", budget: getAgentBudget("compliance") },
      settlement: { status: "active", budget: getAgentBudget("settlement") },
    },
    nanopayments: getNanopaymentStats(),
    uptime: process.uptime(),
    arc: {
      network: "Arc Testnet",
      chainId: 5042002,
      gasToken: "USDC",
    },
    circle: {
      features: [
        "Developer-Controlled Wallets",
        "Gateway Nanopayments",
        "x402 Protocol",
        "ERC-8004 Agent Identity",
        "ERC-8183 AgenticCommerce",
        "CCTP Cross-Chain Bridge",
      ],
    },
  });
});

/**
 * Get real-time agent activity log
 */
app.get("/api/agents/activity", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const log = getAgentActivityLog();
  res.json({
    success: true,
    total: log.length,
    activities: log.slice(-limit),
  });
});

/**
 * Get agent registry (ERC-8004 identities)
 */
app.get("/api/agents/registry", (req, res) => {
  res.json({
    success: true,
    agents: getAgentRegistry(),
    identityRegistryAddress: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    reputationRegistryAddress: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  });
});

/**
 * Get agent budget status
 */
app.get("/api/agents/budgets", (req, res) => {
  const agents = ["coordinator", "payroll", "verification", "compliance", "benefits", "settlement"];
  const budgets = {};
  agents.forEach((name) => {
    budgets[name] = getAgentBudget(name);
  });
  res.json({ success: true, budgets });
});

/**
 * Get nanopayment ledger
 */
app.get("/api/nanopayments/ledger", (req, res) => {
  res.json({
    success: true,
    stats: getNanopaymentStats(),
    ledger: getNanopaymentLedger(),
  });
});

/**
 * Get nanopayment balance for a buyer
 */
app.get("/api/nanopayments/balance/:address", (req, res) => {
  const balance = getNanopaymentBalance(req.params.address);
  res.json({
    success: true,
    address: req.params.address,
    balanceUsdc: balance,
  });
});

/**
 * Deposit USDC into nanopayment Gateway balance
 */
app.post("/api/nanopayments/deposit", (req, res) => {
  const { buyerAddress, amountUsdc } = req.body;
  if (!buyerAddress || !amountUsdc) {
    return res.status(400).json({
      error: "Missing buyerAddress or amountUsdc",
    });
  }

  const result = depositNanopaymentBalance(buyerAddress, amountUsdc);
  const newBalance = getNanopaymentBalance(buyerAddress);

  res.json({
    success: true,
    deposit: result,
    newBalance: newBalance,
    message: `Deposited ${amountUsdc} USDC to Gateway balance for ${buyerAddress}`,
  });
});

// ═════════════════════════════════════════════════════════════════════
// x402-PROTECTED ENDPOINTS (Payment required via nanopayments)
// ═════════════════════════════════════════════════════════════════════

/**
 * POST /api/agent/verify-claim — $0.001 per verification
 * 
 * The flagship x402 endpoint: AI-powered medical claim verification
 * paid per-request via Circle Gateway nanopayments.
 */
app.post(
  "/api/agent/verify-claim",
  x402PaymentRequired({
    priceUsdc: 0.001,
    resourceDescription: "AI-powered medical claim verification",
  }),
  async (req, res) => {
    try {
      const { invoiceText, memberAddress, claimAmount } = req.body;

      if (!invoiceText || !memberAddress || !claimAmount) {
        return res.status(400).json({
          error: "Missing required fields: invoiceText, memberAddress, claimAmount",
        });
      }

      const result = await processClaimWithAgents(invoiceText, memberAddress, claimAmount);

      res.json({
        success: true,
        result,
        payment: req.x402Payment,
        message: "Claim processed through multi-agent pipeline",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

/**
 * GET /api/agent/compliance-check/:address — $0.0005 per check
 */
app.get(
  "/api/agent/compliance-check/:address",
  x402PaymentRequired({
    priceUsdc: 0.0005,
    resourceDescription: "OFAC/sanctions compliance screening",
  }),
  async (req, res) => {
    try {
      const result = await screenAddressWithAgents(req.params.address);

      res.json({
        success: true,
        result,
        payment: req.x402Payment,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/agent/create-stream — $0.005 per stream creation
 */
app.post(
  "/api/agent/create-stream",
  x402PaymentRequired({
    priceUsdc: 0.005,
    resourceDescription: "Autonomous payroll stream creation",
  }),
  async (req, res) => {
    try {
      const { employeeAddress, flowRate, totalCap, employerAddress } = req.body;

      if (!employeeAddress || !flowRate || !totalCap || !employerAddress) {
        return res.status(400).json({
          error: "Missing required fields: employeeAddress, flowRate, totalCap, employerAddress",
        });
      }

      const result = await createStreamWithAgents(
        employeeAddress,
        flowRate,
        totalCap,
        employerAddress
      );

      res.json({
        success: true,
        result,
        payment: req.x402Payment,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * GET /api/agent/payroll-analytics — $0.01 per report
 */
app.get(
  "/api/agent/payroll-analytics",
  x402PaymentRequired({
    priceUsdc: 0.01,
    resourceDescription: "Comprehensive payroll analytics report",
  }),
  async (req, res) => {
    try {
      const agentBudgets = {};
      ["coordinator", "payroll", "verification", "compliance", "benefits", "settlement"].forEach(
        (name) => {
          agentBudgets[name] = getAgentBudget(name);
        }
      );

      const report = {
        generatedAt: new Date().toISOString(),
        network: "Arc Testnet (Chain ID: 5042002)",
        gasToken: "USDC",
        agentBudgetUtilization: agentBudgets,
        nanopaymentMetrics: getNanopaymentStats(),
        activitySummary: {
          totalAgentActions: getAgentActivityLog().length,
          recentActions: getAgentActivityLog().slice(-10),
        },
        contracts: {
          StreamingPayroll: "0xE366FC3cd96AFbDE41B0Fd8a3096178FaC2d1cDF",
          MicroBenefitsVault: "0x712F4a25c5c02574B56B0b4F9F1b76960a9Ea5E6",
          IdentityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
          ReputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
          AgenticCommerce: "0x0747EEf0706327138c69792bF28Cd525089e4583",
        },
      };

      res.json({
        success: true,
        report,
        payment: req.x402Payment,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ═════════════════════════════════════════════════════════════════════
// CLAIM PROCESSING ENDPOINT (Real — requires OPENAI_API_KEY)
// ═════════════════════════════════════════════════════════════════════

/**
 * POST /api/agent/process-claim — Process claim via real LangGraph agents
 * 
 * Unlike the x402-protected endpoints, this endpoint does not charge
 * per-request. It is intended for direct integration testing and
 * hackathon demo flows where the caller provides their own invoice data.
 */
app.post("/api/agent/process-claim", async (req, res) => {
  try {
    const { invoiceText, memberAddress, claimAmount } = req.body;

    if (!invoiceText || !memberAddress || !claimAmount) {
      return res.status(400).json({
        error: "Missing required fields: invoiceText, memberAddress, claimAmount",
        example: {
          invoiceText: "METRO HEALTHCARE CLINIC\\nPatient: John Doe\\nService: Checkup\\nTotal: $100.00",
          memberAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          claimAmount: 100,
        },
      });
    }

    const result = await processClaimWithAgents(invoiceText, memberAddress, claimAmount);

    res.json({
      success: true,
      result,
      message: "Claim processed through real multi-agent LangGraph pipeline",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      hint: "Ensure OPENAI_API_KEY is set in .env for real AI agent inference",
      activityLog: getAgentActivityLog().slice(-10),
    });
  }
});

// ═════════════════════════════════════════════════════════════════════
// START SERVER
// ═════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║         NexaFlow Multi-Agent Economy Server v2.0            ║
╠══════════════════════════════════════════════════════════════╣
║  Port:        ${PORT}                                          ║
║  Network:     Arc Testnet (Chain ID: 5042002)                ║
║  Gas Token:   USDC                                           ║
║                                                              ║
║  AGENTS:                                                     ║
║    ├── Coordinator    ($100 budget)                           ║
║    ├── Payroll        ($50,000 budget)                        ║
║    ├── Verification   ($500 budget)                           ║
║    ├── Compliance     ($200 budget)                           ║
║    └── Settlement     ($100,000 budget)                       ║
║                                                              ║
║  x402 ENDPOINTS:                                             ║
║    POST /api/agent/verify-claim      ($0.001/req)            ║
║    GET  /api/agent/compliance-check  ($0.0005/req)           ║
║    POST /api/agent/create-stream     ($0.005/req)            ║
║    GET  /api/agent/payroll-analytics ($0.01/req)             ║
║                                                              ║
║  CIRCLE STACK:                                               ║
║    ✓ Developer-Controlled Wallets                            ║
║    ✓ Gateway Nanopayments (x402)                             ║
║    ✓ ERC-8004 Agent Identity                                 ║
║    ✓ ERC-8183 AgenticCommerce                                ║
║    ✓ CCTP Cross-Chain Bridge                                 ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
