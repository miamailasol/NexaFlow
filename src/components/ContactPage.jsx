import React, { useState } from 'react';
import { Zap, ArrowLeft, Send, Check, HeartHandshake, HelpCircle, ShieldAlert, ChevronRight, BookOpen } from 'lucide-react';

export default function ContactPage({ onLaunchApp, navigateTo }) {
  const [topic, setTopic] = useState('integration');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !message) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setMessage('');
      setEmail('');
    }, 1000);
  };

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
          <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>NexaFlow Helpdesk</span>
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
        <span className="breadcrumb-item active">Support Inquiry</span>
      </div>

      {/* Main Grid */}
      <main className="contact-main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', maxWidth: '1000px', width: '100%', margin: '40px auto', padding: '0 24px' }}>
        
        {/* Support channels info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-flat)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '2.5px dashed var(--border-color)', paddingBottom: '8px' }}>
              Direct Support Channels
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <div>
                <strong>Technical Discord Channel:</strong>
                <p style={{ marginTop: '2px' }}><a href="#" style={{ color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'none' }} className="hover-underline">discord.gg/nexaflow</a></p>
              </div>
              <div>
                <strong>Developer Github Issues:</strong>
                <p style={{ marginTop: '2px' }}><a href="https://github.com/miamailasol/NexaFlow" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-success)', fontWeight: '700', textDecoration: 'none' }} className="hover-underline">github.com/miamailasol/NexaFlow/issues</a></p>
              </div>
              <div>
                <strong>Compliance Officer Email:</strong>
                <p style={{ marginTop: '2px' }}><a href="mailto:support@nexaflow.io" style={{ color: 'var(--color-secondary)', fontWeight: '700', textDecoration: 'none' }} className="hover-underline">support@nexaflow.io</a></p>
              </div>
            </div>
          </div>

          <div className="panel-card" style={{ backgroundColor: 'var(--color-secondary)', border: 'var(--medium-border)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-flat-sm)', fontSize: '12px' }}>
            <span style={{ fontWeight: '800' }}>💡 Sandbox Testing Guideline:</span>
            <p style={{ marginTop: '4px', lineHeight: '1.5' }}>
              Need testnet tokens? Click the "Claim Free Demo Funds" button in the app sidebar to mint test USDC on the Arc Chain instantly.
            </p>
          </div>
        </div>

        {/* Contact form panel */}
        <div className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-flat-lg)' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-primary)' }}>Inquiry desk</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2.5px dashed #000', paddingBottom: '10px', marginBottom: '20px', marginTop: '4px' }}>
            Submit Technical inquiry
          </h2>

          {!submitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Corporate Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ border: 'var(--medium-border)', padding: '12px' }}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Subject Category</label>
                <select 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="form-input"
                  style={{ border: 'var(--medium-border)', padding: '12px' }}
                  disabled={isSubmitting}
                >
                  <option value="integration">Stream Integration & Setup</option>
                  <option value="coop">Co-op Staking Deficits</option>
                  <option value="passkeys">Biometric Passkey Smart Wallets</option>
                  <option value="compliance">AML/OFAC scanner criteria</option>
                  <option value="bug">Security Vulnerability Report</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Detailed Message</label>
                <textarea 
                  required
                  rows="4" 
                  placeholder="Explain your technical question or bug reports..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="form-input"
                  style={{ border: 'var(--medium-border)', padding: '12px', width: '100%', resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                  disabled={isSubmitting}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Sending message...</span>
                ) : (
                  <>
                    <span>Submit Inquiry</span>
                    <Send size={14} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div style={{
              backgroundColor: 'var(--bg-main)',
              border: 'var(--medium-border)',
              boxShadow: '4px 4px 0px #000',
              padding: '24px',
              borderRadius: '8px',
              textAlign: 'center',
              animation: 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'var(--thin-border)' }}>
                  <Check size={16} color="var(--text-main)" />
                </div>
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>Message Dispatched!</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Our compliance or tech desk will review your inquiry.
              </p>
              <button 
                onClick={() => setSubmitted(false)} 
                className="btn btn-secondary" 
                style={{ fontSize: '11px', padding: '8px 12px', marginTop: '16px' }}
              >
                Submit New Message
              </button>
            </div>
          )}
        </div>

        {/* Related Pages Section */}
        <div className="related-section" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-main)', marginBottom: '8px' }}>
            Related Resources
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Learn more about the technology stack and operations of NexaFlow.
          </p>
          
          <div className="related-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="related-card" onClick={() => navigateTo('docs')}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '8px' }}>
                  <BookOpen size={16} />
                  <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>API Guide</span>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>DEVELOPER DOCUMENTATION</h4>
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

            <div className="related-card" onClick={() => navigateTo('about')}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)', marginBottom: '8px' }}>
                  <HeartHandshake size={16} />
                  <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Our Mission</span>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>PHILOSOPHY & VALUES</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Learn about our decentralized benefits thesis, target demographics, and why continuous finance is essential for remote teams.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800', color: 'var(--color-secondary)', textTransform: 'uppercase', marginTop: '12px' }}>
                <span>View About Us</span>
                <ChevronRight size={12} />
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
