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
  RefreshCw
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
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="modal-card" style={{
            backgroundColor: '#110c22',
            border: '2px solid var(--color-primary, #a78bfa)',
            boxShadow: '4px 4px 0px 0px var(--color-primary, #a78bfa)',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '550px',
            padding: '24px',
            position: 'relative'
          }}>
            <button 
              onClick={() => {
                setIsBridgeModalOpen(false);
                setIsBridgingInProgress(false);
              }} 
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shuffle size={20} color="var(--color-primary)" />
              Circle CCTP Cross-Chain Portal
            </h3>

            {/* Progress Steps Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ opacity: bridgeStep === 1 ? 1 : 0.5, fontWeight: bridgeStep === 1 ? 'bold' : 'normal', fontSize: '12px' }}>1. Configure</div>
              <ArrowRight size={14} style={{ opacity: 0.5 }} />
              <div style={{ opacity: bridgeStep === 2 ? 1 : 0.5, fontWeight: bridgeStep === 2 ? 'bold' : 'normal', fontSize: '12px' }}>2. Burn (Base)</div>
              <ArrowRight size={14} style={{ opacity: 0.5 }} />
              <div style={{ opacity: bridgeStep === 3 ? 1 : 0.5, fontWeight: bridgeStep === 3 ? 'bold' : 'normal', fontSize: '12px' }}>3. Attest</div>
              <ArrowRight size={14} style={{ opacity: 0.5 }} />
              <div style={{ opacity: bridgeStep === 4 ? 1 : 0.5, fontWeight: bridgeStep === 4 ? 'bold' : 'normal', fontSize: '12px' }}>4. Mint (Arc)</div>
              <ArrowRight size={14} style={{ opacity: 0.5 }} />
              <div style={{ opacity: bridgeStep === 5 ? 1 : 0.5, fontWeight: bridgeStep === 5 ? 'bold' : 'normal', fontSize: '12px' }}>5. Complete</div>
            </div>

            {/* Step content */}
            {bridgeStep === 1 && (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Select the source chain and configure the amount of USDC to deposit. The funds will be burned on Base Sepolia and securely minted directly to your Arc Testnet Payroll Treasury.
                </p>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <NetworkIcon name={bridgeSourceChain} size={18} />
                    Source Chain
                  </label>
                  <select 
                    className="form-input" 
                    value={bridgeSourceChain} 
                    onChange={(e) => setBridgeSourceChain(e.target.value)}
                    style={{ width: '100%', height: '40px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1.5px solid var(--border-color)', borderRadius: '6px', color: '#fff', padding: '0 10px' }}
                  >
                    <option value="Base Sepolia">Base Sepolia (CCTP Domain 6)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 16px', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <NetworkIcon name={bridgeSourceChain} size={16} />
                    <span style={{ fontSize: '12px' }}>{bridgeSourceChain}</span>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <NetworkIcon name="Arc Testnet" size={16} />
                    <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold' }}>Arc Testnet (Destination)</span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Amount of USDC to Bridge</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={bridgeAmount} 
                    onChange={(e) => setBridgeAmount(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <button 
                  className="btn btn-primary" 
                  onClick={handleStartCctpBridge} 
                  style={{ width: '100%', height: '46px' }}
                  disabled={parseFloat(bridgeAmount) <= 0}
                >
                  Initiate Bridge Transfer
                </button>
              </div>
            )}

            {bridgeStep === 2 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 16px', animation: 'spin 2s linear infinite', color: 'var(--color-primary)' }} />
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Burning USDC on Source Chain</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '0 20px' }}>{bridgeStatusText}</p>
              </div>
            )}

            {bridgeStep === 3 && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 16px', animation: 'spin 2s linear infinite', color: 'var(--color-secondary)' }} />
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Awaiting Circle Signature Attestation</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', padding: '0 20px' }}>
                  {bridgeStatusText}
                </p>
                
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '11px', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', marginBottom: '20px' }}>
                  <strong>Burn Tx Hash:</strong> {bridgeTxHash}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleMockAttestation}
                    style={{ width: '100%', fontSize: '12px' }}
                  >
                    ⚡ Skip / Speed Up (Mock Attestation)
                  </button>
                </div>
              </div>
            )}

            {bridgeStep === 4 && (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Circle attestation is signed and verified. Now, switch your wallet back to Arc Testnet to claim and deposit the bridged USDC directly into your Payroll Treasury.
                </p>

                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', padding: '12px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tokens to Claim:</span>
                    <strong>{bridgeAmount} USDC</strong>
                  </div>
                </div>

                <button 
                  className="btn btn-success" 
                  onClick={handleClaimCctpBridge} 
                  style={{ width: '100%', height: '46px' }}
                  disabled={isBridgingInProgress}
                >
                  {isBridgingInProgress ? 'Processing Claim...' : 'Claim & Fund Arc Treasury'}
                </button>
                {isBridgingInProgress && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                    {bridgeStatusText}
                  </p>
                )}
              </div>
            )}

            {bridgeStep === 5 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid var(--color-success)' }}>
                  <Check size={32} color="var(--color-success)" />
                </div>
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Bridge Deposit Complete!</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', padding: '0 20px' }}>
                  Your pre-funded Arc payroll balance has been successfully credited with {bridgeAmount} USDC.
                </p>

                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsBridgeModalOpen(false)}
                  style={{ width: '100%', height: '40px' }}
                >
                  Close Portal
                </button>
              </div>
            )}
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
