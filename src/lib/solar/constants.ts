/**
 * SolarQuote UK - UK-Specific Solar Constants
 *
 * These values should be reviewed and updated quarterly
 * Sources documented for each value
 *
 * Last Updated: January 2026
 */

import type {
  UKEnergyConfig,
  SystemCostConfig,
  SolarConfig,
  RoofOrientation,
  HomeOccupancy,
} from '@/types/solar';

// ═══════════════════════════════════════════════════════════════════
// UK ENERGY PRICING (Ofgem Price Cap Q1 2026)
// Source: https://www.ofgem.gov.uk/energy-price-cap
// ═══════════════════════════════════════════════════════════════════

export const UK_ENERGY_CONFIG: UKEnergyConfig = {
  electricityRatePence: 27.69, // p/kWh Direct Debit
  segExportRatePence: 15.0, // Average SEG rate
  standingChargePence: 54.7, // p/day average
  lastUpdated: '2026-01-01',
  source: 'Ofgem Price Cap Q1 2026',
};

// ═══════════════════════════════════════════════════════════════════
// SYSTEM INSTALLATION COSTS
// Source: MCS Installation Database, Energy Saving Trust
// ═══════════════════════════════════════════════════════════════════

export const SYSTEM_COST_CONFIG: SystemCostConfig = {
  costPerKwpSmall: 1500, // £/kWp for <3kWp systems
  costPerKwpMedium: 1300, // £/kWp for 3-6kWp systems
  costPerKwpLarge: 1100, // £/kWp for >6kWp systems
  smallMaxKwp: 3,
  mediumMaxKwp: 6,
};

// ═══════════════════════════════════════════════════════════════════
// SOLAR CALCULATION CONSTANTS
// Sources: PVGIS, MCS MIS 3002, UK Government
// ═══════════════════════════════════════════════════════════════════

export const SOLAR_CONFIG: SolarConfig = {
  // UK grid carbon factor (kg CO2 per kWh)
  // Source: UK Government GHG Conversion Factors 2025
  gridCarbonFactor: 0.233,

  // System losses (inverter, cables, temperature, dirt)
  // Source: PVGIS default
  systemLossFactor: 0.86,

  // Roof area required per kWp
  // Based on typical 400W panels at ~20% efficiency
  panelAreaPerKwp: 5,

  // Annual panel degradation rate
  // Source: Industry standard for modern panels
  annualDegradation: 0.005,

  // Typical panel wattage for calculations
  panelWattage: 400,

  // Orientation efficiency factors
  // Source: Energy Saving Trust, MCS guidance
  orientationFactors: {
    S: 1.0, // South - optimal
    SE: 0.95,
    SW: 0.95,
    E: 0.85,
    W: 0.85,
    NE: 0.7,
    NW: 0.7,
    N: 0.55, // North - significant reduction
    flat: 0.9, // Flat roof with optimal tilt
  } as Record<RoofOrientation, number>,

  // Self-consumption factors by occupancy pattern
  // Source: MCS MGD 003 guidance
  selfConsumptionFactors: {
    always: 0.45, // WFH/retired - higher daytime usage
    daytime: 0.5, // Daytime presence
    evening: 0.25, // Only home evenings - most exported
    variable: 0.35, // Mixed pattern
  } as Record<HomeOccupancy, number>,

  // UK average irradiance fallback (kWh/m²/year)
  // Used when PVGIS unavailable
  ukAverageIrradiance: 1000,
};

// ═══════════════════════════════════════════════════════════════════
// REGIONAL IRRADIANCE DATA (Fallback if PVGIS unavailable)
// Source: Met Office / Energy Saving Trust regional data
// ═══════════════════════════════════════════════════════════════════

export const REGIONAL_IRRADIANCE: Record<string, number> = {
  // England - South
  'South West': 1100,
  'South East': 1050,
  London: 1000,

  // England - Midlands
  'West Midlands': 950,
  'East Midlands': 950,
  'East of England': 1000,

  // England - North
  'North West': 900,
  'North East': 900,
  Yorkshire: 920,

  // Wales
  Wales: 950,

  // Scotland
  'Scotland South': 900,
  'Scotland Central': 880,
  'Scotland North': 850,
  'Scottish Highlands': 800,

  // Northern Ireland
  'Northern Ireland': 900,

  // Default fallback
  default: 950,
};

// ═══════════════════════════════════════════════════════════════════
// PITCH FACTOR LOOKUP
// Efficiency factor based on roof pitch (degrees)
// Optimal for UK is ~35 degrees
// ═══════════════════════════════════════════════════════════════════

export const PITCH_FACTORS: Record<number, number> = {
  0: 0.9, // Flat
  10: 0.94,
  15: 0.96,
  20: 0.98,
  25: 0.99,
  30: 1.0,
  35: 1.0, // Optimal
  40: 0.99,
  45: 0.97,
  50: 0.94,
  60: 0.88,
  70: 0.8,
  80: 0.7,
  90: 0.55, // Vertical
};

/**
 * Get pitch factor by interpolating between known values
 */
export function getPitchFactor(pitch: number): number {
  const clampedPitch = Math.max(0, Math.min(90, pitch));
  const pitches = Object.keys(PITCH_FACTORS)
    .map(Number)
    .sort((a, b) => a - b);

  for (let i = 0; i < pitches.length - 1; i++) {
    const lower = pitches[i];
    const upper = pitches[i + 1];

    if (clampedPitch >= lower && clampedPitch <= upper) {
      const ratio = (clampedPitch - lower) / (upper - lower);
      return PITCH_FACTORS[lower] + ratio * (PITCH_FACTORS[upper] - PITCH_FACTORS[lower]);
    }
  }

  return PITCH_FACTORS[35]; // Default to optimal
}

// ═══════════════════════════════════════════════════════════════════
// LEAD SCORING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════

export const LEAD_SCORING = {
  thresholds: {
    systemSize: { min: 4, points: 30 }, // >=4kWp
    paybackPeriod: { max: 8, points: 25 }, // <=8 years
    roofArea: { min: 30, points: 15 }, // >=30m²
    annualUsage: { min: 4000, points: 15 }, // >=4000kWh
    alwaysHome: { points: 10 },
    phoneProvided: { points: 20 },
  },
  categories: {
    hot: 70, // Score >= 70
    warm: 40, // Score >= 40
    cool: 0, // Score < 40
  },
};

// ═══════════════════════════════════════════════════════════════════
// VALIDATION LIMITS
// ═══════════════════════════════════════════════════════════════════

export const VALIDATION = {
  roofPitch: { min: 0, max: 90 },
  roofArea: { min: 5, max: 500 },
  annualUsage: { min: 500, max: 30000 },
  systemSize: { min: 0.5, max: 50 },
};

// ═══════════════════════════════════════════════════════════════════
// UI LABELS & DISPLAY
// ═══════════════════════════════════════════════════════════════════

export const ORIENTATION_LABELS: Record<RoofOrientation, string> = {
  N: 'North',
  NE: 'North-East',
  E: 'East',
  SE: 'South-East',
  S: 'South',
  SW: 'South-West',
  W: 'West',
  NW: 'North-West',
  flat: 'Flat Roof',
};

export const OCCUPANCY_LABELS: Record<HomeOccupancy, string> = {
  always: 'Always home / Work from home',
  daytime: 'Home during the day',
  evening: 'Home mostly evenings',
  variable: 'Variable / Mixed schedule',
};

export const SHADING_LABELS: Record<number, string> = {
  1.0: 'No shading (ideal)',
  0.9: 'Light shading (occasional shadows)',
  0.75: 'Moderate shading (trees/buildings nearby)',
  0.5: 'Heavy shading (significant obstructions)',
};
