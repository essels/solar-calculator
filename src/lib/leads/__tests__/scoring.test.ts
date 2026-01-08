/**
 * Unit tests for lead scoring algorithm
 */

import { calculateLeadScore, getLeadScoreSummary, getLeadScoreBreakdown } from '../scoring';
import type { CalculatorResults, LeadContact, MonthlyGeneration } from '@/types/solar';

// Helper to create valid calculator results
function createMockResults(overrides: Partial<CalculatorResults> = {}): CalculatorResults {
  const monthlyGeneration: MonthlyGeneration[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: [
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
    ][i],
    generationKwh: 300,
    selfConsumedKwh: 135,
    exportedKwh: 165,
  }));

  return {
    recommendedSystemSize: 4,
    numberOfPanels: 10,
    estimatedAnnualGeneration: 3600,
    monthlyGeneration,
    selfConsumptionRatio: 0.45,
    selfConsumedKwh: 1620,
    exportedKwh: 1980,
    annualSavings: 448,
    annualExportEarnings: 297,
    totalAnnualBenefit: 745,
    estimatedSystemCost: 5200,
    paybackPeriod: 7,
    roi25Years: 12000,
    co2SavedAnnually: 839,
    co2Saved25Years: 18000,
    metadata: {
      calculatedAt: new Date().toISOString(),
      irradianceUsed: 1000,
      irradianceSource: 'PVGIS',
      electricityRate: 27.69,
      exportRate: 15,
      systemLossFactor: 0.86,
      orientationFactor: 1.0,
    },
    ...overrides,
  };
}

// Helper to create lead contact
function createMockContact(overrides: Partial<LeadContact> = {}): LeadContact {
  return {
    email: 'test@example.com',
    ...overrides,
  };
}

describe('Lead Scoring', () => {
  describe('calculateLeadScore', () => {
    it('should return score with all required fields', () => {
      const results = createMockResults();
      const contact = createMockContact();
      const score = calculateLeadScore(results, contact);

      expect(score).toHaveProperty('totalScore');
      expect(score).toHaveProperty('category');
      expect(score).toHaveProperty('factors');
      expect(score.factors).toHaveLength(8);
    });

    it('should categorize high-value leads as hot (70+)', () => {
      const results = createMockResults({
        recommendedSystemSize: 6,
        paybackPeriod: 6,
        totalAnnualBenefit: 800,
        numberOfPanels: 15,
        estimatedAnnualGeneration: 5000,
        selfConsumptionRatio: 0.5,
      });
      const contact = createMockContact({ phone: '07700900123', name: 'John Smith' });
      const score = calculateLeadScore(results, contact);

      expect(score.totalScore).toBeGreaterThanOrEqual(70);
      expect(score.category).toBe('hot');
    });

    it('should categorize medium-value leads as warm (40-69)', () => {
      const results = createMockResults({
        recommendedSystemSize: 4,
        paybackPeriod: 10,
        totalAnnualBenefit: 500,
        numberOfPanels: 10,
        estimatedAnnualGeneration: 3500,
        selfConsumptionRatio: 0.4,
      });
      const contact = createMockContact(); // Email only
      const score = calculateLeadScore(results, contact);

      expect(score.totalScore).toBeGreaterThanOrEqual(40);
      expect(score.totalScore).toBeLessThan(70);
      expect(score.category).toBe('warm');
    });

    it('should categorize low-value leads as cool (<40)', () => {
      const results = createMockResults({
        recommendedSystemSize: 2,
        paybackPeriod: 15,
        totalAnnualBenefit: 200,
        numberOfPanels: 5,
        estimatedAnnualGeneration: 1500,
        selfConsumptionRatio: 0.25,
      });
      const contact = createMockContact();
      const score = calculateLeadScore(results, contact);

      expect(score.totalScore).toBeLessThan(40);
      expect(score.category).toBe('cool');
    });

    it('should award points for phone number provided', () => {
      const results = createMockResults();
      const withPhone = createMockContact({ phone: '07700900123' });
      const withoutPhone = createMockContact();

      const scoreWithPhone = calculateLeadScore(results, withPhone);
      const scoreWithoutPhone = calculateLeadScore(results, withoutPhone);

      expect(scoreWithPhone.totalScore).toBeGreaterThan(scoreWithoutPhone.totalScore);

      const phoneFactorWith = scoreWithPhone.factors.find((f) => f.name === 'Phone Provided');
      const phoneFactorWithout = scoreWithoutPhone.factors.find((f) => f.name === 'Phone Provided');

      expect(phoneFactorWith?.points).toBe(15);
      expect(phoneFactorWithout?.points).toBe(0);
    });

    it('should award points for name provided', () => {
      const results = createMockResults();
      const withName = createMockContact({ name: 'John Smith' });
      const withoutName = createMockContact();

      const scoreWithName = calculateLeadScore(results, withName);
      const scoreWithoutName = calculateLeadScore(results, withoutName);

      expect(scoreWithName.totalScore).toBeGreaterThan(scoreWithoutName.totalScore);

      const nameFactorWith = scoreWithName.factors.find((f) => f.name === 'Name Provided');
      const nameFactorWithout = scoreWithoutName.factors.find((f) => f.name === 'Name Provided');

      expect(nameFactorWith?.points).toBe(5);
      expect(nameFactorWithout?.points).toBe(0);
    });

    it('should score higher for shorter payback periods', () => {
      const results7year = createMockResults({ paybackPeriod: 7 });
      const results14year = createMockResults({ paybackPeriod: 14 });
      const contact = createMockContact();

      const score7 = calculateLeadScore(results7year, contact);
      const score14 = calculateLeadScore(results14year, contact);

      const paybackFactor7 = score7.factors.find((f) => f.name === 'Payback Period');
      const paybackFactor14 = score14.factors.find((f) => f.name === 'Payback Period');

      expect(paybackFactor7?.points).toBeGreaterThan(paybackFactor14?.points || 0);
    });

    it('should score higher for larger system sizes', () => {
      const resultsLarge = createMockResults({ recommendedSystemSize: 6 });
      const resultsSmall = createMockResults({ recommendedSystemSize: 2 });
      const contact = createMockContact();

      const scoreLarge = calculateLeadScore(resultsLarge, contact);
      const scoreSmall = calculateLeadScore(resultsSmall, contact);

      const sizeLarge = scoreLarge.factors.find((f) => f.name === 'System Size');
      const sizeSmall = scoreSmall.factors.find((f) => f.name === 'System Size');

      expect(sizeLarge?.points).toBeGreaterThan(sizeSmall?.points || 0);
    });
  });

  describe('getLeadScoreSummary', () => {
    it('should return formatted summary for hot leads', () => {
      const score = {
        totalScore: 85,
        category: 'hot' as const,
        factors: [],
      };
      const summary = getLeadScoreSummary(score);
      expect(summary).toContain('HOT');
      expect(summary).toContain('85/100');
      expect(summary).toContain('High-value');
    });

    it('should return formatted summary for warm leads', () => {
      const score = {
        totalScore: 55,
        category: 'warm' as const,
        factors: [],
      };
      const summary = getLeadScoreSummary(score);
      expect(summary).toContain('WARM');
      expect(summary).toContain('55/100');
    });

    it('should return formatted summary for cool leads', () => {
      const score = {
        totalScore: 25,
        category: 'cool' as const,
        factors: [],
      };
      const summary = getLeadScoreSummary(score);
      expect(summary).toContain('COOL');
      expect(summary).toContain('25/100');
    });
  });

  describe('getLeadScoreBreakdown', () => {
    it('should return array of formatted factor strings', () => {
      const score = {
        totalScore: 70,
        category: 'hot' as const,
        factors: [
          { name: 'System Size', value: 4, points: 13 },
          { name: 'Payback Period', value: 8, points: 17 },
        ],
      };
      const breakdown = getLeadScoreBreakdown(score);

      expect(breakdown).toHaveLength(2);
      expect(breakdown[0]).toBe('System Size: 13 pts');
      expect(breakdown[1]).toBe('Payback Period: 17 pts');
    });
  });
});
