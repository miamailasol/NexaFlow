import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowRight, 
  Check, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  HeartHandshake, 
  Fingerprint, 
  Sparkles,
  HelpCircle,
  Activity,
  Users,
  Code,
  Lock,
  ChevronRight,
  Clock
} from 'lucide-react';

export default function LandingPage({ onLaunchApp, navigateTo }) {
  const [email, setEmail] = useState('');
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queueNumber, setQueueNumber] = useState(0);
  const [tickerBalance, setTickerBalance] = useState(128.402918);
  const [monthlyPayroll, setMonthlyPayroll] = useState(8000);
  const [hsaPercent, setHsaPercent] = useState(15);
  const [pensionPercent, setPensionPercent] = useState(10);
  const [activeFeature, setActiveFeature] = useState(0);

  // Simulated continuous ticking salary payroll counter
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerBalance(prev => prev + 0.000185);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setWaitlistJoined(true);
      setQueueNumber(Math.floor(Math.random() * 800) + 1200);
    }, 1200);
  };

  const totalSplits = Number(hsaPercent) + Number(pensionPercent);
  const estimatedHsaStream = ((monthlyPayroll * hsaPercent) / 100).toFixed(2);
  const estimatedPensionStream = ((monthlyPayroll * pensionPercent) / 100).toFixed(2);
  const netSalaryReceived = (monthlyPayroll - estimatedHsaStream - estimatedPensionStream).toFixed(2);

  const features = [
    {
      title: "Real-time Salaries",
      desc: "Stop waiting 30 days for payroll checks. Workers earn and claim compensation every single second in USDC.",
      color: "var(--color-primary)",
      icon: <DollarSign size={20} />
    },
    {
      title: "Embedded HSA splits",
      desc: "Specify percentage diversions into health savings accounts. 80% goes to your personal vault, 20% to community pool.",
      color: "var(--color-success)",
      icon: <HeartHandshake size={20} />
    },
    {
      title: "AI Verifier Claims",
      desc: "Upload a clinic invoice and our sandboxed AI agent verifies signature and claims payouts in USDC instantly.",
      color: "var(--color-secondary)",
      icon: <Zap size={20} />
    },
    {
      title: "Biometric Passkeys",
      desc: "ERC-4337 smart wallets allow workers to claim accrued salaries gas-free using FaceID / TouchID biometric enclaves.",
      color: "var(--color-warning)",
      icon: <Fingerprint size={20} />
    }
  ];

  return (
    <div className="landing-wrapper" style={{
      width: '100%',
      height: '100vh',
      backgroundColor: 'var(--bg-main)',
      backgroundImage: 'linear-gradient(rgba(26, 26, 26, 0.04) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(26, 26, 26, 0.04) 1.5px, transparent 1.5px)',
      backgroundSize: '28px 28px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Landing Navbar */}
      <header style={{
        backgroundColor: '#FFF',
        borderBottom: 'var(--thick-border)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'between',
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
          <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>NexaFlow</span>
          <span className="brand-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>ARC NET</span>
        </div>

        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigateTo('docs')} style={{ background: 'none', border: 'none', fontStyle: 'normal', fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: 'var(--text-main)', textTransform: 'uppercase' }} className="hover-underline">Docs</button>
          <button onClick={() => navigateTo('faq')} style={{ background: 'none', border: 'none', fontStyle: 'normal', fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: 'var(--text-main)', textTransform: 'uppercase' }} className="hover-underline">FAQ</button>
          <button onClick={() => navigateTo('about')} style={{ background: 'none', border: 'none', fontStyle: 'normal', fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: 'var(--text-main)', textTransform: 'uppercase' }} className="hover-underline">About</button>
          <button onClick={() => navigateTo('contact')} style={{ background: 'none', border: 'none', fontStyle: 'normal', fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: 'var(--text-main)', textTransform: 'uppercase' }} className="hover-underline">Support</button>
          <button onClick={onLaunchApp} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Launch App</span>
            <ArrowRight size={14} />
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1200px', width: '100%', margin: '60px auto 40px', padding: '0 24px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'center' }}>
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: 'var(--color-primary)', border: 'var(--thin-border)', borderRadius: '20px', boxShadow: '2px 2px 0px #000' }}>
            <Sparkles size={14} color="var(--text-main)" />
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next-Gen Web3 Payroll</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: '900', color: 'var(--text-main)', lineHeight: '1.1', textTransform: 'uppercase', letterSpacing: '-1px' }}>
            Salary doesn't need to wait.<br />
            <span style={{ backgroundColor: 'var(--color-success)', padding: '0 8px', border: 'var(--thin-border)', boxShadow: '4px 4px 0px #000', display: 'inline-block', transform: 'rotate(-1deg)', marginTop: '8px' }}>Stream live wage splits.</span>
          </h1>

          <p style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: '500', lineHeight: '1.6', maxWidth: '580px' }}>
            NexaFlow replaces legacy monthly banking cycles with continuous, second-by-second salary flows. Automatically divert customizable allocations to medical savings accounts and retirement funds on the Arc Chain with zero gas friction.
          </p>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={onLaunchApp} className="btn btn-primary" style={{ fontSize: '14px', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Launch Demo App</span>
              <ArrowRight size={16} />
            </button>
            <a href="#waitlist-section" className="btn btn-secondary" style={{ fontSize: '14px', padding: '14px 24px', textDecoration: 'none' }}>
              Join Waitlist
            </a>
          </div>
        </div>

        {/* Hero Interactive Stream Card */}
        <div style={{ position: 'relative' }}>
          <div className="panel-card" style={{ transform: 'rotate(1deg)', backgroundColor: '#FFF', border: 'var(--thick-border)', boxShadow: 'var(--shadow-flat)', padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px dashed var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--color-success)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Active Payroll Stream</span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: 'var(--color-warning)', border: 'var(--thin-border)', padding: '2px 6px', borderRadius: '4px' }}>ARC TESTNET</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Accruing Wage Balance</span>
              <div style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '32px', 
                fontWeight: '800', 
                backgroundColor: '#FFF', 
                border: 'var(--medium-border)', 
                padding: '12px', 
                borderRadius: '8px', 
                boxShadow: '3px 3px 0px #000',
                marginTop: '6px',
                color: 'var(--text-main)'
              }}>
                ${tickerBalance.toFixed(6)} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>USDC</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontWeight: '600' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1.5px dashed rgba(0,0,0,0.08)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Stream Recipient:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>0x9e8B...f10A (Lead Engineer)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1.5px dashed rgba(0,0,0,0.08)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>HSA Split allocation:</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: '800' }}>15% Diverted (Co-op Underwritten)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Network Gas Rate:</span>
                <span style={{ color: 'var(--color-success)', fontWeight: '800' }}>SPONSORED (0.00 USDC)</span>
              </div>
            </div>
          </div>

          {/* Underwriting pool notification bubble */}
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            right: '-10px',
            backgroundColor: 'var(--color-secondary)',
            border: 'var(--medium-border)',
            boxShadow: '3px 3px 0px #000',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '800',
            textTransform: 'uppercase',
            transform: 'rotate(-2deg)'
          }}>
            🤝 20% Co-op pool protection
          </div>
        </div>
      </section>

      {/* Decorative Rotating Marquee Banner */}
      <div className="marquee-banner" style={{ margin: '40px 0 60px' }}>
        <div className="marquee-content">
          ⚡ BUILT ON ARC CHAIN — TRANSACTIONS SETTLED IN USDC ⚡ PER-SECOND salary streams ⚡ AI-AGENT CLINICAL VERIFIER DESK ⚡ BIOMETRIC ENCLAVE SMART WALLETS ⚡ COMPLIANCE SCREENING ON-CHAIN ⚡ ZERO-DELAY SYSTEM Rails ⚡
        </div>
      </div>

      {/* Traditional vs NexaFlow Comparison Section */}
      <section style={{ maxWidth: '1000px', width: '100%', margin: '0 auto 80px', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Comparison Matrix</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-main)', marginTop: '4px' }}>
            Crushing Legacy Banking Models
          </h2>
        </div>

        <div className="table-container" style={{ border: 'var(--thick-border)', boxShadow: 'var(--shadow-flat-lg)', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ backgroundColor: 'var(--bg-sidebar)', color: '#FFF' }}>Feature comparison</th>
                <th style={{ backgroundColor: 'var(--color-error)' }}>Traditional payroll banks</th>
                <th style={{ backgroundColor: 'var(--color-success)' }}>NexaFlow protocol</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: '800' }}>Settlement Duration</td>
                <td style={{ color: 'var(--text-muted)' }}>3 - 5 Business Days (SWIFT delay)</td>
                <td style={{ fontWeight: '800', color: 'var(--text-main)' }}>🚀 Continuous (Every elapsed second)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '800' }}>Transaction Expense</td>
                <td style={{ color: 'var(--text-muted)' }}>$20 to $50 per wire transfer + FX markups</td>
                <td style={{ fontWeight: '800', color: 'var(--text-main)' }}>⚡ Less than $0.01 USDC (Sponsored gas)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '800' }}>Benefits Integration</td>
                <td style={{ color: 'var(--text-muted)' }}>Manual third-party broker enrollment</td>
                <td style={{ fontWeight: '800', color: 'var(--text-main)' }}>🧠 Auto-split vaults (HSA, pension)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '800' }}>Health coverage split</td>
                <td style={{ color: 'var(--text-muted)' }}>Worker absorbs full deductible risk</td>
                <td style={{ fontWeight: '800', color: 'var(--text-main)' }}>👥 Co-op safety pool offsets deficit</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '800' }}>Security credentials</td>
                <td style={{ color: 'var(--text-muted)' }}>Centralized accounts (vulnerable to hacks)</td>
                <td style={{ fontWeight: '800', color: 'var(--text-main)' }}>🔑 Non-custodial biometric Passkeys</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section style={{ maxWidth: '1100px', width: '100%', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Core primitives</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-main)', marginTop: '4px' }}>
            Engineered for modern remote teams
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {features.map((f, i) => (
            <div key={i} className="stats-card" style={{ 
              backgroundColor: '#FFF', 
              border: 'var(--thick-border)', 
              borderRadius: '12px', 
              boxShadow: 'var(--shadow-flat)', 
              padding: '24px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'between',
              minHeight: '220px',
              cursor: 'pointer'
            }}
            onClick={() => setActiveFeature(i)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = f.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFF';
            }}
            >
              <div>
                <div style={{
                  width: '38px',
                  height: '38px',
                  backgroundColor: f.color,
                  border: 'var(--thin-border)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '1.5px 1.5px 0px #000'
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-main)', marginBottom: '8px' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', fontWeight: '500' }}>
                  {f.desc}
                </p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>
                <span>Learn more</span>
                <ChevronRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive ROI Calculator Section */}
      <section style={{ maxWidth: '900px', width: '100%', margin: '0 auto 80px', padding: '0 24px' }}>
        <div className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', boxShadow: 'var(--shadow-flat-lg)', padding: '32px', borderRadius: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-primary)' }}>Salary Calculator</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-main)', marginTop: '4px' }}>
              Project Your Streaming Splits
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Drag the sliders to simulate how a monthly salary splits into active micro-benefits.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'start' }}>
            {/* Input Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label">Monthly Wages (USDC)</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>${monthlyPayroll.toLocaleString()} USDC</span>
                </div>
                <input 
                  type="range" 
                  min="2000" 
                  max="25000" 
                  step="500"
                  value={monthlyPayroll}
                  onChange={(e) => setMonthlyPayroll(Number(e.target.value))}
                  style={{ width: '100%', height: '8px', borderRadius: '4px', accentColor: 'var(--color-primary)' }}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label">Health HSA Split (%)</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--color-success)' }}>{hsaPercent}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="30" 
                  step="1"
                  value={hsaPercent}
                  onChange={(e) => setHsaPercent(Number(e.target.value))}
                  style={{ width: '100%', height: '8px', borderRadius: '4px', accentColor: 'var(--color-success)' }}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label">Pension / Retirement (%)</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--color-secondary)' }}>{pensionPercent}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="25" 
                  step="1"
                  value={pensionPercent}
                  onChange={(e) => setPensionPercent(Number(e.target.value))}
                  style={{ width: '100%', height: '8px', borderRadius: '4px', accentColor: 'var(--color-secondary)' }}
                />
              </div>
            </div>

            {/* Results Display */}
            <div style={{
              backgroundColor: 'var(--bg-sidebar)',
              border: 'var(--medium-border)',
              boxShadow: '4px 4px 0px #000',
              padding: '24px',
              borderRadius: '8px',
              color: '#FFF',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              textAlign: 'left'
            }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#A1A1AA' }}>Total Wages Committed</span>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#FFF', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  ${monthlyPayroll.toLocaleString()} <span style={{ fontSize: '12px', color: '#A1A1AA' }}>USDC/mo</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', borderTop: '2px dashed rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#A1A1AA' }}>Diverted to Health HSA:</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>+${estimatedHsaStream} USDC</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#A1A1AA' }}>Diverted to Pension Vault:</span>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>+${estimatedPensionStream} USDC</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                  <span style={{ color: '#A1A1AA' }}>Total Benefits Accrual:</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>+${(Number(estimatedHsaStream) + Number(estimatedPensionStream)).toFixed(2)} USDC</span>
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,255,255,0.08)',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#D4D4D8'
              }}>
                ℹ️ <strong>Co-op Safety Net:</strong> 20% of your Health contribution ($<strong>{(estimatedHsaStream * 0.2).toFixed(2)} USDC</strong>) will support global community insurance claims.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section (High Conversion Focus) */}
      <section id="waitlist-section" style={{ maxWidth: '800px', width: '100%', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{
          backgroundColor: 'var(--color-primary)',
          border: 'var(--thick-border)',
          boxShadow: 'var(--shadow-flat-lg)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative background shape */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '120px',
            height: '120px',
            backgroundColor: 'var(--color-success)',
            border: 'var(--medium-border)',
            borderRadius: '50%',
            zIndex: 0,
            opacity: 0.8
          }}></div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div style={{
              width: '44px',
              height: '44px',
              backgroundColor: '#FFF',
              border: 'var(--medium-border)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} color="var(--text-main)" />
            </div>
            
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-main)', lineHeight: '1.1' }}>
              Join the Continuous Finance Movement
            </h2>
            
            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)', maxWidth: '520px' }}>
              Apply for early developer sandbox keys or request waitlist status to integrate NexaFlow streams into your company's HR workflow.
            </p>

            {!waitlistJoined ? (
              <form onSubmit={handleWaitlistSubmit} style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '480px', marginTop: '12px' }}>
                <input 
                  type="email" 
                  required
                  placeholder="Enter corporate email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ flexGrow: 1, backgroundColor: '#FFF', border: 'var(--medium-border)', padding: '12px' }}
                  disabled={isSubmitting}
                />
                <button 
                  type="submit" 
                  className="btn btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Joining...</span>
                  ) : (
                    <>
                      <span>Join Waitlist</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div style={{
                backgroundColor: '#FFF',
                border: 'var(--medium-border)',
                boxShadow: '4px 4px 0px #000',
                padding: '24px',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '480px',
                marginTop: '12px',
                textAlign: 'center',
                animation: 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', border: 'var(--thin-border)' }}>
                    <Check size={16} color="var(--text-main)" />
                  </div>
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>You've joined the waitlist!</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  We sent an onboarding code to <strong>{email}</strong>.
                </p>
                <div style={{
                  backgroundColor: 'var(--bg-main)',
                  border: 'var(--thin-border)',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '800',
                  fontFamily: 'var(--font-mono)',
                  margin: '12px 0 0',
                  display: 'inline-block'
                }}>
                  QUEUE ID: #{queueNumber}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Real-time Diagnostics Indicator Bar */}
      <section style={{ maxWidth: '900px', width: '100%', margin: '0 auto 60px', padding: '0 24px' }}>
        <div style={{
          backgroundColor: '#FFF',
          border: 'var(--medium-border)',
          boxShadow: 'var(--shadow-flat-sm)',
          borderRadius: '8px',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--color-success)" className="animate-pulse" />
            <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Protocol Status Diagnostic:</span>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '11px', fontWeight: '700' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-success)', borderRadius: '50%' }}></span>
              <span>Arc scan RPC: Connected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-success)', borderRadius: '50%' }}></span>
              <span>Circle DCW Ledger: Active</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-success)', borderRadius: '50%' }}></span>
              <span>AI Verifier Agent: Sandboxed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderTop: 'var(--thick-border)',
        padding: '60px 40px 40px',
        color: '#FFF',
        marginTop: 'auto',
        textAlign: 'left'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr repeat(4, 1fr)', gap: '40px', paddingBottom: '40px', borderBottom: '2px dashed rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'var(--color-success)',
                border: 'var(--thin-border)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={16} color="var(--text-main)" fill="var(--text-main)" />
              </div>
              <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>NexaFlow</span>
            </div>
            <p style={{ fontSize: '12px', color: '#A1A1AA', lineHeight: '1.6', maxWidth: '280px' }}>
              Autonomous continuous payroll streams and AI-governed co-op micro-benefits ledger built natively on Arc Testnet.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '16px' }}>Product</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', padding: 0 }}>
              <li><button onClick={onLaunchApp} style={{ background: 'none', border: 'none', color: '#D4D4D8', cursor: 'pointer', padding: 0 }} className="hover-underline">Dashboard</button></li>
              <li><button onClick={onLaunchApp} style={{ background: 'none', border: 'none', color: '#D4D4D8', cursor: 'pointer', padding: 0 }} className="hover-underline">AI Agent Center</button></li>
              <li><button onClick={onLaunchApp} style={{ background: 'none', border: 'none', color: '#D4D4D8', cursor: 'pointer', padding: 0 }} className="hover-underline">Salary Streams</button></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: '16px' }}>Developers</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', padding: 0 }}>
              <li><button onClick={() => navigateTo('docs')} style={{ background: 'none', border: 'none', color: '#D4D4D8', cursor: 'pointer', padding: 0 }} className="hover-underline">Documentation</button></li>
              <li><a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" style={{ color: '#D4D4D8', textDecoration: 'none' }} className="hover-underline">Arcscan Explorer</a></li>
              <li><a href="https://github.com/miamailasol/NexaFlow" target="_blank" rel="noopener noreferrer" style={{ color: '#D4D4D8', textDecoration: 'none' }} className="hover-underline">GitHub</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '16px' }}>Resources</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', padding: 0 }}>
              <li><button onClick={() => navigateTo('faq')} style={{ background: 'none', border: 'none', color: '#D4D4D8', cursor: 'pointer', padding: 0 }} className="hover-underline">FAQ Help</button></li>
              <li><button onClick={() => navigateTo('about')} style={{ background: 'none', border: 'none', color: '#D4D4D8', cursor: 'pointer', padding: 0 }} className="hover-underline">About Us</button></li>
              <li><button onClick={() => navigateTo('contact')} style={{ background: 'none', border: 'none', color: '#D4D4D8', cursor: 'pointer', padding: 0 }} className="hover-underline">Technical Support</button></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-warning)', textTransform: 'uppercase', marginBottom: '16px' }}>Legal</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', padding: 0 }}>
              <li><button onClick={() => navigateTo('privacy')} style={{ background: 'none', border: 'none', color: '#D4D4D8', cursor: 'pointer', padding: 0 }} className="hover-underline">Privacy Policy</button></li>
              <li><button onClick={() => navigateTo('terms')} style={{ background: 'none', border: 'none', color: '#D4D4D8', cursor: 'pointer', padding: 0 }} className="hover-underline">Terms of Service</button></li>
            </ul>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '30px auto 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '11px', color: '#71717A' }}>
          <span>© 2026 NexaFlow Inc. Built for the Agora Stablecoin Commerce Stack Challenge.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Target Gas: ~0.01 USDC (Sponsored)</span>
            <span>·</span>
            <span>Arc Chain Network</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
