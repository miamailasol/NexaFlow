import React, { useState } from 'react';
import { Zap, ArrowLeft, Terminal, Code, Copy, Check, FileText, Cpu, BookOpen, ChevronRight, HelpCircle, HeartHandshake, Sliders } from 'lucide-react';
import { NetworkIcon } from './Icons';

export default function DocsPage({ onLaunchApp, navigateTo }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const codeSnippets = [
    {
      title: "Query Stream Claimable Wages (viem / typescript)",
      lang: "typescript",
      code: `import { createPublicClient, http, formatUnits } from 'viem';
import { arcTestnet } from 'viem/chains';

const STREAMING_PAYROLL_ADDRESS = '0x4300000000000000000000000000000000000000';
const STREAMING_PAYROLL_ABI = [
  {
    inputs: [{ name: "streamId", type: "bytes32" }],
    name: "getClaimableAmount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

const client = createPublicClient({
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.network')
});

async function checkClaimable(streamId: \`0x\${string}\`) {
  const claimableWei = await client.readContract({
    address: STREAMING_PAYROLL_ADDRESS,
    abi: STREAMING_PAYROLL_ABI,
    functionName: 'getClaimableAmount',
    args: [streamId]
  });
  
  // Note: USDC token balances on Arc are represented in 6 decimal places.
  return formatUnits(claimableWei, 6);
}`
    },
    {
      title: "Creating a Payroll Stream (viem / typescript)",
      lang: "typescript",
      code: `import { createWalletClient, custom, parseUnits } from 'viem';
import { arcTestnet } from 'viem/chains';

const STREAMING_PAYROLL_ADDRESS = '0x4300000000000000000000000000000000000000';
const USDC_TOKEN_ADDRESS = '0x3600000000000000000000000000000000000000';

async function deployNewStream(employeeAddress: string, flowRatePerSec: number, totalCapAmount: number) {
  const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
  
  const walletClient = createWalletClient({
    account,
    chain: arcTestnet,
    transport: custom(window.ethereum)
  });

  const flowRateWei = parseUnits(flowRatePerSec.toString(), 6);
  const totalCapWei = parseUnits(totalCapAmount.toString(), 6);

  // 1. Approve USDC first
  // 2. Call createStream(employeeAddress, flowRateWei, totalCapWei)
  const txHash = await walletClient.writeContract({
    address: STREAMING_PAYROLL_ADDRESS,
    abi: [
      {
        inputs: [
          { name: "employee", type: "address" },
          { name: "flowRate", type: "uint256" },
          { name: "totalCap", type: "uint256" }
        ],
        name: "createStream",
        outputs: [{ name: "streamId", type: "bytes32" }],
        stateMutability: "nonpayable",
        type: "function"
      }
    ],
    functionName: 'createStream',
    args: [employeeAddress, flowRateWei, totalCapWei]
  });

  return txHash;
}`
    }
  ];

  const handleCopy = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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
      {/* Header */}
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
          <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>NexaFlow Docs</span>
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
        <span className="breadcrumb-item active">Developer Documentation</span>
      </div>

      {/* Main content grid */}
      <main className="docs-main-grid">
        
        {/* Sidebar Nav */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '90px', height: 'fit-content' }}>
          <div className="panel-card" style={{ padding: '16px', backgroundColor: '#FFF', border: 'var(--medium-border)', borderRadius: '8px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '2px dashed var(--border-color)', paddingBottom: '6px' }}>Technical Guide</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', padding: 0 }}>
              <li><a href="#overview" style={{ color: 'var(--text-main)', fontWeight: '700', textDecoration: 'none' }} className="hover-underline">Protocol Overview</a></li>
              <li><a href="#arc-chain" style={{ color: 'var(--text-main)', fontWeight: '700', textDecoration: 'none' }} className="hover-underline">Arc Gas Architecture</a></li>
              <li><a href="#contracts" style={{ color: 'var(--text-main)', fontWeight: '700', textDecoration: 'none' }} className="hover-underline">Smart Contract Registry</a></li>
              <li><a href="#api" style={{ color: 'var(--text-main)', fontWeight: '700', textDecoration: 'none' }} className="hover-underline">Integration API</a></li>
            </ul>
          </div>
        </aside>

        {/* Docs Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Section 1: Overview */}
          <section id="overview" className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '12px', padding: '28px', boxShadow: 'var(--shadow-flat)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2.5px dashed #000', paddingBottom: '10px', marginBottom: '16px' }}>
              Protocol Overview & Primitives
            </h2>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-muted)', fontWeight: '500' }}>
              NexaFlow operates as a decentralized, non-custodial continuous compensation routing engine. Employers deploy USDC payroll contracts and seed them with reserves. Smart contract logic calculates worker balances per-second based on time elapsed since last withdrawal. 
            </p>
            <div style={{ marginTop: '16px', backgroundColor: 'var(--bg-main)', border: 'var(--thin-border)', padding: '12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
              📊 <strong>Wage Accrual Rule:</strong> Claimable Balance = elapsed_seconds × flow_rate_per_sec (subject to escrow limits).
            </div>
          </section>

          {/* Section 2: Arc Chain */}
          <section id="arc-chain" className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '12px', padding: '28px', boxShadow: 'var(--shadow-flat)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2.5px dashed #000', paddingBottom: '10px', marginBottom: '16px' }}>
              Arc Chain Native USDC Gas
            </h2>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-muted)', fontWeight: '500' }}>
              NexaFlow is deployed on the **Arc Chain**, a stablecoin-first L2 network. On Arc, transaction gas fees are paid directly in <strong>USDC</strong> instead of volatile native utility assets (like ETH, SOL, or MATIC). This guarantees predictable, rock-solid processing fees (averaging ~0.01 USDC per transfer) and enables gas sponsorship capabilities for remote workers.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span className="badge badge-success">USDC Native Gas asset</span>
              <span className="badge badge-info">Zero utility-token friction</span>
              <span className="badge badge-warning">~0.01 USDC average cost</span>
            </div>
          </section>

          {/* Section 3: Smart Contract Registry */}
          <section id="contracts" className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '12px', padding: '28px', boxShadow: 'var(--shadow-flat)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2.5px dashed #000', paddingBottom: '10px', marginBottom: '16px' }}>
              Smart Contract Registry
            </h2>
            <div className="table-container" style={{ border: 'var(--medium-border)', borderRadius: '8px', overflowX: 'auto', overflowY: 'hidden', marginTop: '12px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contract Name</th>
                    <th>Network Target</th>
                    <th>Hex Registry address</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '800' }}>StreamingPayroll</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <NetworkIcon name="Arc Testnet" size={14} />
                        <span>Arc Testnet</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>0xC8f71FCDD3bDeaC7601f0DE727b165b4c10aBD2c</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '800' }}>MicroBenefitsVault</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <NetworkIcon name="Arc Testnet" size={14} />
                        <span>Arc Testnet</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>0xe6Cc45e2270929281aCbF499424D0F8dca9D5184</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '800' }}>USDC ERC-20 Gas</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <NetworkIcon name="Arc Testnet" size={14} />
                        <span>Arc Testnet</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>0x3600000000000000000000000000000000000000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Integration Code */}
          <section id="api" className="panel-card" style={{ backgroundColor: '#FFF', border: 'var(--thick-border)', borderRadius: '12px', padding: '28px', boxShadow: 'var(--shadow-flat)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2.5px dashed #000', paddingBottom: '10px', marginBottom: '20px' }}>
              Integration API Code Snippets
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {codeSnippets.map((snippet, idx) => (
                <div key={idx} style={{ border: 'var(--medium-border)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#1E1E24' }}>
                  <div style={{ backgroundColor: 'var(--bg-sidebar)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#FFF', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
                      {snippet.title}
                    </span>
                    <button 
                      onClick={() => handleCopy(snippet.code, idx)} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: 'var(--color-primary)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}
                    >
                      {copiedIndex === idx ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
                      <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: '16px', overflowX: 'auto', textAlign: 'left' }}>
                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#85E89D', lineHeight: '1.5' }}>
                      {snippet.code}
                    </code>
                  </pre>
                </div>
              ))}
            </div>
          </section>

          {/* Related Pages Section */}
          <div className="related-section">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-main)', marginBottom: '8px' }}>
              Related Resources
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Explore other areas of the NexaFlow continuous payroll and micro-benefits platform.
            </p>
            
            <div className="related-grid">
              <div className="related-card" onClick={() => navigateTo('app', 'contracts')}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '8px' }}>
                    <Code size={16} />
                    <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Visual Spec Sandbox</span>
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>SOLIDITY SMART CONTRACTS</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Inspect full compilable Solidity source code for StreamingPayroll and MicroBenefitsVault directly inside the sandbox viewer.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800', color: 'var(--color-primary)', textTransform: 'uppercase', marginTop: '12px' }}>
                  <span>Open Code Viewer</span>
                  <ChevronRight size={12} />
                </div>
              </div>

              <div className="related-card" onClick={() => navigateTo('faq')}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', marginBottom: '8px' }}>
                    <HelpCircle size={16} />
                    <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Faq Helpdesk</span>
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>COMMON OPERATIONS</h4>
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

        </div>
      </main>
    </div>
  );
}
