import React from 'react';
import { Zap, ArrowLeft, HeartHandshake, Compass, Users, Scale, ShieldAlert, ChevronRight, BookOpen, HelpCircle, Sliders } from 'lucide-react';

export default function AboutPage({ onLaunchApp, navigateTo }) {
  const coreValues = [
    {
      icon: <Compass size={20} />,
      title: "Continuous Liquidity",
      desc: "Financial remuneration shouldn't be locked for 30-day intervals. Capital should circulate dynamically as labor is performed.",
      color: "var(--color-primary)"
    },
    {
      icon: <Users size={20} />,
      title: "Cooperative Safety",
      desc: "Uniting remote contractors under a decentralized health savings co-op underwrites safety nets without relying on central brokers.",
      color: "var(--color-success)"
    },
    {
      icon: <Scale size={20} />,
      title: "Micropayment Feasibility",
      desc: "Operating on stablecoin native gas networks makes transactions costing less than a penny reliable and scalable.",
      color: "var(--color-secondary)"
    }
  ];

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
          <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>About NexaFlow</span>
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
        <span className="breadcrumb-item active">About NexaFlow</span>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '850px', width: '100%', margin: '40px auto', padding: '0 24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Storytelling Section */}
        <section className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-flat)' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-primary)' }}>Our Philosophy</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2.5px dashed #000', paddingBottom: '10px', marginBottom: '16px', marginTop: '4px' }}>
            Our Mission: Re-engineering Financial Settlement
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-muted)', fontWeight: '500' }}>
            Modern remote workforce arrangements represent a paradigm shift, yet corporate compensation rails remain anchored in outdated 20th-century banking architectures. Traditional banking cycles create capital lockups, expose workers to exorbitant international transfer costs, and exclude gig contractors from institutional healthcare options or retirement reserves.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-muted)', fontWeight: '500', marginTop: '12px' }}>
            NexaFlow was built during the <strong>Agora Stablecoin Commerce Stack Challenge</strong> to construct a superior payroll routing alternative. By combining per-second streaming payroll escrows with autonomous verification agents, we unlock a frictionless global workforce infrastructure that guarantees real-time compliance and sovereign custody.
          </p>
        </section>

        {/* Core Values Grid */}
        <section className="about-values-grid">
          {coreValues.map((val, idx) => (
            <div key={idx} className="panel-card" style={{ 
              backgroundColor: '#FFF', 
              border: 'var(--medium-border)', 
              borderRadius: '12px', 
              boxShadow: 'var(--shadow-flat-sm)', 
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transform: idx % 2 === 0 ? 'rotate(-0.5deg)' : 'rotate(0.5deg)'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                backgroundColor: val.color,
                border: 'var(--thin-border)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '1.5px 1.5px 0px #000'
              }}>
                {val.icon}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-main)' }}>
                {val.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', fontWeight: '500' }}>
                {val.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Hackathon Compliance/Disclaimer Section */}
        <section className="panel-card" style={{ backgroundColor: 'var(--bg-sidebar)', color: '#FFF', border: 'var(--thick-border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-flat-sm)', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <ShieldAlert size={36} color="var(--color-warning)" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: '#FFF', marginBottom: '4px' }}>
              Hackathon Sandbox Prototype Disclaimer
            </h4>
            <p style={{ fontSize: '11px', color: '#A1A1AA', lineHeight: '1.5' }}>
              NexaFlow is currently operating as a technology prototype running exclusively on the Arc Testnet and Base Sepolia. All operations process simulated assets. Real USDC deposits require regulatory approval and compliance registration under local jurisdiction frameworks.
            </p>
          </div>
        </section>

        {/* Related Pages Section */}
        <div className="related-section">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-main)', marginBottom: '8px' }}>
            Related Resources
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Learn more about integrating NexaFlow streaming salary escrows and enclaves.
          </p>
          
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
