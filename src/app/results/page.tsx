'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import type {
  CalculatorResults,
  HomeOccupancy,
  RoofOrientation,
  ShadingLevel,
} from '@/types/solar';
import { calculateSolarEstimate } from '@/lib/solar/calculations';

interface StoredFormData {
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  region: string;
  roofOrientation: RoofOrientation;
  roofPitch: number;
  roofArea: number;
  shadingLevel: ShadingLevel;
  annualUsageKwh: number;
  occupancy: HomeOccupancy;
}

export default function ResultsPage() {
  const [results, setResults] = useState<CalculatorResults | null>(null);
  const [formData, setFormData] = useState<StoredFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const storedData = sessionStorage.getItem('solarQuoteInputs');
        if (!storedData) {
          setError('No calculation data found. Please complete the calculator first.');
          setIsLoading(false);
          return;
        }

        const data: StoredFormData = JSON.parse(storedData);
        setFormData(data);

        if (!data.latitude || !data.longitude) {
          setError('Invalid location data. Please try again.');
          setIsLoading(false);
          return;
        }

        // Calculate results using the calculation engine
        const calcResults = calculateSolarEstimate({
          postcode: data.postcode,
          latitude: data.latitude,
          longitude: data.longitude,
          roofOrientation: data.roofOrientation,
          roofPitch: data.roofPitch,
          roofArea: data.roofArea,
          shadingFactor: data.shadingLevel,
          annualElectricityUsage: data.annualUsageKwh,
          homeOccupancy: data.occupancy,
        });

        setResults(calcResults);
        setIsLoading(false);
      } catch {
        setError('Failed to calculate results. Please try again.');
        setIsLoading(false);
      }
    };

    loadResults();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-foreground/60">Calculating your solar estimate...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <svg
              className="h-8 w-8 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="mb-6 text-foreground/60">{error || 'Something went wrong.'}</p>
          <Link
            href="/calculator"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-white hover:bg-primary-dark"
          >
            Start Over
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-primary px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Your Solar Quote</h1>
          <p className="text-primary-light">
            {formData?.postcode} - {formData?.region || 'UK'}
          </p>
        </div>
      </header>

      {/* Key Metrics Grid */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* System Size */}
            <MetricCard
              label="Recommended System"
              value={`${results.recommendedSystemSize} kWp`}
              subtext={`${results.numberOfPanels} panels`}
              icon="solar"
            />

            {/* Annual Savings */}
            <MetricCard
              label="Annual Savings"
              value={`£${Math.round(results.totalAnnualBenefit)}`}
              subtext="Savings + export"
              icon="money"
              highlight
            />

            {/* Payback Period */}
            <MetricCard
              label="Payback Period"
              value={`${results.paybackPeriod.toFixed(1)} years`}
              subtext="Simple payback"
              icon="time"
            />

            {/* System Cost */}
            <MetricCard
              label="Estimated Cost"
              value={`£${results.estimatedSystemCost.toLocaleString()}`}
              subtext="Inc. installation"
              icon="cost"
            />
          </div>
        </div>
      </section>

      {/* Detailed Results */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Generation & Usage */}
          <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Generation & Usage</h2>
            <div className="space-y-4">
              <DetailRow
                label="Annual Generation"
                value={`${results.estimatedAnnualGeneration.toLocaleString()} kWh`}
              />
              <DetailRow
                label="Self-Consumed"
                value={`${results.selfConsumedKwh.toLocaleString()} kWh (${Math.round(results.selfConsumptionRatio * 100)}%)`}
              />
              <DetailRow
                label="Exported to Grid"
                value={`${results.exportedKwh.toLocaleString()} kWh`}
              />
            </div>
          </div>

          {/* Financial Details */}
          <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Financial Summary</h2>
            <div className="space-y-4">
              <DetailRow
                label="Savings from Self-Consumption"
                value={`£${Math.round(results.annualSavings)}/year`}
              />
              <DetailRow
                label="SEG Export Earnings"
                value={`£${Math.round(results.annualExportEarnings)}/year`}
              />
              <DetailRow
                label="Total Annual Benefit"
                value={`£${Math.round(results.totalAnnualBenefit)}/year`}
                highlight
              />
              <hr className="border-border" />
              <DetailRow
                label="25-Year Return"
                value={`£${Math.round(results.roi25Years).toLocaleString()}`}
              />
            </div>
          </div>

          {/* Environmental Impact */}
          <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Environmental Impact</h2>
            <div className="space-y-4">
              <DetailRow
                label="CO2 Saved Annually"
                value={`${Math.round(results.co2SavedAnnually)} kg`}
              />
              <DetailRow
                label="CO2 Saved Over 25 Years"
                value={`${(results.co2Saved25Years / 1000).toFixed(1)} tonnes`}
              />
              <div className="mt-4 rounded-lg bg-success/10 p-4">
                <p className="text-sm text-foreground/70">
                  Thats equivalent to planting{' '}
                  <strong>{Math.round(results.co2Saved25Years / 21)} trees</strong> or avoiding{' '}
                  <strong>
                    {Math.round(results.co2Saved25Years / 0.17).toLocaleString()} miles
                  </strong>{' '}
                  of car travel.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="rounded-lg border border-primary bg-primary/5 p-6 text-center">
            <h2 className="mb-2 text-xl font-semibold text-foreground">Ready to Go Solar?</h2>
            <p className="mb-6 text-foreground/60">
              Get up to 3 quotes from MCS-certified installers in your area.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-white transition-colors hover:bg-primary-dark">
                Get Free Installer Quotes
              </button>
              <button className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-6 font-medium text-foreground transition-colors hover:bg-muted">
                Download PDF Report
              </button>
            </div>
          </div>

          {/* Edit Link */}
          <div className="text-center">
            <Link href="/calculator" className="text-sm text-primary hover:underline">
              Edit your details and recalculate
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center text-xs text-foreground/60">
          <p>Estimates based on MCS methodology and Ofgem Q1 2026 energy prices.</p>
          <p>
            Actual results may vary based on installation, local conditions, and usage patterns.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: 'solar' | 'money' | 'time' | 'cost';
  highlight?: boolean;
}

function MetricCard({ label, value, subtext, icon, highlight }: MetricCardProps) {
  const iconMap = {
    solar: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    money: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    time: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    cost: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
  };

  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight ? 'border-primary bg-primary/10' : 'border-border bg-background'
      }`}
    >
      <div className={`mb-2 ${highlight ? 'text-primary' : 'text-foreground/60'}`}>
        {iconMap[icon]}
      </div>
      <div className="text-xs text-foreground/60">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </div>
      <div className="text-xs text-foreground/60">{subtext}</div>
    </div>
  );
}

// Detail Row Component
interface DetailRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function DetailRow({ label, value, highlight }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground/70">{label}</span>
      <span className={`font-medium ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}
