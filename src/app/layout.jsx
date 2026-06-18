import React from 'react';
import '../styles/globals.css';
import { Providers } from './providers';

export const metadata = {
  metadataBase: new URL('https://nexaflow.surf'),
  title: {
    default: 'NexaFlow - Autonomous Continuous Payroll Protocol',
    template: '%s | NexaFlow'
  },
  description: 'Scale corporate payroll dynamically with autonomous flows, security verification, and biometric smart accounts.',
  keywords: [
    'Web3 Payroll',
    'Continuous Payroll Streaming',
    'Circle Web3 Wallets',
    'Circle UCW',
    'Arc Testnet Gasless',
    'Smart Contract Payroll',
    'Solidity Streaming Payroll',
    'Community Co-op Safety Pool',
    'NexaFlow',
    'USDC Payroll Routing'
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-48x48.png', type: 'image/png', sizes: '48x48' },
      { url: '/favicon-64x64.png', type: 'image/png', sizes: '64x64' },
      { url: '/favicon-128x128.png', type: 'image/png', sizes: '128x128' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#863bff'
      }
    ]
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: './'
  },
  openGraph: {
    title: 'NexaFlow - Autonomous Continuous Payroll Protocol',
    description: 'Scale corporate payroll dynamically with autonomous flows, security verification, and biometric smart accounts.',
    url: 'https://nexaflow.surf',
    siteName: 'NexaFlow',
    images: [
      {
        url: 'https://nexaflow.surf/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NexaFlow Platform Preview'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexaFlow - Autonomous Continuous Payroll Protocol',
    description: 'Scale corporate payroll dynamically with autonomous flows, security verification, and biometric smart accounts.',
    images: ['https://nexaflow.surf/og-image.png']
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "NexaFlow",
  "operatingSystem": "All",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD"
  },
  "description": "Autonomous continuous Web3 payroll and micro-benefits routing protocol built natively on Arc Testnet and Circle stablecoin stack."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
