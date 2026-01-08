'use client';

/**
 * Offline Indicator Component
 * Shows a banner when the user is offline
 */

import { useSyncExternalStore } from 'react';

function subscribeToOnlineStatus(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot(): boolean {
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true; // Assume online during SSR
}

export default function OfflineIndicator() {
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getServerSnapshot
  );

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed bottom-0 left-0 right-0 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium z-50"
    >
      <span className="inline-flex items-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-7.072 7.072a9 9 0 010-12.728m3.536 3.536a4 4 0 010 5.656M12 12h.01"
          />
        </svg>
        You&apos;re offline. Some features may be limited.
      </span>
    </div>
  );
}
