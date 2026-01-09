# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start dev server at localhost:3000

# Testing
npm run test             # Run unit tests (Jest)
npm run test -- --watch  # Run tests in watch mode
npm run test -- src/lib/solar/__tests__/calculations.test.ts  # Run single test file
npm run test:coverage    # Run with coverage report
npm run test:e2e         # Run Playwright E2E tests (requires dev server)

# Build & Lint
npm run build            # Production build
npm run lint             # ESLint check
npm run lint:fix         # ESLint with auto-fix
```

## Architecture

**UK Solar Calculator PWA** - Calculates solar panel savings for UK homeowners using MCS methodology.

### Core Data Flow

1. **User Input** → `src/app/calculator/page.tsx` (3-step wizard)
2. **Location Lookup** → `src/lib/solar/postcodes.ts` (postcodes.io API)
3. **Solar Irradiance** → `src/lib/solar/pvgis.ts` (EU PVGIS satellite data)
4. **Calculations** → `src/lib/solar/calculations.ts` (pure functions)
5. **Results** → `src/app/results/page.tsx`
6. **Lead Capture** → `src/components/modals/LeadCaptureModal.tsx` → `/api/leads`

### Key Modules

| Module                          | Purpose                                                                 |
| ------------------------------- | ----------------------------------------------------------------------- |
| `src/lib/solar/calculations.ts` | Pure calculation functions (system sizing, generation, financials, CO2) |
| `src/lib/solar/constants.ts`    | UK energy rates, costs - **update quarterly**                           |
| `src/lib/leads/scoring.ts`      | Lead scoring algorithm (Hot/Warm/Cool)                                  |
| `reference_data/*.json`         | UK regional irradiance, orientation factors, SEG tariffs                |

### State Management

Calculator state flows via `sessionStorage`:

- Wizard stores inputs in `sessionStorage.calculatorInputs`
- Results page reads and calculates on load
- No global state library - uses React hooks

### API Routes

- `POST /api/calculate` - Server-side calculation
- `POST /api/leads` - Lead submission (rate limited, GDPR compliant)
- `GET /api/report` - PDF generation (jsPDF)

## Testing

- Unit tests in `src/lib/**/__tests__/`
- E2E tests in `e2e/`
- Coverage thresholds: 90% for `calculations.ts` and `scoring.ts`
- API modules (`postcodes.ts`, `pvgis.ts`) tested via integration, not unit tests

## UK-Specific Constants

Located in `src/lib/solar/constants.ts`:

- Electricity rate: 27.69p/kWh (Ofgem Q1 2026)
- SEG export: 15p/kWh
- Grid carbon factor: 0.233 kg/kWh
- System loss factor: 0.86 (14% losses)

These should be reviewed and updated quarterly when Ofgem releases new price caps.
