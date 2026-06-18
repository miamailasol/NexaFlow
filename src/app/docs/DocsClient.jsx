'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DocsPage from '@/components/DocsPage';

export default function DocsClient() {
  const router = useRouter();

  const navigateTo = (tab, subTab) => {
    if (tab === 'home') {
      router.push('/');
    } else if (tab === 'app') {
      if (subTab) {
        router.push(`/app/${subTab}`);
      } else {
        router.push('/app');
      }
    } else {
      router.push(`/${tab}`);
    }
  };

  const onLaunchApp = () => {
    router.push('/app');
  };

  return (
    <DocsPage 
      onLaunchApp={onLaunchApp} 
      navigateTo={navigateTo} 
    />
  );
}
