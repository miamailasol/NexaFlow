'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Cpu,
  DollarSign,
  ShieldCheck,
  HeartHandshake,
  Layers,
  Fingerprint,
  Code,
  X,
  Zap,
  BookOpen,
  HelpCircle,
  Info,
  Mail,
  ThumbsUp
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { NetworkIcon } from '@/components/Icons';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { isConnected, chain } = useAccount();

  const getLinkClass = (path) => {
    const isActive = pathname === path;
    return `nav-link ${isActive ? 'active' : ''}`;
  };

  return (
    <>
      {/* Sidebar Overlay Backdrop for Mobile Drawer */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div>
          <div className="brand-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="brand-logo">
                <Zap size={20} color="var(--text-main)" fill="var(--text-main)" />
              </div>
              <div>
                <span className="brand-name">NexaFlow</span>
                <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>GLOBAL CONTINUOUS PAYMENTS</div>
              </div>
            </Link>
            
            <button 
              className="mobile-close-btn"
              onClick={onClose}
              style={{
                background: 'var(--color-error)',
                border: 'var(--thin-border)',
                borderRadius: '6px',
                padding: '4px',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '1.5px 1.5px 0px #1A1A1A'
              }}
            >
              <X size={14} color="var(--text-main)" />
            </button>
          </div>

          {/* Connect Button */}
          <div style={{ padding: '0 20px 20px', borderBottom: '2px dashed rgba(255, 255, 255, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
            {isConnected && chain && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid var(--border-color)', width: '100%', justifyContent: 'center' }}>
                <NetworkIcon name={chain.name} size={14} />
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{chain.name}</span>
              </div>
            )}
          </div>

          <ul className="nav-list" style={{ marginTop: '20px' }}>
            <li className="nav-item">
              <Link href="/app" className={getLinkClass('/app')} onClick={onClose}>
                <Activity size={18} />
                Overview Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/app/agents" className={getLinkClass('/app/agents')} onClick={onClose}>
                <Cpu size={18} />
                Agent Command Center
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/app/streams" className={getLinkClass('/app/streams')} onClick={onClose}>
                <DollarSign size={18} />
                Continuous Salary Flows
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/app/scanner" className={getLinkClass('/app/scanner')} onClick={onClose}>
                <ShieldCheck size={18} />
                Security & Safety Scanner
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/app/benefits" className={getLinkClass('/app/benefits')} onClick={onClose}>
                <HeartHandshake size={18} />
                My Benefits & Savings
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/app/staker" className={getLinkClass('/app/staker')} onClick={onClose}>
                <Layers size={18} />
                Co-op Staker Portal
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/app/voting" className={getLinkClass('/app/voting')} onClick={onClose}>
                <ThumbsUp size={18} />
                Feature Voting Portal
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/app/passkeys" className={getLinkClass('/app/passkeys')} onClick={onClose}>
                <Fingerprint size={18} />
                Biometric Smart Wallet
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/app/how-it-works" className={getLinkClass('/app/how-it-works')} onClick={onClose}>
                <Code size={18} />
                How It Works
              </Link>
            </li>

            <li style={{ height: '1px', borderTop: '2px dashed rgba(255,255,255,0.1)', margin: '12px 16px' }}></li>

            <li className="nav-item">
              <Link href="/docs" className="nav-link" onClick={onClose} style={{ color: '#A1A1AA', fontSize: '12px' }}>
                <BookOpen size={16} />
                Documentation
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/faq" className="nav-link" onClick={onClose} style={{ color: '#A1A1AA', fontSize: '12px' }}>
                <HelpCircle size={16} />
                FAQ Guide
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/about" className="nav-link" onClick={onClose} style={{ color: '#A1A1AA', fontSize: '12px' }}>
                <Info size={16} />
                About Us
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/contact" className="nav-link" onClick={onClose} style={{ color: '#A1A1AA', fontSize: '12px' }}>
                <Mail size={16} />
                Contact Support
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
