# Ralph Loop Prompt: SolarQuote UK (PWA Lead Magnet)

## Project Overview

Build a production-quality **Solar Quote Calculator PWA** for UK solar installers using Next.js 14, TypeScript, and Tailwind CSS. This tool provides homeowners with accurate savings estimates while qualifying high-value leads for installer follow-up.

The calculator must use real UK data sources (PVGIS for irradiance, postcodes.io for geocoding, Ofgem rates for pricing) and follow MCS (Microgeneration Certification Scheme) calculation methodology.

## Subagent Architecture

This project uses a **subagent pattern** where Claude Haiku is invoked for discovery and research tasks to ensure each iteration works efficiently and uses existing codebase features where possible.

### Subagent Usage Protocol

Before implementing ANY feature, invoke the Haiku subagent for:

1. **Codebase Discovery**: Scan existing modules to find reusable functions
2. **API Research**: Verify current API endpoints, rate limits, response formats
3. **UK Data Verification**: Confirm current energy prices, regulations, rates
4. **Pattern Detection**: Identify similar implementations to maintain consistency
5. **Test Strategy**: Recommend testing approach based on existing test patterns

#### Subagent Invocation Template

```bash
# Use this pattern to invoke Haiku for discovery
claude --model claude-haiku-4-5-20251001 --print "
CONTEXT: Building UK solar quote PWA in Next.js with TypeScript.

CURRENT TASK: Implementing feature [FEATURE_ID]

CODEBASE STATE:
$(find src -name '*.ts' -o -name '*.tsx' | head -20)

EXISTING MODULES:
$(cat src/lib/solar/calculations.ts 2>/dev/null | head -50)

QUESTIONS:
1. What existing functions in src/lib/ can be reused for this feature?
2. Are there any utility functions that should be extracted?
3. What test patterns are established in tests/ that I should follow?
4. Any potential code duplication to avoid?

OUTPUT: JSON with recommendations
"
```

#### Subagent: UK Energy Price Verification

```bash
claude --model claude-haiku-4-5-20251001 --print "
TASK: Verify current UK electricity rates

SEARCH FOR:
1. Ofgem price cap Q1 2026 - electricity unit rate (p/kWh)
2. Current SEG export tariff rates by supplier
3. Standing charge rates
4. Any regional variations

OUTPUT FORMAT:
{
  \"electricityRatePence\": number,
  \"segExportRatePence\": number,
  \"standingChargePence\": number,
  \"source\": string,
  \"lastVerified\": ISO date
}
"
```

#### Subagent: PVGIS API Verification

```bash
claude --model claude-haiku-4-5-20251001 --print "
TASK: Verify PVGIS API endpoint and parameters

CHECK:
1. Current API version (v5_3?)
2. Required parameters for UK locations
3. Response format for PVcalc endpoint
4. Rate limits (30/sec?)
5. Any recent changes or deprecations

OUTPUT: API specification summary with example request
"
```

#### Subagent: Component Pattern Check

```bash
claude --model claude-haiku-4-5-20251001 --print "
CONTEXT: Building React component [COMPONENT_NAME]

EXISTING COMPONENTS:
$(ls -la src/components/ 2>/dev/null)

EXISTING PATTERNS:
$(cat src/components/ui/*.tsx 2>/dev/null | head -100)

QUESTIONS:
1. What prop patterns are established?
2. Are there shared styling conventions?
3. What accessibility patterns are in use?
4. Should this component use existing UI primitives?

OUTPUT: Component implementation recommendations
"
```

## Project Structure

```
solar-lead-magnet/
├── RALPH_PROMPT.md          # This file
├── feature_list.json        # Feature tracking (NEVER delete features)
├── progress.txt             # Cross-iteration state
├── init.sh                  # Build and test script
├── .env.example             # Environment template
├── package.json             # Dependencies
├── reference_data/          # UK-specific lookup tables
│   ├── orientation_factors.json
│   ├── regional_irradiance.json
│   ├── seg_tariffs.json
│   └── system_costs.json
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Landing page
│   │   ├── calculator/      # Multi-step wizard
│   │   ├── results/         # Results display
│   │   └── api/             # API routes
│   ├── components/
│   │   ├── Calculator/      # Wizard steps
│   │   ├── Results/         # Visualisations
│   │   └── ui/              # Shared UI components
│   ├── lib/
│   │   ├── solar/           # Calculation engine
│   │   │   ├── calculations.ts
│   │   │   ├── constants.ts
│   │   │   ├── pvgis.ts     # PVGIS API client
│   │   │   └── postcodes.ts # Postcode lookup
│   │   ├── leads/           # Lead scoring & capture
│   │   └── validation/      # Input validation
│   └── types/
│       └── solar.ts         # TypeScript definitions
└── tests/
    ├── unit/                # Jest unit tests
    ├── integration/         # API route tests
    └── e2e/                 # Playwright E2E
```

## Initialization (First Iteration Only)

On the FIRST iteration:

1. **Create Next.js project**:
   ```bash
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
   ```

2. **Install dependencies**:
   ```bash
   npm install next-pwa @types/node
   npm install -D jest @testing-library/react @testing-library/jest-dom playwright @playwright/test
   ```

3. **Create reference data files** from templates in this prompt

4. **Copy calculation engine** from scaffold (src/lib/solar/)

5. **Initialize git**:
   ```bash
   git init
   git add -A
   git commit -m "chore: initial project setup with Ralph Loop scaffold"
   ```

6. **Run init.sh** to verify setup:
   ```bash
   chmod +x init.sh && ./init.sh
   ```

7. **Mark INIT-001 as passing** in feature_list.json

## Incremental Progress Protocol

### Every Iteration Must:

1. **Orient** (30 seconds):
   ```bash
   pwd
   git log --oneline -5
   cat progress.txt | tail -20
   cat feature_list.json | jq '.features | map(select(.passes == false)) | .[0]'
   ```

2. **Invoke Subagent** (before implementation):
   - Run appropriate Haiku subagent for codebase discovery
   - Cache subagent response in progress.txt
   - Note any reusable code identified

3. **Select Feature**:
   - Read `feature_list.json`
   - Find highest priority feature where `passes: false`
   - Verify all dependencies have `passes: true`
   - If blocked by dependency, select next available

4. **Implement**:
   - Write code following established patterns
   - Reuse existing utilities identified by subagent
   - Add TypeScript types (no `any`)
   - Include JSDoc comments for complex logic

5. **Test**:
   - Write unit tests first (TDD when possible)
   - Run `npm run test` - all must pass
   - Run `npx tsc --noEmit` - no type errors
   - Run `npm run lint` - no lint errors

6. **Verify**:
   - Manual verification if UI component
   - E2E test for user-facing features
   - Check calculation accuracy against reference

7. **Track**:
   - Update `feature_list.json`: set `"passes": true`
   - Commit with descriptive message:
     ```bash
     git add -A
     git commit -m "feat(FEATURE_ID): Brief description

     - What was implemented
     - Subagent recommendations used
     - Test coverage added"
     ```
   - Append to progress.txt

8. **Continue or Complete**:
   - If features remain: continue to next iteration
   - If ALL features pass: output `<promise>SOLAR_QUOTE_COMPLETE</promise>`

## Completion Criteria

The project is COMPLETE when:

1. ALL features in `feature_list.json` have `"passes": true`
2. `npm run test` passes with 80%+ coverage on lib/solar/
3. `npm run build` succeeds without errors
4. `npm run lint` passes without warnings
5. Lighthouse scores: Performance ≥90, Accessibility ≥90
6. PWA installs correctly on mobile (verified via Lighthouse)
7. E2E test covers complete user journey
8. Calculator results within 10% of Energy Saving Trust reference

When ALL criteria are met, output:
```
<promise>SOLAR_QUOTE_COMPLETE</promise>
```

## Blocker Protocol

If a feature cannot be completed:

1. Document the blocker in `progress.txt`
2. List all attempted approaches
3. Mark the feature as `"blocked": true` in `feature_list.json`
4. Add `"blockerReason": "description"` to the feature
5. Move to the next unblocked feature
6. If >3 features blocked, output: `<promise>BLOCKED_NEEDS_REVIEW</promise>`

## Critical Rules

1. **NEVER mark a feature as passing without verified tests**
2. **NEVER delete or modify existing passing tests**
3. **NEVER skip features** - work sequentially through `feature_list.json`
4. **ALWAYS commit after completing a feature**
5. **ALWAYS update `progress.txt` at end of each iteration**
6. **ALWAYS run tests before marking anything complete**
7. **ALWAYS invoke subagent before implementing complex features**
8. **ALWAYS use UK-specific values** from constants.ts or reference data

## Anti-Patterns to Avoid

- ❌ Implementing multiple features at once
- ❌ Leaving code in broken state between iterations
- ❌ Modifying `feature_list.json` to remove features
- ❌ Skipping tests to mark features complete faster
- ❌ Making architectural changes without testing
- ❌ Ignoring TypeScript errors
- ❌ Using hardcoded values instead of constants
- ❌ Skipping subagent discovery for complex features
- ❌ Using non-UK energy rates or solar data
- ❌ Storing sensitive data in localStorage without encryption

## Reference Data Files

The following JSON files provide UK-specific lookup data:

### orientation_factors.json
```json
{
  "S": 1.0, "SE": 0.95, "SW": 0.95, "E": 0.85, "W": 0.85,
  "NE": 0.7, "NW": 0.7, "N": 0.55, "flat": 0.9
}
```

### regional_irradiance.json
Regional fallback values (kWh/m²/year) when PVGIS unavailable.

### seg_tariffs.json
Current SEG export tariffs by supplier.

### system_costs.json
Installation cost per kWp by system size tier.

## Usage

```bash
/ralph-loop "Follow the instructions in RALPH_PROMPT.md exactly. Before each feature, invoke the Haiku subagent for codebase discovery. Read feature_list.json to understand requirements. Work incrementally, one feature at a time. Update progress.txt with subagent recommendations used and commit after each feature. Output <promise>SOLAR_QUOTE_COMPLETE</promise> when ALL features pass." --max-iterations 75 --completion-promise "SOLAR_QUOTE_COMPLETE"
```
