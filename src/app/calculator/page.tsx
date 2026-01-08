'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { RoofOrientation, HomeOccupancy, ShadingLevel } from '@/types/solar';

// Step names for progress indicator
const STEPS = ['Location', 'Roof Details', 'Energy Usage'] as const;

// Calculator form state interface
interface CalculatorFormState {
  // Step 1: Location
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  region: string;

  // Step 2: Roof Details
  roofOrientation: RoofOrientation;
  roofPitch: number;
  roofArea: number;
  shadingLevel: ShadingLevel;

  // Step 3: Energy Usage
  annualUsageKwh: number;
  occupancy: HomeOccupancy;
}

const initialFormState: CalculatorFormState = {
  postcode: '',
  latitude: null,
  longitude: null,
  region: '',
  roofOrientation: 'S',
  roofPitch: 35,
  roofArea: 30,
  shadingLevel: 1.0,
  annualUsageKwh: 3000,
  occupancy: 'variable',
};

export default function CalculatorPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formState, setFormState] = useState<CalculatorFormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 0:
        return formState.postcode.length >= 5 && formState.latitude !== null;
      case 1:
        return formState.roofArea >= 5 && formState.roofArea <= 200;
      case 2:
        return formState.annualUsageKwh >= 500 && formState.annualUsageKwh <= 20000;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && canGoNext()) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSubmit = () => {
    if (!canGoNext()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    // Store form data in sessionStorage for results page
    try {
      sessionStorage.setItem('solarQuoteInputs', JSON.stringify(formState));
      router.push('/results');
    } catch {
      setError('Failed to save calculation data. Please try again.');
      setIsLoading(false);
    }
  };

  const updateFormState = (updates: Partial<CalculatorFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <span className="text-sm text-foreground/60">Step {currentStep + 1} of 3</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-border bg-muted/30 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((step, index) => (
              <div key={step} className="flex flex-1 items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    index < currentStep
                      ? 'bg-primary text-white'
                      : index === currentStep
                        ? 'bg-primary text-white'
                        : 'bg-border text-foreground/40'
                  }`}
                >
                  {index < currentStep ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`ml-2 hidden text-sm sm:block ${
                    index <= currentStep ? 'font-medium text-foreground' : 'text-foreground/40'
                  }`}
                >
                  {step}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 ${
                      index < currentStep ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg border border-error/20 bg-error/10 p-4 text-error">
              {error}
            </div>
          )}

          {/* Step Content */}
          <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
            {currentStep === 0 && (
              <PostcodeStep formState={formState} updateFormState={updateFormState} />
            )}
            {currentStep === 1 && (
              <RoofDetailsStep formState={formState} updateFormState={updateFormState} />
            )}
            {currentStep === 2 && (
              <EnergyUsageStep formState={formState} updateFormState={updateFormState} />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex h-12 items-center justify-center rounded-lg border border-border px-6 font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canGoNext()}
                className="flex h-12 flex-1 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canGoNext() || isLoading}
                className="flex h-12 flex-1 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {isLoading ? 'Calculating...' : 'See My Results'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Step 1: Postcode Input
interface StepProps {
  formState: CalculatorFormState;
  updateFormState: (updates: Partial<CalculatorFormState>) => void;
}

function PostcodeStep({ formState, updateFormState }: StepProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handlePostcodeChange = async (value: string) => {
    const formatted = value.toUpperCase().trim();
    updateFormState({ postcode: formatted, latitude: null, longitude: null, region: '' });
    setValidationError(null);
  };

  const validatePostcode = async () => {
    if (formState.postcode.length < 5) {
      setValidationError('Please enter a valid UK postcode');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Dynamic import to avoid SSR issues
      const { lookupPostcode } = await import('@/lib/solar/postcodes');
      const result = await lookupPostcode(formState.postcode);

      if (result.valid && result.latitude && result.longitude) {
        updateFormState({
          latitude: result.latitude,
          longitude: result.longitude,
          region: result.region || '',
        });
      } else {
        setValidationError(result.error || 'Invalid postcode. Please check and try again.');
      }
    } catch {
      setValidationError('Failed to validate postcode. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">Enter Your Postcode</h2>
      <p className="mb-6 text-foreground/60">
        We use your postcode to calculate local solar irradiance for your area.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="postcode" className="mb-1 block text-sm font-medium text-foreground">
            UK Postcode
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="postcode"
              value={formState.postcode}
              onChange={(e) => handlePostcodeChange(e.target.value)}
              onBlur={() => {
                if (formState.postcode.length >= 5 && !formState.latitude) {
                  validatePostcode();
                }
              }}
              placeholder="e.g. SW1A 1AA"
              className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              maxLength={8}
            />
            <button
              onClick={validatePostcode}
              disabled={isValidating || formState.postcode.length < 5}
              className="rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isValidating ? 'Checking...' : 'Verify'}
            </button>
          </div>
          {validationError && <p className="mt-2 text-sm text-error">{validationError}</p>}
        </div>

        {formState.latitude && formState.longitude && (
          <div className="rounded-lg border border-success/30 bg-success/10 p-4">
            <div className="flex items-center gap-2 text-success">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-medium">Location verified</span>
            </div>
            <p className="mt-1 text-sm text-foreground/60">
              {formState.postcode}
              {formState.region && ` - ${formState.region}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Step 2: Roof Details
function RoofDetailsStep({ formState, updateFormState }: StepProps) {
  const orientations: { value: RoofOrientation; label: string; desc: string }[] = [
    { value: 'S', label: 'South', desc: 'Optimal' },
    { value: 'SE', label: 'South-East', desc: 'Excellent' },
    { value: 'SW', label: 'South-West', desc: 'Excellent' },
    { value: 'E', label: 'East', desc: 'Good' },
    { value: 'W', label: 'West', desc: 'Good' },
    { value: 'flat', label: 'Flat', desc: 'Good' },
  ];

  const shadingOptions: { value: ShadingLevel; label: string; desc: string }[] = [
    { value: 1.0, label: 'None', desc: 'No shading' },
    { value: 0.9, label: 'Light', desc: 'Some trees/buildings' },
    { value: 0.75, label: 'Moderate', desc: 'Partial shade' },
    { value: 0.5, label: 'Heavy', desc: 'Significant shade' },
  ];

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">Your Roof Details</h2>
      <p className="mb-6 text-foreground/60">
        Tell us about your roof to estimate solar panel performance.
      </p>

      <div className="space-y-6">
        {/* Orientation */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Roof Orientation</label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {orientations.map((o) => (
              <button
                key={o.value}
                onClick={() => updateFormState({ roofOrientation: o.value })}
                className={`rounded-lg border p-3 text-center transition-colors ${
                  formState.roofOrientation === o.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-sm font-medium">{o.label}</div>
                <div className="text-xs text-foreground/60">{o.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Pitch */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Roof Pitch: {formState.roofPitch}&deg;
          </label>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={formState.roofPitch}
            onChange={(e) => updateFormState({ roofPitch: parseInt(e.target.value) })}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-border accent-primary"
          />
          <div className="mt-1 flex justify-between text-xs text-foreground/60">
            <span>Flat (0&deg;)</span>
            <span>Typical (30-35&deg;)</span>
            <span>Steep (60&deg;)</span>
          </div>
        </div>

        {/* Area */}
        <div>
          <label htmlFor="roofArea" className="mb-1 block text-sm font-medium text-foreground">
            Usable Roof Area (m&sup2;)
          </label>
          <input
            type="number"
            id="roofArea"
            value={formState.roofArea}
            onChange={(e) => updateFormState({ roofArea: parseInt(e.target.value) || 0 })}
            min="5"
            max="200"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-foreground/60">
            Typical 3-bed house: 20-40m&sup2;. We need ~5m&sup2; per kWp of solar panels.
          </p>
        </div>

        {/* Shading */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Shading Level</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {shadingOptions.map((s) => (
              <button
                key={s.value}
                onClick={() => updateFormState({ shadingLevel: s.value })}
                className={`rounded-lg border p-3 text-center transition-colors ${
                  formState.shadingLevel === s.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-xs text-foreground/60">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Energy Usage
function EnergyUsageStep({ formState, updateFormState }: StepProps) {
  const [knowsUsage, setKnowsUsage] = useState(true);
  const [propertyType, setPropertyType] = useState<'flat' | 'small' | 'medium' | 'large'>('medium');

  const occupancyOptions: { value: HomeOccupancy; label: string; desc: string }[] = [
    { value: 'always', label: 'Always Home', desc: 'Work from home' },
    { value: 'daytime', label: 'Daytime', desc: 'Home during day' },
    { value: 'evening', label: 'Evening', desc: 'Out during day' },
    { value: 'variable', label: 'Variable', desc: 'Varies day to day' },
  ];

  const estimateUsage = (type: 'flat' | 'small' | 'medium' | 'large') => {
    const estimates = {
      flat: 2000,
      small: 2500,
      medium: 3500,
      large: 4500,
    };
    return estimates[type];
  };

  const handlePropertyTypeChange = (type: 'flat' | 'small' | 'medium' | 'large') => {
    setPropertyType(type);
    updateFormState({ annualUsageKwh: estimateUsage(type) });
  };

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">Your Energy Usage</h2>
      <p className="mb-6 text-foreground/60">
        Tell us about your electricity usage to recommend the right system size.
      </p>

      <div className="space-y-6">
        {/* Toggle: Know usage or estimate */}
        <div className="flex gap-2 rounded-lg border border-border p-1">
          <button
            onClick={() => setKnowsUsage(true)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              knowsUsage ? 'bg-primary text-white' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            I know my usage
          </button>
          <button
            onClick={() => setKnowsUsage(false)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              !knowsUsage ? 'bg-primary text-white' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Estimate for me
          </button>
        </div>

        {knowsUsage ? (
          <div>
            <label htmlFor="annualUsage" className="mb-1 block text-sm font-medium text-foreground">
              Annual Electricity Usage (kWh)
            </label>
            <input
              type="number"
              id="annualUsage"
              value={formState.annualUsageKwh}
              onChange={(e) => updateFormState({ annualUsageKwh: parseInt(e.target.value) || 0 })}
              min="500"
              max="20000"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-foreground/60">
              Find this on your energy bill. UK average: 2,700 kWh/year.
            </p>
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Property Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: 'flat', label: 'Flat', desc: '~2,000 kWh' },
                  { value: 'small', label: '1-2 Bed House', desc: '~2,500 kWh' },
                  { value: 'medium', label: '3 Bed House', desc: '~3,500 kWh' },
                  { value: 'large', label: '4+ Bed House', desc: '~4,500 kWh' },
                ] as const
              ).map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePropertyTypeChange(p.value)}
                  className={`rounded-lg border p-3 text-center transition-colors ${
                    propertyType === p.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-xs text-foreground/60">{p.desc}</div>
                </button>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-foreground/60">
              Estimated usage: <strong>{formState.annualUsageKwh.toLocaleString()} kWh/year</strong>
            </p>
          </div>
        )}

        {/* Occupancy */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Home Occupancy Pattern
          </label>
          <div className="grid grid-cols-2 gap-2">
            {occupancyOptions.map((o) => (
              <button
                key={o.value}
                onClick={() => updateFormState({ occupancy: o.value })}
                className={`rounded-lg border p-3 text-center transition-colors ${
                  formState.occupancy === o.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-sm font-medium">{o.label}</div>
                <div className="text-xs text-foreground/60">{o.desc}</div>
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-foreground/60">
            This affects how much solar energy you use directly vs. export to the grid.
          </p>
        </div>
      </div>
    </div>
  );
}
