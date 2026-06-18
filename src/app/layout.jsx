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
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
