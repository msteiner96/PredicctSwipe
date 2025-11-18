'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RainbowKitProvider,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  trustWallet,
  coinbaseWallet,
  walletConnectWallet,
  rabbyWallet,
} from '@rainbow-me/rainbowkit/wallets';
import '@rainbow-me/rainbowkit/styles.css';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Configure wallets - Trust Wallet first for BNB Chain hackathon
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended for BNB Chain',
      wallets: [
        trustWallet,
        rabbyWallet,
        metaMaskWallet,
      ],
    },
    {
      groupName: 'Other Wallets',
      wallets: [
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: 'PredictSwipe',
    projectId,
  }
);

const config = createConfig({
  connectors,
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545'),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{
            lightMode: {
              colors: {
                accentColor: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                accentColorForeground: 'white',
                actionButtonBorder: 'rgba(255, 255, 255, 0.1)',
                actionButtonBorderMobile: 'rgba(255, 255, 255, 0.1)',
                actionButtonSecondaryBackground: 'rgba(0, 0, 0, 0.3)',
                closeButton: 'rgba(255, 255, 255, 0.7)',
                closeButtonBackground: 'rgba(0, 0, 0, 0.2)',
                connectButtonBackground: 'linear-gradient(135deg, #a855f7, #ec4899, #f97316)',
                connectButtonBackgroundError: '#ef4444',
                connectButtonInnerBackground: 'linear-gradient(135deg, #a855f7, #ec4899)',
                connectButtonText: '#fff',
                connectButtonTextError: '#fff',
                connectionIndicator: '#10b981',
                downloadBottomCardBackground: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))',
                downloadTopCardBackground: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
                error: '#ef4444',
                generalBorder: 'rgba(255, 255, 255, 0.1)',
                generalBorderDim: 'rgba(255, 255, 255, 0.05)',
                menuItemBackground: 'rgba(0, 0, 0, 0.2)',
                modalBackdrop: 'rgba(0, 0, 0, 0.8)',
                modalBackground: 'linear-gradient(135deg, #581c87, #831843, #7c2d12)',
                modalBorder: 'rgba(255, 255, 255, 0.1)',
                modalText: '#fff',
                modalTextDim: 'rgba(255, 255, 255, 0.6)',
                modalTextSecondary: 'rgba(255, 255, 255, 0.7)',
                profileAction: 'rgba(0, 0, 0, 0.2)',
                profileActionHover: 'rgba(0, 0, 0, 0.3)',
                profileForeground: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))',
                selectedOptionBorder: 'rgba(251, 191, 36, 0.5)',
                standby: '#fbbf24',
              },
              fonts: {
                body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              },
              radii: {
                actionButton: '24px',
                connectButton: '24px',
                menuButton: '20px',
                modal: '32px',
                modalMobile: '32px',
              },
              shadows: {
                connectButton: '0 8px 32px rgba(168, 85, 247, 0.3)',
                dialog: '0 20px 60px rgba(0, 0, 0, 0.5)',
                profileDetailsAction: '0 4px 12px rgba(0, 0, 0, 0.3)',
                selectedOption: '0 0 0 2px rgba(251, 191, 36, 0.3)',
                selectedWallet: '0 0 0 2px rgba(251, 191, 36, 0.3)',
                walletLogo: '0 4px 16px rgba(0, 0, 0, 0.2)',
              },
              blurs: {
                modalOverlay: 'blur(8px)',
              },
            },
            darkMode: {
              colors: {
                accentColor: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                accentColorForeground: 'white',
                actionButtonBorder: 'rgba(255, 255, 255, 0.1)',
                actionButtonBorderMobile: 'rgba(255, 255, 255, 0.1)',
                actionButtonSecondaryBackground: 'rgba(0, 0, 0, 0.3)',
                closeButton: 'rgba(255, 255, 255, 0.7)',
                closeButtonBackground: 'rgba(0, 0, 0, 0.2)',
                connectButtonBackground: 'linear-gradient(135deg, #a855f7, #ec4899, #f97316)',
                connectButtonBackgroundError: '#ef4444',
                connectButtonInnerBackground: 'linear-gradient(135deg, #a855f7, #ec4899)',
                connectButtonText: '#fff',
                connectButtonTextError: '#fff',
                connectionIndicator: '#10b981',
                downloadBottomCardBackground: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))',
                downloadTopCardBackground: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
                error: '#ef4444',
                generalBorder: 'rgba(255, 255, 255, 0.1)',
                generalBorderDim: 'rgba(255, 255, 255, 0.05)',
                menuItemBackground: 'rgba(0, 0, 0, 0.2)',
                modalBackdrop: 'rgba(0, 0, 0, 0.9)',
                modalBackground: 'linear-gradient(135deg, #581c87, #831843, #7c2d12)',
                modalBorder: 'rgba(255, 255, 255, 0.1)',
                modalText: '#fff',
                modalTextDim: 'rgba(255, 255, 255, 0.6)',
                modalTextSecondary: 'rgba(255, 255, 255, 0.7)',
                profileAction: 'rgba(0, 0, 0, 0.2)',
                profileActionHover: 'rgba(0, 0, 0, 0.3)',
                profileForeground: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))',
                selectedOptionBorder: 'rgba(251, 191, 36, 0.5)',
                standby: '#fbbf24',
              },
              fonts: {
                body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              },
              radii: {
                actionButton: '24px',
                connectButton: '24px',
                menuButton: '20px',
                modal: '32px',
                modalMobile: '32px',
              },
              shadows: {
                connectButton: '0 8px 32px rgba(168, 85, 247, 0.3)',
                dialog: '0 20px 60px rgba(0, 0, 0, 0.5)',
                profileDetailsAction: '0 4px 12px rgba(0, 0, 0, 0.3)',
                selectedOption: '0 0 0 2px rgba(251, 191, 36, 0.3)',
                selectedWallet: '0 0 0 2px rgba(251, 191, 36, 0.3)',
                walletLogo: '0 4px 16px rgba(0, 0, 0, 0.2)',
              },
              blurs: {
                modalOverlay: 'blur(8px)',
              },
            },
          }}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
