import React from 'react';
import FaqClient from './FaqClient';

export const metadata = {
  title: 'Frequently Asked Questions | NexaFlow Help Center',
  description: 'Find answers to common questions about continuous salary streaming, Arc Chain gas sponsorships, biometric smart accounts, and co-op HSA safety pools.',
  alternates: {
    canonical: 'https://nexaflow.surf/faq'
  },
  openGraph: {
    title: 'Frequently Asked Questions | NexaFlow Help Center',
    description: 'Find answers to common questions about continuous salary streaming, Arc Chain gas sponsorships, biometric smart accounts, and co-op HSA safety pools.',
    url: 'https://nexaflow.surf/faq',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frequently Asked Questions | NexaFlow Help Center',
    description: 'Find answers to common questions about continuous salary streaming, Arc Chain gas sponsorships, biometric smart accounts, and co-op HSA safety pools.'
  }
};

export default function FAQ() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://nexaflow.surf/faq/#faqpage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'How does continuous wage streaming actually work under the hood?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'When an employer initiates a salary stream, they escrow USDC into our StreamingPayroll contract and specify a flow rate (e.g. 0.00185 USDC per second). The blockchain contract computes wages in real-time. The recipient can withdraw accrued USDC instantly at any moment.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Why is Arc Chain better than other layers like Ethereum or Base?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Arc Chain utilizes USDC as its native gas token. Unlike Ethereum or Base which require users to acquire and hold volatile ETH to pay transaction fees, NexaFlow transactions on Arc burn fractional USDC directly. This eliminates cryptocurrency exposure for employees and enables sponsors to cover gas fees entirely.'
        }
      },
      {
        '@type': 'Question',
        'name': 'What is the Community Co-op Safety Pool?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'For employees who opt to allocate percentage cuts of their salary to Healthcare HSA vaults, NexaFlow automatically routes 80% to their personal health wallet and redirects 20% to a global shared treasury pool. If a worker incurs a healthcare invoice that exceeds their personal balance, the global pool automatically covers the deficit.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Is the AI Verifier Agent secure, and how does it prevent hacks?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Our verification agent runs inside a secure sandboxed enclave. It parses clinic receipts via secure OCR, checks OFAC/AML blocklists, and executes transactions via Circle Developer-Controlled Wallets. Only the authorized verifier key is permitted to trigger claims payouts from the Co-op Benefits Vault, protecting pool solvency.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can employees access funds using biometric Passkeys?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes. NexaFlow supports ERC-4337 smart account wallets. Workers can link their device enclaves (such as Apple FaceID or Android TouchID) to generate cryptographic passkeys. This allows them to execute salary withdrawals with zero gas costs and without managing raw 12-word seed phrases.'
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FaqClient />
    </>
  );
}
