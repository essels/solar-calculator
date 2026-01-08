import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import PWAProvider from '@/components/pwa/PWAProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SolarQuote UK - Calculate Your Solar Savings',
  description:
    'Calculate your potential solar panel savings with accurate UK energy prices. Get instant estimates for system size, costs, and payback period.',
  keywords: ['solar panels', 'UK', 'solar calculator', 'renewable energy', 'electricity savings'],
  authors: [{ name: 'SolarQuote UK' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SolarQuote UK',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    title: 'SolarQuote UK - Calculate Your Solar Savings',
    description: 'Calculate your potential solar panel savings with accurate UK energy prices.',
    siteName: 'SolarQuote UK',
  },
};

export const viewport: Viewport = {
  themeColor: '#228B22',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PWAProvider>{children}</PWAProvider>
      </body>
    </html>
  );
}
