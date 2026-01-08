/**
 * SolarQuote UK - Solar Calculation Engine
 *
 * Core calculation functions for estimating solar PV system performance
 * Based on MCS (Microgeneration Certification Scheme) methodology
 *
 * All functions are pure and testable
 */

import type {
  CalculatorInputs,
  CalculatorResults,
  MonthlyGeneration,
  CalculationMetadata,
  RoofOrientation,
  HomeOccupancy,
} from '@/types/solar';

import {
  UK_ENERGY_CONFIG,
  SYSTEM_COST_CONFIG,
  SOLAR_CONFIG,
  REGIONAL_IRRADIANCE,
  getPitchFactor,
} from './constants';

// ═══════════════════════════════════════════════════════════════════
// SYSTEM SIZING
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate maximum system size based on available roof area
 */
export function calculateMaxSystemSize(roofArea: number): number {
  // kWp = roof area / area per kWp
  const maxKwp = roofArea / SOLAR_CONFIG.panelAreaPerKwp;
  return Math.round(maxKwp * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate recommended system size based on energy usage
 * Aims to generate ~80-100% of annual usage for optimal self-consumption
 */
export function calculateRecommendedSize(
  annualUsage: number,
  irradiance: number,
  orientationFactor: number,
  pitchFactor: number,
  shadingFactor: number
): number {
  // Target: generate enough to cover usage
  // Annual generation = kWp × irradiance × factors
  // kWp = usage / (irradiance × factors × system_loss)

  const effectiveIrradiance =
    irradiance * orientationFactor * pitchFactor * shadingFactor * SOLAR_CONFIG.systemLossFactor;

  // Aim for 90% of usage (accounting for self-consumption losses)
  const targetGeneration = annualUsage * 0.9;

  // Peak sun hours ≈ irradiance / 1000
  const peakSunHours = effectiveIrradiance;

  // kWp needed
  const recommendedKwp = targetGeneration / peakSunHours;

  return Math.round(recommendedKwp * 10) / 10;
}

/**
 * Determine final system size considering roof constraints
 */
export function determineFinalSystemSize(recommendedKwp: number, maxKwp: number): number {
  // Use smaller of recommended and maximum
  const finalKwp = Math.min(recommendedKwp, maxKwp);

  // Round to common system sizes (0.5kWp increments)
  return Math.round(finalKwp * 2) / 2;
}

/**
 * Calculate number of panels needed
 */
export function calculatePanelCount(systemSizeKwp: number): number {
  return Math.ceil((systemSizeKwp * 1000) / SOLAR_CONFIG.panelWattage);
}

// ═══════════════════════════════════════════════════════════════════
// GENERATION ESTIMATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate annual energy generation in kWh
 */
export function calculateAnnualGeneration(
  systemSizeKwp: number,
  irradiance: number,
  orientationFactor: number,
  pitchFactor: number,
  shadingFactor: number
): number {
  const generation =
    systemSizeKwp *
    irradiance *
    orientationFactor *
    pitchFactor *
    shadingFactor *
    SOLAR_CONFIG.systemLossFactor;

  return Math.round(generation);
}

/**
 * Monthly generation distribution (UK typical pattern)
 * Returns percentage of annual generation for each month
 */
export function getMonthlyDistribution(): number[] {
  // Based on UK solar radiation patterns
  // Source: Met Office / PVGIS typical year data
  return [
    0.03, // January
    0.05, // February
    0.08, // March
    0.1, // April
    0.12, // May
    0.13, // June (peak)
    0.13, // July
    0.11, // August
    0.09, // September
    0.07, // October
    0.05, // November
    0.04, // December
  ];
}

/**
 * Calculate monthly generation breakdown
 */
export function calculateMonthlyGeneration(
  annualGeneration: number,
  selfConsumptionRatio: number
): MonthlyGeneration[] {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const distribution = getMonthlyDistribution();

  return distribution.map((fraction, index) => {
    const generationKwh = Math.round(annualGeneration * fraction);
    const selfConsumedKwh = Math.round(generationKwh * selfConsumptionRatio);
    const exportedKwh = generationKwh - selfConsumedKwh;

    return {
      month: index + 1,
      monthName: monthNames[index],
      generationKwh,
      selfConsumedKwh,
      exportedKwh,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
// SELF-CONSUMPTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate self-consumption ratio based on occupancy
 */
export function calculateSelfConsumption(occupancy: HomeOccupancy): number {
  return SOLAR_CONFIG.selfConsumptionFactors[occupancy];
}

// ═══════════════════════════════════════════════════════════════════
// FINANCIAL CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate annual savings from self-consumed electricity
 */
export function calculateAnnualSavings(
  selfConsumedKwh: number,
  electricityRatePence: number = UK_ENERGY_CONFIG.electricityRatePence
): number {
  // Savings = self-consumed kWh × electricity rate
  const savingsPence = selfConsumedKwh * electricityRatePence;
  return Math.round(savingsPence) / 100; // Convert to pounds
}

/**
 * Calculate annual SEG export earnings
 */
export function calculateExportEarnings(
  exportedKwh: number,
  exportRatePence: number = UK_ENERGY_CONFIG.segExportRatePence
): number {
  const earningsPence = exportedKwh * exportRatePence;
  return Math.round(earningsPence) / 100;
}

/**
 * Calculate estimated system cost
 */
export function calculateSystemCost(systemSizeKwp: number): number {
  let costPerKwp: number;

  if (systemSizeKwp <= SYSTEM_COST_CONFIG.smallMaxKwp) {
    costPerKwp = SYSTEM_COST_CONFIG.costPerKwpSmall;
  } else if (systemSizeKwp <= SYSTEM_COST_CONFIG.mediumMaxKwp) {
    costPerKwp = SYSTEM_COST_CONFIG.costPerKwpMedium;
  } else {
    costPerKwp = SYSTEM_COST_CONFIG.costPerKwpLarge;
  }

  return Math.round(systemSizeKwp * costPerKwp);
}

/**
 * Calculate simple payback period in years
 */
export function calculatePaybackPeriod(systemCost: number, annualBenefit: number): number {
  if (annualBenefit <= 0) return Infinity;
  return Math.round((systemCost / annualBenefit) * 10) / 10;
}

/**
 * Calculate 25-year return on investment
 * Accounts for panel degradation and current energy prices
 */
export function calculateROI25Years(
  annualGeneration: number,
  selfConsumptionRatio: number,
  electricityRatePence: number,
  exportRatePence: number,
  systemCost: number
): number {
  let totalBenefit = 0;
  const degradation = SOLAR_CONFIG.annualDegradation;

  for (let year = 1; year <= 25; year++) {
    // Apply degradation
    const yearGeneration = annualGeneration * Math.pow(1 - degradation, year - 1);
    const selfConsumed = yearGeneration * selfConsumptionRatio;
    const exported = yearGeneration - selfConsumed;

    // Calculate year benefit (not accounting for price inflation)
    const savings = (selfConsumed * electricityRatePence) / 100;
    const exportEarnings = (exported * exportRatePence) / 100;

    totalBenefit += savings + exportEarnings;
  }

  return Math.round(totalBenefit - systemCost);
}

// ═══════════════════════════════════════════════════════════════════
// ENVIRONMENTAL IMPACT
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate annual CO2 savings in kg
 */
export function calculateCO2Savings(annualGenerationKwh: number): number {
  return Math.round(annualGenerationKwh * SOLAR_CONFIG.gridCarbonFactor);
}

/**
 * Calculate 25-year CO2 savings accounting for degradation
 */
export function calculateCO2Savings25Years(annualGeneration: number): number {
  let totalGeneration = 0;
  const degradation = SOLAR_CONFIG.annualDegradation;

  for (let year = 1; year <= 25; year++) {
    totalGeneration += annualGeneration * Math.pow(1 - degradation, year - 1);
  }

  return Math.round(totalGeneration * SOLAR_CONFIG.gridCarbonFactor);
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get orientation factor from config
 */
export function getOrientationFactor(orientation: RoofOrientation): number {
  return SOLAR_CONFIG.orientationFactors[orientation];
}

/**
 * Get regional irradiance fallback
 */
export function getRegionalIrradiance(region: string): number {
  return REGIONAL_IRRADIANCE[region] || REGIONAL_IRRADIANCE.default;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN CALCULATION PIPELINE
// ═══════════════════════════════════════════════════════════════════

/**
 * Main calculation function - processes all inputs and returns complete results
 */
export function calculateSolarEstimate(
  inputs: CalculatorInputs,
  irradiance?: number
): CalculatorResults {
  // Get factors
  const orientationFactor = getOrientationFactor(inputs.roofOrientation);
  const pitchFactor = getPitchFactor(inputs.roofPitch);
  const shadingFactor = inputs.shadingFactor;

  // Use provided irradiance or fallback
  const usedIrradiance = irradiance || SOLAR_CONFIG.ukAverageIrradiance;
  const irradianceSource: 'PVGIS' | 'UK_AVERAGE' = irradiance ? 'PVGIS' : 'UK_AVERAGE';

  // Electricity rates
  const electricityRate = inputs.electricityUnitRate || UK_ENERGY_CONFIG.electricityRatePence;
  const exportRate = inputs.exportTariffRate || UK_ENERGY_CONFIG.segExportRatePence;

  // Calculate system size
  const maxSize = calculateMaxSystemSize(inputs.roofArea);
  const recommendedSize = calculateRecommendedSize(
    inputs.annualElectricityUsage,
    usedIrradiance,
    orientationFactor,
    pitchFactor,
    shadingFactor
  );
  const finalSize = determineFinalSystemSize(recommendedSize, maxSize);
  const panelCount = calculatePanelCount(finalSize);

  // Calculate generation
  const annualGeneration = calculateAnnualGeneration(
    finalSize,
    usedIrradiance,
    orientationFactor,
    pitchFactor,
    shadingFactor
  );

  // Self-consumption
  const selfConsumptionRatio = calculateSelfConsumption(inputs.homeOccupancy);
  const selfConsumedKwh = Math.round(annualGeneration * selfConsumptionRatio);
  const exportedKwh = annualGeneration - selfConsumedKwh;

  // Monthly breakdown
  const monthlyGeneration = calculateMonthlyGeneration(annualGeneration, selfConsumptionRatio);

  // Financials
  const annualSavings = calculateAnnualSavings(selfConsumedKwh, electricityRate);
  const annualExportEarnings = calculateExportEarnings(exportedKwh, exportRate);
  const totalAnnualBenefit = annualSavings + annualExportEarnings;
  const systemCost = calculateSystemCost(finalSize);
  const paybackPeriod = calculatePaybackPeriod(systemCost, totalAnnualBenefit);
  const roi25Years = calculateROI25Years(
    annualGeneration,
    selfConsumptionRatio,
    electricityRate,
    exportRate,
    systemCost
  );

  // Environmental
  const co2SavedAnnually = calculateCO2Savings(annualGeneration);
  const co2Saved25Years = calculateCO2Savings25Years(annualGeneration);

  // Metadata
  const metadata: CalculationMetadata = {
    calculatedAt: new Date().toISOString(),
    irradianceUsed: usedIrradiance,
    irradianceSource,
    electricityRate,
    exportRate,
    systemLossFactor: SOLAR_CONFIG.systemLossFactor,
    orientationFactor,
  };

  return {
    recommendedSystemSize: finalSize,
    numberOfPanels: panelCount,
    estimatedAnnualGeneration: annualGeneration,
    monthlyGeneration,
    selfConsumptionRatio,
    selfConsumedKwh,
    exportedKwh,
    annualSavings,
    annualExportEarnings,
    totalAnnualBenefit,
    estimatedSystemCost: systemCost,
    paybackPeriod,
    roi25Years,
    co2SavedAnnually,
    co2Saved25Years,
    metadata,
  };
}
