import React from 'react';
import ContactClient from './ContactClient';

export const metadata = {
  title: 'Contact Technical Support | NexaFlow Integration Help',
  description: 'Get in touch with the NexaFlow team for developer sandbox keys, corporate payroll integration assistance, and treasury setup support on the Arc Chain.',
  alternates: {
    canonical: 'https://nexaflow.surf/contact'
  },
  openGraph: {
    title: 'Contact Technical Support | NexaFlow Integration Help',
    description: 'Get in touch with the NexaFlow team for developer sandbox keys, corporate payroll integration assistance, and treasury setup support on the Arc Chain.',
    url: 'https://nexaflow.surf/contact',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Technical Support | NexaFlow Integration Help',
    description: 'Get in touch with the NexaFlow team for developer sandbox keys, corporate payroll integration assistance, and treasury setup support on the Arc Chain.'
  }
};

export default function Contact() {
  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://nexaflow.surf/contact/#webpage',
    'url': 'https://nexaflow.surf/contact',
    'name': 'Contact Technical Support - NexaFlow',
    'description': 'Get in touch with the NexaFlow team for developer sandbox keys, corporate payroll integration assistance, and treasury setup support on the Arc Chain.',
    'publisher': {
      '@type': 'Organization',
      'name': 'NexaFlow'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <ContactClient />
    </>
  );
}
