import React, { useState } from 'react';
import { Zap, ArrowLeft, Search, HelpCircle, ChevronDown, ChevronUp, Layers, ChevronRight, BookOpen, HeartHandshake, Sliders } from 'lucide-react';

export default function FaqPage({ onLaunchApp, navigateTo }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const renderAnswer = (faq) => {
    if (faq.category === 'payroll') {
      return (
        <div>
          <p>{faq.answer}</p>
          <button 
            onClick={(e) => { e.stopPropagation(); navigateTo('app', 'streaming'); }}
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '11px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Launch Salary Streams Setup</span>
            <ChevronRight size={12} />
          </button>
        </div>
      );
    }
    if (faq.category === 'benefits') {
      return (
        <div>
          <p>{faq.answer}</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); navigateTo('app', 'coop'); }}
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Visit Co-op Pool</span>
              <ChevronRight size={12} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); navigateTo('app', 'benefits'); }}
              className="btn btn-outline" 
              style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: 'var(--thin-border)', borderRadius: '4px', background: 'none', cursor: 'pointer', fontWeight: '800' }}
            >
              <span>Configure HSA Splits</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      );
    }
    if (faq.category === 'security' && faq.question.includes('Passkeys')) {
      return (
        <div>
          <p>{faq.answer}</p>
          <button 
            onClick={(e) => { e.stopPropagation(); navigateTo('app', 'passkeys'); }}
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '11px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Setup Passkey Smart Wallet</span>
            <ChevronRight size={12} />
          </button>
        </div>
      );
    }
    if (faq.category === 'security' && faq.question.includes('AI Verifier')) {
      return (
        <div>
          <p>{faq.answer}</p>
          <button 
            onClick={(e) => { e.stopPropagation(); navigateTo('app', 'agents'); }}
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '11px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Open Agent Command Center</span>
            <ChevronRight size={12} />
          </button>
        </div>
      );
    }
    return <p>{faq.answer}</p>;
  };

  const faqs = [
    {
      question: "How does continuous wage streaming actually work under the hood?",
      answer: "When an employer initiates a salary stream, they escrow USDC into our StreamingPayroll contract and specify a flow rate (e.g. 0.00185 USDC per second). The blockchain contract computes wages in real-time. The recipient can click 'Withdraw' at any time to pull all accrued USDC instantly.",
      category: "payroll"
    },
    {
      question: "Why is Arc Chain better than other layers like Ethereum or Base?",
      answer: "Arc Chain utilizes USDC as its native gas token. Unlike Ethereum or Base which require users to acquire and hold volatile ETH to pay transaction fees, NexaFlow transactions on Arc burn fractional USDC directly. This eliminates cryptocurrency exposure for employees and enables sponsors to cover gas fees entirely.",
      category: "network"
    },
    {
      question: "What is the Community Co-op Safety Pool?",
      answer: "For employees who opt to allocate percentage cuts of their salary to Healthcare HSA vaults, NexaFlow automatically routes 80% to their personal health wallet and redirects 20% to a global shared treasury pool. If a worker incurs a healthcare invoice that exceeds their personal balance, the global pool automatically covers the deficit.",
      category: "benefits"
    },
    {
      question: "Is the AI Verifier Agent secure, and how does it prevent hacks?",
      answer: "Our verification agent runs inside a secure sandboxed enclave. It parses clinic receipts via secure OCR, checks OFAC/AML blocklists, and executes transactions via Circle Developer-Controlled Wallets. Only the authorized verifier key is permitted to trigger claims payouts from the Co-op Benefits Vault, protecting pool solvency.",
      category: "security"
    },
    {
      question: "Can employees access funds using biometric Passkeys?",
      answer: "Yes. NexaFlow supports ERC-4337 smart account wallets. Workers can link their device enclaves (such as Apple FaceID or Android TouchID) to generate cryptographic passkeys. This allows them to execute salary withdrawals with zero gas costs and without managing raw 12-word seed phrases.",
      category: "security"
    }
  ];

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'payroll', label: 'Streaming Payroll' },
    { id: 'network', label: 'Arc Network' },
    { id: 'benefits', label: 'Micro-Benefits' },
    { id: 'security', label: 'Security & Enclaves' }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
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
          <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>NexaFlow Help</span>
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
        <span className="breadcrumb-item active">FAQ Helpdesk</span>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '800px', width: '100%', margin: '40px auto', padding: '0 24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-primary)' }}>FAQ Desk</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-main)', marginTop: '4px' }}>
            Frequently Answered Questions
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500', marginTop: '6px' }}>
            Find technical and operational details regarding NexaFlow streaming finance.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="panel-card" style={{ padding: '16px', backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '12px', boxShadow: 'var(--shadow-flat)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Search size={20} color="var(--text-main)" />
          <input 
            type="text" 
            placeholder="Search FAQs by keywords..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ flexGrow: 1, border: 'var(--thin-border)', padding: '10px', boxShadow: 'none' }}
          />
        </div>

        {/* Categories Bar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="badge"
              style={{
                backgroundColor: activeCategory === cat.id ? 'var(--color-success)' : '#FFF',
                color: 'var(--text-main)',
                border: 'var(--thin-border)',
                padding: '8px 14px',
                cursor: 'pointer',
                fontWeight: '800',
                transform: activeCategory === cat.id ? 'rotate(1deg) translateY(-1px)' : 'none'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="panel-card" 
                  style={{ 
                    backgroundColor: '#FFF', 
                    border: 'var(--medium-border)', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    boxShadow: 'var(--shadow-flat-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease-in-out'
                  }}
                  onClick={() => toggleExpand(idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <HelpCircle size={18} color="var(--color-primary)" />
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                        {faq.question}
                      </h4>
                    </div>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>

                  {isExpanded && (
                    <div style={{ 
                      marginTop: '12px', 
                      paddingTop: '12px', 
                      borderTop: '1.5px dashed var(--border-color)', 
                      fontSize: '13px', 
                      lineHeight: '1.6', 
                      color: 'var(--text-muted)',
                      fontWeight: '500' 
                    }}>
                      {renderAnswer(faq)}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed rgba(0,0,0,0.15)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
              No matches found for your search query. Try typing another term.
            </div>
          )}
        </div>

        {/* Related Pages Section */}
        <div className="related-section">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-main)', marginBottom: '8px' }}>
            Related Resources
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Explore other developer resources and channels of the NexaFlow continuous payroll ecosystem.
          </p>
          
          <div className="related-grid">
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

            <div className="related-card" onClick={() => navigateTo('about')}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', marginBottom: '8px' }}>
                  <HeartHandshake size={16} />
                  <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Our Mission</span>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>PHILOSOPHY & VALUES</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Learn about our decentralized benefits thesis, target demographics, and why continuous finance is essential for remote teams.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800', color: 'var(--color-success)', textTransform: 'uppercase', marginTop: '12px' }}>
                <span>View About Us</span>
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
