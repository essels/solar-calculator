'use client';

/**
 * Install Prompt Component
 * Shows a banner to prompt users to install the PWA
 */

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Store for tracking if PWA is installed
let isInstalledState = false;
const installedListeners = new Set<() => void>();

function subscribeToInstalled(callback: () => void): () => void {
  installedListeners.add(callback);
  return () => installedListeners.delete(callback);
}

function getInstalledSnapshot(): boolean {
  return isInstalledState;
}

function getInstalledServerSnapshot(): boolean {
  return false;
}

function setInstalled(value: boolean): void {
  isInstalledState = value;
  installedListeners.forEach((listener) => listener());
}

// Check if dismissed recently
function isDismissedRecently(): boolean {
  if (typeof window === 'undefined') return false;
  const dismissedAt = localStorage.getItem('pwa-install-dismissed');
  if (dismissedAt) {
    const dismissedDate = new Date(dismissedAt);
    const now = new Date();
    const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceDismissed < 7;
  }
  return false;
}

// Initialize installed state on first client render
function initInstalledState(): void {
  if (typeof window !== 'undefined') {
    isInstalledState = window.matchMedia('(display-mode: standalone)').matches;
  }
}

export default function InstallPrompt() {
  // Initialize on first render
  useState(() => {
    initInstalledState();
  });

  const isInstalled = useSyncExternalStore(
    subscribeToInstalled,
    getInstalledSnapshot,
    getInstalledServerSnapshot
  );

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(() => isDismissedRecently());

  useEffect(() => {
    // Skip if already installed or dismissed
    if (isInstalled || dismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, dismissed]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      setInstalled(true);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    setShowPrompt(false);
    setDismissed(true);
  }, []);

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div
      role="complementary"
      aria-label="Install app prompt"
      className="fixed bottom-0 left-0 right-0 bg-green-700 text-white px-4 py-3 shadow-lg z-50"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm">Install SolarQuote UK</p>
            <p className="text-xs text-green-100">Use offline and get faster access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-sm text-green-100 hover:text-white transition-colors"
            aria-label="Dismiss install prompt"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="px-4 py-1.5 bg-white text-green-700 text-sm font-medium rounded-lg hover:bg-green-50 transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
