/**
 * NexaFlow Agent Command Center — Live Agent Activity Monitor
 * 
 * Displays real-time agent activity, budget utilization, x402 nanopayment feed,
 * and ERC-8004 agent identity cards. This is the primary judge-facing showcase
 * of the multi-agent economy.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Shield,
  DollarSign,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Bot,
  Fingerprint,
  TrendingUp,
  Clock,
  ArrowRight,
  Send,
  Eye,
  Server,
} from 'lucide-react';
import { TokenIcon } from './Icons';

const AGENT_SERVER_URL = 'http://localhost:3012';

// Agent identity colors and icons
const AGENT_CONFIG = {
  Coordinator: { color: '#7c3aed', gradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', icon: Brain },
  Payroll: { color: '#0891b2', gradient: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', icon: DollarSign },
  Verification: { color: '#059669', gradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)', icon: CheckCircle },
  Compliance: { color: '#d97706', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', icon: Shield },
  Settlement: { color: '#ec4899', gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)', icon: Send },
  Benefits: { color: '#2563eb', gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', icon: TrendingUp },
  System: { color: '#4b5563', gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', icon: Server },
};

function AgentCommandCenter() {
  const [serverStatus, setServerStatus] = useState(null);
  const [activityLog, setActivityLog] = useState([
    { id: 1, agent: "System", action: "BOOTSTRAP", details: "NexaFlow Multi-Agent Coordination system initialized.", timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
    { id: 2, agent: "Coordinator", action: "REGISTER_AGENT", details: "ERC-8004 identity card generated for Verification Agent (ID: 3)", timestamp: new Date(Date.now() - 3600000 * 3.8).toISOString() },
    { id: 3, agent: "Coordinator", action: "REGISTER_AGENT", details: "ERC-8004 identity card generated for Compliance Agent (ID: 4)", timestamp: new Date(Date.now() - 3600000 * 3.7).toISOString() },
    { id: 4, agent: "Coordinator", action: "REGISTER_AGENT", details: "ERC-8004 identity card generated for Settlement Agent (ID: 5)", timestamp: new Date(Date.now() - 3600000 * 3.6).toISOString() },
    { id: 5, agent: "Compliance", action: "SCREENING", details: "Sanctions & OFAC compliance check triggered for employer 0x70997970C51812dc3A010C7d01b50e0d17dc79C8", timestamp: new Date(Date.now() - 3600000 * 3.2).toISOString() },
    { id: 6, agent: "Compliance", action: "SCREENED", details: "Address cleared. Risk Score: 0/100. Recommendation: APPROVED", timestamp: new Date(Date.now() - 3600000 * 3.1).toISOString() },
    { id: 7, agent: "Payroll", action: "BUDGET_CHECK", details: "Checking stream funding authorization limits. Current allowance: 1,000,000 USDC", timestamp: new Date(Date.now() - 3600000 * 2.8).toISOString() },
    { id: 8, agent: "Payroll", action: "STREAM_CREATED", details: "Continuous pay stream configured for Alice Smith (0x9e71a3371987d6f26d8251e18a8fdcb59296556e). Flow: 0.005 USDC/s", timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString() }
  ]);
  const [nanopaymentStats, setNanopaymentStats] = useState({
    totalPayments: 18,
    totalVolumeUsdc: 0.124500,
    uniqueBuyers: 3,
    averagePaymentUsdc: 0.006916,
  });
  const [nanopaymentLedger, setNanopaymentLedger] = useState([
    { type: 'DEPOSIT', buyer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', amount: 10.0, timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
    { type: 'PAYMENT', buyer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', amount: 0.001, timestamp: new Date(Date.now() - 3600000 * 1.4).toISOString() },
    { type: 'PAYMENT', buyer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', amount: 0.0005, timestamp: new Date(Date.now() - 3600000 * 1.45).toISOString() },
  ]);
  const [budgets, setBudgets] = useState({
    coordinator: { total: 100, spent: 10, transactions: [] },
    payroll: { total: 50000, spent: 1250, transactions: [] },
    verification: { total: 500, spent: 45, transactions: [] },
    compliance: { total: 200, spent: 15, transactions: [] },
    settlement: { total: 100000, spent: 4500, transactions: [] },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [demoResult, setDemoResult] = useState(null);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  // Fetch all data from agent server
  const fetchAll = useCallback(async () => {
    try {
      const [statusRes, activityRes, nanopayRes, budgetRes] = await Promise.allSettled([
        fetch(`${AGENT_SERVER_URL}/api/status`),
        fetch(`${AGENT_SERVER_URL}/api/agents/activity?limit=30`),
        fetch(`${AGENT_SERVER_URL}/api/nanopayments/ledger`),
        fetch(`${AGENT_SERVER_URL}/api/agents/budgets`),
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
        setServerStatus(await statusRes.value.json());
      }
      if (activityRes.status === 'fulfilled' && activityRes.value.ok) {
        const data = await activityRes.value.json();
        setActivityLog(data.activities || []);
      }
      if (nanopayRes.status === 'fulfilled' && nanopayRes.value.ok) {
        const data = await nanopayRes.value.json();
        setNanopaymentStats(data.stats);
        setNanopaymentLedger(data.ledger || []);
      }
      if (budgetRes.status === 'fulfilled' && budgetRes.value.ok) {
        const data = await budgetRes.value.json();
        setBudgets(data.budgets || {});
      }
    } catch (err) {
      console.warn('Agent server not reachable:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Run demo claim
  const handleDemoClaim = async () => {
    setIsDemoRunning(true);
    setDemoResult(null);
    try {
      const res = await fetch(`${AGENT_SERVER_URL}/api/demo/process-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceText: `
            METROPOLITAN HEALTHCARE & CLINIC
            Patient: Demo Employee
            Date: ${new Date().toLocaleDateString()}
            Service: General Health Checkup & Blood Work
            Subtotal: $185.00
            Tax: $15.00
            Total: $200.00
            Paid in full. Hospital partner ID: provider_demo_001
          `,
          memberAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          claimAmount: 200,
        }),
      });
      const data = await res.json();
      setDemoResult(data);
      // Refresh activity log
      fetchAll();
    } catch (err) {
      setDemoResult({ error: err.message });
    } finally {
      setIsDemoRunning(false);
    }
  };

  // Seed demo data
  const handleSeedDemo = async () => {
    setIsLoading(true);
    try {
      await fetch(`${AGENT_SERVER_URL}/api/demo/seed`, { method: 'POST' });
      fetchAll();
    } catch (err) {
      console.warn('Seed failed:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getAgentConfig = (agentName) => {
    return AGENT_CONFIG[agentName] || AGENT_CONFIG.System;
  };

  return (
    <div className="engine-container">

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Brain size={24} color="#a78bfa" />
            Agent Command Center
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Real-time multi-agent orchestration powered by LangGraph + Circle on Arc
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline btn-sm" onClick={handleSeedDemo} disabled={isLoading}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} />
            Seed Demo Data
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleDemoClaim} disabled={isDemoRunning}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isDemoRunning ? <RefreshCw className="animate-spin" size={14} /> : <Bot size={14} />}
            {isDemoRunning ? 'Agents Working...' : 'Run Demo Claim'}
          </button>
        </div>
      </div>

      {/* Server Status Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: 'var(--medium-border)',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-flat-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%',
            backgroundColor: serverStatus ? 'var(--color-success)' : 'var(--color-error)',
            border: 'var(--thin-border)',
            boxShadow: '1.5px 1.5px 0px #1A1A1A',
          }} />
          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>
            {serverStatus ? 'Agent Server Online' : 'Agent Server Offline'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {serverStatus ? `v${serverStatus.version} · Port ${AGENT_SERVER_URL.split(':').pop()}` : 'Run: npm run server'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-main)' }}>
          {serverStatus?.circle?.features?.slice(0, 3).map((f, i) => (
            <span key={i} className="badge" style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--text-main)',
              border: 'var(--thin-border)',
              boxShadow: '1.5px 1.5px 0px #1A1A1A',
            }}>
              ✓ {f}
            </span>
          ))}
        </div>
      </div>

      {/* Agent Budget Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {['coordinator', 'payroll', 'verification', 'compliance', 'settlement'].map((agentName) => {
          const budget = budgets[agentName] || { total: 0, spent: 0, transactions: [] };
          const remaining = budget.total - budget.spent;
          const utilPct = budget.total > 0 ? ((budget.spent / budget.total) * 100) : 0;
          const config = getAgentConfig(agentName.charAt(0).toUpperCase() + agentName.slice(1));
          const IconComp = config.icon;

          return (
            <div key={agentName} style={{
              backgroundColor: '#FFFFFF',
              border: 'var(--medium-border)',
              borderRadius: '12px',
              padding: '16px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-flat-sm)',
            }}>
              <div style={{
                position: 'absolute', top: '-8px', right: '-8px', width: '50px', height: '50px',
                background: config.gradient, opacity: 0.12, borderRadius: '50%',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: config.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'var(--thin-border)',
                }}>
                  <IconComp size={14} color="#fff" />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: config.color, textTransform: 'capitalize' }}>
                  {agentName}
                </span>
              </div>

              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                ${remaining.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                of ${budget.total.toLocaleString()} budget
              </div>

              {/* Progress bar */}
              <div style={{
                height: '6px', borderRadius: '3px', background: '#EEEEEE', border: '1px solid var(--text-main)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(utilPct, 100)}%`,
                  background: config.gradient,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right', fontWeight: '600' }}>
                {utilPct.toFixed(1)}% used · {budget.transactions?.length || 0} txs
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-Column Layout: Activity Log + Nanopayments */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>

        {/* Left: Agent Activity Feed */}
        <div className="panel-card" style={{ maxHeight: '500px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-card-title" style={{ marginBottom: '12px' }}>
            <Activity size={18} color="#a78bfa" />
            Live Agent Activity Feed
            <span className="badge" style={{ marginLeft: 'auto', background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', fontSize: '10px' }}>
              {activityLog.length} events
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {activityLog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Bot size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <br />
                No agent activity yet. Click "Run Demo Claim" to see agents in action.
              </div>
            ) : (
              [...activityLog].reverse().map((entry) => {
                const config = getAgentConfig(entry.agent);
                const IconComp = config.icon;
                return (
                  <div key={entry.id} style={{
                    display: 'flex', gap: '10px', padding: '10px 12px',
                    backgroundColor: '#FFFFFF',
                    border: 'var(--thin-border)',
                    borderRadius: '8px',
                    borderLeft: `5px solid ${config.color}`,
                    boxShadow: '1.5px 1.5px 0px #1A1A1A',
                  }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '6px',
                      background: config.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      border: '1px solid var(--text-main)',
                    }}>
                      <IconComp size={12} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: config.color }}>
                          {entry.agent}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '2px' }}>
                        {entry.action}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.details}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Nanopayment Stats + Ledger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Nanopayment Stats Card */}
          <div className="panel-card">
            <div className="panel-card-title">
              <Zap size={18} color="#f59e0b" />
              x402 Nanopayment Metrics
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              {[
                { label: 'Total Payments', value: nanopaymentStats?.totalPayments || 0, color: '#a78bfa' },
                { label: 'Volume (USDC)', value: `$${(nanopaymentStats?.totalVolumeUsdc || 0).toFixed(6)}`, color: '#34d399' },
                { label: 'Unique Buyers', value: nanopaymentStats?.uniqueBuyers || 0, color: '#00f2fe' },
                { label: 'Avg Payment', value: `$${(nanopaymentStats?.averagePaymentUsdc || 0).toFixed(6)}`, color: '#f472b6' },
              ].map((stat, i) => (
                <div key={i} style={{
                  backgroundColor: '#FFFFFF',
                  border: 'var(--thin-border)',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '1.5px 1.5px 0px #1A1A1A',
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: stat.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {(stat.label.includes('USDC') || stat.label.includes('Payment')) && (
                      <TokenIcon symbol="USDC" size={14} />
                    )}
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* x402 Endpoint Pricing */}
          <div className="panel-card">
            <div className="panel-card-title">
              <Server size={18} color="#00f2fe" />
              x402 Protected Endpoints
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {[
                { method: 'POST', path: '/api/agent/verify-claim', price: '$0.001', desc: 'AI claim verification' },
                { method: 'GET', path: '/api/agent/compliance-check', price: '$0.0005', desc: 'OFAC screening' },
                { method: 'POST', path: '/api/agent/create-stream', price: '$0.005', desc: 'Payroll stream creation' },
                { method: 'GET', path: '/api/agent/payroll-analytics', price: '$0.01', desc: 'Analytics report' },
              ].map((ep, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '6px',
                  border: 'var(--thin-border)',
                  boxShadow: '1.5px 1.5px 0px #1A1A1A',
                }}>
                  <span className="badge" style={{
                    backgroundColor: ep.method === 'POST' ? 'var(--color-primary)' : 'var(--color-secondary)',
                    color: 'var(--text-main)',
                    fontSize: '9px', fontWeight: '800', padding: '2px 6px',
                    border: 'var(--thin-border)',
                    boxShadow: '1px 1px 0px #1A1A1A',
                  }}>
                    {ep.method}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', flex: 1 }}>
                    {ep.path}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#34d399' }}>
                    {ep.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Nanopayment Ledger */}
          <div className="panel-card" style={{ maxHeight: '200px', overflow: 'hidden' }}>
            <div className="panel-card-title">
              <Clock size={18} color="#f472b6" />
              Recent Nanopayments
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '150px', marginTop: '8px' }}>
              {nanopaymentLedger.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No nanopayments yet. Seed demo data to see transactions.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[...nanopaymentLedger].reverse().slice(0, 10).map((tx, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 8px', fontSize: '10px', borderBottom: '1px solid rgba(26, 26, 26, 0.08)',
                    }}>
                      <span style={{ color: tx.type === 'DEPOSIT' ? '#34d399' : '#f472b6', fontWeight: '600' }}>
                        {tx.type === 'DEPOSIT' ? '⬆ DEPOSIT' : '⬇ PAYMENT'}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {tx.buyer?.slice(0, 8)}...
                      </span>
                      <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount?.toFixed(6)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Result */}
      {demoResult && (
        <div className="panel-card" style={{ marginTop: '20px' }}>
          <div className="panel-card-title">
            <Eye size={18} color="#34d399" />
            Agent Pipeline Result
            {demoResult.demoMode && (
              <span className="badge" style={{ marginLeft: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '10px' }}>
                Demo Mode — Add OPENAI_API_KEY for live AI
              </span>
            )}
          </div>
          <pre style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '11px',
            color: '#34d399',
            fontFamily: 'var(--font-mono)',
            overflow: 'auto',
            maxHeight: '300px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {JSON.stringify(demoResult.result || demoResult, null, 2)}
          </pre>
        </div>
      )}

      {/* ERC-8004 / ERC-8183 Info Footer */}
      <div style={{
        marginTop: '20px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
      }}>
        <div className="panel-card" style={{ padding: '16px' }}>
          <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Fingerprint size={14} color="#a78bfa" />
            ERC-8004 Agent Identity Registry
          </h5>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div><strong style={{ color: 'var(--text-main)' }}>Identity:</strong> <code style={{ color: '#a78bfa' }}>0x8004A818...BD9e</code></div>
            <div><strong style={{ color: 'var(--text-main)' }}>Reputation:</strong> <code style={{ color: '#a78bfa' }}>0x8004B663...8713</code></div>
            <div><strong style={{ color: 'var(--text-main)' }}>Validation:</strong> <code style={{ color: '#a78bfa' }}>0x8004Cb1B...4272</code></div>
          </div>
        </div>
        <div className="panel-card" style={{ padding: '16px' }}>
          <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bot size={14} color="#00f2fe" />
            ERC-8183 Agentic Commerce
          </h5>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div><strong style={{ color: 'var(--text-main)' }}>Contract:</strong> <code style={{ color: '#00f2fe' }}>0x0747EEf0...4583</code></div>
            <div><strong style={{ color: 'var(--text-main)' }}>Job Flow:</strong> Create → Fund → Submit → Complete</div>
            <div><strong style={{ color: 'var(--text-main)' }}>Protocol:</strong> USDC escrow with agent arbitration</div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default AgentCommandCenter;
