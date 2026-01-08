/**
 * Unit tests for solar calculation functions
 */

import {
  calculateMaxSystemSize,
  calculateRecommendedSize,
  determineFinalSystemSize,
  calculatePanelCount,
  calculateAnnualGeneration,
  getMonthlyDistribution,
  calculateMonthlyGeneration,
  calculateSelfConsumption,
  calculateAnnualSavings,
  calculateExportEarnings,
  calculateSystemCost,
  calculatePaybackPeriod,
  calculateROI25Years,
  calculateCO2Savings,
  calculateCO2Savings25Years,
  getOrientationFactor,
  getRegionalIrradiance,
  calculateSolarEstimate,
} from '../calculations';
import type { CalculatorInputs } from '@/types/solar';
import { SOLAR_CONFIG, SYSTEM_COST_CONFIG } from '../constants';

describe('System Sizing', () => {
  describe('calculateMaxSystemSize', () => {
    it('should calculate max system size from roof area', () => {
      // 30m² should give 6.0 kWp (5m² per kWp)
      expect(calculateMaxSystemSize(30)).toBe(6.0);
    });

    it('should round to 1 decimal place', () => {
      expect(calculateMaxSystemSize(27)).toBe(5.4);
      expect(calculateMaxSystemSize(33)).toBe(6.6);
    });

    it('should handle small roof areas', () => {
      expect(calculateMaxSystemSize(5)).toBe(1.0);
    });

    it('should handle large roof areas', () => {
      expect(calculateMaxSystemSize(100)).toBe(20.0);
    });
  });

  describe('calculateRecommendedSize', () => {
    it('should recommend system size based on usage', () => {
      // 3000 kWh usage with 1000 irradiance and factor 1.0 should recommend ~3 kWp
      const recommended = calculateRecommendedSize(3000, 1000, 1.0, 1.0, 1.0);
      expect(recommended).toBeGreaterThan(2);
      expect(recommended).toBeLessThan(5);
    });

    it('should recommend smaller systems for south-facing roofs', () => {
      const southFacing = calculateRecommendedSize(3000, 1000, 1.0, 1.0, 1.0);
      const northFacing = calculateRecommendedSize(3000, 1000, 0.55, 1.0, 1.0);
      expect(southFacing).toBeLessThan(northFacing);
    });

    it('should recommend larger systems for shaded properties', () => {
      const noShading = calculateRecommendedSize(3000, 1000, 1.0, 1.0, 1.0);
      const heavyShading = calculateRecommendedSize(3000, 1000, 1.0, 1.0, 0.5);
      expect(heavyShading).toBeGreaterThan(noShading);
    });
  });

  describe('determineFinalSystemSize', () => {
    it('should use recommended size if within roof constraints', () => {
      expect(determineFinalSystemSize(4, 6)).toBe(4);
    });

    it('should limit to max size if recommended exceeds', () => {
      expect(determineFinalSystemSize(8, 6)).toBe(6);
    });

    it('should round to 0.5 kWp increments', () => {
      expect(determineFinalSystemSize(3.3, 6)).toBe(3.5);
      expect(determineFinalSystemSize(3.7, 6)).toBe(3.5);
      expect(determineFinalSystemSize(3.8, 6)).toBe(4.0);
    });
  });

  describe('calculatePanelCount', () => {
    it('should calculate number of 400W panels needed', () => {
      // 4 kWp = 4000W / 400W = 10 panels
      expect(calculatePanelCount(4)).toBe(10);
    });

    it('should round up for partial panels', () => {
      // 3 kWp = 3000W / 400W = 7.5 -> 8 panels
      expect(calculatePanelCount(3)).toBe(8);
    });
  });
});

describe('Generation Estimation', () => {
  describe('calculateAnnualGeneration', () => {
    it('should calculate annual generation', () => {
      // 4kWp × 1000 kWh/kWp × 1.0 × 1.0 × 1.0 × 0.86 = 3440 kWh
      const generation = calculateAnnualGeneration(4, 1000, 1.0, 1.0, 1.0);
      expect(generation).toBe(3440);
    });

    it('should apply orientation factor', () => {
      const south = calculateAnnualGeneration(4, 1000, 1.0, 1.0, 1.0);
      const east = calculateAnnualGeneration(4, 1000, 0.86, 1.0, 1.0);
      expect(east).toBeLessThan(south);
    });

    it('should apply shading factor', () => {
      const noShade = calculateAnnualGeneration(4, 1000, 1.0, 1.0, 1.0);
      const shaded = calculateAnnualGeneration(4, 1000, 1.0, 1.0, 0.75);
      expect(shaded).toBe(Math.round(noShade * 0.75));
    });
  });

  describe('getMonthlyDistribution', () => {
    it('should return 12 months of distribution', () => {
      const distribution = getMonthlyDistribution();
      expect(distribution).toHaveLength(12);
    });

    it('should sum to 100%', () => {
      const distribution = getMonthlyDistribution();
      const sum = distribution.reduce((acc, val) => acc + val, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have peak in June/July', () => {
      const distribution = getMonthlyDistribution();
      const june = distribution[5];
      const july = distribution[6];
      const max = Math.max(...distribution);
      expect(june).toBe(max);
      expect(july).toBe(max);
    });

    it('should have lowest values in winter', () => {
      const distribution = getMonthlyDistribution();
      const jan = distribution[0];
      const dec = distribution[11];
      expect(jan).toBeLessThan(0.05);
      expect(dec).toBeLessThan(0.05);
    });
  });

  describe('calculateMonthlyGeneration', () => {
    it('should return 12 months of data', () => {
      const monthly = calculateMonthlyGeneration(3500, 0.45);
      expect(monthly).toHaveLength(12);
    });

    it('should include month names', () => {
      const monthly = calculateMonthlyGeneration(3500, 0.45);
      expect(monthly[0].monthName).toBe('January');
      expect(monthly[5].monthName).toBe('June');
      expect(monthly[11].monthName).toBe('December');
    });

    it('should split into self-consumed and exported', () => {
      const monthly = calculateMonthlyGeneration(3500, 0.45);
      monthly.forEach((m) => {
        expect(m.selfConsumedKwh + m.exportedKwh).toBe(m.generationKwh);
      });
    });
  });
});

describe('Self-Consumption', () => {
  describe('calculateSelfConsumption', () => {
    it('should return correct ratio for always home', () => {
      expect(calculateSelfConsumption('always')).toBe(SOLAR_CONFIG.selfConsumptionFactors.always);
    });

    it('should return correct ratio for daytime', () => {
      expect(calculateSelfConsumption('daytime')).toBe(SOLAR_CONFIG.selfConsumptionFactors.daytime);
    });

    it('should return correct ratio for evening', () => {
      expect(calculateSelfConsumption('evening')).toBe(SOLAR_CONFIG.selfConsumptionFactors.evening);
    });

    it('should return correct ratio for variable', () => {
      expect(calculateSelfConsumption('variable')).toBe(
        SOLAR_CONFIG.selfConsumptionFactors.variable
      );
    });
  });
});

describe('Financial Calculations', () => {
  describe('calculateAnnualSavings', () => {
    it('should calculate savings from self-consumed electricity', () => {
      // 1500 kWh × 27.69p = £415.35
      const savings = calculateAnnualSavings(1500, 27.69);
      expect(savings).toBeCloseTo(415.35, 0);
    });

    it('should return pounds not pence', () => {
      const savings = calculateAnnualSavings(100, 100);
      expect(savings).toBe(100); // 100 kWh × 100p = 10000p = £100
    });
  });

  describe('calculateExportEarnings', () => {
    it('should calculate SEG earnings from exported electricity', () => {
      // 2000 kWh × 15p = £300
      const earnings = calculateExportEarnings(2000, 15);
      expect(earnings).toBe(300);
    });
  });

  describe('calculateSystemCost', () => {
    it('should use small system rate for systems up to 3kWp', () => {
      const cost = calculateSystemCost(3);
      expect(cost).toBe(3 * SYSTEM_COST_CONFIG.costPerKwpSmall);
    });

    it('should use medium system rate for 3-6kWp systems', () => {
      const cost = calculateSystemCost(5);
      expect(cost).toBe(5 * SYSTEM_COST_CONFIG.costPerKwpMedium);
    });

    it('should use large system rate for systems over 6kWp', () => {
      const cost = calculateSystemCost(8);
      expect(cost).toBe(8 * SYSTEM_COST_CONFIG.costPerKwpLarge);
    });
  });

  describe('calculatePaybackPeriod', () => {
    it('should calculate simple payback period', () => {
      // £6000 / £600 per year = 10 years
      expect(calculatePaybackPeriod(6000, 600)).toBe(10);
    });

    it('should return Infinity if no benefit', () => {
      expect(calculatePaybackPeriod(6000, 0)).toBe(Infinity);
      expect(calculatePaybackPeriod(6000, -100)).toBe(Infinity);
    });

    it('should round to 1 decimal place', () => {
      expect(calculatePaybackPeriod(6500, 600)).toBeCloseTo(10.8, 1);
    });
  });

  describe('calculateROI25Years', () => {
    it('should calculate 25-year return considering degradation', () => {
      const roi = calculateROI25Years(3500, 0.45, 27.69, 15, 7000);
      expect(roi).toBeGreaterThan(0); // Should be profitable
    });

    it('should be less than simple multiplication due to degradation', () => {
      const annualBenefit = (3500 * 0.45 * 27.69 + 3500 * 0.55 * 15) / 100;
      const simpleROI = annualBenefit * 25 - 7000;
      const actualROI = calculateROI25Years(3500, 0.45, 27.69, 15, 7000);
      expect(actualROI).toBeLessThan(simpleROI);
    });
  });
});

describe('Environmental Impact', () => {
  describe('calculateCO2Savings', () => {
    it('should calculate annual CO2 savings', () => {
      // 3500 kWh × 0.233 kg/kWh = 815.5 kg
      const savings = calculateCO2Savings(3500);
      expect(savings).toBe(Math.round(3500 * SOLAR_CONFIG.gridCarbonFactor));
    });
  });

  describe('calculateCO2Savings25Years', () => {
    it('should calculate 25-year savings with degradation', () => {
      const savings25 = calculateCO2Savings25Years(3500);
      const annualSavings = calculateCO2Savings(3500);
      // Should be less than 25x annual due to degradation
      expect(savings25).toBeLessThan(annualSavings * 25);
      // But more than 20x (accounting for ~11% degradation over 25 years)
      expect(savings25).toBeGreaterThan(annualSavings * 20);
    });
  });
});

describe('Helper Functions', () => {
  describe('getOrientationFactor', () => {
    it('should return 1.0 for south', () => {
      expect(getOrientationFactor('S')).toBe(1.0);
    });

    it('should return lower values for non-optimal orientations', () => {
      expect(getOrientationFactor('E')).toBeLessThan(1.0);
      expect(getOrientationFactor('W')).toBeLessThan(1.0);
      expect(getOrientationFactor('N')).toBeLessThan(getOrientationFactor('S'));
    });
  });

  describe('getRegionalIrradiance', () => {
    it('should return regional values', () => {
      expect(getRegionalIrradiance('South East')).toBeGreaterThan(1000);
      expect(getRegionalIrradiance('Scottish Highlands')).toBeLessThan(900);
    });

    it('should return default for unknown regions', () => {
      expect(getRegionalIrradiance('Unknown Region')).toBe(getRegionalIrradiance('default'));
    });
  });
});

describe('calculateSolarEstimate (Integration)', () => {
  const validInputs: CalculatorInputs = {
    postcode: 'SW1A 1AA',
    latitude: 51.5,
    longitude: -0.14,
    roofOrientation: 'S',
    roofPitch: 35,
    roofArea: 30,
    shadingFactor: 1.0,
    annualElectricityUsage: 3500,
    homeOccupancy: 'daytime',
  };

  it('should return all required result fields', () => {
    const results = calculateSolarEstimate(validInputs);

    expect(results).toHaveProperty('recommendedSystemSize');
    expect(results).toHaveProperty('numberOfPanels');
    expect(results).toHaveProperty('estimatedAnnualGeneration');
    expect(results).toHaveProperty('monthlyGeneration');
    expect(results).toHaveProperty('selfConsumptionRatio');
    expect(results).toHaveProperty('selfConsumedKwh');
    expect(results).toHaveProperty('exportedKwh');
    expect(results).toHaveProperty('annualSavings');
    expect(results).toHaveProperty('annualExportEarnings');
    expect(results).toHaveProperty('totalAnnualBenefit');
    expect(results).toHaveProperty('estimatedSystemCost');
    expect(results).toHaveProperty('paybackPeriod');
    expect(results).toHaveProperty('roi25Years');
    expect(results).toHaveProperty('co2SavedAnnually');
    expect(results).toHaveProperty('co2Saved25Years');
    expect(results).toHaveProperty('metadata');
  });

  it('should calculate realistic values for typical UK installation', () => {
    const results = calculateSolarEstimate(validInputs);

    // System size should be reasonable
    expect(results.recommendedSystemSize).toBeGreaterThan(2);
    expect(results.recommendedSystemSize).toBeLessThan(8);

    // Payback should be 7-15 years for typical UK
    expect(results.paybackPeriod).toBeGreaterThan(5);
    expect(results.paybackPeriod).toBeLessThan(15);

    // 25-year ROI should be positive
    expect(results.roi25Years).toBeGreaterThan(0);
  });

  it('should use provided irradiance when available', () => {
    const results = calculateSolarEstimate(validInputs, 950);
    expect(results.metadata.irradianceUsed).toBe(950);
    expect(results.metadata.irradianceSource).toBe('PVGIS');
  });

  it('should fallback to UK average irradiance when not provided', () => {
    const results = calculateSolarEstimate(validInputs);
    expect(results.metadata.irradianceUsed).toBe(SOLAR_CONFIG.ukAverageIrradiance);
    expect(results.metadata.irradianceSource).toBe('UK_AVERAGE');
  });

  it('should use custom electricity rates when provided', () => {
    const customInputs = {
      ...validInputs,
      electricityUnitRate: 30,
      exportTariffRate: 20,
    };
    const results = calculateSolarEstimate(customInputs);
    expect(results.metadata.electricityRate).toBe(30);
    expect(results.metadata.exportRate).toBe(20);
  });

  it('should generate 12 months of data', () => {
    const results = calculateSolarEstimate(validInputs);
    expect(results.monthlyGeneration).toHaveLength(12);
  });

  it('should have consistent self-consumption breakdown', () => {
    const results = calculateSolarEstimate(validInputs);
    expect(results.selfConsumedKwh + results.exportedKwh).toBe(results.estimatedAnnualGeneration);
  });
});
