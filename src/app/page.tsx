import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Trust Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Based on MCS methodology &amp; PVGIS data</span>
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Calculate Your
            <span className="block text-primary">Solar Savings</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-8 max-w-2xl text-lg text-foreground/70 sm:text-xl">
            Get a personalised estimate for your home in under 2 minutes. See how much you could
            save with solar panels using real UK energy prices.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/calculator"
              className="inline-flex h-14 items-center justify-center rounded-lg bg-primary px-8 text-lg font-semibold text-white shadow-lg transition-all hover:bg-primary-dark hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Get Your Free Quote
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <span className="text-sm text-foreground/60">No email required to start</span>
          </div>

          {/* Trust Signals */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-foreground/60">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>MCS Certified Methods</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>PVGIS Satellite Data</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Ofgem Q1 2026 Prices</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div>
              <div className="text-3xl font-bold text-primary sm:text-4xl">27.69p</div>
              <div className="mt-1 text-sm text-foreground/60">Current electricity rate/kWh</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary sm:text-4xl">15p</div>
              <div className="mt-1 text-sm text-foreground/60">SEG export rate/kWh</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary sm:text-4xl">7-10</div>
              <div className="mt-1 text-sm text-foreground/60">Year payback period</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary sm:text-4xl">25+</div>
              <div className="mt-1 text-sm text-foreground/60">Years panel warranty</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            Why Use Our Solar Calculator?
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Benefit 1 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="h-7 w-7 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Accurate Estimates</h3>
              <p className="text-sm text-foreground/60">
                Based on your postcode, roof orientation, and actual UK energy prices for Q1 2026.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="h-7 w-7 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Quick Results</h3>
              <p className="text-sm text-foreground/60">
                Get your personalised solar estimate in under 2 minutes. No registration required.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="h-7 w-7 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Local Solar Data</h3>
              <p className="text-sm text-foreground/60">
                Uses PVGIS satellite data specific to your location for accurate generation
                estimates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">How It Works</h2>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                1
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Enter Your Postcode</h3>
              <p className="text-sm text-foreground/60">
                We use your postcode to calculate local solar irradiance and regional energy prices.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                2
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Add Your Roof Details</h3>
              <p className="text-sm text-foreground/60">
                Tell us about your roof orientation, pitch, and approximate size for precise
                calculations.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                3
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Get Your Results</h3>
              <p className="text-sm text-foreground/60">
                See your potential savings, payback period, and recommended system size instantly.
              </p>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/calculator"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-white shadow transition-all hover:bg-primary-dark hover:shadow-lg"
            >
              Start Your Calculation
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center justify-between gap-6 text-sm text-foreground/60 md:flex-row">
            <div className="flex items-center gap-2">
              <svg
                className="h-6 w-6 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
                stroke="none"
              >
                <circle cx="12" cy="12" r="10" />
                <path
                  d="M12 6v6l4 2"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-semibold text-foreground">SolarQuote UK</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
            </div>
            <div className="text-center md:text-right">
              <p>Prices updated Q1 2026</p>
              <p>Estimates based on MCS methodology</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
