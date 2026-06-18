import React from 'react';
import ComplianceClient from './ComplianceClient';

export const metadata = {
  title: 'AML Compliance & Security Standards | NexaFlow Legal',
  description: 'Read the NexaFlow AML policy code, OFAC/AML sanction checking regulations, and secure biometric enclave privacy standards on the Arc Chain.',
  alternates: {
    canonical: 'https://nexaflow.surf/legal/compliance'
  },
  openGraph: {
    title: 'AML Compliance & Security Standards | NexaFlow Legal',
    description: 'Read the NexaFlow AML policy code, OFAC/AML sanction checking regulations, and secure biometric enclave privacy standards on the Arc Chain.',
    url: 'https://nexaflow.surf/legal/compliance',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AML Compliance & Security Standards | NexaFlow Legal',
    description: 'Read the NexaFlow AML policy code, OFAC/AML sanction checking regulations, and secure biometric enclave privacy standards on the Arc Chain.'
  }
};

export default function CompliancePage() {
  const complianceSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://nexaflow.surf/legal/compliance/#webpage',
    'url': 'https://nexaflow.surf/legal/compliance',
    'name': 'AML Compliance & Security Standards - NexaFlow Legal',
    'description': 'Read the NexaFlow AML policy code, OFAC/AML sanction checking regulations, and secure biometric enclave privacy standards on the Arc Chain.',
    'publisher': {
      '@type': 'Organization',
      'name': 'NexaFlow'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(complianceSchema) }}
      />
      <ComplianceClient />
    </>
  );
}
