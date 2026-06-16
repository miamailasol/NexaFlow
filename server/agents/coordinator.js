/**
 * NexaFlow Multi-Agent Coordinator — LangGraph StateGraph
 * 
 * This is the brain of NexaFlow's autonomous agent economy.
 * It orchestrates 5 specialized agents using LangGraph's StateGraph:
 * 
 *   Coordinator → routes incoming tasks
 *     ├── Payroll Agent     → manages streams, adjusts flow rates
 *     ├── Verification Agent → AI-powered claim analysis via GPT-4o
 *     ├── Compliance Agent   → OFAC screening, risk scoring
 *     ├── Benefits Agent     → optimizes benefit splits, negotiates providers
 *     └── Settlement Agent   → executes USDC payments via Circle DCW
 * 
 * All agents are registered on-chain via ERC-8004 (IdentityRegistry)
 * and can create/complete ERC-8183 jobs (AgenticCommerce).
 */

import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import {
  verifyClaimTool,
  checkComplianceTool,
  executePaymentTool,
  createStreamTool,
  checkBudgetTool,
  registerAgentTool,
  recordReputationTool,
  createJobTool,
  initAgentBudget,
} from "./tools.js";

// ─── Agent Registry (ERC-8004 token IDs stored after registration) ─
const agentRegistry = new Map();
const agentActivityLog = [];

export function getAgentActivityLog() {
  return agentActivityLog;
}

export function getAgentRegistry() {
  return Object.fromEntries(agentRegistry);
}

// ─── Initialize Agent Budgets ───────────────────────────────────────
initAgentBudget("coordinator", 100);
initAgentBudget("payroll", 50000);
initAgentBudget("verification", 500);
initAgentBudget("compliance", 200);
initAgentBudget("benefits", 10000);
initAgentBudget("settlement", 100000);

// ─── Model Configuration ───────────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is required. Set it in your .env file for real AI agent inference.");
  console.error("   Get a key at https://platform.openai.com/api-keys");
  process.exit(1);
}

function createAgentModel(agentName, tools) {
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
    openAIApiKey: OPENAI_API_KEY,
  }).bindTools(tools);
  return model;
}

// ─── Tool Sets Per Agent ────────────────────────────────────────────
const coordinatorTools = [checkBudgetTool, createJobTool, registerAgentTool, recordReputationTool];
const payrollTools = [createStreamTool, checkBudgetTool];
const verificationTools = [verifyClaimTool, checkBudgetTool, recordReputationTool];
const complianceTools = [checkComplianceTool, checkBudgetTool];
const settlementTools = [executePaymentTool, checkBudgetTool];

// ─── All tools combined for ToolNode ────────────────────────────────
const allTools = [
  verifyClaimTool,
  checkComplianceTool,
  executePaymentTool,
  createStreamTool,
  checkBudgetTool,
  registerAgentTool,
  recordReputationTool,
  createJobTool,
];

const toolNode = new ToolNode(allTools);

// ─── System Prompts ─────────────────────────────────────────────────
const COORDINATOR_PROMPT = `You are the NexaFlow Coordinator Agent — the brain of an autonomous payroll and benefits economy on Arc blockchain.

Your responsibilities:
1. ANALYZE incoming requests and determine which specialized agent should handle them
2. DELEGATE tasks by calling the appropriate tools
3. MANAGE budgets — always check agent budgets before delegating expensive operations
4. RECORD reputation — after each successful/failed operation, record feedback via ERC-8004
5. CREATE JOBS — use ERC-8183 AgenticCommerce to create escrow-funded jobs between agents

You manage 5 sub-agents:
- Payroll Agent: Creates/manages USDC salary streams. Budget: $50,000
- Verification Agent: AI-powered medical claim analysis. Budget: $500  
- Compliance Agent: OFAC/sanctions screening. Budget: $200
- Benefits Agent: Manages benefit allocations. Budget: $10,000
- Settlement Agent: Executes USDC payments. Budget: $100,000

For EVERY task:
1. First check the relevant agent's budget
2. Then execute the appropriate tool(s)
3. Finally record a reputation event for the agent that performed the work

Always respond with structured JSON analysis of your decisions.`;

const VERIFICATION_PROMPT = `You are the NexaFlow Verification Agent — an autonomous AI claims analyst.

Your sole purpose is to verify medical and benefits claims using AI analysis.

For each claim:
1. Analyze the invoice text for legitimacy indicators
2. Cross-validate the claimed amount against invoice totals
3. Check for fraud patterns (duplicate claims, excessive amounts, missing provider info)
4. Generate a verification hash for on-chain settlement
5. Provide a confidence score (0-1) and risk level (LOW/MEDIUM/HIGH)

You MUST call verify_medical_claim for every verification request.
If confidence < 0.5, recommend rejection.
If risk is HIGH, recommend manual review.

You are paid $0.001 per verification via x402 nanopayments.`;

const COMPLIANCE_PROMPT = `You are the NexaFlow Compliance Agent — an autonomous OFAC and sanctions screening system.

For every address you screen:
1. Check against OFAC SDN list
2. Check for PEP (Politically Exposed Person) status
3. Analyze on-chain activity for suspicious patterns
4. Generate a risk score (0-100)
5. Provide a clear APPROVED/REVIEW/BLOCK recommendation

You MUST call check_compliance for every screening request.
Cost: $0.0005 per screening via x402 nanopayments.`;

// ─── Node Functions ─────────────────────────────────────────────────

function logActivity(agent, action, details) {
  const entry = {
    id: agentActivityLog.length + 1,
    agent,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  agentActivityLog.push(entry);
  // Keep only last 200 entries
  if (agentActivityLog.length > 200) {
    agentActivityLog.splice(0, agentActivityLog.length - 200);
  }
  return entry;
}

async function coordinatorNode(state) {
  logActivity("Coordinator", "ROUTING", "Analyzing incoming request and delegating to sub-agents");

  const model = createAgentModel("coordinator", coordinatorTools);
  const systemMsg = new SystemMessage(COORDINATOR_PROMPT);
  const response = await model.invoke([systemMsg, ...state.messages]);

  logActivity("Coordinator", "DECIDED", response.content?.slice?.(0, 200) || "Decision made");

  return { messages: [response] };
}

async function verificationNode(state) {
  logActivity("Verification", "ANALYZING", "Processing claim verification request");

  const model = createAgentModel("verification", verificationTools);
  const systemMsg = new SystemMessage(VERIFICATION_PROMPT);
  const response = await model.invoke([systemMsg, ...state.messages]);

  logActivity("Verification", "COMPLETED", response.content?.slice?.(0, 200) || "Verification done");

  return { messages: [response] };
}

async function complianceNode(state) {
  logActivity("Compliance", "SCREENING", "Running OFAC/sanctions compliance check");

  const model = createAgentModel("compliance", complianceTools);
  const systemMsg = new SystemMessage(COMPLIANCE_PROMPT);
  const response = await model.invoke([systemMsg, ...state.messages]);

  logActivity("Compliance", "SCREENED", response.content?.slice?.(0, 200) || "Compliance check done");

  return { messages: [response] };
}

async function payrollNode(state) {
  logActivity("Payroll", "MANAGING", "Processing payroll stream operation");

  const model = createAgentModel("payroll", payrollTools);
  const systemMsg = new SystemMessage(
    "You are the NexaFlow Payroll Agent. You create and manage USDC salary streams on the StreamingPayroll contract. Always check budget before creating streams."
  );
  const response = await model.invoke([systemMsg, ...state.messages]);

  logActivity("Payroll", "PROCESSED", response.content?.slice?.(0, 200) || "Payroll operation done");

  return { messages: [response] };
}

async function settlementNode(state) {
  logActivity("Settlement", "SETTLING", "Executing USDC payment via Circle DCW");

  const model = createAgentModel("settlement", settlementTools);
  const systemMsg = new SystemMessage(
    "You are the NexaFlow Settlement Agent. You execute USDC payments via Circle Developer-Controlled Wallets on Arc Testnet. Always check budget before paying. Include the agentName 'settlement' when calling execute_usdc_payment."
  );
  const response = await model.invoke([systemMsg, ...state.messages]);

  logActivity("Settlement", "SETTLED", response.content?.slice?.(0, 200) || "Payment settled");

  return { messages: [response] };
}

// ─── Router Function ────────────────────────────────────────────────
function routeAfterCoordinator(state) {
  const lastMessage = state.messages[state.messages.length - 1];

  // If the coordinator called tools, go to tool execution
  if (lastMessage?.tool_calls?.length > 0) {
    return "tools";
  }

  // Analyze content for routing keywords
  const content = (lastMessage?.content || "").toLowerCase();

  if (content.includes("verif") || content.includes("claim") || content.includes("invoice")) {
    return "verification";
  }
  if (content.includes("compliance") || content.includes("ofac") || content.includes("screen")) {
    return "compliance";
  }
  if (content.includes("stream") || content.includes("payroll") || content.includes("salary")) {
    return "payroll";
  }
  if (content.includes("pay") || content.includes("settle") || content.includes("transfer")) {
    return "settlement";
  }

  return END;
}

function routeAfterAgent(state) {
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage?.tool_calls?.length > 0) {
    return "tools";
  }
  return END;
}

// ─── Build the StateGraph ───────────────────────────────────────────
export function buildAgentGraph() {
  const graph = new StateGraph(MessagesAnnotation)
    // Add nodes
    .addNode("coordinator", coordinatorNode)
    .addNode("verification", verificationNode)
    .addNode("compliance", complianceNode)
    .addNode("payroll", payrollNode)
    .addNode("settlement", settlementNode)
    .addNode("tools", toolNode)

    // Entry point
    .addEdge(START, "coordinator")

    // Coordinator routes to agents or tools
    .addConditionalEdges("coordinator", routeAfterCoordinator, [
      "tools",
      "verification",
      "compliance",
      "payroll",
      "settlement",
      END,
    ])

    // Tools always return to coordinator for next decision
    .addEdge("tools", "coordinator")

    // Each agent can call tools or end
    .addConditionalEdges("verification", routeAfterAgent, ["tools", END])
    .addConditionalEdges("compliance", routeAfterAgent, ["tools", END])
    .addConditionalEdges("payroll", routeAfterAgent, ["tools", END])
    .addConditionalEdges("settlement", routeAfterAgent, ["tools", END]);

  return graph.compile();
}

// ─── High-Level Invocation Functions ────────────────────────────────

/**
 * Process a benefits claim through the full agent pipeline
 */
export async function processClaimWithAgents(invoiceText, memberAddress, claimAmount) {
  const app = buildAgentGraph();

  const input = {
    messages: [
      new HumanMessage(
        `Process this medical benefits claim:\n\n` +
        `Member: ${memberAddress}\n` +
        `Claimed Amount: $${claimAmount} USDC\n` +
        `Invoice:\n${invoiceText}\n\n` +
        `Steps required:\n` +
        `1. Check compliance on the member address\n` +
        `2. Verify the claim legitimacy using AI analysis\n` +
        `3. If approved, execute USDC payment to the service provider\n` +
        `4. Record reputation for the verification agent`
      ),
    ],
  };

  logActivity("System", "CLAIM_RECEIVED", `Claim of $${claimAmount} from ${memberAddress.slice(0, 10)}...`);

  const result = await app.invoke(input);
  return {
    messages: result.messages.map((m) => ({
      role: m._getType?.() || "unknown",
      content: m.content,
      toolCalls: m.tool_calls || [],
    })),
    activityLog: agentActivityLog.slice(-20),
  };
}

/**
 * Create a payroll stream through the agent pipeline
 */
export async function createStreamWithAgents(employeeAddress, flowRate, totalCap, employerAddress) {
  const app = buildAgentGraph();

  const input = {
    messages: [
      new HumanMessage(
        `Create a new payroll stream:\n\n` +
        `Employee: ${employeeAddress}\n` +
        `Flow Rate: ${flowRate} USDC/second\n` +
        `Total Cap: ${totalCap} USDC\n` +
        `Employer: ${employerAddress}\n\n` +
        `Steps required:\n` +
        `1. Check compliance on the employee address\n` +
        `2. Check payroll agent budget\n` +
        `3. Create the payroll stream`
      ),
    ],
  };

  logActivity("System", "STREAM_REQUEST", `Stream for ${employeeAddress.slice(0, 10)}... at ${flowRate} USDC/s`);

  const result = await app.invoke(input);
  return {
    messages: result.messages.map((m) => ({
      role: m._getType?.() || "unknown",
      content: m.content,
      toolCalls: m.tool_calls || [],
    })),
    activityLog: agentActivityLog.slice(-20),
  };
}

/**
 * Run a compliance screening through the agent pipeline
 */
export async function screenAddressWithAgents(address) {
  const app = buildAgentGraph();

  const input = {
    messages: [
      new HumanMessage(
        `Screen this address for compliance:\n\n` +
        `Address: ${address}\n\n` +
        `Run a full OFAC/sanctions compliance check and provide a recommendation.`
      ),
    ],
  };

  logActivity("System", "COMPLIANCE_REQUEST", `Screening ${address.slice(0, 10)}...`);

  const result = await app.invoke(input);
  return {
    messages: result.messages.map((m) => ({
      role: m._getType?.() || "unknown",
      content: m.content,
      toolCalls: m.tool_calls || [],
    })),
    activityLog: agentActivityLog.slice(-20),
  };
}

export default {
  buildAgentGraph,
  processClaimWithAgents,
  createStreamWithAgents,
  screenAddressWithAgents,
  getAgentActivityLog,
  getAgentRegistry,
};
