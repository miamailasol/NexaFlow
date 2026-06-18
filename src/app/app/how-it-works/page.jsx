'use client';

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  STREAMING_PAYROLL_ADDRESS,
  MICRO_BENEFITS_VAULT_ADDRESS,
  USDC_TOKEN_ADDRESS
} from '@/contracts';

const streamingPayrollCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StreamingPayroll {
    struct Stream {
        address employer;
        address employee;
        uint256 flowRate; // USDC (6 decimals) per second
        uint256 startTime;
        uint256 lastUpdated;
        uint256 accruedPaid;
        uint256 totalCap; // Maximum amount for this milestone
        bool isActive;
    }

    address public immutable usdcToken;
    address public owner;
    
    mapping(bytes32 => Stream) public streams;

    // ... createStream, getClaimableAmount, withdrawFunds, cancelStream
}`;

const benefitsVaultCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MicroBenefitsVault {
    struct MemberAccount {
        uint256 healthInsuranceBalance;
        uint256 retirementBalance;
        uint256 emergencyFundBalance;
        uint256 totalContributed;
        bool isRegistered;
    }

    address public immutable usdcToken;
    address public verifierAgent; // Circle Developer-Controlled wallet
    
    mapping(address => MemberAccount) public members;

    // ... depositContribution, processClaim (AI-Agent verified)
}`;

export default function HowItWorksPage() {
  const [activeContractTab, setActiveContractTab] = useState('payroll');

  return (
    <div className="playground-layout fade-in-route">
      <div className="contracts-list">
        <div
          className={`contract-tab ${activeContractTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setActiveContractTab('payroll')}
        >
          <h4>Continuous Payroll Engine code</h4>
          <p>Salary stream escrow rules that handle continuous distributions.</p>
        </div>

        <div
          className={`contract-tab ${activeContractTab === 'vault' ? 'active' : ''}`}
          onClick={() => setActiveContractTab('vault')}
        >
          <h4>Micro-Benefits Vault code</h4>
          <p>Rules that split claimed wages and disburse clinic claims.</p>
        </div>

        <div className="panel-card" style={{ marginTop: '12px', padding: '16px' }}>
          <h5 style={{ color: 'var(--text-main)', fontSize: '14px', marginBottom: '8px' }}>Payment Network Details</h5>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><strong>Connection Status:</strong> Active (Secure)</div>
            <div><strong>Processing Cost:</strong> Sponsored (Free)</div>
            <div><strong>Settlement Delay:</strong> Sub-second (Instant)</div>
            <div><strong>Network Currency Token:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{USDC_TOKEN_ADDRESS}</span></div>
            <div><strong>Continuous Payroll Rule:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{STREAMING_PAYROLL_ADDRESS}</span></div>
            <div><strong>Benefits Vault Rule:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{MICRO_BENEFITS_VAULT_ADDRESS}</span></div>
          </div>
        </div>
      </div>

      <div className="code-viewer-container">
        <div className="code-viewer-header">
          <div className="code-viewer-title">
            {activeContractTab === 'payroll' ? 'StreamingPayroll.sol' : 'MicroBenefitsVault.sol'}
          </div>
          <a
            href={`https://testnet.arcscan.app/address/${activeContractTab === 'payroll' ? STREAMING_PAYROLL_ADDRESS : MICRO_BENEFITS_VAULT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-secondary)', textDecoration: 'none' }}
          >
            View Network Registry Link
            <ExternalLink size={12} />
          </a>
        </div>
        <pre className="code-block">
          <code>
            {activeContractTab === 'payroll' ? streamingPayrollCode : benefitsVaultCode}
          </code>
        </pre>
      </div>
    </div>
  );
}
