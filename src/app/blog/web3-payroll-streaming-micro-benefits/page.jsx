import React from 'react';
import BlogClient from './BlogClient';

export const metadata = {
  title: 'Web3 Payroll Streaming & Micro-Benefits: The Future of Global Payroll',
  description: 'Discover how continuous per-second wages, Circle User-Controlled Wallets, and sponsored gas on Arc Chain are redefining remote remote compensation.',
  alternates: {
    canonical: 'https://nexaflow.surf/blog/web3-payroll-streaming-micro-benefits'
  },
  openGraph: {
    title: 'Web3 Payroll Streaming & Micro-Benefits: The Future of Global Payroll',
    description: 'Discover how continuous per-second wages, Circle User-Controlled Wallets, and sponsored gas on Arc Chain are redefining remote remote compensation.',
    url: 'https://nexaflow.surf/blog/web3-payroll-streaming-micro-benefits',
    type: 'article',
    publishedTime: '2026-06-18T15:25:00+07:00',
    authors: ['NexaFlow Editorial Board'],
    images: [
      {
        url: 'https://nexaflow.surf/web3_payroll_stream_header.png',
        width: 1200,
        height: 630,
        alt: 'Web3 Payroll Streaming and Micro-Benefits Banner'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web3 Payroll Streaming & Micro-Benefits: The Future of Global Payroll',
    description: 'Discover how continuous per-second wages, Circle User-Controlled Wallets, and sponsored gas on Arc Chain are redefining remote remote compensation.',
    images: ['https://nexaflow.surf/web3_payroll_stream_header.png']
  }
};

export default function Blog() {
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': 'https://nexaflow.surf/blog/web3-payroll-streaming-micro-benefits/#blogposting',
    'url': 'https://nexaflow.surf/blog/web3-payroll-streaming-micro-benefits',
    'headline': 'Web3 Payroll Streaming & Micro-Benefits: The Future of Global Remote Workforce Settlement',
    'image': 'https://nexaflow.surf/web3_payroll_stream_header.png',
    'datePublished': '2026-06-18T15:25:00+07:00',
    'dateModified': '2026-06-18T15:25:00+07:00',
    'author': [{
      '@type': 'Person',
      'name': 'NexaFlow Editorial Board',
      'url': 'https://nexaflow.surf/about'
    }],
    'publisher': {
      '@type': 'Organization',
      'name': 'NexaFlow',
      'url': 'https://nexaflow.surf'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <BlogClient />
    </>
  );
}
