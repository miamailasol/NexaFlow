'use client';

import React from 'react';
import {
  Fingerprint,
  Zap,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { useNexaFlow } from '@/context/NexaFlowContext';
import { useAccount } from 'wagmi';

export default function PasskeysPage() {
  const { address } = useAccount();
  const {
    isConnected,
    passkeyAccountAddress,
    setPasskeyAccountAddress,
    passkeyCredentialId,
    setPasskeyCredentialId,
    passkeyPubKeyX,
    setPasskeyPubKeyX,
    passkeyPubKeyY,
    setPasskeyPubKeyY,
    isPasskeyLoading,
    onboardWithPasskey,
    triggerToast,
    paymasterSponsorBalance,
    sponsorDepositAmount,
    setSponsorDepositAmount,
    isSponsorLoading,
    handleDepositSponsor,
    employees,
    selectedWorkerForConfig,
    setSelectedWorkerForConfig,
    maxTxLimitInput,
    setMaxTxLimitInput,
    maxGasPriceInput,
    setMaxGasPriceInput,
    handleSetWorkerRule,
    isConfiguringRules,
    workerRulesMap,
    handleResetMonthlyUsage
  } = useNexaFlow();

  return (
    <div className="engine-container fade-in-route">
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Column: Smart Account Setup & Info */}
        <div className="panel-card" style={{ height: '100%' }}>
          <div className="panel-card-title">
            <Fingerprint size={18} color="var(--color-primary)" />
            WebAuthn Account Status
          </div>

          {!passkeyAccountAddress ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,242,254,0.1) 0%, rgba(79,172,254,0.05) 100%)',
                border: '2px solid rgba(0, 242, 254, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'pulse 2s infinite'
              }}>
                <Fingerprint size={40} color="var(--color-primary)" />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>No Biometric Smart Account Found</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
                Register your device's biometric key (FaceID, TouchID, or Windows Hello) to deploy a counterfactual smart contract wallet. This enables gasless, single-tap stream withdrawals.
              </p>

              <button
                className="btn btn-primary"
                onClick={onboardWithPasskey}
                disabled={isPasskeyLoading || !isConnected}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
              >
                {isPasskeyLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Onboarding Wallet...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Onboard with FaceID / TouchID
                  </>
                )}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Active Wallet Box */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(79, 172, 254, 0.08) 100%)',
                border: '1.5px solid rgba(0, 242, 254, 0.25)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.15 }}>
                  <Fingerprint size={80} color="var(--color-primary)" />
                </div>
                
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '8px' }}>
                  Biometric Smart Wallet Address
                </div>
                <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontWeight: '600', marginBottom: '16px', wordBreak: 'break-all', letterSpacing: '0.5px' }}>
                  {passkeyAccountAddress}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <span className="badge" style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--color-primary)', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
                    ERC-4337 Smart Account
                  </span>
                  <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--color-success)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                    WebAuthn Active
                  </span>
                </div>
              </div>

              {/* Metadata Specs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Credential ID:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{passkeyCredentialId ? `${passkeyCredentialId.slice(0, 10)}...${passkeyCredentialId.slice(-8)}` : 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Public Key X:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{passkeyPubKeyX ? `${passkeyPubKeyX.slice(0, 10)}...${passkeyPubKeyX.slice(-8)}` : 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Public Key Y:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{passkeyPubKeyY ? `${passkeyPubKeyY.slice(0, 10)}...${passkeyPubKeyY.slice(-8)}` : 'N/A'}</span>
                </div>
              </div>

              <button
                className="btn btn-outline"
                onClick={() => {
                  localStorage.removeItem(`nexaflow_passkey_account_${address.toLowerCase()}`);
                  setPasskeyAccountAddress(null);
                  setPasskeyCredentialId(null);
                  setPasskeyPubKeyX(null);
                  setPasskeyPubKeyY(null);
                  triggerToast('Wallet Reset', 'Biometric credential link removed locally.');
                }}
                style={{ border: '1.5px solid var(--color-error)', color: 'var(--color-error)', width: '100%', padding: '10px' }}
              >
                Disconnect Biometric Key
              </button>

            </div>
          )}
        </div>

        {/* Right Column: Employer Sponsor Vault */}
        <div className="panel-card" style={{ height: '100%' }}>
          <div className="panel-card-title">
            <Zap size={18} color="var(--color-secondary)" />
            Gas Sponsorship & Paymaster
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
            The NexaPaymaster allows employers to fund a central gas sponsorship pool. Employees calling <code style={{ color: 'var(--color-primary)' }}>withdrawFunds</code> from an active stream will have their gas covered automatically.
          </p>

          {/* Balance Summary Card */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1.5px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>
                Sponsorship Balance
              </div>
              <div style={{ fontSize: '28px', color: 'var(--text-main)', fontWeight: '700', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                {paymasterSponsorBalance.toFixed(2)}
                <span style={{ fontSize: '14px', color: 'var(--color-secondary)', fontWeight: '600' }}>USDC</span>
              </div>
            </div>

            <span className="badge" style={{ background: paymasterSponsorBalance > 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: paymasterSponsorBalance > 0 ? 'var(--color-success)' : 'var(--color-error)', border: paymasterSponsorBalance > 0 ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px' }}>
              {paymasterSponsorBalance > 0 ? 'Gas Covered' : 'Depleted'}
            </span>
          </div>

          {/* Deposit Form */}
          <form onSubmit={handleDepositSponsor} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>Fund Gas Sponsorship Vault (USDC)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  placeholder="e.g. 50.00"
                  className="form-input"
                  value={sponsorDepositAmount}
                  onChange={(e) => setSponsorDepositAmount(e.target.value)}
                  style={{ paddingRight: '60px' }}
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', fontSize: '12px', color: 'var(--text-muted)' }}>USDC</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              disabled={isSponsorLoading || !isConnected}
              style={{ width: '100%', padding: '12px' }}
            >
              {isSponsorLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Funding Vault...
                </>
              ) : (
                'Deposit Gas Sponsorship'
              )}
            </button>
          </form>

         </div>

      </div>

      {/* Gas Sponsorship Configurator Card */}
      <div className="panel-card" style={{ marginTop: '24px' }}>
        <div className="panel-card-title">
          <Sliders size={18} color="var(--color-secondary)" />
          Gas Sponsorship Configurator
        </div>
        
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
          Define strict gas limits per worker address to control paymaster sponsorship overhead.
        </p>

        <form onSubmit={handleSetWorkerRule} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div className="input-group">
            <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>Target Worker Wallet</label>
            <select
              className="form-input"
              value={selectedWorkerForConfig}
              onChange={(e) => setSelectedWorkerForConfig(e.target.value)}
            >
              <option value="">-- Select Worker --</option>
              {Array.from(new Set(employees.map(e => e.address))).filter(Boolean).map(workerAddr => (
                <option key={workerAddr} value={workerAddr}>
                  {workerAddr.slice(0, 10)}...{workerAddr.slice(-8)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>Max Tx / Month</label>
              <input
                type="number"
                placeholder="e.g. 10"
                className="form-input"
                value={maxTxLimitInput}
                onChange={(e) => setMaxTxLimitInput(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>Max Gas Price (Gwei)</label>
              <input
                type="number"
                placeholder="e.g. 50"
                className="form-input"
                value={maxGasPriceInput}
                onChange={(e) => setMaxGasPriceInput(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-secondary"
            disabled={isConfiguringRules || !selectedWorkerForConfig || !isConnected}
            style={{ width: '100%', padding: '12px' }}
          >
            {isConfiguringRules ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                Saving Limits...
              </>
            ) : (
              'Save Sponsorship Limits'
            )}
          </button>
        </form>

        {/* Table of active rules */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '12px' }}>Active Limits & Usage</h4>
          
          {Object.keys(workerRulesMap).length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              No individual worker rules configured. All workers default to unlimited sponsorship.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(workerRulesMap).map(([workerAddr, rule]) => (
                <div key={workerAddr} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600' }}>
                      {workerAddr.slice(0, 8)}...{workerAddr.slice(-6)}
                    </span>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleResetMonthlyUsage(workerAddr)}
                      style={{ padding: '2px 8px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-muted)' }}
                    >
                      Reset Count
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Txs: </span>
                      <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{rule.txCountThisMonth} / {rule.maxTxPerMonth}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Max Gas: </span>
                      <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{rule.maxGasPrice} Gwei</span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Gas Sponsored: </span>
                      <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>{rule.totalGasPaidUSDC.toFixed(4)} USDC</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
