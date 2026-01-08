'use client';

/**
 * PWA Provider Component
 * Wraps the app with PWA-related components
 */

import dynamic from 'next/dynamic';

// Dynamically import PWA components to avoid SSR issues
const OfflineIndicator = dynamic(() => import('./OfflineIndicator'), { ssr: false });
const InstallPrompt = dynamic(() => import('./InstallPrompt'), { ssr: false });

interface PWAProviderProps {
  children: React.ReactNode;
}

export default function PWAProvider({ children }: PWAProviderProps) {
  return (
    <>
      {children}
      <OfflineIndicator />
      <InstallPrompt />
    </>
  );
}
