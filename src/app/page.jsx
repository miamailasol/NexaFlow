import React from 'react';
import HomeClient from './HomeClient';

// Tận dụng tối đa khả năng SEO và Metadata API của Next.js (App Router)
export const metadata = {
  metadataBase: new URL('https://nexaflow.surf'),
  title: 'NexaFlow | Autonomous Continuous Payroll Protocol on Arc Chain',
  description: 'Scale corporate payroll dynamically with autonomous flows, automated healthcare/pension splits, security scanning, and biometric passkey accounts with native USDC gas.',
  keywords: [
    'NexaFlow',
    'continuous payroll',
    'salary streaming',
    'USDC gas',
    'Arc chain',
    'Circle DCW',
    'biometric wallet',
    'passkey smart account',
    'on-chain payroll registry',
    'real-time compensation'
  ],
  alternates: {
    canonical: 'https://nexaflow.surf'
  },
  openGraph: {
    title: 'NexaFlow | Autonomous Continuous Payroll Protocol',
    description: 'Scale corporate payroll dynamically with autonomous flows, automated healthcare/pension splits, security scanning, and biometric passkey accounts.',
    url: 'https://nexaflow.surf',
    siteName: 'NexaFlow',
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexaFlow | Autonomous Continuous Payroll Protocol',
    description: 'Scale corporate payroll dynamically with autonomous flows, automated healthcare/pension splits, security scanning, and biometric passkey accounts.'
  }
};

export default function Home() {
  // Structured Data (Schema.org JSON-LD) cho Google Rich Results
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://nexaflow.surf/#organization',
    'name': 'NexaFlow',
    'url': 'https://nexaflow.surf',
    'logo': {
      '@type': 'ImageObject',
      'url': 'https://nexaflow.surf/logo.png',
      'caption': 'NexaFlow'
    }
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://nexaflow.surf/#website',
    'url': 'https://nexaflow.surf',
    'name': 'NexaFlow',
    'description': 'Autonomous continuous payroll protocol on Arc chain'
  };

  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': 'https://nexaflow.surf/#software',
    'name': 'NexaFlow Protocol',
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'WebBrowser',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD'
    }
  };

  return (
    <>
      {/* Script chèn JSON-LD schema chuẩn SEO Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <HomeClient />
    </>
  );
}
