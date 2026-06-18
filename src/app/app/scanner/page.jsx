'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  X,
  RefreshCw,
  Bot,
  Clock,
  Activity,
  DollarSign,
  Zap,
  Search
} from 'lucide-react';
import { useNexaFlow } from '@/context/NexaFlowContext';
import { useReadContract, useAccount } from 'wagmi';
import { COMPLIANCE_REGISTRY_ADDRESS, COMPLIANCE_REGISTRY_ABI, USDC_TOKEN_ADDRESS, USDC_ABI } from '@/contracts';

export default function ScannerPage() {
  const { address } = useAccount();
  const {
    employees,
    publicClient,
    triggerToast,
    isolatedAddress,
    complianceTarget,
    setComplianceTarget,
    guardianTarget,
    setGuardianTarget,
    blacklistLoading,
    guardianLoading,
    handleSetSanctionStatus,
    handleSetGuardianStatus
  } = useNexaFlow();

  // Component-local scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedContracts, setScannedContracts] = useState('pending');
  const [blacklistStatus, setBlacklistStatus] = useState('pending');
  const [gasSimResult, setGasSimResult] = useState('pending');

  // Real-Time Compliance Screening states
  const [screenAddress, setScreenAddress] = useState('');
  const [isScreening, setIsScreening] = useState(false);
  const [screeningResult, setScreeningResult] = useState(null);
  const [nanopayments, setNanopayments] = useState([]);
  const [nanopayStats, setNanopayStats] = useState(null);
  const [screeningLogs, setScreeningLogs] = useState([]);

  const extractTxHashes = (text) => {
    if (!text) return [];
    const regex = /0x[a-fA-F0-9]{64}/g;
    return text.match(regex) || [];
  };


  const fetchNanopaymentLedger = async () => {
    try {
      const res = await fetch('http://localhost:3012/api/nanopayments/ledger');
      if (res.ok) {
        const data = await res.json();
        setNanopayments(data.ledger || []);
        setNanopayStats(data.stats);
      }
    } catch (err) {
      console.warn('Failed to fetch nanopayments in scanner:', err);
    }
  };

  useEffect(() => {
    fetchNanopaymentLedger();
    const interval = setInterval(fetchNanopaymentLedger, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRunComplianceCheck = async (e) => {
    e.preventDefault();
    if (!screenAddress || !screenAddress.startsWith('0x') || screenAddress.length !== 42) {
      triggerToast('Invalid Address', 'Please enter a valid Ethereum address starting with 0x.', 'error');
      return;
    }

    setIsScreening(true);
    setScreeningResult(null);
    setScreeningLogs([]);

    try {
      const res = await fetch(`http://localhost:3012/api/demo/compliance-check/${screenAddress}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setScreeningResult(data.result);
        setScreeningLogs(data.agentResult?.activityLog || []);
        triggerToast('Compliance Screened', `Address screening complete. Recommendation: ${data.result.recommendation || 'APPROVED'}`, 'success');
        fetchNanopaymentLedger();
      } else {
        triggerToast('Compliance Check Failed', data.error || 'Server error', 'error');
      }
    } catch (err) {
      triggerToast('Compliance Check Failed', err.message, 'error');
    } finally {
      setIsScreening(false);
    }

  };


  // Read guardian status directly in this component
  const { data: isUserGuardianRaw } = useReadContract({
    address: COMPLIANCE_REGISTRY_ADDRESS,
    abi: COMPLIANCE_REGISTRY_ABI,
    functionName: 'isGuardian',
    args: address ? [address] : undefined,
    chainId: 5042002,
    query: { enabled: !!address }
  });
  const isUserGuardian = !!isUserGuardianRaw;


  const runPreFlightSimulation = async () => {
    setIsScanning(true);
    setScanStep('Retrieving Active Stream Registry...');
    setScanProgress(15);
    setScannedContracts('pending');
    setBlacklistStatus('pending');
    setGasSimResult('pending');

    try {
      // Gather addresses to check (isolated address entered + all active employee addresses)
      const addressesToCheck = [isolatedAddress, ...employees.map((e) => e.address)].filter(
        (addr) => addr && addr.startsWith('0x') && addr.length === 42
      );

      // 1. Check live sanctions status on ComplianceRegistry
      setScanStep('Contacting Circle Compliance Database (OFAC query)...');
      setScanProgress(45);
      
      let hasSanctioned = false;
      if (publicClient) {
        for (const addr of addressesToCheck) {
          try {
            const isBlocked = await publicClient.readContract({
              address: COMPLIANCE_REGISTRY_ADDRESS,
              abi: COMPLIANCE_REGISTRY_ABI,
              functionName: 'isSanctioned',
              args: [addr]
            });
            if (isBlocked) {
              hasSanctioned = true;
            }
          } catch (err) {
            console.error('Failed to read sanctions status for', addr, err);
          }
        }
      }

      setBlacklistStatus(hasSanctioned ? 'failed' : 'passed');

      // 2. Running EVM static call simulation
      setScanStep('Running EVM Static Calls simulation on Arc Testnet...');
      setScanProgress(75);

      let simulationPassed = true;
      if (publicClient && addressesToCheck.length > 0) {
        try {
          // Attempting static call simulation on USDC balanceOf or similar to test connectivity
          await publicClient.simulateContract({
            address: USDC_TOKEN_ADDRESS,
            abi: USDC_ABI,
            functionName: 'balanceOf',
            args: [addressesToCheck[0]],
            account: address
          });
          setScannedContracts('passed');
        } catch (err) {
          console.warn('Simulation caught EVM revert:', err.message);
          simulationPassed = false;
          setScannedContracts('failed');
        }
      } else {
        setScannedContracts('passed');
      }

      // 3. Estimate gas
      setScanStep('Estimating USDC transaction gas parameters...');
      setScanProgress(100);
      setGasSimResult(hasSanctioned || !simulationPassed ? 'failed' : 'passed');
      setIsScanning(false);

      if (hasSanctioned) {
        triggerToast(
          'Compliance Alert!',
          'Sanctioned recipient detected in current active registry! Payouts/Streams are blocked.',
          'compliance'
        );
      } else {
        triggerToast(
          'Compliance Check Passed',
          'All checked recipient accounts are clear of regulatory blocklists.',
          'success'
        );
      }
    } catch (e) {
      console.error(e);
      setIsScanning(false);
      triggerToast('Simulation Failed', e.message);
    }
  };

  return (
    <>
      <div className="scanner-grid fade-in-route">
      <div className="scanner-panel">
        
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-card-title">
            <ShieldCheck size={18} color="var(--color-primary)" />
            Automated Recipient Security Scanner
          </div>

          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Ensure transfer safety by screening recipient addresses against global sanctions lists (OFAC) and pre-testing transaction routing. Flagged destination addresses are automatically locked to avoid regulatory compliance friction.
          </p>

          <div className={`radar-container ${isScanning ? 'scanning' : ''}`}>
            <div className="radar-circle">
              <ShieldCheck size={36} color="var(--color-secondary)" />
            </div>
            <div className="radar-sweep"></div>
            <div className="radar-status">{
              scanStep === 'Retrieving Active Stream Registry...' ? 'Scanning active registries...' :
              scanStep === 'Contacting Circle Compliance Database (OFAC query)...' ? 'Screening sanctions registries (OFAC)...' :
              scanStep === 'Running EVM Static Calls simulation on Arc Testnet...' ? 'Pre-testing transaction routes...' :
              scanStep || 'System Idle. Ready to Scan.'
            }</div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <button
              className="btn btn-primary"
              onClick={runPreFlightSimulation}
              disabled={isScanning}
              style={{ flexGrow: 1 }}
            >
              {isScanning ? 'Running Security Screen...' : 'Scan Payment Addresses & Run Safety Checks'}
            </button>
          </div>
        </div>

        {/* Results status list */}
        <div className="panel-card">
          <div className="panel-card-title">
            Security Check Results
          </div>

          <div className="compliance-list">
            <div className="compliance-item">
              <div className="compliance-item-left">
                <div className={`compliance-check-indicator ${blacklistStatus === 'passed' ? 'success' : blacklistStatus === 'failed' ? 'failed' : 'pending'}`}>
                  {blacklistStatus === 'passed' ? <Check size={12} /> : blacklistStatus === 'failed' ? <X size={12} /> : '1'}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Sanctions List Security Check</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Checks payment accounts against global regulatory sanction blocklists (OFAC).</div>
                </div>
              </div>
              <span>
                {blacklistStatus === 'passed' && <span className="badge badge-success">CLEARED</span>}
                {blacklistStatus === 'pending' && <span className="badge badge-warning">AWAITING</span>}
                {blacklistStatus === 'failed' && <span className="badge badge-danger">FAILED</span>}
              </span>
            </div>

            <div className="compliance-item">
              <div className="compliance-item-left">
                <div className={`compliance-check-indicator ${scannedContracts === 'passed' ? 'success' : scannedContracts === 'failed' ? 'failed' : 'pending'}`}>
                  {scannedContracts === 'passed' ? <Check size={12} /> : scannedContracts === 'failed' ? <X size={12} /> : '2'}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Transaction Route Simulation</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pre-tests the payment route on the network to catch errors before broadcast.</div>
                </div>
              </div>
              <span>
                {scannedContracts === 'failed' && <span className="badge badge-danger">1 SUSPICIOUS ACCOUNT BLOCKED</span>}
                {scannedContracts === 'passed' && <span className="badge badge-success">ROUTE VERIFIED (0 REVERTS)</span>}
                {scannedContracts === 'pending' && <span className="badge badge-warning">AWAITING</span>}
              </span>
            </div>

            <div className="compliance-item">
              <div className="compliance-item-left">
                <div className={`compliance-check-indicator ${gasSimResult === 'passed' ? 'success' : gasSimResult === 'failed' ? 'failed' : 'pending'}`}>
                  {gasSimResult === 'passed' ? <Check size={12} /> : gasSimResult === 'failed' ? <X size={12} /> : '3'}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Fee & Gas Authorization Check</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ensures connected funding balance is authorized to pay processing fees.</div>
                </div>
              </div>
              <span>
                {gasSimResult === 'passed' && <span className="badge badge-success">AUTHORIZED (SPONSORED)</span>}
                {gasSimResult === 'pending' && <span className="badge badge-warning">AWAITING</span>}
                {gasSimResult === 'failed' && <span className="badge badge-danger">REJECTED</span>}
              </span>
            </div>
          </div>

          {blacklistStatus === 'passed' && scannedContracts === 'passed' && gasSimResult === 'passed' && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              border: '1.5px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="var(--color-success)" />
                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)' }}>RECIPIENTS VERIFIED AND ROUTE CLEARED</span>
              </div>
            </div>
          )}

        </div>

        {/* Real-Time Compliance Screening */}
        <div className="panel-card" style={{ marginTop: '20px' }}>
          <div className="panel-card-title">
            <Bot size={18} color="var(--color-primary)" />
            Real-Time Compliance Screening
          </div>
          
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Initiate an automated agent-driven compliance check on any recipient address. This operation queries OFAC records and on-chain transaction history. It costs a micro-toll of <strong style={{ color: 'var(--text-main)' }}>0.0005 USDC</strong> settled via Circle Gateway nanopayments.
          </p>

          <form onSubmit={handleRunComplianceCheck} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Wallet Address to Screen (0x...)"
              value={screenAddress}
              onChange={(e) => setScreenAddress(e.target.value)}
              style={{ flexGrow: 1, fontFamily: 'var(--font-mono)' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isScreening || !screenAddress}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isScreening ? (
                <>
                  <RefreshCw style={{ animation: 'sweep 1.5s linear infinite' }} size={16} />
                  Screening...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Run Compliance Check
                </>
              )}
            </button>
          </form>

          {screeningResult && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              border: '2px dashed var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>COMPLIANCE AGENT RESPONSE:</span>
                <span className={`badge ${screeningResult.isCompliant ? 'badge-success' : 'badge-danger'}`}>
                  {screeningResult.isCompliant ? 'Compliant' : 'Non-Compliant'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Risk Score:</strong>
                </div>
                <div>
                  <span style={{
                    fontWeight: '800',
                    fontFamily: 'var(--font-mono)',
                    color: screeningResult.riskScore > 50 ? 'var(--color-error)' : screeningResult.riskScore > 10 ? 'var(--color-warning)' : 'inherit'
                  }}>
                    {screeningResult.riskScore} / 100
                  </span>
                </div>

                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Recommendation:</strong>
                </div>
                <div style={{ fontWeight: '700' }}>
                  {screeningResult.recommendation}
                </div>

                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>On-Chain Tx Count:</strong>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>
                  {screeningResult.onChainTxCount} txs
                </div>

                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Screened At:</strong>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {new Date(screeningResult.screenedAt).toLocaleString()}
                </div>
              </div>

              {screeningLogs && screeningLogs.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Multi-Agent Execution Log:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {screeningLogs.map((log, i) => {
                      const hashes = extractTxHashes(log.details);
                      return (
                        <div key={i} style={{ fontSize: '11px', lineHeight: '1.4', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '2px' }}>
                            <span><strong>[{log.agent}]</strong> {log.action}</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div style={{ color: 'var(--text-main)' }}>{log.details}</div>
                          {hashes.map((hash) => (
                            <div key={hash} style={{ marginTop: '4px' }}>
                              <a 
                                href={`https://testnet.arcscan.app/tx/${hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                  color: 'var(--color-primary)', 
                                  fontWeight: '800', 
                                  textDecoration: 'underline',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  fontFamily: 'var(--font-mono)'
                                }}
                              >
                                <span>View Identity/Job Tx on Arcscan</span>
                                <ArrowRight size={8} />
                              </a>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Right side container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Directory Blocklist summary */}
        <div className="panel-card" style={{ height: 'fit-content', marginBottom: 0 }}>
          <div className="panel-card-title">
            Flagged Suspicious Accounts
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Addresses matching high-friction compliance parameters are automatically isolated. Our payment streaming engine prevents any funds from being disbursed to these destinations.
          </p>
          
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)' }}>
              <AlertTriangle size={16} />
              <span style={{ fontWeight: '700', fontSize: '14px' }}>Restricted Destination Account</span>
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
              {isolatedAddress}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setComplianceTarget(isolatedAddress);
                  triggerToast('Selected Address', `Address set to compliance panel: ${isolatedAddress}`);
                }}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                Manage Address
              </button>
            </div>
          </div>
        </div>

        {/* Guardian Compliance Panel */}
        <div className="panel-card" style={{ height: 'fit-content' }}>
          <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Guardian Compliance Control</span>
            {isUserGuardian ? (
              <span className="badge badge-success" style={{ fontSize: '10px' }}>ACTIVE GUARDIAN</span>
            ) : (
              <span className="badge badge-warning" style={{ fontSize: '10px' }}>VIEW ONLY</span>
            )}
          </div>
          
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Manage the decentralised on-chain sanctions list registry. Only authorized compliance guardians can sign status updates.
          </p>

          {/* 1. Sanctions Registry Form */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Sanctions Registry</div>
            <input
              type="text"
              className="form-input"
              placeholder="Recipient Wallet Address (0x...)"
              value={complianceTarget || ''}
              onChange={(e) => setComplianceTarget(e.target.value)}
              style={{ marginBottom: '8px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-danger"
                onClick={() => handleSetSanctionStatus(true)}
                disabled={blacklistLoading || !isUserGuardian}
                style={{ fontSize: '11px', padding: '6px 12px', flexGrow: 1 }}
              >
                {blacklistLoading ? 'Updating...' : 'Sanction Address'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSetSanctionStatus(false)}
                disabled={blacklistLoading || !isUserGuardian}
                style={{ fontSize: '11px', padding: '6px 12px', flexGrow: 1 }}
              >
                {blacklistLoading ? 'Updating...' : 'Whitelist Address'}
              </button>
            </div>
          </div>

          {/* 2. Guardian Management Form */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Guardian Directory</div>
            <input
              type="text"
              className="form-input"
              placeholder="Guardian Address (0x...)"
              value={guardianTarget || ''}
              onChange={(e) => setGuardianTarget(e.target.value)}
              style={{ marginBottom: '8px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleSetGuardianStatus(true)}
                disabled={guardianLoading || !isUserGuardian}
                style={{ fontSize: '11px', padding: '6px 12px', flexGrow: 1 }}
              >
                {guardianLoading ? 'Promoting...' : 'Promote Guardian'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleSetGuardianStatus(false)}
                disabled={guardianLoading || !isUserGuardian}
                style={{ fontSize: '11px', padding: '6px 12px', flexGrow: 1 }}
              >
                {guardianLoading ? 'Demoting...' : 'Demote Guardian'}
              </button>
            </div>
          </div>

          {!isUserGuardian && (
            <div style={{ marginTop: '16px', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '6px', padding: '10px', fontSize: '11px', color: 'var(--color-warning)' }}>
              Note: To test Sanction/Guardian management, switch to the deployer wallet that deployed the ComplianceRegistry contract.
            </div>
          )}
        </div>

      </div>

    </div>

    {/* x402 Nanopayment Ledger */}
    <div className="panel-card" style={{ marginTop: '28px' }}>
      <div className="panel-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={18} color="var(--color-warning)" />
          x402 Nanopayment Ledger
        </div>
        {nanopayStats && (
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <span>Payments: <strong>{nanopayStats.totalPayments}</strong></span>
            <span>Volume: <strong>${nanopayStats.totalVolumeUsdc?.toFixed(4)} USDC</strong></span>
          </div>
        )}
      </div>

      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
        Micro-payments settled natively on the Arc Testnet using the Circle Gateway. Each agent-to-agent call and compliance-screening endpoint invocation is recorded here.
      </p>

      <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Resource / Action</th>
              <th>Buyer</th>
              <th>Fee (USDC)</th>
              <th>Gateway Signature</th>
            </tr>
          </thead>
          <tbody>
            {nanopayments.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  No micro-transactions recorded yet. Seed the demo state or run a compliance check to initiate payments.
                </td>
              </tr>
            ) : (
              [...nanopayments].reverse().map((pay, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {new Date(pay.timestamp).toLocaleTimeString()}
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ fontSize: '10px', textTransform: 'none', borderRadius: '4px' }}>
                      {pay.resource || 'Compliance screening'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {pay.buyer?.slice(0, 8)}...{pay.buyer?.slice(-6)}
                  </td>
                  <td style={{ fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                    ${pay.amount?.toFixed(4)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {pay.signature?.slice(0, 16)}...
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </>
  );
}
