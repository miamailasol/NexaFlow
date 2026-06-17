import React from 'react';
import { Zap, ArrowLeft, ShieldCheck, Scale, FileText, ChevronRight } from 'lucide-react';

export default function LegalPages({ mode, onLaunchApp, navigateTo }) {
  const isPrivacy = mode === 'privacy';

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
            backgroundColor: 'var(--color-success)',
            border: 'var(--medium-border)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={18} color="var(--text-main)" fill="var(--text-main)" />
          </div>
          <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
            NexaFlow Legal
          </span>
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
      <div className="breadcrumb-container">
        <span className="breadcrumb-item" onClick={() => navigateTo('home')}>Home</span>
        <span className="breadcrumb-separator"><ChevronRight size={10} /></span>
        <span className="breadcrumb-item active">{isPrivacy ? "Privacy Policy" : "Terms of Service"}</span>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '800px', width: '100%', margin: '40px auto', padding: '0 24px', textAlign: 'left' }}>
        <div className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '16px', padding: '36px', boxShadow: 'var(--shadow-flat)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {isPrivacy ? <ShieldCheck size={20} color="var(--color-primary)" /> : <Scale size={20} color="var(--color-success)" />}
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
              {isPrivacy ? "Compliance Center" : "Agreement Protocol"}
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2.5px dashed #000', paddingBottom: '10px', marginBottom: '20px' }}>
            {isPrivacy ? "Privacy Policy Disclosure" : "Terms of Service Agreement"}
          </h1>

          {isPrivacy ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '16px', fontWeight: '500' }}>
              <p>
                <strong>Last Updated: June 2026</strong>
              </p>
              <p>
                NexaFlow protocol operates as a decentralized routing network on the Arc Testnet. We are committed to transparency and compliance in data processing. Unlike centralized banking systems, NexaFlow does not store your private keys, biological passkey data, or raw invoice payloads.
              </p>
              <h4 style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '15px', textTransform: 'uppercase', marginTop: '10px' }}>1. On-Chain Ledger Transparency</h4>
              <p>
                All continuous stream parameters, withdrawal transactions, health HSA contribution deposits, and community co-op disbursements are permanently recorded on the public Arc network. These public records include wallet address metadata, flow velocities, and contract variables.
              </p>
              <h4 style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '15px', textTransform: 'uppercase', marginTop: '10px' }}>2. AI Agent Processing</h4>
              <p>
                Invoice payloads uploaded to the NexaFlow AI Verifier Agent are parsed in temporary, sandboxed memory enclaves. OFAC/AML sanctions checks screen addresses against public blocklists to comply with financial regulations. Metadata extracted during verification is discarded after claim signing.
              </p>
              <h4 style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '15px', textTransform: 'uppercase', marginTop: '10px' }}>3. Passkey Credentials Security</h4>
              <p>
                Biometric validation credentials (using TouchID or FaceID enclaves) remain localized on your secure hardware enclaves. NexaFlow does not collect or transmit biological information.
              </p>
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '16px', fontWeight: '500' }}>
              <p>
                <strong>Last Updated: June 2026</strong>
              </p>
              <p>
                Welcome to NexaFlow. By utilizing our decentralized salary streaming protocol, smart contracts, and AI-agent verification portals, you agree to comply with the terms defined herein.
              </p>
              <h4 style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '15px', textTransform: 'uppercase', marginTop: '10px' }}>1. Non-Custodial Protocol Execution</h4>
              <p>
                NexaFlow provides open-source smart contract interfaces. We do not manage, hold, or back employee compensation balances. All salary escrows are maintained autonomously in cryptographic vaults governed by StreamingPayroll.sol rules. Employers are solely responsible for keeping sufficient reserves.
              </p>
              <h4 style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '15px', textTransform: 'uppercase', marginTop: '10px' }}>2. Arc Network Risk Disclosure</h4>
              <p>
                Transactions operate on the experimental Arc Testnet. Users acknowledge that test networks can experience latency, consensus updates, or resets. Gas calculations and token values are simulated for demo and assessment verification.
              </p>
              <h4 style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '15px', textTransform: 'uppercase', marginTop: '10px' }}>3. Co-op Mutual Pool Solvency</h4>
              <p>
                The Community Co-op Safety Pool aggregates diverted HSA fractions to protect members from claim deficits. In the event of extreme deficit spikes, the protocol automatically restricts claims to protect insolvency, and reserves the right to decline verification processing if pool balances reach zero.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
