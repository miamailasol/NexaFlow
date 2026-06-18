import React from 'react';
import DocsClient from './DocsClient';

export const metadata = {
  title: 'Developer Documentation | NexaFlow Integration Guides',
  description: 'Explore developer integration guides, API schemas, smart contract references, and biometric smart wallet configurations on the Arc Chain.',
  keywords: [
    'NexaFlow documentation',
    'developer integration guides',
    'API schema',
    'smart contract reference',
    'biometric wallet SDK',
    'Arc chain deployment',
    'Circle DCW API'
  ],
  alternates: {
    canonical: 'https://nexaflow.surf/docs'
  },
  openGraph: {
    title: 'Developer Documentation | NexaFlow Integration Guides',
    description: 'Explore developer integration guides, API schemas, smart contract references, and biometric smart wallet configurations on the Arc Chain.',
    url: 'https://nexaflow.surf/docs',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Developer Documentation | NexaFlow Integration Guides',
    description: 'Explore developer integration guides, API schemas, smart contract references, and biometric smart wallet configurations on the Arc Chain.'
  }
};

export default function Docs() {
  const docsSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': 'https://nexaflow.surf/docs/#article',
    'headline': 'NexaFlow Developer Documentation & Integration Guides',
    'description': 'Explore developer integration guides, API schemas, smart contract references, and biometric smart wallet configurations on the Arc Chain.',
    'url': 'https://nexaflow.surf/docs',
    'inLanguage': 'en',
    'publisher': {
      '@type': 'Organization',
      'name': 'NexaFlow'
    },
    'author': {
      '@type': 'Organization',
      'name': 'NexaFlow Core Team'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(docsSchema) }}
      />
      <DocsClient />
    </>
  );
}
