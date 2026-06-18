import React from 'react';
import TermsClient from './TermsClient';

export const metadata = {
  title: 'Terms of Service | NexaFlow Protocol Guidelines',
  description: 'Read the NexaFlow service guidelines, smart contract streaming policies, biometric passkeys usage agreement, and fee structures on the Arc Chain.',
  alternates: {
    canonical: 'https://nexaflow.surf/legal/terms'
  },
  openGraph: {
    title: 'Terms of Service | NexaFlow Protocol Guidelines',
    description: 'Read the NexaFlow service guidelines, smart contract streaming policies, biometric passkeys usage agreement, and fee structures on the Arc Chain.',
    url: 'https://nexaflow.surf/legal/terms',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | NexaFlow Protocol Guidelines',
    description: 'Read the NexaFlow service guidelines, smart contract streaming policies, biometric passkeys usage agreement, and fee structures on the Arc Chain.'
  }
};

export default function TermsPage() {
  const termsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://nexaflow.surf/legal/terms/#webpage',
    'url': 'https://nexaflow.surf/legal/terms',
    'name': 'Terms of Service - NexaFlow',
    'description': 'Read the NexaFlow service guidelines, smart contract streaming policies, biometric passkeys usage agreement, and fee structures on the Arc Chain.',
    'publisher': {
      '@type': 'Organization',
      'name': 'NexaFlow'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsSchema) }}
      />
      <TermsClient />
    </>
  );
}
