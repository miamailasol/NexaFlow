import React from 'react';
import AboutClient from './AboutClient';

export const metadata = {
  title: 'About Us | NexaFlow Continuous Payroll Protocol',
  description: "Discover NexaFlow's mission, our stablecoin payment streaming rails, biometric passkeys integration, and autonomous medical splits architecture built for remote organizations.",
  alternates: {
    canonical: 'https://nexaflow.surf/about'
  },
  openGraph: {
    title: 'About Us | NexaFlow Continuous Payroll Protocol',
    description: "Discover NexaFlow's mission, our stablecoin payment streaming rails, biometric passkeys integration, and autonomous medical splits architecture.",
    url: 'https://nexaflow.surf/about',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | NexaFlow Continuous Payroll Protocol',
    description: "Discover NexaFlow's mission, our stablecoin payment streaming rails, biometric passkeys integration, and autonomous medical splits architecture."
  }
};

export default function About() {
  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://nexaflow.surf/about/#webpage',
    'url': 'https://nexaflow.surf/about',
    'name': 'About Us - NexaFlow',
    'description': "Discover NexaFlow's mission, our stablecoin payment streaming rails, biometric passkeys integration, and autonomous medical splits architecture.",
    'publisher': {
      '@type': 'Organization',
      'name': 'NexaFlow'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <AboutClient />
    </>
  );
}
