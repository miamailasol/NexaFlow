'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft, Zap, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ComplianceClient() {
  const router = useRouter();

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
      flexDirection: 'column',
      color: 'var(--text-main)'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => router.push('/')}>
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
            NexaFlow Compliance
          </span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={() => router.push('/')} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </button>
          <button onClick={() => router.push('/app')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
            Launch App
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '800px', width: '100%', margin: '40px auto', padding: '0 24px', textAlign: 'left' }}>
        <div className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '16px', padding: '36px', boxShadow: 'var(--shadow-flat)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={20} color="var(--color-success)" />
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
              Regulatory Affairs & AML
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2.5px dashed #000', paddingBottom: '10px', marginBottom: '20px' }}>
            AML & Security Standards
          </h1>

          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '16px', fontWeight: '500' }}>
            <p>
              <strong>Policy Code: AML-NEXA-2026</strong>
            </p>
            <p>
              NexaFlow integrates active automated anti-money laundering (AML) controls to screen counterparties on-chain. By using decentralized compliance registries and real-time EVM call simulations, the system blocks and isolates flagged payment flows before they settle.
            </p>
            
            <h4 style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '15px', textTransform: 'uppercase', marginTop: '10px' }}>1. Sanction List Verification</h4>
            <p>
              All payroll addresses and claim payouts are run against our on-chain OFAC-registry mirror. If any transaction routes to a restricted country code or isolated sanction destination, the system triggers an emergency freeze.
            </p>

            <h4 style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '15px', textTransform: 'uppercase', marginTop: '10px' }}>2. Enclave OCR Privacy</h4>
            <p>
              Receipts uploaded for health claims benefits are scanned in a sandboxed, confidential computing enclave. This protects medical and invoice privacy while validating claims validity using verified AI agents.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
