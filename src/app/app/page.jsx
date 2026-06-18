'use client';

import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Download,
  Plus,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Cpu,
  Layers,
  HeartHandshake,
  Zap,
  Check
} from 'lucide-react';
import { useNexaFlow } from '@/context/NexaFlowContext';
import { TokenIcon } from '@/components/Icons';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function DashboardOverview() {
  const {
    employees,
    transactions,
    isDcwLoading,
    totalStreamedUSDC,
    activeCount,
    isWarningState,
    employerBuffer,
    totalMonthlyCommitment,
    daysCovered,
    bufferAmount,
    setBufferAmount,
    handleDepositBuffer,
    handleWithdrawBuffer,
    isBufferLoading,
    autoPilot,
    handleToggleAutoPilot,
    dcwAddress,
    dcwWalletId,
    isDcwCreating,
    dcwError,
    handleProvisionDcw,
    dcwIsLive,
    dcwBalance,
    handleRefreshDcwBalance,
    employerPayrollBalance,
    setBridgeStep,
    setIsBridgeModalOpen,
    benefitsConfig,
    healthBalance,
    liveRetirement,
    liveEmergency,
    totalAccruedTax,
    isSigner,
    withdrawLeftoverAmount,
    setWithdrawLeftoverAmount,
    newOracleAddress,
    setNewOracleAddress,
    handleProposeWithdrawLeftover,
    handleProposeSetOracle,
    isProposing,
    proposals,
    handleConfirmProposal,
    handleExecuteProposal,
    exportAuditLogsToCSV,
    referralEmployee,
    setReferralEmployee,
    referralReferrer,
    setReferralReferrer,
    referralRate,
    setReferralRate,
    referralLoading,
    handleRegisterReferral,
    showOnboarding,
    setShowOnboarding,
    step1Done,
    step2Done,
    step3Done,
    step4Done,
    onboardingProgressPercent,
    usdcBalance,
    glowTargetId,
    isConnected,
    address,
    disconnect,
    usdcAllowance,
    approveLoading,
    handleApprove
  } = useNexaFlow();

  const renderStatsCardSkeleton = () => (
    <div className="stats-card skeleton">
      <div className="skeleton-line" style={{ width: '60%', height: '14px', marginBottom: '12px' }}></div>
      <div className="skeleton-line" style={{ width: '80%', height: '28px', marginBottom: '12px' }}></div>
      <div className="skeleton-line" style={{ width: '40%', height: '10px' }}></div>
    </div>
  );

  const renderEmployeeListSkeleton = () => (
    <div className="panel-card skeleton">
      <div className="skeleton-line" style={{ width: '40%', height: '20px', marginBottom: '20px' }}></div>
      {[1, 2, 3].map((n) => (
        <div key={n} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div className="skeleton-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton-line" style={{ width: '50%', height: '14px' }}></div>
            <div className="skeleton-line" style={{ width: '70%', height: '10px' }}></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderChartSkeleton = () => (
    <div className="panel-card skeleton" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
      <div className="skeleton-avatar" style={{ width: '150px', height: '150px', borderRadius: '50%', marginBottom: '20px' }}></div>
      <div className="skeleton-line" style={{ width: '60%', height: '12px', marginBottom: '8px' }}></div>
      <div className="skeleton-line" style={{ width: '40%', height: '12px' }}></div>
    </div>
  );

  return (
    <div className="fade-in-route">
      {/* Repeated marquee diagonal tape banner */}
      <div className="marquee-banner">
        <div className="marquee-content">
          NEXAFLOW ⚡ DECENTRALIZED PAYROLL ⚡ REAL-TIME DISBURSEMENT ⚡ AUTOMATED MICRO-BENEFITS ⚡ SUB-SECOND SETTLEMENT ⚡ ZERO PROCESSING FEES ⚡ ARC TESTNET SPONSORED ⚡ NEXAFLOW ⚡ DECENTRALIZED PAYROLL ⚡ REAL-TIME DISBURSEMENT ⚡ AUTOMATED MICRO-BENEFITS ⚡ SUB-SECOND SETTLEMENT ⚡ ZERO PROCESSING FEES ⚡ ARC TESTNET SPONSORED
        </div>
      </div>

      {/* Main Header */}
      <header className="main-header">
        <div className="header-title-wrapper">
          <h1>Continuous Payroll & Benefits</h1>
          <p>Pay remote staff second-by-second. Auto-divert percentages into medical and retirement savings pots.</p>
        </div>

        <div className="header-actions">
          {usdcAllowance < 1000 ? (
            <button
              id="approve-btn"
              className={`btn btn-primary ${glowTargetId === 'approve-btn' ? 'sub-second-glow' : ''}`}
              onClick={handleApprove}
              disabled={approveLoading || !isConnected}
            >
              {approveLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                  Authorizing Funding Account...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Pre-Authorize Payout Funds
                </>
              )}
            </button>
          ) : (
            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '8px 12px' }}>
              <CheckCircle size={14} />
              Payout Funding Authorized
            </span>
          )}
        </div>
      </header>

      {/* Global Interactive Quickstart Guide (Smart Onboarding Banner) */}
      {showOnboarding && (
        <div className="onboarding-guide-container">
          <div className="onboarding-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--color-secondary)" fill="var(--color-secondary)" />
              <strong style={{ fontSize: '15px', color: '#1A1A1A' }}>Quickstart Guide: Interactive Onboarding</strong>
            </div>
            <button className="onboarding-toggle-btn" onClick={() => setShowOnboarding(false)}>
              Dismiss Guide
            </button>
          </div>
          
          <div className="onboarding-steps-grid">
            <div className={`onboarding-step-card ${step1Done ? 'completed' : 'active'}`}>
              <div className="onboarding-step-number">
                <span>Step 1</span>
                {step1Done ? <CheckCircle size={14} color="var(--color-success)" /> : <span style={{ color: 'var(--color-secondary)', fontSize: '10px' }}>In Progress</span>}
              </div>
              <div className="onboarding-step-title">Link Security Profile</div>
              <div className="onboarding-step-desc">Link your digital payment key using the button at the top to establish your identity.</div>
            </div>

            <div className={`onboarding-step-card ${step1Done && !step2Done ? 'active' : ''} ${step2Done ? 'completed' : ''}`}>
              <div className="onboarding-step-number">
                <span>Step 2</span>
                {step2Done ? <CheckCircle size={14} color="var(--color-success)" /> : <span style={{ color: 'var(--text-muted)' }}>Awaiting</span>}
              </div>
              <div className="onboarding-step-title">Get Demo Funds</div>
              <div className="onboarding-step-desc">Click "Claim Free Demo Funds" at the bottom of the sidebar to receive test USDC in your wallet.</div>
            </div>

            <div className={`onboarding-step-card ${step2Done && !step3Done ? 'active' : ''} ${step3Done ? 'completed' : ''}`}>
              <div className="onboarding-step-number">
                <span>Step 3</span>
                {step3Done ? <CheckCircle size={14} color="var(--color-success)" /> : <span style={{ color: 'var(--text-muted)' }}>Awaiting</span>}
              </div>
              <div className="onboarding-step-title">Start continuous Pay Flow</div>
              <div className="onboarding-step-desc">
                Deploy a continuous salary stream to a recipient address in the Streams tab.
              </div>
            </div>

            <div className={`onboarding-step-card ${step3Done && !step4Done ? 'active' : ''} ${step4Done ? 'completed' : ''}`}>
              <div className="onboarding-step-number">
                <span>Step 4</span>
                {step4Done ? <CheckCircle size={14} color="var(--color-success)" /> : <span style={{ color: 'var(--text-muted)' }}>Awaiting</span>}
              </div>
              <div className="onboarding-step-title">Divert Savings</div>
              <div className="onboarding-step-desc">
                Go to the Benefits tab, configure your split sliders, and deposit funds to see splits auto-allocate.
              </div>
            </div>
          </div>

          <div className="onboarding-progress-bar-wrapper">
            <span className="onboarding-progress-text">Onboarding Progress: {onboardingProgressPercent}% Completed</span>
            <div className="onboarding-progress-bar">
              <div className="onboarding-progress-fill" style={{ width: `${onboardingProgressPercent}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Top Cards Row */}
      <div className="dashboard-grid">
        {isDcwLoading ? (
          <>
            {renderStatsCardSkeleton()}
            {renderStatsCardSkeleton()}
            {renderStatsCardSkeleton()}
            {renderStatsCardSkeleton()}
          </>
        ) : (
          <>
            <div className="stats-card">
              <div className="stats-header">
                <span>Total Payout Funds Protected</span>
                <div className="stats-icon-wrapper primary">
                  <Wallet size={16} />
                </div>
              </div>
              <div className="stats-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TokenIcon symbol="USDC" size={20} />
                {employees.reduce((acc, emp) => acc + emp.totalCap, 0).toLocaleString('en-US')} USDC
              </div>
              <div className="stats-value-sub" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 'bold' }}>
                ({employerPayrollBalance.toLocaleString('en-US')} USDC Pre-funded)
              </div>
              <div className="stats-footer">
                <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>100% Secure</span>
                <span>held in automated payment escrows</span>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-header">
                <span>Live Salaries Disbursed</span>
                <div className="stats-icon-wrapper secondary">
                  <Zap size={16} />
                </div>
              </div>
              <div className="stats-value ticking-val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TokenIcon symbol="USDC" size={20} />
                {totalStreamedUSDC.toFixed(5)} USDC
              </div>
              <div className="stats-footer">
                <span className="live-pulse"></span>
                <span style={{ marginLeft: '4px' }}>Accruing live second-by-second</span>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-header">
                <span>Active Pay Channels</span>
                <div className="stats-icon-wrapper success">
                  <Activity size={16} />
                </div>
              </div>
              <div className="stats-value">
                {activeCount} / {employees.length}
              </div>
              <div className="stats-footer">
                <span>1 restricted payment destination isolated for safety</span>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-header">
                <span>Settlement Time</span>
                <div className="stats-icon-wrapper warning">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div className="stats-value">
                Instant (&lt;0.8s)
              </div>
              <div className="stats-footer">
                <span style={{ color: 'var(--color-success)' }}>Zero delay</span>
                <span>no manual bank processing</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Treasury Health Tracker Dashboard */}
      <div className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color={isWarningState ? "var(--color-danger)" : "var(--color-success)"} />
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Treasury Health Tracker & Safety Buffer</span>
          </div>
          {isWarningState ? (
            <span className="badge badge-danger animate-pulse" style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#Fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', fontWeight: 'bold' }}>
              <AlertTriangle size={12} /> WARNING: Deficit Detected
            </span>
          ) : (
            <span className="badge badge-success" style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', fontWeight: 'bold' }}>
              Treasury Healthy
            </span>
          )}
        </div>

        {isWarningState && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1.5px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={18} />
            <span>
              <strong>Warning State Active!</strong> Reserve buffer has fallen below the 30-day payroll commitment. Stream creation is restricted, and claims are limited to Priority 1 (Key Roles).
            </span>
          </div>
        )}

        <div className="treasury-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginTop: '16px' }}>
          {/* Gauge and metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ border: '1.5px solid var(--border-color)', borderRadius: '6px', padding: '12px', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Employer Buffer Reserve</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '4px' }}>
                  {employerBuffer.toFixed(2)} USDC
                </div>
              </div>
              <div style={{ border: '1.5px solid var(--border-color)', borderRadius: '6px', padding: '12px', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monthly Commitments</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '4px' }}>
                  {totalMonthlyCommitment.toFixed(2)} USDC
                </div>
              </div>
            </div>

            {/* Visual Days Covered Gauge */}
            <div style={{ border: '1.5px solid var(--border-color)', borderRadius: '6px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Payroll Coverage Duration</span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: daysCovered >= 30 ? '#10B981' : daysCovered >= 15 ? '#F59E0B' : '#EF4444'
                }}>
                  {daysCovered} Days Covered
                </span>
              </div>

              {/* Progress Bar Gauge */}
              <div style={{
                height: '14px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((daysCovered / 30) * 100, 100)}%`,
                  background: daysCovered >= 30
                    ? 'linear-gradient(90deg, #10B981, #059669)'
                    : daysCovered >= 15
                      ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                      : 'linear-gradient(90deg, #EF4444, #DC2626)',
                  borderRadius: '10px',
                  transition: 'width 0.5s ease-out'
                }}></div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span>0 Days</span>
                <span>15 Days</span>
                <span>30+ Days (Safe)</span>
              </div>
            </div>
          </div>

          {/* Deposit/Withdraw reserve controls */}
          <div style={{ border: '1.5px solid var(--border-color)', borderRadius: '6px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Manage Reserve Buffer</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Increase or decrease your treasury reserves. Locking safety deposits ensures your payroll streams stay active and avoids claims prioritization lockdowns.
            </p>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="number"
                placeholder="USDC Amount"
                value={bufferAmount}
                onChange={(e) => setBufferAmount(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={handleDepositBuffer}
                disabled={isBufferLoading}
                style={{ height: '38px', whiteSpace: 'nowrap' }}
              >
                {isBufferLoading ? 'Processing...' : 'Deposit'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleWithdrawBuffer}
                disabled={isBufferLoading}
                style={{ height: '38px', whiteSpace: 'nowrap' }}
              >
                Withdraw
              </button>
            </div>
            
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TokenIcon symbol="USDC" size={12} />
                USDC Wallet: {usdcBalance.toFixed(2)} USDC
              </span>
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setBufferAmount(usdcBalance.toString())}>Max</span>
            </div>
          </div>
        </div>
      </div>

      {/* Circle Developer-Controlled Wallets Auto-Pilot Treasury Control Panel */}
      <div className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="var(--color-secondary)" />
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Treasury Auto-Pilot (Circle Developer-Controlled Wallets)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>AUTO-PILOT:</span>
            <button
              className={`btn btn-sm ${autoPilot ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleToggleAutoPilot}
              style={{ fontSize: '11px', padding: '4px 12px', border: '1.5px solid var(--border-color)' }}
            >
              {autoPilot ? 'ACTIVE (AUTOMATED)' : 'DISABLED (MANUAL)'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Automated Corporate Escrow Key</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Provision an on-chain developer-controlled wallet to handle sub-second payouts and streaming setups programmatically. Eliminates the need for manual browser-extension signature prompts.
            </p>
            
            {dcwAddress ? (
              <div style={{ backgroundColor: 'rgba(192, 132, 252, 0.05)', border: '1.5px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                  <strong>DCW Address:</strong> {dcwAddress}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <strong>Wallet ID:</strong> {dcwWalletId}
                </div>
              </div>
            ) : (
              <div>
                <button
                  className="btn btn-primary"
                  onClick={handleProvisionDcw}
                  disabled={isDcwCreating}
                  style={{ fontSize: '12px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {isDcwCreating && <span className="spinner-icon" />}
                  {isDcwCreating ? 'Provisioning Wallet...' : 'Provision Corporate Developer Wallet'}
                </button>
                {dcwError && (
                  <div style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '8px' }}>
                    {dcwError}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ borderLeft: '1.5px solid var(--border-color)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Circle Developer Console Sync</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status:</span>
                {dcwAddress ? (
                  <span className="badge badge-success" style={{ fontSize: '11px' }}>
                    {dcwIsLive ? 'LIVE (CIRCLE INTEGRATED)' : 'DEMO MODE (MOCKED)'}
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '11px' }}>NOT INITIATED</span>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>DCW Treasury Balance:</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TokenIcon symbol="USDC" size={16} />
                  {dcwBalance} USDC
                </span>
              </div>
            </div>

            {dcwAddress && (
              <button
                className="btn btn-secondary"
                onClick={handleRefreshDcwBalance}
                style={{ fontSize: '12px', padding: '8px 16px', alignSelf: 'flex-start' }}
              >
                Refresh Treasury Balance
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Circle CCTP Portal Ingestion Card */}
      <div className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--color-primary)" />
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Cross-Chain Treasury Funding (Circle CCTP Bridge)</span>
          </div>
          <span className="badge badge-success" style={{ fontSize: '11px', textTransform: 'uppercase' }}>USDC Gas Enabled</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Fund from Base or Ethereum</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Bridge USDC directly from Base Sepolia into your Arc Testnet payroll contract. CCTP burns the source USDC and mints it to Arc, auto-crediting your pre-funded balance.
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setBridgeStep(1)
                  setIsBridgeModalOpen(true)
                }}
                style={{ fontSize: '12px', padding: '8px 16px' }}
              >
                Open Bridge Portal
              </button>
            </div>
          </div>

          <div style={{ borderLeft: '1.5px solid var(--border-color)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Pre-Funded Payroll Balance</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Arc Pre-Funded Treasury:</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TokenIcon symbol="USDC" size={18} />
                  {employerPayrollBalance} USDC
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Creating streams will automatically consume from this balance first, requiring zero MetaMask approval/signature popups per milestone stream creation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Visual Panels */}
      <div className="dashboard-panels-grid">
        {isDcwLoading ? (
          <>
            {renderEmployeeListSkeleton()}
            {renderChartSkeleton()}
          </>
        ) : (
          <>
            {/* Active Streams Panel */}
            <div className="panel-card" style={{ marginBottom: 0 }}>
              <div className="panel-card-title">
                <Activity size={18} color="var(--color-primary)" />
                Real-time Pay Streams
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {employees.slice(0, 3).map((emp) => (
                  <div key={emp.id} className="stream-card">
                    <div className="stream-card-section stream-card-info">
                      <div className="stream-info">
                        <div className="avatar">{emp.avatar}</div>
                        <div className="engineer-details">
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {emp.name}
                            {emp.isPrivate && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '9px',
                                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                color: '#A78BFA',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                fontWeight: 'normal'
                              }}>
                                Private
                              </span>
                            )}
                          </h4>
                          <p>{emp.role}</p>
                        </div>
                      </div>
                    </div>
                    <div className="stream-card-section stream-card-counter-wrapper">
                      <span className="stream-counter-label">Accrued Salary (Live)</span>
                      <div className="stream-counter-value" style={{ color: emp.isActive ? 'var(--color-secondary)' : 'var(--text-muted)' }}>
                        {emp.accruedLive.toFixed(5)} USDC
                      </div>
                      <span className="stream-flow-details">
                        {emp.isPrivate ? 'Masked 🔒' : `Velocity: ${emp.flowRate.toFixed(4)} USDC/s (~$${(emp.flowRate * 3600).toFixed(2)}/hr)`}
                      </span>
                    </div>
                    <div className="stream-card-section stream-card-progress">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span>{(emp.accruedLive / emp.totalCap * 100).toFixed(1)}%</span>
                        <span>Limit: {emp.totalCap} USDC</span>
                      </div>
                      <div className="stream-progress-bar">
                        <div
                          className="stream-progress-bar-fill"
                          style={{ width: `${(emp.accruedLive / emp.totalCap) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="stream-card-section stream-card-status">
                      <span className={`badge ${emp.complianceStatus === 'Verified' ? 'badge-success' : 'badge-danger'}`}>
                        {emp.complianceStatus === 'Verified' ? 'Security Cleared' : 'Flagged'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits Vault Panel */}
            <div className="panel-card" style={{ marginBottom: 0 }}>
              <div className="panel-card-title">
                <HeartHandshake size={18} color="var(--color-secondary)" />
                My Savings & Benefits Allocations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {/* Dynamic pie segment representation */}
                <div className="pie-chart" style={{
                  background: `conic-gradient(
                    var(--color-primary) 0% ${benefitsConfig.health}%,
                    var(--color-secondary) ${benefitsConfig.health}% ${benefitsConfig.health + benefitsConfig.retirement}%,
                    var(--color-success) ${benefitsConfig.health + benefitsConfig.retirement}% 100%
                  )`
                }}>
                  <div className="pie-inner-cutout">
                    <div className="pie-inner-value">${(healthBalance + liveRetirement + liveEmergency).toFixed(2)}</div>
                    <div className="pie-inner-label">Total Savings Saved</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="legend-color" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                      Health Savings HSA ({benefitsConfig.health}%)
                    </span>
                    <span style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TokenIcon symbol="USDC" size={14} />
                      {healthBalance.toFixed(2)} USDC
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="legend-color" style={{ backgroundColor: 'var(--color-secondary)' }}></div>
                      Personal Pension Pot ({benefitsConfig.retirement}%)
                    </span>
                    <span style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TokenIcon symbol="USDC" size={14} />
                      {liveRetirement.toFixed(4)} USDC
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="legend-color" style={{ backgroundColor: 'var(--color-success)' }}></div>
                      Rainy-Day Emergency Reserve ({benefitsConfig.emergency}%)
                    </span>
                    <span style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TokenIcon symbol="USDC" size={14} />
                      {liveEmergency.toFixed(4)} USDC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent On-Chain Ledger */}
      <div className="panel-card">
        <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--color-warning)" />
            <span>Recent Payment Ledger (Permanently Recorded)</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1.5px solid var(--color-error)',
            padding: '6px 14px',
            borderRadius: '8px',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Accrued Tax Withholding (Live):
            </span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-error)' }} className="ticking-tax-val">
              {totalAccruedTax.toFixed(6)} USDC
            </span>
            <span className="live-pulse" style={{ backgroundColor: 'var(--color-error)', width: '6px', height: '6px', marginLeft: '0px' }}></span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment Type</th>
                <th>Counterparty</th>
                <th>Amount</th>
                <th>Verification Reference</th>
                <th>Settled Time</th>
                <th>Network Processing Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: '600' }}>{tx.type === 'Deploy StreamingPayroll' ? 'Setup Platform' : tx.type === 'Stream Initiated' ? 'Pay Flow Activated' : tx.type}</td>
                  <td>{tx.engineer}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)' }}>{tx.amount}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{tx.txHash}</td>
                  <td>{tx.time}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sponsored (Free)</td>
                  <td>
                    <span className="badge badge-success">
                      <CheckCircle size={10} />
                      Settled
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Corporate Multi-Sig Queue Panel */}
      <div className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--color-primary)" />
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Corporate Multi-Sig Approvals Queue</span>
          </div>
          <span className="badge" style={{ backgroundColor: isSigner ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: isSigner ? '#34D399' : 'var(--text-muted)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            {isSigner ? "Authorized Signer" : "View-Only Mode"}
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Certain administrative tasks (cancelling high-value streams &ge; 10,000 USDC, withdrawing leftover payroll funds, or updating the payroll oracle) require multi-signature approval (2 of 3 signers).
        </p>

        {/* Propose Administrative Action forms */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <form onSubmit={handleProposeWithdrawLeftover} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)' }}>Propose Leftover Treasury Withdrawal</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                placeholder="USDC Amount"
                value={withdrawLeftoverAmount}
                onChange={(e) => setWithdrawLeftoverAmount(e.target.value)}
                className="form-input"
                style={{ flexGrow: 1 }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} disabled={isProposing || !isConnected}>
                Propose
              </button>
            </div>
          </form>

          <form onSubmit={handleProposeSetOracle} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)' }}>Propose Oracle/Verifier Address Update</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="New Oracle Address (0x...)"
                value={newOracleAddress}
                onChange={(e) => setNewOracleAddress(e.target.value)}
                className="form-input"
                style={{ flexGrow: 1 }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} disabled={isProposing || !isConnected}>
                Propose
              </button>
            </div>
          </form>
        </div>

        {proposals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '14px', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
            No pending administrative proposals found on-chain.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Proposed Action</th>
                  <th>Target Details</th>
                  <th>Value</th>
                  <th>Confirmations</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((prop) => (
                  <tr key={prop.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>#{prop.id}</td>
                    <td>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        {prop.actionType === 'CANCEL_STREAM' ? '🚫 Stream Cancellation' : prop.actionType === 'WITHDRAW_TREASURY' ? '💸 Leftover Withdrawal' : '🔮 Update Oracle'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {prop.actionType === 'CANCEL_STREAM' ? `Stream: ${prop.streamId.slice(0, 10)}...` : prop.targetAddress}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {prop.amount > 0 ? `${prop.amount.toLocaleString()} USDC` : 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{prop.confirmationCount} / 2</span>
                        <div style={{ width: '60px', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${(prop.confirmationCount / 2) * 100}%`, height: '100%', backgroundColor: prop.confirmationCount >= 2 ? 'var(--color-success)' : 'var(--color-secondary)' }}></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {prop.executed ? (
                        <span className="badge badge-success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>Executed</span>
                      ) : (
                        <span className="badge badge-warning" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>Pending Approvals</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn"
                          style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: prop.hasConfirmed ? 'rgba(255,255,255,0.05)' : 'var(--color-secondary)', color: prop.hasConfirmed ? 'var(--text-muted)' : '#000', cursor: prop.hasConfirmed || prop.executed ? 'not-allowed' : 'pointer' }}
                          disabled={!isSigner || prop.hasConfirmed || prop.executed || !isConnected}
                          onClick={() => handleConfirmProposal(prop.id)}
                        >
                          {prop.hasConfirmed ? 'Signed' : 'Approve'}
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '11px', cursor: prop.confirmationCount < 2 || prop.executed ? 'not-allowed' : 'pointer' }}
                          disabled={prop.confirmationCount < 2 || prop.executed || !isConnected}
                          onClick={() => handleExecuteProposal(prop.id)}
                        >
                          Execute
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Ledger & Analytics Dashboard */}
      <div className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--color-secondary)" />
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Audit Ledger & Analytics Dashboard</span>
          </div>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px' }}
            onClick={exportAuditLogsToCSV}
          >
            <Download size={14} /> Export Audit Log (CSV)
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Real-time tracking of historical disbursements, tax withholdings, and employee health/retirement contributions on the secure ledger.
        </p>

        {/* Analytics metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1.5px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Total Accrued Payouts</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
              {employees.reduce((sum, e) => sum + e.accruedPaid, 0).toFixed(4)} USDC
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1.5px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Taxes Withheld</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)' }}>
              {employees.reduce((sum, e) => {
                const rate = e.fiatPeg ? 0.15 : 0.0;
                return sum + (e.accruedPaid * rate);
              }, 0).toFixed(4)} USDC
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1.5px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>HSA Savings Deposited</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
              {employees.reduce((sum, e) => sum + (e.accruedPaid * (e.healthPercent || 5) / 100), 0).toFixed(4)} USDC
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1.5px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Pension & Emergency Funds</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
              {employees.reduce((sum, e) => {
                const pension = e.accruedPaid * (e.retirementPercent || 5) / 100;
                const emergency = e.accruedPaid * (e.emergencyPercent || 5) / 100;
                return sum + pension + emergency;
              }, 0).toFixed(4)} USDC
            </div>
          </div>
        </div>
      </div>

      {/* x402 Real-Time Micro-Payment batching tracker */}
      <div className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--color-primary)" />
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>x402 Real-Time Micro-Payment Batching Tracker</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Monitor the real-time processing of micro-transactions batched via the Canteen x402 middleware. Payments are aggregated off-chain and settled periodically on the Arc blockchain.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1.5px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Facilitator Queue</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-primary)' }}>12 Transactions</div>
            <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '4px' }}>● Ready to Batch</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1.5px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Aggregated Volume</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-secondary)' }}>0.4820 USDC</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Next epoch in 45s</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1.5px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Relayer Status</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>Active</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Fee delegation: Sponsored</div>
          </div>
        </div>

        {/* x402 6-Step Visual Pipeline */}
        <div style={{ padding: '20px 0', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '16px', color: 'var(--text-muted)' }}>Transaction Pipeline</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', flexWrap: 'wrap', gap: '20px' }}>
            {/* Pipeline bar background */}
            <div className="pipeline-track" style={{ position: 'absolute', top: '15px', left: '20px', right: '20px', height: '3px', backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 1 }}>
              <div style={{ width: '80%', height: '100%', backgroundColor: 'var(--color-primary)' }}></div>
            </div>

            {[
              { step: '1', name: 'Sign EIP-712', desc: 'Wallet authorizes toll', done: true },
              { step: '2', name: 'Facilitator Queue', desc: 'Added to pending batch', done: true },
              { step: '3', name: 'Co-op Routing', desc: 'Diverting splits & fees', done: true },
              { step: '4', name: 'Relayer Gas', desc: 'NexaPaymaster sponsorship', done: true },
              { step: '5', name: 'On-chain Batch', desc: 'submitBatch on Arc Testnet', done: true },
              { step: '6', name: 'Settlement', desc: 'USDC deposited to creator', done: false }
            ].map((s, idx) => (
              <div key={idx} className="pipeline-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: s.done ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  border: s.done ? 'none' : '1.5px solid var(--border-color)',
                  color: s.done ? '#000' : '#fff',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  marginBottom: '8px'
                }}>
                  {s.done ? <Check size={14} strokeWidth={3} /> : s.step}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: s.done ? '#fff' : 'var(--text-muted)', textAlign: 'center' }}>{s.name}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2px' }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Referral & Viral Growth panel */}
      <div className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HeartHandshake size={18} color="var(--color-secondary)" />
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Referral Rewards Program</span>
          </div>
          <span className="badge badge-success" style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#93C5FD', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', fontWeight: 'bold' }}>
            On-chain Splitting
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Register a referral mapping in the payroll smart contract. Referrers receive a customized percentage slice (up to 5%) from the employee's stream claims automatically.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Employee Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="0x..."
              value={referralEmployee}
              onChange={(e) => setReferralEmployee(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Referrer Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="0x..."
              value={referralReferrer}
              onChange={(e) => setReferralReferrer(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Bonus Rate (%)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 0.5"
              step="0.1"
              min="0.1"
              max="5.0"
              value={referralRate}
              onChange={(e) => setReferralRate(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            className="btn btn-primary"
            disabled={referralLoading}
            onClick={handleRegisterReferral}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontSize: '13px' }}
          >
            {referralLoading ? <RefreshCw size={14} className="animate-spin" /> : 'Register Referral'}
          </button>
        </div>
      </div>
    </div>
  );
}
