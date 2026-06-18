import React from 'react';
import PrivacyClient from './PrivacyClient';

export const metadata = {
  title: 'Privacy Policy | NexaFlow Financial Streaming Platform',
  description: 'Understand how NexaFlow secures your transaction information, manages on-chain cryptographic address privacy, and sandboxes biometric enclave credentials.',
  alternates: {
    canonical: 'https://nexaflow.surf/legal/privacy'
  },
  openGraph: {
    title: 'Privacy Policy | NexaFlow Financial Streaming Platform',
    description: 'Understand how NexaFlow secures your transaction information, manages on-chain cryptographic address privacy, and sandboxes biometric enclave credentials.',
    url: 'https://nexaflow.surf/legal/privacy',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | NexaFlow Financial Streaming Platform',
    description: 'Understand how NexaFlow secures your transaction information, manages on-chain cryptographic address privacy, and sandboxes biometric enclave credentials.'
  }
};

export default function PrivacyPage() {
  const privacySchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://nexaflow.surf/legal/privacy/#webpage',
    'url': 'https://nexaflow.surf/legal/privacy',
    'name': 'Privacy Policy - NexaFlow',
    'description': 'Understand how NexaFlow secures your transaction information, manages on-chain cryptographic address privacy, and sandboxes biometric enclave credentials.',
    'publisher': {
      '@type': 'Organization',
      'name': 'NexaFlow'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacySchema) }}
      />
      <PrivacyClient />
    </>
  );
}
