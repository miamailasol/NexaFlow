'use client';

import React from 'react';
import {
  PiggyBank,
  CheckCircle,
  AlertTriangle,
  HeartHandshake,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useNexaFlow } from '@/context/NexaFlowContext';
import { TokenIcon } from '@/components/Icons';

export default function BenefitsPage() {
  const {
    address,
    isConnected,
    usdcBalance,
    isRegistered,
    healthBalance,
    retirementBalance, // retirementSharesVal
    emergencyBalance, // emergencySharesVal
    totalContributed,
    coopTreasuryPool,
    liveRetirement,
    liveEmergency,
    benefitsConfig,
    handleBenefitsSplitChange,
    depositAmount,
    setDepositAmount,
    billAmount,
    setBillAmount,
    claimLoading,
    showClaimSuccess,
    claimTxHash,
    handleRegisterMember,
    handleDepositSplits,
    handleApproveVault,
    handleSubmitClaim,
    benefitsAllowance,
    approveLoading,
    depositLoading,
    registerLoading
  } = useNexaFlow();

  const retirementSharesVal = retirementBalance;
  const emergencySharesVal = emergencyBalance;
  const coopTreasury = coopTreasuryPool;

  const handleVerifyClaim = (e) => {
    e.preventDefault();
    handleSubmitClaim();
  };

  return (
    <div className="engine-container fade-in-route">
      
      {!isRegistered ? (
        <div className="alert-message warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="var(--color-warning)" />
            <div>
              <strong>Savings Account Profile Not Yet Activated</strong>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Activate your savings profile to start contributing to your medical insurance, emergency fund, and retirement pools.</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleRegisterMember} disabled={registerLoading} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {registerLoading && <RefreshCw className="animate-spin" size={16} />}
            {registerLoading ? 'Activating Profile...' : 'Activate Savings Profile'}
          </button>
        </div>
      ) : (
        <div className="alert-message success" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', width: '100%' }}>
          <CheckCircle size={24} color="var(--color-success)" />
          <div>
            <strong>Savings Account Profile Active & Verified</strong>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Smart Savings Key: <span style={{ fontFamily: 'var(--font-mono)' }}>{address}</span> | Total Contributed: {totalContributed.toFixed(2)} USDC</div>
          </div>
        </div>
      )}

      <div className="vault-split-layout">
        {/* Sliders panel */}
        <div>
          <div className="panel-card">
            <div className="panel-card-title">
              <PiggyBank size={18} color="var(--color-primary)" />
              Automated Savings Allocations
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Adjust the sliders below to decide how your salary is split. When you claim accrued wages, these exact percentages are routed to your medical, retirement, and emergency funds.
            </p>

            <div className="allocation-sliders">
              <div className="slider-group">
                <div className="slider-header">
                  <span>Global Medical Insurance Fund</span>
                  <span style={{ color: 'var(--color-primary)' }}>{benefitsConfig.health}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  className="range-slider"
                  value={benefitsConfig.health}
                  onChange={(e) => handleBenefitsSplitChange('health', e.target.value)}
                />
              </div>

              <div className="slider-group">
                <div className="slider-header">
                  <span>Personal Pension Pot</span>
                  <span style={{ color: 'var(--color-secondary)' }}>{benefitsConfig.retirement}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  className="range-slider"
                  value={benefitsConfig.retirement}
                  onChange={(e) => handleBenefitsSplitChange('retirement', e.target.value)}
                />
              </div>

              <div className="slider-group">
                <div className="slider-header">
                  <span>Rainy-Day Emergency Reserve</span>
                  <span style={{ color: 'var(--color-success)' }}>{benefitsConfig.emergency}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  className="range-slider"
                  value={benefitsConfig.emergency}
                  onChange={(e) => handleBenefitsSplitChange('emergency', e.target.value)}
                />
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right', fontWeight: '500' }}>
                Diverted Savings: {benefitsConfig.health + benefitsConfig.retirement + benefitsConfig.emergency}% | Net Pocket Take-Home: {100 - (benefitsConfig.health + benefitsConfig.retirement + benefitsConfig.emergency)}%
              </div>
            </div>
          </div>

          {isRegistered && (
            <div className="panel-card" style={{ marginTop: '24px' }}>
              <div className="panel-card-title">
                <PiggyBank size={18} color="var(--color-secondary)" />
                Deposit Funds to Savings Pots
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Transfer USDC directly from your main wallet to manually fund your savings pots according to the split allocation weights configured above.
              </p>
              <form onSubmit={handleDepositSplits}>
                <div className="form-group">
                  <label className="form-label">Deposit Amount (USDC)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TokenIcon symbol="USDC" size={12} />
                      Wallet Balance: {usdcBalance.toFixed(2)} USDC
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TokenIcon symbol="USDC" size={12} />
                      Healthcare HSA Split: {(parseFloat(depositAmount || '0') * benefitsConfig.health / 100).toFixed(2)} USDC
                    </span>
                  </div>
                </div>

                {/* Action Preview */}
                <div className="action-preview-card success-preview">
                  <div className="action-preview-title">
                    <CheckCircle size={14} color="var(--color-success)" />
                    Deposit Preview & Splits Breakdown:
                  </div>
                  <ul className="action-preview-list">
                    <li><strong>{(parseFloat(depositAmount || '0') * benefitsConfig.health / 100).toFixed(2)} USDC</strong> will fund your Medical Insurance.</li>
                    <li><strong>{(parseFloat(depositAmount || '0') * benefitsConfig.retirement / 100).toFixed(2)} USDC</strong> will fund your retirement pension.</li>
                    <li><strong>{(parseFloat(depositAmount || '0') * benefitsConfig.emergency / 100).toFixed(2)} USDC</strong> will fund your emergency Rainy-Day reserve.</li>
                  </ul>
                </div>
                
                 {benefitsAllowance < parseFloat(depositAmount || '0') ? (
                  <button type="button" className="btn btn-outline" style={{ width: '100%', height: '46px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleApproveVault} disabled={approveLoading}>
                    {approveLoading && <RefreshCw className="animate-spin" size={16} />}
                    {approveLoading ? 'Authorizing Payout Deposit...' : 'Authorize Savings Deposit Spend'}
                  </button>
                ) : (
                  <button type="submit" className="btn btn-success" style={{ width: '100%', height: '46px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={depositLoading || !isConnected || parseFloat(depositAmount) <= 0}>
                    {depositLoading && <RefreshCw className="animate-spin" size={16} />}
                    {depositLoading ? 'Diverting Savings to Pots...' : 'Deposit Splits'}
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Claims Processing and AI Vault */}
        <div>
          {/* Live Yield-Bearing Savings Portfolio Card */}
          <div className="panel-card" style={{ marginBottom: '24px' }}>
            <div className="panel-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PiggyBank size={18} color="var(--color-success)" />
                <span>Live Yield-Bearing Savings Portfolio</span>
              </div>
              <span className="badge badge-success" style={{ fontSize: '11px', animation: 'pulse 2s infinite' }}>5.0% APY</span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Your retirement and emergency pools are automatically routed to our on-chain ERC-4626 Yield-Bearing Vault.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              {/* Healthcare */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>Healthcare HSA</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Non-yield allocation</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <TokenIcon symbol="USDC" size={14} />
                    {healthBalance.toFixed(2)} USDC
                  </span>
                </div>
              </div>

              {/* Retirement pension */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Personal Pension Pot
                    <span className="live-pulse" style={{ backgroundColor: 'var(--color-secondary)' }}></span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Shares: {retirementSharesVal.toFixed(4)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <TokenIcon symbol="USDC" size={14} />
                    {liveRetirement.toFixed(6)} USDC
                  </span>
                </div>
              </div>

              {/* Emergency reserve */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Rainy-Day Emergency Reserve
                    <span className="live-pulse" style={{ backgroundColor: 'var(--color-success)' }}></span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Shares: {emergencySharesVal.toFixed(4)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-success)', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <TokenIcon symbol="USDC" size={14} />
                    {liveEmergency.toFixed(6)} USDC
                  </span>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '6px', padding: '10px', fontSize: '11px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} />
              <span>Interest is accruing continuously in real-time on-chain via the ERC-4626 smart vault.</span>
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-card-title">
              <HeartHandshake size={18} color="var(--color-secondary)" />
              Claims Assistance Portal
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Submit medical invoices. The automated review evaluator validates the healthcare partner signature and disburses instant payouts directly to the clinic from your Health Savings HSA.
            </p>

            <form onSubmit={handleVerifyClaim} id="claim-form">
              <div className="form-group">
                <label className="form-label">Invoice Amount (USDC)</label>
                <input
                  type="number"
                  className="form-input"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  required
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Available Healthcare HSA Balance:</span>
                  <TokenIcon symbol="USDC" size={12} />
                  <strong>{healthBalance.toFixed(2)} USDC</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Security & Authentication Method</label>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  🔒 Automated Clinic signature verified instantly. Payment dispatches directly from the savings pool.
                </div>
              </div>

              {/* Action Preview */}
              <div className="action-preview-card">
                <div className="action-preview-title">
                  <Zap size={14} color="var(--color-secondary)" fill="var(--color-secondary)" />
                  Claim Action Preview:
                </div>
                <ul className="action-preview-list">
                  <li>The portal scans clinic billing credentials.</li>
                  <li>Releases <strong>{billAmount || '0'} USDC</strong> directly to the provider instantly.</li>
                  <li>If your individual balance is insufficient, the <strong>Community Co-op Safety Pool</strong> automatically pays the difference.</li>
                </ul>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', height: '46px' }}
                disabled={claimLoading || !isConnected || parseFloat(billAmount) <= 0}
              >
                {claimLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                    Processing Claim Payment...
                  </>
                ) : (
                  'Submit Invoice & Pay Provider Instantly'
                )}
              </button>
            </form>

            {showClaimSuccess && (
              <div className="alert-message success" style={{ marginTop: '20px' }}>
                <CheckCircle size={18} />
                <div>
                  <strong>Claim Approved & Disbursed!</strong>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', marginTop: '4px' }}>
                    Reference ID: {claimTxHash}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Settled instantly to the medical clinic.
                  </div>
                </div>
              </div>
            )}
            
            <div className="panel-card" style={{ marginTop: '24px', backgroundColor: 'rgba(255, 255, 255, 0.015)', border: '1px solid var(--border-color)', padding: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Community Co-op Safety Pool</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                A shared insurance pool funded by 20% of medical contributions. If your clinic bill exceeds your personal savings pot, the community fund automatically covers the remaining balance for you.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Co-op Treasury Size:</span>
                <strong style={{ color: 'var(--color-secondary)' }}>{coopTreasury.toFixed(2)} USDC</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
