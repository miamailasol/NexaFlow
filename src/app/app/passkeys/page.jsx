'use client';

import React from 'react';
import {
  Fingerprint,
  Zap,
  RefreshCw,
  Sliders,
  ArrowRightLeft,
  Coins,
  Send,
  Lock,
  CheckCircle2,
  ShieldAlert
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
    isPasskeyMock,
    onboardWithPasskey,
    disconnectPasskey,
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
    handleResetMonthlyUsage,
    
    // Circle DCW Integration
    passkeyUsdcBalance,
    refetchPasskeyUsdc,
    dcwAddress,
    dcwWalletId,
    dcwBalance,
    dcwIsLive,
    isDcwCreating,
    dcwError,
    isDcwLoading,
    handleProvisionDcw,
    handleRefreshDcwBalance,
    transferFromPasskeyAccount
  } = useNexaFlow();

  // Circle Transfer Form states
  const [transferAmountToDcw, setTransferAmountToDcw] = React.useState('');
  const [transferAmountFromDcw, setTransferAmountFromDcw] = React.useState('');

  // Custom Biometric Transfer states
  const [customRecipient, setCustomRecipient] = React.useState('');
  const [customTransferAmount, setCustomTransferAmount] = React.useState('');

  // Local loaders & Scan overlay states
  const [isCircleTransferLoading, setIsCircleTransferLoading] = React.useState(false);
  const [isBiometricTransferLoading, setIsBiometricTransferLoading] = React.useState(false);
  const [scanningActive, setScanningActive] = React.useState(false);
  const [scanningStep, setScanningStep] = React.useState('');
  const [scanningStepText, setScanningStepText] = React.useState('');

  const handleBiometricTransferToDcw = async (e) => {
    e.preventDefault();
    if (!transferAmountToDcw || isNaN(transferAmountToDcw) || parseFloat(transferAmountToDcw) <= 0) {
      triggerToast('Invalid Amount', 'Please specify a valid USDC amount to transfer.');
      return;
    }
    if (!dcwAddress) {
      triggerToast('Circle Wallet Offline', 'Please provision or link your Circle Developer-Controlled Wallet first.');
      return;
    }

    setScanningActive(true);
    setIsBiometricTransferLoading(true);

    try {
      await transferFromPasskeyAccount(
        dcwAddress,
        transferAmountToDcw,
        (step, text) => {
          setScanningStep(step);
          setScanningStepText(text);
        }
      );
      setTransferAmountToDcw('');
      // Sync DCW balance after transfer
      setTimeout(() => {
        handleRefreshDcwBalance();
      }, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setScanningActive(false);
      setIsBiometricTransferLoading(false);
    }
  };

  const handleCircleTransferToPasskey = async (e) => {
    e.preventDefault();
    if (!transferAmountFromDcw || isNaN(transferAmountFromDcw) || parseFloat(transferAmountFromDcw) <= 0) {
      triggerToast('Invalid Amount', 'Please specify a valid USDC amount.');
      return;
    }
    if (!passkeyAccountAddress) {
      triggerToast('Biometric Account Offline', 'Please onboard your biometric smart wallet first.');
      return;
    }

    setIsCircleTransferLoading(true);
    triggerToast('Initiating Circle EOA transfer', 'Requesting USDC transfer from Circle DCW...');

    try {
      const res = await fetch('http://localhost:3011/api/treasury/transfer-dcw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: passkeyAccountAddress,
          amount: transferAmountFromDcw
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Transfer Initiated', `Circle USDC transfer sent successfully!`, 'success');
        setTransferAmountFromDcw('');
        // Refresh balances
        setTimeout(async () => {
          await handleRefreshDcwBalance();
          if (refetchPasskeyUsdc) refetchPasskeyUsdc();
        }, 3000);
      } else {
        triggerToast('Circle Transfer Failed', data.error || 'Failed to transfer USDC.');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Connection Error', 'Backend service at port 3011 is offline.');
    } finally {
      setIsCircleTransferLoading(false);
    }
  };

  const handleCustomBiometricTransfer = async (e) => {
    e.preventDefault();
    if (!customRecipient || !customRecipient.startsWith('0x') || customRecipient.length !== 42) {
      triggerToast('Invalid Address', 'Please provide a valid ERC-20 recipient address.');
      return;
    }
    if (!customTransferAmount || isNaN(customTransferAmount) || parseFloat(customTransferAmount) <= 0) {
      triggerToast('Invalid Amount', 'Please specify a valid USDC amount.');
      return;
    }

    setScanningActive(true);
    setIsBiometricTransferLoading(true);

    try {
      await transferFromPasskeyAccount(
        customRecipient,
        customTransferAmount,
        (step, text) => {
          setScanningStep(step);
          setScanningStepText(text);
        }
      );
      setCustomRecipient('');
      setCustomTransferAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setScanningActive(false);
      setIsBiometricTransferLoading(false);
    }
  };

  return (
    <div className="engine-container fade-in-route">
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Column: Smart Account Setup & Info + Circle Integration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Smart Account Card */}
          <div className="panel-card">
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

                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>No Circle Smart Wallet Found</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
                  Register a secure Circle User-Controlled Smart Wallet protected by your own personal PIN. This enables secure, gasless, single-tap stream withdrawals.
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
                      Onboarding Circle Wallet...
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Onboard with Circle PIN Setup
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
                    Circle User-Controlled Smart Wallet Address
                  </div>
                  <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontWeight: '600', marginBottom: '16px', wordBreak: 'break-all', letterSpacing: '0.5px' }}>
                    {passkeyAccountAddress}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span className="badge" style={{ background: 'rgba(0, 242, 254, 0.15)', color: '#0284c7', border: '1px solid rgba(0, 242, 254, 0.3)', fontWeight: '700' }}>
                      Circle SCA Account
                    </span>
                    <span className="badge" style={{ 
                      background: 'rgba(52, 211, 153, 0.15)', 
                      color: '#047857', 
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      fontWeight: '700'
                    }}>
                      Circle PIN Active
                    </span>
                  </div>
                </div>

                {/* USDC Balance block */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '2px' }}>
                      Circle UCW Wallet Balance
                    </div>
                    <div style={{ fontSize: '20px', color: 'var(--text-main)', fontWeight: '700', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      {passkeyUsdcBalance.toFixed(2)}
                      <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600' }}>USDC</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      if (refetchPasskeyUsdc) refetchPasskeyUsdc();
                      triggerToast('Balance Refreshed', 'Successfully synced Circle User-Controlled Wallet balance.');
                    }}
                    style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={12} />
                    Sync Balance
                  </button>
                </div>

                {/* Metadata Specs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Circle Wallet ID:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{passkeyCredentialId ? `${passkeyCredentialId.slice(0, 10)}...${passkeyCredentialId.slice(-8)}` : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Circle Blockchain:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{passkeyPubKeyX || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Circle Wallet State:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{passkeyPubKeyY || 'N/A'}</span>
                  </div>
                </div>

                <button
                  className="btn btn-outline"
                  onClick={disconnectPasskey}
                  style={{ border: '1.5px solid var(--color-error)', color: 'var(--color-error)', width: '100%', padding: '10px' }}
                >
                  Disconnect Circle Wallet
                </button>

              </div>
            )}
          </div>

          {/* Circle Web3 Wallet Hub */}
          <div className="panel-card">
            <div className="panel-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={18} color="var(--color-primary)" />
                Circle Web3 Wallet Hub
              </div>
              {dcwAddress && (
                <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  {dcwIsLive ? 'Circle SDK Live' : 'Circle Mock Mode'}
                </span>
              )}
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
              Integrate your WebAuthn Biometric Wallet with Circle Developer-Controlled Wallets. Move USDC gaslessly and instantly between the two secure custody environments.
            </p>

            {!dcwAddress ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <Lock size={32} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>No Circle Wallet Connected</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', maxWidth: '320px', margin: '0 auto 16px' }}>
                  Provision a Circle Developer-Controlled multichain wallet to act as your secure treasury buffer.
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={handleProvisionDcw}
                  disabled={isDcwCreating}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
                >
                  {isDcwCreating ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      Provisioning Wallet...
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Provision Circle Treasury DCW
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Circle Address and Balance Display */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1.5px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '2px' }}>
                        Circle DCW Address
                      </div>
                      <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontWeight: '600', wordBreak: 'break-all' }}>
                        {dcwAddress}
                      </div>
                    </div>
                    
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={handleRefreshDcwBalance}
                      style={{ padding: '6px' }}
                      title="Sync Balance"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Circle USDC Balance:</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{Number(dcwBalance).toFixed(2)} USDC</span>
                  </div>
                </div>

                {/* Cross-wallet transfer tabs */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRightLeft size={14} color="var(--color-primary)" />
                    Instant Cross-Wallet Settlement
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    
                    {/* Form: Biometric to Circle DCW */}
                    <form onSubmit={handleBiometricTransferToDcw} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Biometric → Circle
                      </div>
                      <div className="input-group" style={{ marginBottom: '10px' }}>
                        <input
                          type="number"
                          placeholder="USDC Amount"
                          className="form-input"
                          value={transferAmountToDcw || ''}
                          onChange={(e) => setTransferAmountToDcw(e.target.value)}
                          style={{ fontSize: '12px', padding: '6px 10px' }}
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={isBiometricTransferLoading || !passkeyAccountAddress}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px', padding: '6px' }}
                      >
                        <Fingerprint size={12} />
                        Transfer to Circle
                      </button>
                    </form>

                    {/* Form: Circle DCW to Biometric */}
                    <form onSubmit={handleCircleTransferToPasskey} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Circle → Biometric
                      </div>
                      <div className="input-group" style={{ marginBottom: '10px' }}>
                        <input
                          type="number"
                          placeholder="USDC Amount"
                          className="form-input"
                          value={transferAmountFromDcw || ''}
                          onChange={(e) => setTransferAmountFromDcw(e.target.value)}
                          style={{ fontSize: '12px', padding: '6px 10px' }}
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-secondary btn-sm"
                        disabled={isCircleTransferLoading || !passkeyAccountAddress}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px', padding: '6px' }}
                      >
                        <RefreshCw className={isCircleTransferLoading ? 'animate-spin' : ''} size={12} />
                        Transfer to Passkey
                      </button>
                    </form>

                  </div>
                </div>

                {/* Form: Custom Recipient Biometric Transfer */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Send size={14} color="var(--color-primary)" />
                    Gasless Biometric Transfer (External)
                  </h4>
                  
                  <form onSubmit={handleCustomBiometricTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Recipient Address (0x...)"
                        className="form-input"
                        value={customRecipient || ''}
                        onChange={(e) => setCustomRecipient(e.target.value)}
                        style={{ fontSize: '12px', padding: '8px 12px' }}
                      />
                      <input
                        type="number"
                        placeholder="USDC Amount"
                        className="form-input"
                        value={customTransferAmount || ''}
                        onChange={(e) => setCustomTransferAmount(e.target.value)}
                        style={{ fontSize: '12px', padding: '8px 12px' }}
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isBiometricTransferLoading || !passkeyAccountAddress}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
                    >
                      <Fingerprint size={14} />
                      Authorize Transfer with Biometrics
                    </button>
                  </form>
                </div>

              </div>
            )}
          </div>

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
                  value={sponsorDepositAmount || ''}
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
              value={selectedWorkerForConfig || ''}
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
                value={maxTxLimitInput || ''}
                onChange={(e) => setMaxTxLimitInput(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>Max Gas Price (Gwei)</label>
              <input
                type="number"
                placeholder="e.g. 50"
                className="form-input"
                value={maxGasPriceInput || ''}
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

      {/* Biometric Scanning Overlay */}
      {scanningActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(10, 11, 14, 0.95)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            position: 'relative',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,242,254,0.15) 0%, rgba(79,172,254,0.05) 100%)',
            border: '2px solid rgba(0, 242, 254, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
            boxShadow: '0 0 30px rgba(0, 242, 254, 0.2)',
          }}>
            {/* Pulsating fingerprint scan */}
            <div style={{
              position: 'absolute',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '2px solid rgba(0, 242, 254, 0.1)',
              animation: 'pulse 1.5s infinite ease-in-out'
            }} />
            
            {/* Cyan glowing laser bar scanning */}
            <div style={{
              position: 'absolute',
              top: '15px',
              left: '15px',
              width: '120px',
              height: '4px',
              background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
              boxShadow: '0 0 8px var(--color-primary)',
              animation: 'scanLaser 2s infinite linear',
              borderRadius: '2px'
            }} />

            <Fingerprint size={70} color="var(--color-primary)" />
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '0.5px' }}>
            Biometric Enclave Active
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'center', maxWidth: '300px' }}>
            {scanningStepText || 'Authorizing smart account execution...'}
          </p>

          {/* Graphical scanning loading bar */}
          <div style={{
            width: '240px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
              width: scanningStep === 'init' ? '20%' :
                     scanningStep === 'scan' ? '45%' :
                     scanningStep === 'sign' ? '70%' :
                     scanningStep === 'submit' ? '90%' : '98%',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanLaser {
          0% { top: 15px; }
          50% { top: 130px; }
          100% { top: 15px; }
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.6; }
          100% { transform: scale(0.9); opacity: 0.2; }
        }
      `}</style>

    </div>
  );
}
