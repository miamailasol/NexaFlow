'use client';

import React from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { fallback } from 'viem';
import { arcTestnet, baseSepolia, sepolia, arbitrumSepolia } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NexaFlowProvider } from '@/context/NexaFlowContext';
import ModalManager from '@/components/Modals/ModalManager';

const config = getDefaultConfig({
  appName: 'NexaFlow',
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '0e6180af00a4477c7f8d66c94ddfa8ff',
  chains: [arcTestnet, baseSepolia, sepolia, arbitrumSepolia],
  ssr: true,
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
    [baseSepolia.id]: fallback([
      http('https://base-sepolia-rpc.publicnode.com'),
      http('https://sepolia.base.org'),
      http('https://base-sepolia.blockpi.network/v1/rpc/public')
    ]),
    [sepolia.id]: fallback([
      http('https://ethereum-sepolia-rpc.publicnode.com'),
      http('https://rpc.ankr.com/eth_sepolia'),
      http('https://sepolia.gateway.tenderly.co')
    ]),
    [arbitrumSepolia.id]: fallback([
      http('https://arbitrum-sepolia-rpc.publicnode.com'),
      http('https://sepolia-rollup.arbitrum.io/rpc'),
      http('https://arbitrum-sepolia.blockpi.network/v1/rpc/public')
    ])
  },
});

const queryClient = new QueryClient();

export function Providers({ children }) {
  React.useEffect(() => {
    const handleError = (e) => {
      if (
        e.message?.includes('Unexpected error') || 
        e.error?.stack?.includes('chrome-extension') || 
        e.filename?.includes('chrome-extension')
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    const handleUnhandledRejection = (e) => {
      if (
        e.reason?.message?.includes('Unexpected error') || 
        e.reason?.stack?.includes('chrome-extension')
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#8b5cf6',
          accentColorForeground: 'white',
          borderRadius: 'medium',
          overlayBlur: 'small',
        })}>
          <NexaFlowProvider>
            {children}
            <ModalManager />
          </NexaFlowProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
