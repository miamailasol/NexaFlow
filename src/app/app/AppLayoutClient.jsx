'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Cpu,
  DollarSign,
  Layers,
  Menu,
  Zap,
  X,
  ArrowRight,
  Shuffle,
  Check,
  RefreshCw,
  Loader2,
  Brain,
  Send,
  ShieldAlert,
  MessageSquare,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { useNexaFlow } from '@/context/NexaFlowContext';
import Sidebar from '@/components/Sidebar';
import { NetworkIcon } from '@/components/Icons';

export default function AppLayoutClient({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  
  // Floating system local states
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState('logs'); // 'logs' or 'chat'
  const [agentLogs, setAgentLogs] = useState([]);
  const [agentBudgets, setAgentBudgets] = useState(null);
  const [serverOnline, setServerOnline] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatResponding, setIsChatResponding] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'agent',
      text: 'Hello! I am the NexaFlow AI Coordinator. How can I help you manage your streaming payroll, check compliance blacklist statuses, verify clinic invoices, or configure savings pots today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const {
    toastShow,
    toastTitle,
    toastBody,
    toastTxHash,
    isBridgeModalOpen,
    setIsBridgeModalOpen,
    bridgeAmount,
    setBridgeAmount,
    bridgeSourceChain,
    setBridgeSourceChain,
    bridgeStep,
    setBridgeStep,
    bridgeTxHash,
    bridgeMessageBytes,
    bridgeAttestation,
    bridgeStatusText,
    isBridgingInProgress,
    setIsBridgingInProgress,
    handleStartCctpBridge,
    handleMockAttestation,
    handleClaimCctpBridge,
    daysCovered,
    isWarningState
  } = useNexaFlow();

  // Poll agent server for logs and budgets
  useEffect(() => {
    const fetchAgentServerData = async () => {
      try {
        const [statusRes, activityRes, budgetRes] = await Promise.allSettled([
          fetch('http://localhost:3012/api/status'),
          fetch('http://localhost:3012/api/agents/activity?limit=15'),
          fetch('http://localhost:3012/api/agents/budgets'),
        ]);

        if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
          setServerOnline(true);
        } else {
          setServerOnline(false);
        }

        if (activityRes.status === 'fulfilled' && activityRes.value.ok) {
          const data = await activityRes.value.json();
          setAgentLogs(data.activities || []);
        } else {
          // Use fallback mock logs matching NexaFlow specifications
          setAgentLogs([
            { id: 1, agent: "System", action: "BOOTSTRAP", details: "NexaFlow Multi-Agent system initialized (Demo Mode).", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
            { id: 2, agent: "Coordinator", action: "REGISTER_AGENT", details: "ERC-8004 identity card generated for Compliance Agent (ID: 4)", timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString() },
            { id: 3, agent: "Compliance", action: "SCREENED", details: "Sanctions address check cleared. Risk Score: 0/100.", timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString() },
            { id: 4, agent: "Payroll", action: "BUDGET_CHECK", details: "Checking escrow allocation. Pre-funded buffer is stable.", timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString() }
          ]);
        }

        if (budgetRes.status === 'fulfilled' && budgetRes.value.ok) {
          const data = await budgetRes.value.json();
          setAgentBudgets(data.budgets || null);
        }
      } catch (err) {
        setServerOnline(false);
        setAgentLogs([
          { id: 1, agent: "System", action: "BOOTSTRAP", details: "NexaFlow Multi-Agent system initialized (Demo Mode).", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
          { id: 2, agent: "Coordinator", action: "REGISTER_AGENT", details: "ERC-8004 identity card generated for Compliance Agent (ID: 4)", timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString() },
          { id: 3, agent: "Compliance", action: "SCREENED", details: "Sanctions address check cleared. Risk Score: 0/100.", timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString() },
          { id: 4, agent: "Payroll", action: "BUDGET_CHECK", details: "Checking escrow allocation. Pre-funded buffer is stable.", timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString() }
        ]);
      }
    };

    fetchAgentServerData();
    const interval = setInterval(fetchAgentServerData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory((prev) => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatResponding(true);

    setTimeout(() => {
      let replyText = "I've analyzed your question regarding NexaFlow. As the AI Coordinator, I guide the Payroll, Compliance, Verification, Benefits, and Settlement agents to automate your continuous USDC ledger on Arc L1.";
      const query = currentInput.toLowerCase();

      if (query.includes('solvency') || query.includes('buffer') || query.includes('warning')) {
        replyText = "The Solvency Safety Buffer (managed by TreasuryBufferManager) protects employees from stream disruptions. If the pre-funded reserves drop below 14 days of payroll commitment, stream setup is locked and claims are prioritized for high-priority roles (Priority 1) only. You can deposit USDC to restore status.";
      } else if (query.includes('split') || query.includes('benefit') || query.includes('hsa') || query.includes('retirement') || query.includes('emergency')) {
        replyText = "When employees claim their salary stream, the MicroBenefitsVault contract automatically routes funds to saving splits: HSA (Healthcare Savings, protected by a 20% Co-op risk-sharing pool), Retirement pension (deposited directly into compound interest ERC-4626 yield-bearing vaults), and Emergency cash reserves.";
      } else if (query.includes('cctp') || query.includes('bridge')) {
        replyText = "Circle Cross-Chain Transfer Protocol (CCTP) lets employers fund their Arc Testnet escrow treasury gaslessly from Base Sepolia, Ethereum Sepolia, or Arbitrum Sepolia. The system burns the source USDC, checks for Circle attestation consensus, and mints matching USDC directly to Arc L1.";
      } else if (query.includes('gas') || query.includes('paymaster') || query.includes('passkey')) {
        replyText = "Employees utilize PasskeyAccount (WebAuthn validation) for a gasless UX. NexaPaymaster sponsors these transactions, consuming a micro gas fee ($0.0005 USDC) from the employer's pre-funded gas escrow, so workers do not need to acquire native tokens for salary claims.";
      } else if (query.includes('compliance') || query.includes('sanctions') || query.includes('ofac')) {
        replyText = "Our Compliance Agent performs automated screening by querying the on-chain ComplianceRegistry contract. If a contractor's address is flagged or matches OFAC sanction records, the stream is suspended instantly, isolating the recipient wallet for corporate security.";
      } else if (query.includes('clinic') || query.includes('invoice') || query.includes('claim') || query.includes('medical')) {
        replyText = "Medical clinic claims are signed cryptographically using EIP-712. The Verification Agent (DeepSeek v4) parses invoice line-items, verifies the clinic's credentials and signature, and routes USDC directly from the employee's HSA (absorbing deficits from the Co-op pool if necessary).";
      }

      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsChatResponding(false);
    }, 1200);
  };

  const getAgentIcon = (agentName) => {
    switch (agentName?.toLowerCase()) {
      case 'coordinator': return Brain;
      case 'compliance': return ShieldAlert;
      case 'payroll': return DollarSign;
      case 'verification': return Check;
      case 'settlement': return Send;
      default: return Cpu;
    }
  };

  const getAgentColor = (agentName) => {
    switch (agentName?.toLowerCase()) {
      case 'coordinator': return '#7c3aed';
      case 'compliance': return '#d97706';
      case 'payroll': return '#0891b2';
      case 'verification': return '#059669';
      case 'settlement': return '#ec4899';
      default: return '#4b5563';
    }
  };


  const getBottomNavClass = (path) => {
    return `mobile-bottom-nav-item ${pathname === path ? 'active' : ''}`;
  };

  const hasSolvencyWarning = daysCovered > 0 && daysCovered < 14;

  return (
    <div className="app-container" style={{ paddingTop: hasSolvencyWarning ? '44px' : '0' }}>
      {/* Dynamic Solvency Warning Banner */}
      {hasSolvencyWarning && (
        <div className="solvency-banner-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ animation: 'pulse 1.5s infinite' }}>⚠️</span>
            <span>Action Required: Payroll treasury solvency is low ({daysCovered} days covered)</span>
          </div>
          <button onClick={() => setIsBridgeModalOpen(true)}>
            Bridge USDC
          </button>
        </div>
      )}
      {/* Toast Alert Notification */}
      <div className={`payout-toast ${toastShow ? 'show' : ''}`}>
        <div className="payout-toast-header">
          <div className="payout-toast-title">⚡ Instant Settlement</div>
          <span className="badge badge-success">Secure Network</span>
        </div>
        <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-main)' }}>{toastTitle}</div>
        <div className="payout-toast-body">
          {toastBody}
          {toastTxHash && (
            <div style={{ marginTop: '8px' }}>
              <a 
                href={`https://testnet.arcscan.app/tx/${toastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="toast-explorer-link"
                style={{ 
                  color: 'var(--color-primary)', 
                  fontWeight: '800', 
                  fontSize: '11px',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <span>View on Arcscan</span>
                <ArrowRight size={10} style={{ strokeWidth: '3px' }} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Top Navbar Header */}
      <div className="mobile-navbar">
        <div className="mobile-brand">
          <div style={{ 
            width: '32px', 
            height: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'var(--color-success)', 
            border: 'var(--thin-border)', 
            borderRadius: '6px' 
          }}>
            <Zap size={16} color="var(--text-main)" fill="var(--text-main)" />
          </div>
          <span className="brand-name">NexaFlow</span>
          <span className="brand-badge" style={{ fontSize: '8px', padding: '1px 4px' }}>LIVE</span>
        </div>
        <button className="menu-toggle-btn" onClick={() => setIsMobileSidebarOpen(true)}>
          <Menu size={18} color="var(--text-main)" />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-container">
          {children}
        </div>
      </main>

      {/* Circle CCTP Portal Modal Overlay */}
      {isBridgeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBridgeModalOpen(false)}>
          <div 
            className="modal-container skew-right" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '550px' }}
          >
            <div className="modal-header-tape warning" />
            
            <button 
              className="modal-close-btn"
              onClick={() => {
                setIsBridgeModalOpen(false);
                setIsBridgingInProgress(false);
              }} 
              aria-label="Close portal"
            >
              <X size={16} />
            </button>

            <div className="modal-content-inner">
              {/* Header Block */}
              <div className="modal-header-block">
                <div className="modal-icon-badge warning">
                  <Shuffle size={22} />
                </div>
                <div className="modal-title-text">
                  <h3>Circle CCTP Bridge</h3>
                  <span>Step {bridgeStep} of 3</span>
                </div>
              </div>

              {/* Progress Steps Header */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '6px', 
                margin: '16px 0 8px',
                backgroundColor: '#F4F4F9',
                padding: '8px',
                borderRadius: '8px',
                border: 'var(--thin-border)'
              }}>
                {[
                  'Configure',
                  'Transferring',
                  'Complete'
                ].map((label, idx) => {
                  const stepNum = idx + 1;
                  const isActive = bridgeStep === stepNum;
                  const isCompleted = bridgeStep > stepNum;
                  return (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px 2px',
                        borderRadius: '6px',
                        border: isActive ? 'var(--thin-border)' : '1.5px solid transparent',
                        backgroundColor: isActive ? 'var(--color-warning)' : isCompleted ? 'var(--color-success)' : 'transparent',
                        boxShadow: isActive ? '2px 2px 0px #1A1A1A' : 'none',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        fontWeight: '800',
                        textAlign: 'center',
                        color: 'var(--text-main)',
                        opacity: isActive || isCompleted ? 1 : 0.5,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{ fontSize: '11px', display: 'block' }}>{stepNum}</span>
                      <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>{label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Step content */}
              {bridgeStep === 1 && (
                <div>
                  <p className="modal-body-desc" style={{ marginBottom: '16px' }}>
                    Select the source chain and configure the amount of USDC to deposit. The funds will be burned on the selected network and securely minted directly to your Arc Testnet Payroll Treasury.
                  </p>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">
                      Source Chain
                    </label>
                    <select 
                      className="form-input" 
                      value={bridgeSourceChain} 
                      onChange={(e) => setBridgeSourceChain(e.target.value)}
                    >
                      <option value="Base Sepolia">Base Sepolia (CCTP Domain 6)</option>
                      <option value="Ethereum Sepolia">Ethereum Sepolia (CCTP Domain 0)</option>
                      <option value="Arbitrum Sepolia">Arbitrum Sepolia (CCTP Domain 3)</option>
                    </select>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '12px', 
                    margin: '16px 0', 
                    padding: '12px', 
                    backgroundColor: '#FFF', 
                    borderRadius: '8px', 
                    border: '1.5px dashed #1A1A1A'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      <NetworkIcon name={bridgeSourceChain} size={18} />
                      <span>{bridgeSourceChain}</span>
                    </div>
                    <ArrowRight size={16} style={{ strokeWidth: '3px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      <NetworkIcon name="Arc Testnet" size={18} />
                      <span style={{ color: 'var(--color-primary)' }}>Arc Testnet</span>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label">Amount of USDC to Bridge</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={bridgeAmount || ''} 
                      onChange={(e) => setBridgeAmount(e.target.value)}
                    />
                  </div>

                  <button 
                    className="btn btn-primary" 
                    onClick={handleStartCctpBridge} 
                    style={{ width: '100%' }}
                    disabled={parseFloat(bridgeAmount) <= 0}
                  >
                    Initiate Bridge Transfer
                  </button>
                </div>
              )}

              {bridgeStep === 2 && (
                <div style={{ textAlign: 'center', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="modal-spinner-wrapper">
                    <Loader2 className="modal-loading-spinner" size={40} />
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                    {bridgeTxHash ? "Securing Circle Attestation" : "Processing Source Chain Burn"}
                  </p>
                  <div className="modal-loading-bar-container">
                    <div className="modal-loading-bar-fill" />
                  </div>
                  <p className="modal-body-desc">{bridgeStatusText}</p>
                  
                  {bridgeTxHash && (
                    <>
                      <div className="modal-details-box" style={{ margin: '8px 0 16px' }}>
                        <div className="modal-details-row">
                          <span className="modal-details-label">Burn Tx Hash</span>
                          <span className="modal-details-value address" style={{ fontSize: '11px' }}>{bridgeTxHash}</span>
                        </div>
                      </div>

                      <button 
                        className="btn btn-secondary" 
                        onClick={handleMockAttestation}
                        style={{ width: '100%' }}
                        disabled={isBridgingInProgress && bridgeStatusText.includes("claimUSDCFromBridge")}
                      >
                        ⚡ Skip / Speed Up (Mock Attestation)
                      </button>
                    </>
                  )}
                </div>
              )}

              {bridgeStep === 3 && (
                <div style={{ textAlign: 'center', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                  <div className="modal-icon-badge success" style={{ width: '64px', height: '64px', borderRadius: '50%' }}>
                    <Check size={36} />
                  </div>
                  <p style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                    Bridge Deposit Complete!
                  </p>
                  <p className="modal-body-desc">
                    Your pre-funded Arc payroll balance has been successfully credited with <strong>{bridgeAmount} USDC</strong>.
                  </p>

                  <button 
                    className="btn btn-primary" 
                    onClick={() => setIsBridgeModalOpen(false)}
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    Close Portal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating CCTP Bridge Progress Tracker */}
      {isBridgingInProgress && !isBridgeModalOpen && (
        <div className="cctp-tracker-pill">
          <div className="cctp-tracker-pill-title">
            <Shuffle size={14} style={{ color: 'var(--color-primary)' }} />
            CCTP Bridge Active
          </div>
          <div className="cctp-tracker-pill-status">
            {bridgeStatusText || 'Awaiting validation...'}
          </div>
          <button 
            className="cctp-tracker-pill-btn"
            onClick={() => setIsBridgeModalOpen(true)}
          >
            Open Bridge Portal
          </button>
        </div>
      )}

      {/* AI Agent Command Center Launcher */}
      <button 
        className="floating-agent-btn"
        onClick={() => setIsAgentDrawerOpen(!isAgentDrawerOpen)}
        aria-label="Toggle AI Agent Committee Command Center"
      >
        <Brain size={22} color="#FFFFFF" />
        <span className="floating-agent-btn-badge" />
      </button>

      {/* AI Agent Drawer */}
      <div className={`agent-drawer ${isAgentDrawerOpen ? 'open' : ''}`}>
        <div className="agent-drawer-header">
          <div className="agent-drawer-title-group">
            <span className="agent-drawer-title">Agent Coordinator</span>
            <span className="agent-drawer-subtitle">
              {serverOnline ? '● SERVER ONLINE (Port 3012)' : '● DECOUPLED MODE'}
            </span>
          </div>
          <button 
            className="agent-drawer-close"
            onClick={() => setIsAgentDrawerOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="agent-drawer-tabs">
          <button 
            className={`agent-drawer-tab ${activeDrawerTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveDrawerTab('logs')}
          >
            Consensus Logs
          </button>
          <button 
            className={`agent-drawer-tab ${activeDrawerTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveDrawerTab('chat')}
          >
            Agent Chat
          </button>
        </div>

        <div className="agent-drawer-content">
          {activeDrawerTab === 'logs' ? (
            <div className="agent-logs-list">
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #1A1A1A',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '8px',
                boxShadow: '2px 2px 0 #1A1A1A'
              }}>
                <span style={{ fontSize: '11px', fontWeight: '800', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                  🧠 Committee Utilization
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {['coord', 'pay', 'verif', 'comp', 'settle'].map((name, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: '9px', fontWeight: '800' }}>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: '#10B981', 
                        margin: '0 auto 4px'
                      }} />
                      {name}
                    </div>
                  ))}
                </div>
              </div>

              {agentLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Awaiting agent lifecycle events...
                </div>
              ) : (
                [...agentLogs].reverse().map((entry, idx) => {
                  const AgentIcon = getAgentIcon(entry.agent);
                  const agentColor = getAgentColor(entry.agent);
                  return (
                    <div key={idx} className="agent-log-item" style={{ borderLeft: `5px solid ${agentColor}` }}>
                      <div className="agent-log-icon-container" style={{ backgroundColor: agentColor }}>
                        <AgentIcon size={12} />
                      </div>
                      <div className="agent-log-body">
                        <div className="agent-log-meta">
                          <span style={{ color: agentColor, fontWeight: '800' }}>{entry.agent}</span>
                          <span>{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Live'}</span>
                        </div>
                        <div className="agent-log-action">{entry.action}</div>
                        <div className="agent-log-details">{entry.details}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="chat-history">
              <div className="chat-messages">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`chat-message ${msg.sender}`}>
                    <div>{msg.text}</div>
                    <div className="chat-message-time">{msg.timestamp}</div>
                  </div>
                ))}
                {isChatResponding && (
                  <div className="chat-message agent" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Coordinator analyzing request...</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="chat-input-form">
                <input 
                  type="text" 
                  className="chat-input"
                  placeholder="Ask agents (e.g. solvency, splits, gas)..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" className="chat-submit-btn">
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <Link href="/app" className={getBottomNavClass('/app')} onClick={() => setIsMobileSidebarOpen(false)}>
          <Activity size={18} />
          <span>Dashboard</span>
        </Link>
        <Link href="/app/agents" className={getBottomNavClass('/app/agents')} onClick={() => setIsMobileSidebarOpen(false)}>
          <Cpu size={18} />
          <span>Agents</span>
        </Link>
        <Link href="/app/streams" className={getBottomNavClass('/app/streams')} onClick={() => setIsMobileSidebarOpen(false)}>
          <DollarSign size={18} />
          <span>Streams</span>
        </Link>
        <Link href="/app/staker" className={getBottomNavClass('/app/staker')} onClick={() => setIsMobileSidebarOpen(false)}>
          <Layers size={18} />
          <span>Staking</span>
        </Link>
        <button 
          className="mobile-bottom-nav-item" 
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <Menu size={18} />
          <span>More</span>
        </button>
      </nav>

      {/* Dynamic Styled-JSX replacement containing neobrutalist specs */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* solvency-banner-bar */
        .solvency-banner-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10002;
          height: 44px;
          background-color: #FBBF24;
          border-bottom: 3px solid #1A1A1A;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          font-family: var(--font-display), sans-serif;
          font-weight: 800;
          font-size: 13px;
          text-transform: uppercase;
          color: #1A1A1A;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .solvency-banner-bar button {
          font-family: var(--font-display), sans-serif;
          font-weight: 800;
          font-size: 11px;
          background-color: #FFFFFF;
          border: 2px solid #1A1A1A;
          padding: 4px 12px;
          cursor: pointer;
          box-shadow: 2px 2px 0px #1A1A1A;
          transition: all 0.1s ease;
        }
        .solvency-banner-bar button:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px #1A1A1A;
        }

        /* cctp-tracker-pill */
        .cctp-tracker-pill {
          position: fixed;
          bottom: 84px;
          left: 20px;
          z-index: 995;
          background-color: #FFFFFF;
          border: 3px solid #1A1A1A;
          border-radius: 12px;
          padding: 14px 18px;
          width: 280px;
          box-shadow: var(--shadow-flat-sm);
          font-family: var(--font-display), sans-serif;
          color: #1A1A1A;
        }
        @media (min-width: 1025px) {
          .cctp-tracker-pill {
            left: 318px;
          }
        }
        .cctp-tracker-pill-title {
          font-weight: 900;
          font-size: 12px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .cctp-tracker-pill-status {
          font-size: 11px;
          font-family: var(--font-mono), monospace;
          color: var(--text-muted);
          margin-bottom: 10px;
        }
        .cctp-tracker-pill-btn {
          width: 100%;
          padding: 6px;
          font-size: 10px;
          font-weight: 800;
          background-color: var(--color-primary);
          color: #FFFFFF;
          border: 2px solid #1A1A1A;
          cursor: pointer;
          box-shadow: 2px 2px 0px #1A1A1A;
          transition: all 0.1s ease;
        }
        .cctp-tracker-pill-btn:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px #1A1A1A;
        }

        /* floating-agent-btn */
        .floating-agent-btn {
          position: fixed;
          bottom: 84px;
          right: 20px;
          z-index: 996;
          background-color: var(--color-primary, #7c3aed);
          border: 3px solid #1A1A1A;
          box-shadow: var(--shadow-flat-sm);
          border-radius: 50%;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .floating-agent-btn:hover {
          transform: translate(-3px, -3px) scale(1.05);
          box-shadow: var(--shadow-flat);
        }
        @media (min-width: 1025px) {
          .floating-agent-btn {
            right: 28px;
            bottom: 28px;
          }
        }
        .floating-agent-btn-badge {
          position: absolute;
          top: 0;
          right: 0;
          width: 14px;
          height: 14px;
          background-color: #10B981;
          border-radius: 50%;
          border: 2px solid #1A1A1A;
          box-shadow: 0 0 6px #10B981;
        }

        /* agent-drawer */
        .agent-drawer {
          position: fixed;
          top: 0;
          right: -420px;
          bottom: 0;
          width: 100%;
          max-width: 400px;
          background-color: #FFFFFF;
          border-left: 4px solid #1A1A1A;
          z-index: 10001;
          box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .agent-drawer.open {
          right: 0;
        }
        .agent-drawer-header {
          padding: 20px;
          border-bottom: 3px solid #1A1A1A;
          background-color: #F3F4F6;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .agent-drawer-title-group {
          display: flex;
          flex-direction: column;
        }
        .agent-drawer-title {
          font-family: var(--font-display), sans-serif;
          font-size: 16px;
          font-weight: 900;
          text-transform: uppercase;
          color: #1A1A1A;
        }
        .agent-drawer-subtitle {
          font-size: 11px;
          color: var(--text-muted);
          font-family: var(--font-mono), monospace;
        }
        .agent-drawer-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #1A1A1A;
        }
        .agent-drawer-tabs {
          display: flex;
          border-bottom: 3px solid #1A1A1A;
        }
        .agent-drawer-tab {
          flex: 1;
          padding: 12px;
          font-family: var(--font-display), sans-serif;
          font-weight: 800;
          font-size: 12px;
          text-transform: uppercase;
          background: #FFFFFF;
          border: none;
          cursor: pointer;
          text-align: center;
          border-bottom: none;
        }
        .agent-drawer-tab.active {
          background-color: var(--color-primary);
          color: #FFFFFF;
        }
        .agent-drawer-tab:first-child {
          border-right: 3px solid #1A1A1A;
        }
        .agent-drawer-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background-color: #FAFAFA;
        }
        .agent-logs-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .agent-log-item {
          background-color: #FFFFFF;
          border: 2px solid #1A1A1A;
          border-radius: 8px;
          padding: 10px 14px;
          box-shadow: 2px 2px 0 #1A1A1A;
          display: flex;
          gap: 10px;
        }
        .agent-log-icon-container {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #1A1A1A;
          color: #FFFFFF;
          flex-shrink: 0;
        }
        .agent-log-body {
          flex: 1;
          min-width: 0;
        }
        .agent-log-meta {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          font-weight: 800;
          margin-bottom: 2px;
        }
        .agent-log-action {
          font-size: 10px;
          font-weight: 800;
          color: #1A1A1A;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        .agent-log-details {
          font-size: 10px;
          color: var(--text-muted);
          line-height: 1.3;
        }
        .chat-history {
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: 100%;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-bottom: 12px;
          max-height: 380px;
        }
        .chat-message {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 2px solid #1A1A1A;
          font-size: 11px;
          line-height: 1.4;
          box-shadow: 2px 2px 0 #1A1A1A;
        }
        .chat-message.agent {
          align-self: flex-start;
          background-color: #FFFFFF;
          border-left: 5px solid var(--color-primary);
        }
        .chat-message.user {
          align-self: flex-end;
          background-color: var(--color-primary);
          color: #FFFFFF;
          border-right: 5px solid #1D4ED8;
        }
        .chat-message-time {
          font-size: 8px;
          text-align: right;
          margin-top: 4px;
          color: rgba(0,0,0,0.4);
        }
        .chat-message.user .chat-message-time {
          color: rgba(255,255,255,0.7);
        }
        .chat-input-form {
          border-top: 3px solid #1A1A1A;
          padding-top: 14px;
          display: flex;
          gap: 8px;
        }
        .chat-input {
          flex: 1;
          border: 2px solid #1A1A1A;
          padding: 8px 12px;
          font-size: 11px;
          font-family: inherit;
          border-radius: 6px;
          outline: none;
          box-shadow: inset 1px 1px 2px rgba(0,0,0,0.05);
        }
        .chat-input:focus {
          border-color: var(--color-primary);
        }
        .chat-submit-btn {
          background-color: var(--color-primary);
          color: #FFFFFF;
          border: 2px solid #1A1A1A;
          border-radius: 6px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 2px 2px 0 #1A1A1A;
          transition: all 0.1s ease;
        }
        .chat-submit-btn:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 #1A1A1A;
        }
      ` }} />
    </div>
  );
}
