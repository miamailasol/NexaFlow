'use client';

import React from 'react';
import {
  Plus,
  Activity,
  CheckCircle,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Coins,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useNexaFlow } from '@/context/NexaFlowContext';
import { TokenIcon } from '@/components/Icons';

export default function StreamsPage() {
  const {
    employees,
    newEmployeeName,
    setNewEmployeeName,
    newEmployeeRole,
    setNewEmployeeRole,
    newEmployeeLoc,
    setNewEmployeeLoc,
    newEmployeeAddress,
    setNewEmployeeAddress,
    newEmployeeRate,
    setNewEmployeeRate,
    newEmployeeCap,
    setNewEmployeeCap,
    isPrivateMode,
    setIsPrivateMode,
    recipientTokenChoice,
    setRecipientTokenChoice,
    pegToFiat,
    setPegToFiat,
    fiatCurrency,
    setFiatCurrency,
    fiatMonthlySalary,
    setFiatMonthlySalary,
    oracleRates,
    bulkOnboardingType,
    setBulkOnboardingType,
    csvText,
    setCsvText,
    csvFileName,
    parsedWorkers,
    csvError,
    selectedStreamIds,
    setSelectedStreamIds,
    handleCreateStream,
    handleCreateStreamsBatch,
    handleCsvFileUpload,
    parseCsvData,
    downloadCsvTemplate,
    handleBatchPause,
    handleBatchWithdraw,
    handleWithdrawal,
    handleCancelStream,
    handleProposeCancelStream,
    handleTogglePayoutToken,
    handleSetStreamPriority,
    getCountryCode,
    glowTargetId,
    isConnected,
    approveLoading
  } = useNexaFlow();

  return (
    <div className="engine-container fade-in-route">
      
      {/* Create New Stream Form */}
      <div className="panel-card" id="new-stream-form">
        <div className="panel-card-title">
          <Plus size={18} color="var(--color-primary)" />
          Create New Continuous Pay Flow
        </div>

        {/* Toggle Tabs for Single vs Bulk */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          borderBottom: '2px dashed var(--border-color)',
          paddingBottom: '16px'
        }}>
          <button
            type="button"
            className={`btn ${bulkOnboardingType === 'individual' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '6px' }}
            onClick={() => setBulkOnboardingType('individual')}
          >
            Single Worker
          </button>
          <button
            type="button"
            className={`btn ${bulkOnboardingType === 'bulk' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '6px' }}
            onClick={() => setBulkOnboardingType('bulk')}
          >
            Bulk Upload Workers (CSV)
          </button>
        </div>

        {bulkOnboardingType === 'individual' ? (
          <form onSubmit={handleCreateStream} className="stream-form-grid">
            <div className="form-group form-name">
              <label className="form-label">Team Member Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Tan Wei Liang"
                value={newEmployeeName || ''}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                required
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Name of the wage recipient.</div>
            </div>

            <div className="form-group form-role">
              <label className="form-label">Role Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Backend Developer"
                value={newEmployeeRole || ''}
                onChange={(e) => setNewEmployeeRole(e.target.value)}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Designation or department.</div>
            </div>

            <div className="form-group form-currency">
              <label className="form-label">Local Currency / Country</label>
              <select
                className="form-input"
                value={newEmployeeLoc || 'Singapore 🇸🇬'}
                onChange={(e) => setNewEmployeeLoc(e.target.value)}
              >
                <option value="Singapore 🇸🇬">Singapore 🇸🇬 (SGD)</option>
                <option value="Brazil 🇧🇷">Brazil 🇧🇷 (BRL)</option>
                <option value="Nigeria 🇳🇬">Nigeria 🇳🇬 (NGN)</option>
                <option value="Taiwan 🇹🇼">Taiwan 🇹🇼 (TWD)</option>
              </select>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Jurisdiction for automated tax reserve routing.</div>
              {getCountryCode(newEmployeeLoc) !== 'SG' && (
                <div className="tax-warning-banner" style={{
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '16px', lineHeight: '1' }}>⚠️</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#f87171' }}>
                      Jurisdictional Withholding Required
                    </span>
                    <span style={{ fontSize: '11px', color: '#fca5a5', lineHeight: '1.4' }}>
                      Streams in this region are subject to a {
                        getCountryCode(newEmployeeLoc) === 'BR' ? '15%' :
                        getCountryCode(newEmployeeLoc) === 'NG' ? '10%' : '18%'
                      } local tax withholding rate. Splitting will occur automatically on withdrawal.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group form-limit">
              <label className="form-label">Maximum Payment Limit (USDC)</label>
              <input
                type="number"
                className="form-input"
                value={newEmployeeCap || ''}
                onChange={(e) => setNewEmployeeCap(e.target.value)}
                required
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                The total amount of funds locked in the continuous pay flow safe.
              </div>
            </div>

            <div className="form-group form-address">
              <label className="form-label">Recipient Payment Wallet / Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="0x..."
                value={newEmployeeAddress || ''}
                onChange={(e) => setNewEmployeeAddress(e.target.value)}
                required
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <span>The digital wallet destination where the continuous salary will stream.</span>
              </div>
            </div>

            <div className="form-group form-velocity">
              <label className="form-label">Flow Velocity: {newEmployeeRate} USDC/sec (~${(newEmployeeRate * 3600).toFixed(2)}/hour)</label>
              <input
                type="range"
                min="0.001"
                max="0.02"
                step="0.0005"
                className="range-slider"
                value={newEmployeeRate || 0.004}
                onChange={(e) => setNewEmployeeRate(e.target.value)}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Adjust how fast salary builds up (per-second distribution rate).
              </div>
            </div>

            <div className="form-group form-privacy" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)', marginBottom: '16px' }}>
              <input
                type="checkbox"
                id="privacy-mode-toggle"
                checked={isPrivateMode || false}
                onChange={(e) => setIsPrivateMode(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-secondary)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="privacy-mode-toggle" style={{ fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="var(--color-secondary)" />
                  Enable Cryptographic Privacy Mode
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Masks flow velocity and limits on-chain using a commitment hash commitment.
                </span>
              </div>
            </div>

            <div className="form-group form-token-choice" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TokenIcon symbol={recipientTokenChoice} size={18} />
                Recipient Payout Asset
              </label>
              <select
                className="form-input"
                value={recipientTokenChoice || 'USDC'}
                onChange={(e) => setRecipientTokenChoice(e.target.value)}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', width: '100%', cursor: 'pointer' }}
              >
                <option value="USDC">USDC (No Swap - Standard)</option>
                <option value="EURC">EURC (Auto Swap - Dynamic)</option>
              </select>
              {recipientTokenChoice === 'EURC' && (
                <div style={{ marginTop: '8px', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.2)', backgroundColor: 'rgba(139, 92, 246, 0.05)', fontSize: '12px', color: 'var(--text-color)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>AMM Exchange Rate Quote:</span> 
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TokenIcon symbol="USDC" size={12} /> 1 USDC ≈ 0.92 EURC <TokenIcon symbol="EURC" size={12} />
                  </span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', width: '100%' }}>
                    Withdrawals will automatically execute an exact-input Uniswap V3 swap routed on Arc Testnet.
                  </div>
                </div>
              )}
            </div>

            <div className="form-group form-peg-fiat" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)', marginBottom: '16px' }}>
              <input
                type="checkbox"
                id="peg-to-fiat-toggle"
                checked={pegToFiat || false}
                onChange={(e) => setPegToFiat(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="peg-to-fiat-toggle" style={{ fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Coins size={16} color="var(--color-primary)" />
                  Peg Stream to Local Currency (Oracle-pegged)
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Peg salary to a fiat currency using decentralized price feeds on Arc.
                </span>
              </div>
            </div>

            {pegToFiat && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.02)', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>Select Fiat Currency</label>
                  <select
                    className="form-input"
                    value={fiatCurrency || 'SGD'}
                    onChange={(e) => setFiatCurrency(e.target.value)}
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', width: '100%', cursor: 'pointer' }}
                  >
                    <option value="SGD">Singapore Dollar (SGD)</option>
                    <option value="BRL">Brazilian Real (BRL)</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>Monthly Salary Rate ({fiatCurrency})</label>
                  <input
                    type="number"
                    className="form-input"
                    value={fiatMonthlySalary || ''}
                    onChange={(e) => setFiatMonthlySalary(Number(e.target.value))}
                    min="1"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', width: '100%' }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px', borderLeft: '2px solid var(--color-primary)', paddingLeft: '8px' }}>
                    <span>Calculated Velocity: <strong>{(fiatMonthlySalary / 2592000).toFixed(6)} {fiatCurrency}/sec</strong></span>
                    <span>USDC Rate equivalent: <strong>{((fiatMonthlySalary / 2592000) / (oracleRates[fiatCurrency] || 1.0)).toFixed(6)} USDC/sec</strong></span>
                    <span style={{ color: 'var(--color-primary)' }}>Oracle Price: 1 USD = {oracleRates[fiatCurrency]} {fiatCurrency}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions-wrapper">
              {/* Action Preview */}
              <div className="action-preview-card">
                <div className="action-preview-title">
                  <Zap size={14} color="var(--color-secondary)" fill="var(--color-secondary)" />
                  What happens next?
                </div>
                <ul className="action-preview-list">
                  <li>You lock <strong>{newEmployeeCap || '0'} USDC</strong> in a secure automated pay safe.</li>
                  {isPrivateMode ? (
                    <li>Continuous payouts are masked. Flow rate is hidden behind a secure hash commitment.</li>
                  ) : (
                    <li>Continuous second-by-second payouts will activate instantly for <strong>{newEmployeeName || 'Recipient'}</strong>.</li>
                  )}
                  <li>You retain full power to pause or close the channel to retrieve unspent funds.</li>
                </ul>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px' }} disabled={!isConnected}>
                <Zap size={16} />
                Activate Pay Flow
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateStreamsBatch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '800' }}>
                Upload Worker Allocation CSV
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvFileUpload}
                style={{ cursor: 'pointer', maxWidth: '300px' }}
              />
              {csvFileName && (
                <span className="badge badge-info" style={{ textTransform: 'none' }}>
                  File Selected: {csvFileName}
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Or Paste CSV Config Text</label>
              <textarea
                className="form-input"
                rows={5}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', resize: 'vertical' }}
                placeholder="Worker Address,Flow Rate (USDC/sec),Total Cap (USDC),Name,Role,Country&#10;0x9e71a3371987d6f26d8251e18a8fdcb59296556e,0.005,1500,Tan Wei Liang,Senior React Developer,Singapore&#10;0x9e71a3371987d6f26d8251e18a8fdcb59296556e,0.002,500,Alice Smith,UI Designer,Brazil"
                value={csvText || ''}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  parseCsvData(e.target.value);
                }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Columns format: Address, FlowRate, Cap, Name, Role, Country (includes Header row).
              </div>
            </div>

            {csvError && (
              <div className="alert-message warning" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', marginBottom: 0 }}>
                <AlertTriangle size={18} color="var(--color-error)" />
                <span style={{ fontSize: '13px', fontWeight: '800' }}>{csvError}</span>
              </div>
            )}

            {parsedWorkers.length > 0 && (
              <div className="action-preview-card success-preview" style={{ padding: '16px', borderRadius: '8px' }}>
                <div className="action-preview-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircle size={16} color="var(--color-success)" />
                  <strong>Parsed Onboarding Configuration ({parsedWorkers.length} Workers)</strong>
                </div>
                <div className="table-responsive" style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: 0 }}>
                  <table className="data-table" style={{ fontSize: '11px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px', fontSize: '11px' }}>Name / Role</th>
                        <th style={{ padding: '8px', fontSize: '11px' }}>Address</th>
                        <th style={{ padding: '8px', fontSize: '11px' }}>Flow Rate</th>
                        <th style={{ padding: '8px', fontSize: '11px' }}>Limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedWorkers.map((w, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '8px' }}>
                            <strong>{w.name}</strong>
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{w.role}</div>
                          </td>
                          <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{w.address.slice(0, 6)}...{w.address.slice(-4)}</td>
                          <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{w.flowRate} USDC/s</td>
                          <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{w.totalCap} USDC</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: '800', display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed var(--border-color)', paddingTop: '8px' }}>
                  <span>Aggregate Locked Deposit:</span>
                  <span style={{ color: 'var(--color-secondary)' }}>
                    {parsedWorkers.reduce((sum, w) => sum + w.totalCap, 0).toLocaleString()} USDC
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={downloadCsvTemplate}
                style={{ flexGrow: 1 }}
              >
                Download CSV Template
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ flexGrow: 2, height: '46px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={approveLoading || !isConnected || parsedWorkers.length === 0}
              >
                {approveLoading ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                {approveLoading ? 'Deploying Bulk Streams...' : 'Deploy Bulk Streams'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Active Streams Table */}
      <div className="panel-card">
        <div className="panel-card-title">
          <Activity size={18} color="var(--color-secondary)" />
          Active Remote Workforce Salary Streams
        </div>

        {/* Master Checkbox & Batch Selection Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          padding: '12px',
          borderRadius: '8px',
          border: '1.5px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={employees.length > 0 && selectedStreamIds.length === employees.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedStreamIds(employees.map(emp => emp.id));
                } else {
                  setSelectedStreamIds([]);
                }
              }}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', fontWeight: '800' }}>Select All ({employees.length})</span>
          </div>

          {selectedStreamIds.length > 0 && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: 'var(--color-error)', color: '#000' }}
                onClick={handleBatchPause}
                disabled={!isConnected}
              >
                Pause Selected
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '11px' }}
                onClick={handleBatchWithdraw}
                disabled={!isConnected}
              >
                Claim Selected
              </button>
              <button
                type="button"
                className="btn"
                style={{ padding: '6px 12px', fontSize: '11px', background: '#FFF' }}
                onClick={() => setSelectedStreamIds([])}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {employees.map((emp) => (
            <div key={emp.id} className="stream-card" id={`stream-card-${emp.id}`} style={{
              borderColor: glowTargetId === `stream-card-${emp.id}` ? 'var(--color-success)' : '',
              boxShadow: glowTargetId === `stream-card-${emp.id}` ? '0 0 15px rgba(16, 185, 129, 0.3)' : ''
            }}>
              {/* Individual Row Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', alignSelf: 'stretch', paddingRight: '8px' }}>
                <input
                  type="checkbox"
                  checked={selectedStreamIds.includes(emp.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStreamIds(prev => [...prev, emp.id]);
                    } else {
                      setSelectedStreamIds(prev => prev.filter(id => id !== emp.id));
                    }
                  }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <div className="stream-card-section stream-card-info" style={{ width: '22%' }}>
                <div className="stream-info">
                  <div className="avatar">{emp.avatar}</div>
                  <div className="engineer-details">
                    <h4 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
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
                          <ShieldCheck size={10} /> Private
                        </span>
                      )}
                    </h4>
                    <p>{emp.role}</p>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.location}</span>
                  </div>
                </div>
              </div>

              <div className="stream-card-section stream-card-address" style={{ width: '22%' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Worker Digital Account Address</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-main)', wordBreak: 'break-all', fontWeight: '600' }}>
                  {emp.address}
                </div>
              </div>

              <div className="stream-card-section stream-card-counter-wrapper" style={{ width: '25%' }}>
                <span className="stream-counter-label">Accruing Balance</span>
                <div className="stream-counter-value">
                  {emp.accruedLive.toFixed(5)} USDC
                </div>
                <span className="stream-flow-details">
                  Velocity: {emp.isPrivate ? 'Masked 🔒' : (emp.fiatPeg ? `${emp.flowRate.toFixed(4)} ${emp.fiatPeg}/s (Oracle-Pegged)` : `${emp.flowRate.toFixed(4)} USDC/s`)}
                </span>
                {emp.fiatPeg && (
                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: '#60A5FA',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontSize: '10px'
                    }}>
                      Oracle Peg: 1 USD = {oracleRates[emp.fiatPeg] || 1.35} {emp.fiatPeg}
                    </span>
                  </div>
                )}
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Settling In:</span>
                  <span style={{
                    backgroundColor: emp.targetPayoutToken === 'EURC' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: emp.targetPayoutToken === 'EURC' ? '#A78BFA' : '#34D399',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: emp.targetPayoutToken === 'EURC' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <TokenIcon symbol={emp.targetPayoutToken || 'USDC'} size={12} />
                    {emp.targetPayoutToken || 'USDC'}
                  </span>
                  <button
                    onClick={() => handleTogglePayoutToken(emp.id, emp.targetPayoutToken)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-secondary)',
                      textDecoration: 'underline',
                      fontSize: '10px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    disabled={!isConnected}
                  >
                    (Switch)
                  </button>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Priority:</span>
                  <span style={{
                    backgroundColor: emp.priority === 1 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: emp.priority === 1 ? '#Fca5a5' : 'var(--text-muted)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    border: emp.priority === 1 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)'
                  }}>
                    {emp.priority === 1 ? 'High (Key Role)' : 'Standard'}
                  </span>
                  <button
                    onClick={() => handleSetStreamPriority(emp.id, emp.priority === 1 ? 0 : 1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      textDecoration: 'underline',
                      fontSize: '10px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    disabled={!isConnected}
                  >
                    (Toggle)
                  </button>
                </div>
              </div>

              <div className="stream-card-section stream-card-progress" style={{ width: '20%' }}>
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

              <div className="stream-card-section stream-card-actions" style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-outline"
                  style={{ padding: '8px 12px' }}
                  onClick={() => handleWithdrawal(emp.id)}
                  disabled={!isConnected || (emp.accruedLive - emp.accruedPaid) <= 0.005}
                >
                  Claim Payout
                </button>
                <button
                  className="btn btn-outline"
                  style={{ padding: '8px 12px', borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                  onClick={() => {
                    if (emp.totalCap >= 10000) {
                      handleProposeCancelStream(emp.id);
                    } else {
                      handleCancelStream(emp.id);
                    }
                  }}
                  disabled={!isConnected || !emp.isActive}
                >
                  {emp.totalCap >= 10000 ? "Propose Cancel" : "Cancel"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
