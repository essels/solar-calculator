# 🔆 SolarQuote UK

> **A lead generation PWA for UK solar installers** - Accurate quotes, qualified leads, autonomous development.

## Files Created

**RALPH_PROMPT.md** — The main prompt file containing:
- Complete project structure specification
- Subagent invocation templates for Haiku research
- Initialization steps for the first iteration
- Incremental progress protocol (orient → subagent → select → implement → test → verify → track)
- Completion criteria and promise
- Blocker handling protocol
- Critical rules and anti-patterns

**feature_list.json** — A JSON-based PRD with 45 features across 12 categories:
- Project Setup (3 features)
- Data Integration (4 features) - postcodes.io, PVGIS, UK pricing
- Calculation Engine (8 features) - sizing, generation, financials, CO2
- UI Landing (2 features)
- UI Calculator (5 features) - wizard steps
- UI Results (4 features) - visualisations
- Lead Capture (4 features) - form, scoring, PDF
- API Routes (3 features)
- PWA (3 features) - offline, install
- Testing (5 features) - Jest, Playwright
- Performance (2 features) - Core Web Vitals, Lighthouse
- Deployment (2 features) - Vercel

**progress.txt** — Progress tracking with subagent response caching

**init.sh** — Build, test, and validation script

**reference_data/** — UK-specific lookup tables:
- `orientation_factors.json` — Roof orientation efficiency factors
- `regional_irradiance.json` — UK regional solar irradiance by postcode
- `seg_tariffs.json` — Smart Export Guarantee rates by supplier
- `system_costs.json` — Installation costs by system size tier

**src/lib/solar/** — Calculation engine:
- `calculations.ts` — Core calculation functions (MCS methodology)
- `constants.ts` — UK energy pricing (Ofgem Q1 2026)

**src/types/solar.ts** — TypeScript definitions

## How to Use

1. Place all files in your project directory
2. Install the ralph-wiggum plugin: `/plugin install ralph-wiggum@claude-plugins-official`
3. Run the loop:

```bash
/ralph-loop "Follow the instructions in RALPH_PROMPT.md exactly. Before each feature, invoke the Haiku subagent for codebase discovery. Read feature_list.json to understand requirements. Work incrementally, one feature at a time. Update progress.txt with subagent recommendations used and commit after each feature. Output <promise>SOLAR_QUOTE_COMPLETE</promise> when ALL features pass." --max-iterations 75 --completion-promise "SOLAR_QUOTE_COMPLETE"
```

## Key Features

| Feature | Implementation |
|---------|----------------|
| Solar irradiance | PVGIS EU JRC API (free) |
| UK postcodes | postcodes.io (free) |
| Electricity rate | 27.69p/kWh (Ofgem Q1 2026) |
| SEG export | 15p/kWh default |
| Lead scoring | Hot/Warm/Cool based on potential |
| PWA | Offline calculator, installable |

## Subagent Pattern

Before implementing complex features, the loop invokes **Claude Haiku** to:
1. Scan existing code for reusable functions
2. Verify current UK energy prices and regulations
3. Check API documentation and rate limits
4. Recommend test patterns based on existing tests

This ensures efficient iteration and prevents duplicated code.

## Calculator Accuracy

Based on MCS (Microgeneration Certification Scheme) methodology:
- Results within 10% of Energy Saving Trust calculator
- Uses real PVGIS satellite data for irradiance
- Accounts for orientation, pitch, shading factors
- Applies 14% system losses (industry standard)
