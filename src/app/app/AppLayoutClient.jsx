'use client';

import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { useNexaFlow } from '@/context/NexaFlowContext';
import Sidebar from '@/components/Sidebar';
import { NetworkIcon } from '@/components/Icons';

export default function AppLayoutClient({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const {
    toastShow,
    toastTitle,
    toastBody,
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
    handleClaimCctpBridge
  } = useNexaFlow();

  const getBottomNavClass = (path) => {
    return `mobile-bottom-nav-item ${pathname === path ? 'active' : ''}`;
  };

  return (
    <div className="app-container">
      {/* Toast Alert Notification */}
      <div className={`payout-toast ${toastShow ? 'show' : ''}`}>
        <div className="payout-toast-header">
          <div className="payout-toast-title">⚡ Instant Settlement</div>
          <span className="badge badge-success">Secure Network</span>
        </div>
        <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-main)' }}>{toastTitle}</div>
        <div className="payout-toast-body">{toastBody}</div>
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
                  <span>Step {bridgeStep} of 5</span>
                </div>
              </div>

              {/* Progress Steps Header */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 1fr)', 
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
                      value={bridgeAmount} 
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
    </div>
  );
}
