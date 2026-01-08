'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';

interface StoredQuoteData {
  leadId?: string;
  systemSize?: number;
  annualSavings?: number;
  postcode?: string;
}

// Read sessionStorage synchronously to avoid setState in useEffect
function getQuoteDataSnapshot(): StoredQuoteData | null {
  if (typeof window === 'undefined') return null;
  const storedData = sessionStorage.getItem('solarQuoteSubmission');
  return storedData ? JSON.parse(storedData) : null;
}

function getServerSnapshot(): StoredQuoteData | null {
  return null;
}

function subscribeToStorage(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export default function ThankYouPage() {
  const quoteData = useSyncExternalStore(
    subscribeToStorage,
    getQuoteDataSnapshot,
    getServerSnapshot
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-primary px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Thank You!</h1>
          <p className="text-primary-light">Your quote request has been received</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Success Icon */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <svg
                className="h-10 w-10 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              Your Solar Quote Request is Confirmed
            </h2>
            <p className="text-foreground/60">
              We&apos;ve received your details and will be in touch shortly.
            </p>
          </div>

          {/* What Happens Next */}
          <div className="mb-8 rounded-lg border border-border bg-background p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">What Happens Next?</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">Quote Review</p>
                  <p className="text-sm text-foreground/60">
                    Our team will review your property details and solar requirements within 24
                    hours.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Installer Matching</p>
                  <p className="text-sm text-foreground/60">
                    We&apos;ll connect you with up to 3 MCS-certified installers in your area.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Free Quotes</p>
                  <p className="text-sm text-foreground/60">
                    Receive competitive quotes with no obligation. Compare and choose the best offer
                    for you.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Summary (if available) */}
          {quoteData && quoteData.systemSize && (
            <div className="mb-8 rounded-lg border border-primary bg-primary/5 p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Your Estimate Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{quoteData.systemSize} kWp</p>
                  <p className="text-sm text-foreground/60">System Size</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    £{Math.round(quoteData.annualSavings || 0)}
                  </p>
                  <p className="text-sm text-foreground/60">Annual Savings</p>
                </div>
              </div>
              {quoteData.postcode && (
                <p className="mt-4 text-center text-sm text-foreground/60">
                  Location: {quoteData.postcode}
                </p>
              )}
            </div>
          )}

          {/* Download PDF CTA */}
          <div className="mb-8 rounded-lg border border-border bg-muted/30 p-6 text-center">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Want a Full Report?</h3>
            <p className="mb-4 text-sm text-foreground/60">
              Download your personalised solar report with detailed calculations.
            </p>
            <button
              className="inline-flex h-10 items-center justify-center rounded-lg border border-primary bg-background px-6 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
              onClick={() => {
                // PDF download will be implemented in LEAD-003
                alert('PDF report download coming soon!');
              }}
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF Report
            </button>
          </div>

          {/* Social Sharing */}
          <div className="mb-8 text-center">
            <p className="mb-4 text-sm text-foreground/60">Share your solar journey:</p>
            <div className="flex justify-center gap-4">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DA1F2] text-white transition-opacity hover:opacity-80"
                aria-label="Share on Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4267B2] text-white transition-opacity hover:opacity-80"
                aria-label="Share on Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0077B5] text-white transition-opacity hover:opacity-80"
                aria-label="Share on LinkedIn"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Return Link */}
          <div className="text-center">
            <Link href="/" className="text-sm text-primary hover:underline">
              Return to Homepage
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center text-xs text-foreground/60">
          <p>Questions? Contact us at support@solarquote.co.uk</p>
          <p className="mt-1">Your data is protected under UK GDPR regulations.</p>
        </div>
      </footer>
    </div>
  );
}
