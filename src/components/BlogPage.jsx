import React from 'react';
import { Zap, ArrowLeft, BookOpen, HelpCircle, Sliders, ChevronRight, Calendar, Clock, Share2, Shield, DollarSign, Wallet, Percent, HeartPulse } from 'lucide-react';

export default function BlogPage({ onLaunchApp, navigateTo }) {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: 'var(--bg-main)',
      backgroundImage: 'linear-gradient(rgba(26, 26, 26, 0.04) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(26, 26, 26, 0.04) 1.5px, transparent 1.5px)',
      backgroundSize: '28px 28px',
      overflowY: 'auto',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navbar */}
      <header style={{
        backgroundColor: '#FFF',
        borderBottom: 'var(--thick-border)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigateTo('home')}>
          <div style={{
            width: '36px',
            height: '36px',
            backgroundColor: 'var(--color-primary)',
            border: 'var(--medium-border)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={18} color="var(--text-main)" fill="var(--text-main)" />
          </div>
          <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>NexaFlow Blog</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={() => navigateTo('home')} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </button>
          <button onClick={onLaunchApp} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
            Launch App
          </button>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="breadcrumb-container" style={{ padding: '16px 40px 0' }}>
        <span className="breadcrumb-item" onClick={() => navigateTo('home')} style={{ cursor: 'pointer', color: 'var(--color-primary)', fontWeight: '700' }}>Home</span>
        <span className="breadcrumb-separator" style={{ margin: '0 8px', color: 'var(--text-muted)' }}><ChevronRight size={10} style={{ display: 'inline' }} /></span>
        <span className="breadcrumb-item active" style={{ color: 'var(--text-main)' }}>Blog</span>
      </div>

      {/* Main Content Container */}
      <main style={{ maxWidth: '850px', width: '100%', margin: '24px auto 60px', padding: '0 24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Article Meta Header */}
        <div className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-flat)' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <span className="badge" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--text-main)', border: 'var(--thin-border)', fontWeight: 'bold' }}>Web3 Payroll</span>
            <span className="badge" style={{ backgroundColor: 'var(--color-success)', color: 'var(--text-main)', border: 'var(--thin-border)', fontWeight: 'bold' }}>Stablecoins</span>
            <span className="badge" style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--text-main)', border: 'var(--thin-border)', fontWeight: 'bold' }}>Account Abstraction</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.2', color: 'var(--text-main)', marginBottom: '16px' }}>
            Web3 Payroll Streaming & Micro-Benefits: The Future of Global Remote Workforce Settlement
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'var(--text-muted)', fontSize: '13px', borderTop: '2px dashed #EEE', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} />
              <span>June 18, 2026</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} />
              <span>15 min read</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Share2 size={14} />
              <span>Share Article</span>
            </div>
          </div>
        </div>

        {/* Generated Header Banner */}
        <img 
          src="/web3_payroll_stream_header.png" 
          alt="Web3 Payroll Streaming Header" 
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '12px',
            border: 'var(--medium-border)',
            boxShadow: 'var(--shadow-flat)',
          }}
        />

        {/* Executive Summary (TL;DR) */}
        <section className="panel-card" style={{ backgroundColor: 'var(--bg-card-hover)', border: 'var(--medium-border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-flat-sm)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-main)', marginBottom: '10px' }}>
            TL;DR (Quick Summary)
          </h3>
          <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Continuous Wages:</strong> Rather than batch payment intervals, Web3 Streaming enables per-second payroll accrued dynamically on-chain.</li>
            <li><strong>Circle User-Controlled Wallets (UCW):</strong> Secure PIN & biometric web enclave authentication provides users with non-custodial custody of their funds.</li>
            <li><strong>Gasless Design:</strong> Using Arc Chain (USDC as native gas) and smart contracts sponsorship (paymasters) completely deletes gas friction for the worker.</li>
            <li><strong>Co-op Risk-Pooling:</strong> Diverting 20% of HSA benefits splits into a global Community Co-op Pool funds safety nets for medical claim deficits.</li>
          </ul>
        </section>

        {/* Section 1 */}
        <section className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-flat)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px dashed #000', paddingBottom: '8px', marginBottom: '16px' }}>
            1. Understanding Continuous Payroll (Salary Streaming)
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Modern employment paradigms are increasingly decentralized and remote, yet employee compensation rails remain anchored to outdated 20th-century banking architectures. Standard 30-day payroll cycles create capital lockups, expose workers to international wire costs, and exclude gig contractors from institutional benefits.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Salary streaming models payroll as a continuous mathematical function of elapsed time. Rather than releasing funds in discrete bi-weekly chunks, capital flows dynamically in real-time.
          </p>

          <div style={{ backgroundColor: 'var(--bg-sidebar)', color: '#FFF', padding: '20px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '13px', margin: '20px 0', border: 'var(--thin-border)' }}>
            <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '8px' }}>// Streaming Payroll Logic (USDC/sec)</div>
            <div>A(t) = min( (t - t_last) * flowRate, totalCap - totalClaimed )</div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-main)', marginTop: '20px', marginBottom: '8px' }}>
            Real-World Impact
          </h3>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-muted)' }}>
            Consider a worker earning <strong>3,600 USDC per month</strong>. Under legacy models, they work 30 days before receiving a single cent. Under NexaFlow, they earn <strong>0.001388 USDC every second</strong>. They can withdraw 120 USDC after just one day of labor to cover urgent bills or deposit into high-yield vaults, giving them ultimate sovereign control over their money.
          </p>
        </section>

        {/* Section 2 */}
        <section className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-flat)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px dashed #000', paddingBottom: '8px', marginBottom: '16px' }}>
            2. The Pain Points of Traditional Cross-Border Payroll
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(255, 142, 169, 0.15)', border: 'var(--thin-border)' }}>
                <DollarSign size={18} color="var(--color-error)" />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-main)' }}>Exorbitant Intermediary Fees</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>SWIFT networks, currency exchange spreads (1.5% - 4%), and local receiving bank costs drain value from remote workers' paychecks before they ever arrive.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(251, 191, 36, 0.15)', border: 'var(--thin-border)' }}>
                <Clock size={18} color="var(--color-warning)" />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-main)' }}>Multi-Day Transaction Delays</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>International banking transfers frequently require 3-5 business days to clear, causing severe liquidity shortages for workers in developing economies.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(192, 132, 252, 0.15)', border: 'var(--thin-border)' }}>
                <Shield size={18} color="var(--color-primary)" />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-main)' }}>Absence of Portable Benefits</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Cross-border freelancers and contractors do not receive standardized health insurance plans, pension matching, or emergency safety nets from corporate employers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-flat)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px dashed #000', paddingBottom: '8px', marginBottom: '16px' }}>
            3. Core Architecture: Arc Chain & Circle Web3 Wallets
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-muted)', marginBottom: '16px' }}>
            NexaFlow resolves these structural inefficiencies by combining a native stablecoin blockchain with premium custodial APIs:
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-main)', marginBottom: '8px' }}>
            Arc Chain: USDC as Gas Token
          </h3>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Unlike other blockchain L2 networks that require users to buy and maintain gas balances (such as ETH or MATIC), Arc Chain treats **USDC as its native gas token**. Every contract interaction consumes USDC directly, making onboarding incredibly intuitive for non-crypto native users.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-main)', marginBottom: '8px' }}>
            Circle User-Controlled Wallets (UCW)
          </h3>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-muted)', marginBottom: '16px' }}>
            To prevent platform rug-pulls or central security leaks, NexaFlow implements Circle UCW. Private keys are encrypted and stored in secure cloud-enclaves (HSMs). The employee signs transactions and executes withdrawals using a secure PIN or FaceID/TouchID challenge (WebAuthn).
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', border: 'var(--medium-border)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: 'var(--medium-border)' }}>
                <th style={{ padding: '10px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', textAlign: 'left', borderRight: 'var(--thin-border)' }}>Metrics</th>
                <th style={{ padding: '10px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', textAlign: 'left', borderRight: 'var(--thin-border)' }}>Legacy Banking</th>
                <th style={{ padding: '10px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', textAlign: 'left' }}>NexaFlow Web3</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: 'var(--thin-border)' }}>
                <td style={{ padding: '10px', fontSize: '12px', fontWeight: '700', borderRight: 'var(--thin-border)' }}>Settlement Speed</td>
                <td style={{ padding: '10px', fontSize: '12px', borderRight: 'var(--thin-border)' }}>3 to 5 business days</td>
                <td style={{ padding: '10px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold' }}>Sub-second block finality</td>
              </tr>
              <tr style={{ borderBottom: 'var(--thin-border)' }}>
                <td style={{ padding: '10px', fontSize: '12px', fontWeight: '700', borderRight: 'var(--thin-border)' }}>Execution Fees</td>
                <td style={{ padding: '10px', fontSize: '12px', borderRight: 'var(--thin-border)' }}>$15 - $50 per wire + FX spreads</td>
                <td style={{ padding: '10px', fontSize: '12px', color: 'var(--color-success)', fontWeight: 'bold' }}>Sponsored (Zero fee for worker)</td>
              </tr>
              <tr style={{ borderBottom: 'var(--thin-border)' }}>
                <td style={{ padding: '10px', fontSize: '12px', fontWeight: '700', borderRight: 'var(--thin-border)' }}>Security Model</td>
                <td style={{ padding: '10px', fontSize: '12px', borderRight: 'var(--thin-border)' }}>Centralized (Bank controlled)</td>
                <td style={{ padding: '10px', fontSize: '12px' }}>Non-custodial (PIN Enclave)</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 4 */}
        <section className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-flat)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px dashed #000', paddingBottom: '8px', marginBottom: '16px' }}>
            4. Embedded Micro-Benefits Splitting
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Instead of manually moving wages into sub-accounts, NexaFlow introduces automated routing. Upon withdrawing wages, the smart contract automatically executes allocation splits defined by the employee:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', margin: '20px 0' }}>
            <div style={{ padding: '16px', border: 'var(--thin-border)', borderRadius: '8px', boxShadow: 'var(--shadow-flat-sm)' }}>
              <Wallet size={20} color="var(--color-primary)" style={{ marginBottom: '8px' }} />
              <h4 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>HSA Health Savings</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Automated splits feed the worker's decentralized healthcare vault.</p>
            </div>
            <div style={{ padding: '16px', border: 'var(--thin-border)', borderRadius: '8px', boxShadow: 'var(--shadow-flat-sm)' }}>
              <Percent size={20} color="var(--color-success)" style={{ marginBottom: '8px' }} />
              <h4 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Pension Reserves</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Funds hưu trí vaults and yield-bearing collateral pools.</p>
            </div>
            <div style={{ padding: '16px', border: 'var(--thin-border)', borderRadius: '8px', boxShadow: 'var(--shadow-flat-sm)' }}>
              <HeartPulse size={20} color="var(--color-secondary)" style={{ marginBottom: '8px' }} />
              <h4 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Co-op Shared Treasury</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Redirects 20% of HSA splits into a mutual safety pool.</p>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-flat)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px dashed #000', paddingBottom: '8px', marginBottom: '16px' }}>
            5. Community Co-op Safety Pool Logic
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-muted)', marginBottom: '16px' }}>
            NexaFlow reinvents medical protection with an on-chain risk-sharing safety net. If a member submits an invoice (V_claim) exceeding their personal HSA balance (B_member), the deficit (D) is absorbed by the Community Safety Pool (T_coop):
          </p>

          <div style={{ backgroundColor: 'var(--bg-main)', border: 'var(--thin-border)', padding: '20px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-main)' }}>
            <strong>Deficit Coverage Algorithm:</strong>
            <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
              <li><strong>Scenario A:</strong> If D &le; 0, deduct the full invoice amount from the member's HSA: B_member = B_member - V_claim.</li>
              <li><strong>Scenario B:</strong> If D &gt; 0 and T_coop &ge; D, empty the member's HSA and deduct the deficit from the shared Co-op Pool: B_member = 0; T_coop = T_coop - D.</li>
              <li><strong>Scenario C:</strong> If D &gt; 0 and T_coop &lt; D, the transaction reverts to secure protocol solvency.</li>
            </ul>
          </div>
        </section>

        {/* Section 6: Common Mistakes */}
        <section className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-flat)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px dashed #000', paddingBottom: '8px', marginBottom: '16px' }}>
            6. Developer Common Mistakes
          </h2>
          <ul style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><strong>Gas Decimals vs Token Decimals:</strong> Mistakenly parsing ERC-20 token transfers using 18 decimals instead of standard USDC 6 decimals, or vice versa for native gas calls.</li>
            <li><strong>Exposing Enclave Keys:</strong> Hardcoding Circle SDK app credentials or developer signing keys inside React client components instead of loading via node variables.</li>
            <li><strong>Viem Checksum Crashing:</strong> Sending mixed-case raw strings to Viem without applying `.toLowerCase()` validation checkups first.</li>
          </ul>
        </section>

        {/* Section 7: FAQ */}
        <section className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-flat)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px dashed #000', paddingBottom: '8px', marginBottom: '16px' }}>
            7. Frequently Asked Questions (FAQ)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Q1: Do I need a browser extension like MetaMask to register?</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>No. NexaFlow integrates the Circle Web Enclave SDK, allowing users to register a secure smart wallet with just a password or security PIN.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Q2: Can employers claw back salary streams?</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Employers can only claw back the unclaimed, un-streamed balance of an active stream. Accrued wages belong strictly to the employee.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Q3: How secure are User-Controlled Wallets?</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Extremely secure. Private keys are encrypted inside HSM hardware and can only be recovered using the user's secret PIN or backup security questions.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Q4: What blockchain does NexaFlow use?</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>We operate natively on Arc Testnet, an EVM chain where USDC is the native gas token for predictable stablecoin transactions.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Q5: Are there any gas fees when I withdraw my salary?</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>No. NexaFlow integrates smart contract paymasters that sponsor all withdrawal and benefits split operations, ensuring a zero-fee experience for the worker.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Q6: What happens if the Community Co-op Safety Pool runs out of funds?</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>If a deficit exceeds the available liquidity in the shared treasury, claims revert on-chain to secure protocol solvency until voting replenishes the treasury.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Q7: Can I hook my own external ledger or hardware wallet?</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Yes. NexaFlow supports RainbowKit, meaning you can connect any wallet like MetaMask, Rabby, or WalletConnect as an alternate method.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Q8: How does the AI Verifier Agent protect the insurance pool?</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>The LangGraph agent checks invoice OCR data, validates the medical provider's identity, and screens against OFAC sanctions lists before signing.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Q9: How are tax liabilities recorded on-chain?</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Every withdrawal and allocation split creates a permanent cryptographic record, exportable via CSV or JSON formats for local tax reporting.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Q10: What happens if I forget my Circle UCW PIN?</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>You can restore access using your pre-configured security questions. If both the PIN and security answers are lost, the wallet cannot be recovered.</p>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="panel-card" style={{ backgroundColor: 'var(--bg-sidebar)', color: '#FFF', border: 'var(--thick-border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-flat)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px dashed var(--color-primary)', paddingBottom: '8px', marginBottom: '16px' }}>
            Conclusion
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#E4E4E7', marginBottom: '20px' }}>
            Continuous salary streaming represents the ultimate evolution of workforce payment rails. By aligning compensation with real-time labor, NexaFlow eliminates cash-flow constraints, while Circle Wallets and Arc Chain deliver institutional security with zero gas friction.
          </p>
          <button onClick={onLaunchApp} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '14px', width: '100%' }}>
            LAUNCH NEXAFLOW PLATFORM NOW
          </button>
        </section>

        {/* Schema markup guide */}
        <section style={{ display: 'none' }}>
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "Web3 Payroll Streaming & Micro-Benefits: The Future of Global Remote Workforce Settlement",
              "image": "https://nexaflow.surf/web3_payroll_stream_header.png",
              "datePublished": "2026-06-18T15:25:00+07:00",
              "dateModified": "2026-06-18T15:25:00+07:00",
              "author": [{
                "@type": "Person",
                "name": "NexaFlow Editorial Board",
                "url": "https://nexaflow.surf/about"
              }]
            })}
          </script>
        </section>

        {/* Related Pages Section */}
        <div className="related-section">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-main)', marginBottom: '8px' }}>
            Related Resources
          </h3>
          <div className="related-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="related-card" onClick={() => navigateTo('docs')}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '8px' }}>
                  <BookOpen size={16} />
                  <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>API Guide</span>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>DEVELOPER API DOCS</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Access integration snippets, ABI specs, smart contract registers, and the native USDC gas mechanics of Arc Chain.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800', color: 'var(--color-primary)', textTransform: 'uppercase', marginTop: '12px' }}>
                <span>Read Docs</span>
                <ChevronRight size={12} />
              </div>
            </div>

            <div className="related-card" onClick={() => navigateTo('faq')}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', marginBottom: '8px' }}>
                  <HelpCircle size={16} />
                  <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Common Questions</span>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>FAQ HELPDESK</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Learn about biometric TouchID/FaceID enclaves, gas sponsorship mechanisms on the Arc L2 chain, and co-op staking metrics.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800', color: 'var(--color-success)', textTransform: 'uppercase', marginTop: '12px' }}>
                <span>Browse FAQ</span>
                <ChevronRight size={12} />
              </div>
            </div>

            <div className="related-card" onClick={() => navigateTo('contact')}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)', marginBottom: '8px' }}>
                  <Sliders size={16} />
                  <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Integration Support</span>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>HELP & INQUIRIES</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Contact our sandbox integration technicians or compliance officers to configure splits for your corporate workspace.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800', color: 'var(--color-secondary)', textTransform: 'uppercase', marginTop: '12px' }}>
                <span>Submit Inquiry</span>
                <ChevronRight size={12} />
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
