'use client';

import React from 'react';
import {
  Activity,
  Zap,
  Wallet
} from 'lucide-react';
import { useNexaFlow } from '@/context/NexaFlowContext';
import { TokenIcon } from '@/components/Icons';

export default function StakerPage() {
  const {
    isConnected,
    usdcBalance,
    coopTreasuryPool,
    totalCoopShares,
    userCoopShares,
    stakeAmount,
    setStakeAmount,
    unstakeShares,
    setUnstakeShares,
    stakeLoading,
    unstakeLoading,
    handleStakeCoop,
    handleUnstakeCoop
  } = useNexaFlow();

  const coopTreasury = coopTreasuryPool;
  const coopSharePrice = totalCoopShares > 0 ? coopTreasury / totalCoopShares : 1.0;
  const userStakedUSDC = totalCoopShares > 0 ? (userCoopShares * coopTreasury) / totalCoopShares : 0;

  return (
    <div className="engine-container fade-in-route">
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Column: Pool Metrics & Reward Dynamics */}
        <div className="panel-card" style={{ height: 'fit-content' }}>
          <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--color-primary)" />
            <span>Pool Metrics & Underwriting Status</span>
          </div>
          
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
            The Community Co-op Mutual Pool enables stakers to deposit USDC liquidity to underwrite healthcare claim deficits. 
            When any remote worker's personal Health Savings Account (HSA) balance is insufficient to cover medical invoices, 
            the pool automatically absorbs the remaining deficit.
          </p>

          <div className="onboarding-step-box" style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
            <h4 style={{ color: 'var(--color-primary)', fontSize: '14px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} />
              Yield Incentive Structure
            </h4>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
              To compensate stakers for underwriting risk, <strong>2.0% of all payroll claim withdrawals</strong> across the network are routed directly to the mutual pool, increasing the value of staker pool shares over time.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>Total Pool Size</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                {coopTreasury.toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>USDC</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>Total Pool Shares</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                {totalCoopShares.toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SHARES</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>Pool Exchange Rate</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                {coopSharePrice.toFixed(4)} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>USDC/Share</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>Projected Yield (APY)</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                18.4% <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Your Staking Status & Interaction Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Your Position Panel */}
          <div className="panel-card">
            <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={18} color="var(--color-secondary)" />
              <span>Your Staking Position</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Staked Balance:</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>{userStakedUSDC.toFixed(2)} USDC</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Staker Equity Shares:</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>{userCoopShares.toFixed(2)} Shares</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Pool Ownership:</span>
                <strong style={{ color: 'var(--color-primary)', fontSize: '14px' }}>
                  {totalCoopShares > 0 ? ((userCoopShares / totalCoopShares) * 100).toFixed(2) : '0.00'}%
                </strong>
              </div>
            </div>
          </div>

          {/* Staking Operations */}
          <div className="panel-card">
            <div className="panel-card-title">
              <span>Manage Staking Liquidity</span>
            </div>

            {/* Stake USDC Form */}
            <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Stake USDC</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <input
                  type="number"
                  className="form-input"
                  placeholder="USDC amount to stake"
                  value={stakeAmount || ''}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  style={{ flexGrow: 1 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleStakeCoop}
                  disabled={stakeLoading || !isConnected}
                  style={{ minWidth: '120px' }}
                >
                  {stakeLoading ? 'Staking...' : 'Stake USDC'}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TokenIcon symbol="USDC" size={12} />
                  Your Wallet: {usdcBalance.toFixed(2)} USDC
                </span>
                <span style={{ cursor: 'pointer', color: 'var(--color-primary)' }} onClick={() => setStakeAmount(usdcBalance.toFixed(2))}>MAX</span>
              </div>
            </div>

            {/* Unstake Shares Form */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Unstake & Redeem Shares</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Shares to redeem"
                  value={unstakeShares || ''}
                  onChange={(e) => setUnstakeShares(e.target.value)}
                  style={{ flexGrow: 1 }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleUnstakeCoop}
                  disabled={unstakeLoading || !isConnected || userCoopShares === 0}
                  style={{ minWidth: '120px' }}
                >
                  {unstakeLoading ? 'Redeeming...' : 'Redeem Shares'}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Your Shares: {userCoopShares.toFixed(2)} Shares</span>
                <span style={{ cursor: 'pointer', color: 'var(--color-secondary)' }} onClick={() => setUnstakeShares(userCoopShares.toFixed(2))}>MAX</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
