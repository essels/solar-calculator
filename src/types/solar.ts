/**
 * SolarQuote UK - TypeScript Type Definitions
 * Core types for the solar calculation engine and lead capture
 */

// ═══════════════════════════════════════════════════════════════════
// CALCULATOR INPUT TYPES
// ═══════════════════════════════════════════════════════════════════

export type RoofOrientation = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'flat';

export type ShadingLevel = 0 | 0.5 | 0.75 | 0.9 | 1.0;

export type HomeOccupancy = 'always' | 'daytime' | 'evening' | 'variable';

export interface CalculatorInputs {
  /** UK postcode (validated format) */
  postcode: string;

  /** Latitude from postcode lookup */
  latitude: number;

  /** Longitude from postcode lookup */
  longitude: number;

  /** Primary roof direction */
  roofOrientation: RoofOrientation;

  /** Roof pitch in degrees (0-90) */
  roofPitch: number;

  /** Usable roof area in m² */
  roofArea: number;

  /** Shading factor (1 = no shading, 0 = full shade) */
  shadingFactor: ShadingLevel;

  /** Annual electricity consumption in kWh */
  annualElectricityUsage: number;

  /** Typical home occupancy pattern */
  homeOccupancy: HomeOccupancy;

  /** Override electricity unit rate (p/kWh) */
  electricityUnitRate?: number;

  /** Override SEG export rate (p/kWh) */
  exportTariffRate?: number;
}

// ═══════════════════════════════════════════════════════════════════
// CALCULATOR OUTPUT TYPES
// ═══════════════════════════════════════════════════════════════════

export interface CalculatorResults {
  /** Recommended system size in kWp */
  recommendedSystemSize: number;

  /** Number of panels (assuming 400W each) */
  numberOfPanels: number;

  /** Estimated annual generation in kWh */
  estimatedAnnualGeneration: number;

  /** Monthly generation breakdown */
  monthlyGeneration: MonthlyGeneration[];

  /** Ratio of generation used onsite (0-1) */
  selfConsumptionRatio: number;

  /** kWh consumed onsite */
  selfConsumedKwh: number;

  /** kWh exported to grid */
  exportedKwh: number;

  /** Annual savings from self-consumption in £ */
  annualSavings: number;

  /** Annual SEG export earnings in £ */
  annualExportEarnings: number;

  /** Total annual benefit in £ */
  totalAnnualBenefit: number;

  /** Estimated system cost including installation in £ */
  estimatedSystemCost: number;

  /** Simple payback period in years */
  paybackPeriod: number;

  /** Total return over 25 years in £ */
  roi25Years: number;

  /** Annual CO2 saved in kg */
  co2SavedAnnually: number;

  /** CO2 saved over 25 years in kg */
  co2Saved25Years: number;

  /** Calculation metadata */
  metadata: CalculationMetadata;
}

export interface MonthlyGeneration {
  month: number;
  monthName: string;
  generationKwh: number;
  selfConsumedKwh: number;
  exportedKwh: number;
}

export interface CalculationMetadata {
  /** Calculation timestamp */
  calculatedAt: string;

  /** Solar irradiance used (kWh/m²/year) */
  irradianceUsed: number;

  /** Data source for irradiance */
  irradianceSource: 'PVGIS' | 'UK_AVERAGE';

  /** Electricity rate used (p/kWh) */
  electricityRate: number;

  /** Export rate used (p/kWh) */
  exportRate: number;

  /** System efficiency factor applied */
  systemLossFactor: number;

  /** Orientation factor applied */
  orientationFactor: number;
}

// ═══════════════════════════════════════════════════════════════════
// LEAD CAPTURE TYPES
// ═══════════════════════════════════════════════════════════════════

export interface LeadContact {
  email: string;
  phone?: string;
  name?: string;
  preferredContactTime?: 'morning' | 'afternoon' | 'evening';
}

export interface LeadConsent {
  marketingConsent: boolean;
  privacyAcceptance: boolean;
  consentTimestamp: string;
}

export interface Lead {
  id: string;
  contact: LeadContact;
  consent: LeadConsent;
  inputs: CalculatorInputs;
  results: CalculatorResults;
  score: LeadScore;
  createdAt: string;
  source?: string;
}

export interface LeadScore {
  totalScore: number;
  category: 'hot' | 'warm' | 'cool';
  factors: LeadScoreFactor[];
}

export interface LeadScoreFactor {
  name: string;
  value: boolean | number;
  points: number;
}

// ═══════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════

export interface PostcodeResponse {
  valid: boolean;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  region?: string;
  error?: string;
}

export interface PVGISResponse {
  success: boolean;
  annualIrradiance?: number;
  monthlyIrradiance?: number[];
  error?: string;
}

export interface CalculateAPIRequest {
  inputs: CalculatorInputs;
}

export interface CalculateAPIResponse {
  success: boolean;
  results?: CalculatorResults;
  error?: string;
}

export interface LeadSubmitRequest {
  contact: LeadContact;
  consent: LeadConsent;
  calculationId: string;
}

export interface LeadSubmitResponse {
  success: boolean;
  leadId?: string;
  message?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION TYPES
// ═══════════════════════════════════════════════════════════════════

export interface UKEnergyConfig {
  /** Electricity unit rate in pence/kWh */
  electricityRatePence: number;

  /** SEG export rate in pence/kWh */
  segExportRatePence: number;

  /** Standing charge in pence/day */
  standingChargePence: number;

  /** Last updated date */
  lastUpdated: string;

  /** Source (e.g., "Ofgem Q1 2026") */
  source: string;
}

export interface SystemCostConfig {
  /** Cost per kWp for small systems (<3kWp) */
  costPerKwpSmall: number;

  /** Cost per kWp for medium systems (3-6kWp) */
  costPerKwpMedium: number;

  /** Cost per kWp for large systems (>6kWp) */
  costPerKwpLarge: number;

  /** Size tier boundaries */
  smallMaxKwp: number;
  mediumMaxKwp: number;
}

export interface SolarConfig {
  /** UK grid carbon factor (kg CO2/kWh) */
  gridCarbonFactor: number;

  /** System loss factor (0.86 = 14% losses) */
  systemLossFactor: number;

  /** Panel area per kWp (m²) */
  panelAreaPerKwp: number;

  /** Annual degradation rate (0.005 = 0.5%) */
  annualDegradation: number;

  /** Typical panel wattage */
  panelWattage: number;

  /** Orientation factors */
  orientationFactors: Record<RoofOrientation, number>;

  /** Self-consumption factors by occupancy */
  selfConsumptionFactors: Record<HomeOccupancy, number>;

  /** UK average irradiance fallback */
  ukAverageIrradiance: number;
}
