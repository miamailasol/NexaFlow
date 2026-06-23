/**
 * NexaFlow Supabase Persistent Database Layer
 * 
 * Provides server-side PostgreSQL/Supabase persistence for:
 * 1. DAO / Community Feature Suggestions, votes, comments, and user profiles.
 * 2. Multi-Agent activity logs.
 * 3. x402 nanopayment ledgers and client balances cache.
 * 
 * This establishes real, robust database synchronization replacing local files.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured in .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Default suggestions to populate DB on first run
const defaultSuggestions = [
  {
    id: "suggest-1",
    title: "Multi-currency streaming support (EURC, USDC, yield stablecoins)",
    description: "Allow employers to stream not just USDC but also EURC or yield-bearing stablecoins directly to remote contractors. This makes international salary payouts much more flexible.",
    category: "Payroll",
    status: "In Progress",
    impact: "High",
    upvotes: 48,
    downvotes: 2,
    submitterAddress: "0x71C9592AC392A7210100282121B66f343cde10ac",
    submitterName: "NexaAdmin",
    date: "3 days ago",
    comments: [
      {
        id: "c-1",
        authorName: "Tan Wei Liang",
        authorAddress: "0x9e71a3371987d6f26d8251e18a8fdcb59296556e",
        content: "This is super critical for our European remote engineers!",
        timestamp: "2 days ago"
      },
      {
        id: "c-2",
        authorName: "Alice Smith",
        authorAddress: "0x32a78f26d8251e18a8fdcb59296556e41ef4a25c",
        content: "Awesome, yield-bearing streams will be a game changer for long term escrows.",
        timestamp: "1 day ago"
      }
    ],
    votedUsers: {
      "0x71c9592ac392a7210100282121b66f343cde10ac": "up",
      "0x9e71a3371987d6f26d8251e18a8fdcb59296556e": "up"
    }
  },
  {
    id: "suggest-2",
    title: "Apple Pay / Google Pay integrations for Biometric Wallets",
    description: "Enable top-up or withdrawal of stablecoins directly to bank cards using Apple Pay/Google Pay via Circle on-ramp precompiles. Great for mobile-first employees.",
    category: "Smart Wallet",
    status: "Planned",
    impact: "Medium",
    upvotes: 35,
    downvotes: 1,
    submitterAddress: "0x98b8c01ac5c02574B56B0b4F9F1b76960a9Ea5E6",
    submitterName: "UserX",
    date: "5 days ago",
    comments: [],
    votedUsers: {}
  },
  {
    id: "suggest-3",
    title: "Automated Tax Filing & Local compliance helper exports",
    description: "Automatically calculate, withhold, and generate tax forms (e.g. W-8BEN, W-9) based on country code rules. Makes cross-border hiring compliance effortless.",
    category: "Security",
    status: "Planned",
    impact: "High",
    upvotes: 29,
    downvotes: 0,
    submitterAddress: "0x51c5b4F9F1b76960a9Ea5E610000000000000000",
    submitterName: "BizDev",
    date: "1 week ago",
    comments: [
      {
        id: "c-3",
        authorName: "Developer SG",
        authorAddress: "0x42fef12345678901234567890123456789012345",
        content: "We need this to comply with Singapore IRAS guidelines.",
        timestamp: "5 days ago"
      }
    ],
    votedUsers: {}
  },
  {
    id: "suggest-4",
    title: "Agent Command Center: Automate pay rules via custom LLM prompts",
    description: "Let users write natural language rules like 'If my employee works > 40 hours or submits a verified git commit, stream an extra 50 USDC buffer automatically.'",
    category: "Agents",
    status: "Completed",
    impact: "High",
    upvotes: 62,
    downvotes: 3,
    submitterAddress: "0x88fca21c392A7210100282121B66f343cde10ac1",
    submitterName: "DevGuru",
    date: "2 weeks ago",
    comments: [
      {
        id: "c-4",
        authorName: "Founder Beta",
        authorAddress: "0x1129994F9F1b76960a9Ea5E61000000000000000",
        content: "Works like a charm! Love the integration with compliance scanner.",
        timestamp: "1 week ago"
      }
    ],
    votedUsers: {}
  }
];

// ─── Suggestions (DAO Voting) Operations ─────────────────────────────
export async function getSuggestions() {
  try {
    const { data, error } = await supabase
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching suggestions:", error.message);
      return [];
    }

    const { data: comments, error: commentError } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: true });

    const commentsMap = {};
    if (comments) {
      comments.forEach(c => {
        if (!commentsMap[c.suggestion_id]) {
          commentsMap[c.suggestion_id] = [];
        }
        commentsMap[c.suggestion_id].push({
          id: c.id,
          authorName: c.author_name,
          authorAddress: c.author_address,
          content: c.content,
          timestamp: c.timestamp
        });
      });
    }

    return (data || []).map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      category: s.category,
      status: s.status,
      impact: s.impact,
      upvotes: s.upvotes,
      downvotes: s.downvotes,
      submitterAddress: s.submitter_address,
      submitterName: s.submitter_name,
      date: s.date,
      votedUsers: s.voted_users || {},
      comments: commentsMap[s.id] || []
    }));
  } catch (err) {
    console.error("Failed to read suggestions:", err);
    return [];
  }
}

export async function addSuggestion(s) {
  try {
    const { error } = await supabase
      .from("suggestions")
      .insert([{
        id: s.id,
        title: s.title,
        description: s.description,
        category: s.category,
        status: s.status,
        impact: s.impact,
        upvotes: s.upvotes || 0,
        downvotes: s.downvotes || 0,
        submitter_address: s.submitterAddress,
        submitter_name: s.submitterName,
        date: s.date,
        voted_users: s.votedUsers || {}
      }]);
    if (error) {
      console.error("Error adding suggestion:", error.message);
    }
  } catch (err) {
    console.error("Failed to save suggestion:", err);
  }
  return s;
}

export async function voteSuggestion(id, voterAddress, voteType) {
  const voterId = voterAddress.toLowerCase();

  try {
    const { data: s, error: fetchErr } = await supabase
      .from("suggestions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !s) {
      return { success: false, message: "Suggestion not found" };
    }

    const currentVote = s.voted_users?.[voterId] || null;
    let newVotedUsers = { ...(s.voted_users || {}) };
    let upvotes = s.upvotes || 0;
    let downvotes = s.downvotes || 0;
    let msg = "";

    if (currentVote === voteType) {
      if (voteType === "up") upvotes = Math.max(0, upvotes - 1);
      else downvotes = Math.max(0, downvotes - 1);
      delete newVotedUsers[voterId];
      msg = "Vote removed";
    } else {
      if (currentVote === "up") upvotes = Math.max(0, upvotes - 1);
      if (currentVote === "down") downvotes = Math.max(0, downvotes - 1);

      if (voteType === "up") {
        upvotes += 1;
        msg = "Upvoted suggestion";
      } else {
        downvotes += 1;
        msg = "Downvoted suggestion";
      }
      newVotedUsers[voterId] = voteType;
    }

    const { error: updateErr } = await supabase
      .from("suggestions")
      .update({
        upvotes,
        downvotes,
        voted_users: newVotedUsers
      })
      .eq("id", id);

    if (updateErr) {
      console.error("Error updating vote:", updateErr.message);
      return { success: false, error: updateErr.message };
    }

    const updatedSuggestions = await getSuggestions();
    return { success: true, message: msg, suggestions: updatedSuggestions };
  } catch (err) {
    console.error("Failed to vote suggestion:", err);
    return { success: false, error: err.message };
  }
}

export async function addComment(proposalId, comment) {
  try {
    const { error } = await supabase
      .from("comments")
      .insert([{
        id: comment.id,
        suggestion_id: proposalId,
        author_name: comment.authorName,
        author_address: comment.authorAddress,
        content: comment.content,
        timestamp: comment.timestamp
      }]);
    
    if (error) {
      console.error("Error inserting comment:", error.message);
    }
  } catch (err) {
    console.error("Failed to add comment:", err);
  }

  const suggestions = await getSuggestions();
  return suggestions.find((s) => s.id === proposalId);
}

// ─── Profile Operations ──────────────────────────────────────────────
export async function getProfile(address) {
  const key = address.toLowerCase();
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("address", key)
      .single();

    if (error || !data) {
      const defaultProf = {
        address: key,
        name: `Contributor ${address.slice(0, 6)}...${address.slice(-4)}`,
        bio: "NexaFlow Web3 Contributor",
        reputation: 10
      };
      await supabase.from("profiles").insert([defaultProf]);
      return defaultProf;
    }

    return data;
  } catch (err) {
    console.error("Failed to read profile:", err);
    return { address: key, name: "Anonymous Contributor", bio: "NexaFlow Contributor", reputation: 10 };
  }
}

export async function saveProfile(address, profile) {
  const key = address.toLowerCase();
  try {
    const existing = await getProfile(address);
    const updated = {
      name: profile.name !== undefined ? profile.name : existing.name,
      bio: profile.bio !== undefined ? profile.bio : existing.bio,
      reputation: profile.reputation !== undefined ? profile.reputation : existing.reputation
    };

    const { error } = await supabase
      .from("profiles")
      .update(updated)
      .eq("address", key);

    if (error) {
      console.error("Error saving profile:", error.message);
    }
    return { address: key, ...updated };
  } catch (err) {
    console.error("Failed to save profile:", err);
    return { address: key, ...profile };
  }
}

export async function incrementReputation(address, val) {
  try {
    const key = address.toLowerCase();
    const existing = await getProfile(address);
    const newRep = (existing.reputation || 0) + val;

    await supabase
      .from("profiles")
      .update({ reputation: newRep })
      .eq("address", key);

    return { ...existing, reputation: newRep };
  } catch (err) {
    console.error("Failed to increment reputation:", err);
  }
}

// ─── Agent Logs Operations ───────────────────────────────────────────
export async function getAgentLogs() {
  try {
    const { data, error } = await supabase
      .from("agent_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(300);

    if (error) {
      console.error("Error reading agent logs:", error.message);
      return [];
    }

    return (data || []).reverse().map(l => ({
      id: l.id,
      agent: l.agent,
      action: l.action,
      details: l.details,
      timestamp: l.timestamp
    }));
  } catch (err) {
    console.error("Failed to fetch agent logs:", err);
    return [];
  }
}

export async function addAgentLog(entry) {
  try {
    const { error } = await supabase
      .from("agent_logs")
      .insert([{
        agent: entry.agent,
        action: entry.action,
        details: entry.details,
        timestamp: entry.timestamp || new Date().toISOString()
      }]);
    if (error) {
      console.error("Error inserting agent log:", error.message);
    }
  } catch (err) {
    console.error("Failed to insert agent log:", err);
  }
  return entry;
}

// ─── x402 Operations ─────────────────────────────────────────────────
export async function getX402Ledger() {
  try {
    const { data, error } = await supabase
      .from("x402_ledger")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Error reading x402 ledger:", error.message);
      return [];
    }

    return (data || []).reverse().map(l => ({
      type: l.sender === "0x0000000000000000000000000000000000000000" ? "DEPOSIT" : "PAYMENT",
      buyer: l.sender === "0x0000000000000000000000000000000000000000" ? l.recipient : l.sender,
      seller: l.recipient,
      amount: parseFloat(l.amount || 0),
      resource: l.nonce.startsWith("deposit") ? "USDC Nanopayment Deposit" : "Protected API resource",
      signature: l.signature,
      timestamp: l.timestamp,
      settled: true
    }));
  } catch (err) {
    console.error("Failed to read x402 ledger:", err);
    return [];
  }
}

export async function addX402Record(record) {
  try {
    const isDeposit = record.type === "DEPOSIT";
    const sender = isDeposit ? "0x0000000000000000000000000000000000000000" : (record.buyer || "unknown");
    const recipient = isDeposit ? (record.buyer || "unknown") : (record.seller || "unknown");
    const nonce = isDeposit ? `deposit-${Date.now()}` : `payment-${Date.now()}`;

    const { error } = await supabase
      .from("x402_ledger")
      .insert([{
        payment_id: record.signature || `p-${Date.now()}`,
        sender,
        recipient,
        amount: record.amount || 0,
        nonce,
        signature: record.signature || "none",
        tx_hash: record.txHash || null,
        timestamp: record.timestamp || new Date().toISOString()
      }]);

    if (error) {
      console.error("Error inserting x402 record:", error.message);
    }
  } catch (err) {
    console.error("Failed to save x402 record:", err);
  }
  return record;
}

export async function getX402Balance(buyerAddress) {
  try {
    const key = buyerAddress.toLowerCase();
    const { data, error } = await supabase
      .from("x402_balances")
      .select("*")
      .eq("address", key)
      .single();

    if (error || !data) {
      return 0;
    }
    return parseFloat(data.balance || "0");
  } catch (err) {
    console.error("Failed to get x402 balance:", err);
    return 0;
  }
}

export async function setX402Balance(buyerAddress, balance) {
  try {
    const key = buyerAddress.toLowerCase();
    const { error } = await supabase
      .from("x402_balances")
      .upsert([{
        address: key,
        balance: balance,
        updated_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("Error upserting balance:", error.message);
    }
  } catch (err) {
    console.error("Failed to set x402 balance:", err);
  }
  return balance;
}

export async function depositX402(buyerAddress, amountUsdc) {
  try {
    const key = buyerAddress.toLowerCase();
    const current = await getX402Balance(buyerAddress);
    const newBal = current + amountUsdc;
    await setX402Balance(buyerAddress, newBal);
    return newBal;
  } catch (err) {
    console.error("Failed to deposit x402:", err);
  }
}

// ─── Initial Database Seeding ─────────────────────────────────────────
const defaultAgentLogs = [
  { agent: "System", action: "BOOTSTRAP", details: "NexaFlow Multi-Agent Coordination system initialized.", timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
  { agent: "Coordinator", action: "REGISTER_AGENT", details: "ERC-8004 identity card generated for Verification Agent (ID: 3)", timestamp: new Date(Date.now() - 3600000 * 3.8).toISOString() },
  { agent: "Coordinator", action: "REGISTER_AGENT", details: "ERC-8004 identity card generated for Compliance Agent (ID: 4)", timestamp: new Date(Date.now() - 3600000 * 3.7).toISOString() },
  { agent: "Coordinator", action: "REGISTER_AGENT", details: "ERC-8004 identity card generated for Settlement Agent (ID: 5)", timestamp: new Date(Date.now() - 3600000 * 3.6).toISOString() },
  { agent: "Compliance", action: "SCREENING", details: "Sanctions & OFAC compliance check triggered for employer 0x70997970C51812dc3A010C7d01b50e0d17dc79C8", timestamp: new Date(Date.now() - 3600000 * 3.2).toISOString() },
  { agent: "Compliance", action: "SCREENED", details: "Address cleared. Risk Score: 0/100. Recommendation: APPROVED", timestamp: new Date(Date.now() - 3600000 * 3.1).toISOString() },
  { agent: "Payroll", action: "BUDGET_CHECK", details: "Checking stream funding authorization limits. Current allowance: 1,000,000 USDC", timestamp: new Date(Date.now() - 3600000 * 2.8).toISOString() },
  { agent: "Payroll", action: "STREAM_CREATED", details: "Continuous pay stream configured for Alice Smith (0x9e71a3371987d6f26d8251e18a8fdcb59296556e). Flow: 0.005 USDC/s", timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString() },
  { agent: "System", action: "CLAIM_RECEIVED", details: "Benefits claim of $200.00 USDC submitted by demo employee 0x70997970C51812dc3A010C7d01b50e0d17dc79C8", timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString() },
  { agent: "Coordinator", action: "ROUTING", details: "Routing medical benefits claim verification request to Verification Agent", timestamp: new Date(Date.now() - 3600000 * 1.48).toISOString() },
  { agent: "Compliance", action: "SCREENING", details: "Running sanction checklist check on claimant 0x70997970C51812dc3A010C7d01b50e0d17dc79C8", timestamp: new Date(Date.now() - 3600000 * 1.45).toISOString() },
  { agent: "Compliance", action: "SCREENED", details: "Claimant cleared. Recommendation: APPROVED", timestamp: new Date(Date.now() - 3600000 * 1.44).toISOString() },
  { agent: "Verification", action: "ANALYZING", details: "DeepSeek v4 parsing invoice text. Clinic provider validation: PASS. Sum check: PASS.", timestamp: new Date(Date.now() - 3600000 * 1.4).toISOString() },
  { agent: "Verification", action: "COMPLETED", details: "Claim verified as LEGITIMATE with confidence score: 0.98. Signature hash created.", timestamp: new Date(Date.now() - 3600000 * 1.35).toISOString() },
  { agent: "Settlement", action: "SETTLING", details: "Initiating USDC refund disbursement of $200.00 USDC via Circle Developer Wallet", timestamp: new Date(Date.now() - 3600000 * 1.3).toISOString() },
  { agent: "Settlement", action: "SETTLED", details: "Disbursement completed on-chain. Tx: 0x9beff4270d4bde28cd525089e45831938b8c01ac5c02574B56B0b4F9F1b76960", timestamp: new Date(Date.now() - 3600000 * 1.25).toISOString() },
  { agent: "Coordinator", action: "RECORDING", details: "Updating Verification Agent reputation scores (+10 points for successful claim settlement)", timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString() },
  { agent: "Coordinator", action: "COMPLETED", details: "Benefits claim process completed successfully", timestamp: new Date(Date.now() - 3600000 * 1.15).toISOString() }
];

const defaultX402Ledger = [
  { payment_id: "p-init-1", sender: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", recipient: "0xCA2DE969C3266f530a27bE3B46EC0550cF609c67", amount: 0.001, nonce: "payment-1", signature: "0x123...456", timestamp: new Date(Date.now() - 3600000 * 1.4).toISOString() },
  { payment_id: "p-init-2", sender: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", recipient: "0xCA2DE969C3266f530a27bE3B46EC0550cF609c67", amount: 0.0005, nonce: "payment-2", signature: "0x789...101", timestamp: new Date(Date.now() - 3600000 * 1.45).toISOString() },
  { payment_id: "p-init-3", sender: "0x0000000000000000000000000000000000000000", recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", amount: 10.0, nonce: "deposit-1", signature: "0xabc...def", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
];

async function seedDBIfEmpty() {
  try {
    // 1. Suggestions Seeding
    const { count: sugCount, error: sugErr } = await supabase
      .from("suggestions")
      .select("*", { count: "exact", head: true });

    if (sugErr) {
      console.log("Supabase connection check failed:", sugErr.message);
      return;
    }

    if (sugCount === 0) {
      console.log("🌱 Database suggestions table is empty. Seeding defaults...");
      for (const s of defaultSuggestions) {
        await addSuggestion(s);
        if (s.comments && s.comments.length > 0) {
          for (const c of s.comments) {
            await supabase.from("comments").insert([{
              id: c.id,
              suggestion_id: s.id,
              author_name: c.authorName,
              author_address: c.authorAddress,
              content: c.content,
              timestamp: c.timestamp
            }]);
          }
        }
      }
      console.log("✅ Suggestions seeding completed successfully!");
    } else {
      console.log("✅ Suggestions table verified. Found:", sugCount);
    }

    // 2. Agent Logs Seeding
    const { count: logCount, error: logErr } = await supabase
      .from("agent_logs")
      .select("*", { count: "exact", head: true });

    if (!logErr && logCount === 0) {
      console.log("🌱 Database agent_logs table is empty. Seeding defaults...");
      const { error: insertErr } = await supabase.from("agent_logs").insert(
        defaultAgentLogs.map(l => ({
          agent: l.agent,
          action: l.action,
          details: l.details,
          timestamp: l.timestamp
        }))
      );
      if (insertErr) {
        console.error("Error seeding agent_logs:", insertErr.message);
      } else {
        console.log("✅ Agent logs seeding completed successfully!");
      }
    } else if (!logErr) {
      console.log("✅ Agent logs table verified. Found:", logCount);
    }

    // 3. x402 Ledger Seeding
    const { count: ledCount, error: ledErr } = await supabase
      .from("x402_ledger")
      .select("*", { count: "exact", head: true });

    if (!ledErr && ledCount === 0) {
      console.log("🌱 Database x402_ledger table is empty. Seeding defaults...");
      const { error: insertErr } = await supabase.from("x402_ledger").insert(
        defaultX402Ledger.map(l => ({
          payment_id: l.payment_id,
          sender: l.sender,
          recipient: l.recipient,
          amount: l.amount,
          nonce: l.nonce,
          signature: l.signature,
          timestamp: l.timestamp
        }))
      );
      if (insertErr) {
        console.error("Error seeding x402_ledger:", insertErr.message);
      } else {
        console.log("✅ x402 ledger seeding completed successfully!");
      }
    } else if (!ledErr) {
      console.log("✅ x402 ledger table verified. Found:", ledCount);
    }

    // 4. x402 Balances Seeding
    const defaultDemoAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".toLowerCase();
    const { count: balCount, error: balErr } = await supabase
      .from("x402_balances")
      .select("*", { count: "exact", head: true });

    if (!balErr && balCount === 0) {
      console.log("🌱 Database x402_balances table is empty. Seeding defaults...");
      const { error: insertErr } = await supabase.from("x402_balances").insert([
        {
          address: defaultDemoAddress,
          balance: 10.0,
          updated_at: new Date().toISOString()
        }
      ]);
      if (insertErr) {
        console.error("Error seeding x402_balances:", insertErr.message);
      } else {
        console.log("✅ x402 balances seeding completed successfully!");
      }
    } else if (!balErr) {
      console.log("✅ x402 balances table verified. Found:", balCount);
    }

  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}

// Perform seed check asynchronously
seedDBIfEmpty();
