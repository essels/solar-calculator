/**
 * Lead Scoring Algorithm
 * Calculates a lead score based on solar calculation results and contact information
 * Higher scores indicate better qualified leads for solar installation
 */

import type { CalculatorResults, LeadContact, LeadScore, LeadScoreFactor } from '@/types/solar';

/**
 * Score thresholds for lead categorization
 */
const SCORE_THRESHOLDS = {
  hot: 70, // 70+ = hot lead
  warm: 40, // 40-69 = warm lead
  // Below 40 = cool lead
};

/**
 * Maximum points for each scoring factor
 */
const SCORING_WEIGHTS = {
  systemSize: 20, // Larger systems = higher value
  paybackPeriod: 20, // Shorter payback = more likely to convert
  annualSavings: 15, // Higher savings = more attractive
  roofArea: 10, // Adequate roof space
  phoneProvided: 15, // Contact preference indicates intent
  nameProvided: 5, // More detail = more engaged
  selfConsumption: 10, // Higher self-use = better fit
  usageLevel: 5, // Higher usage = bigger opportunity
};

/**
 * Calculate lead score based on results and contact info
 */
export function calculateLeadScore(results: CalculatorResults, contact: LeadContact): LeadScore {
  const factors: LeadScoreFactor[] = [];
  let totalScore = 0;

  // 1. System size scoring (0-20 points)
  // Larger systems (4kWp+) are more valuable
  const systemSizePoints = Math.min(
    SCORING_WEIGHTS.systemSize,
    Math.round((results.recommendedSystemSize / 6) * SCORING_WEIGHTS.systemSize)
  );
  factors.push({
    name: 'System Size',
    value: results.recommendedSystemSize,
    points: systemSizePoints,
  });
  totalScore += systemSizePoints;

  // 2. Payback period scoring (0-20 points)
  // Shorter payback is better (inverse scoring)
  // 7 years or less = full points, 15+ years = 0 points
  const paybackScore =
    results.paybackPeriod <= 7
      ? SCORING_WEIGHTS.paybackPeriod
      : results.paybackPeriod >= 15
        ? 0
        : Math.round(((15 - results.paybackPeriod) / 8) * SCORING_WEIGHTS.paybackPeriod);
  factors.push({
    name: 'Payback Period',
    value: results.paybackPeriod,
    points: paybackScore,
  });
  totalScore += paybackScore;

  // 3. Annual savings scoring (0-15 points)
  // £500+ annual savings = full points
  const savingsPoints = Math.min(
    SCORING_WEIGHTS.annualSavings,
    Math.round((results.totalAnnualBenefit / 500) * SCORING_WEIGHTS.annualSavings)
  );
  factors.push({
    name: 'Annual Savings',
    value: results.totalAnnualBenefit,
    points: savingsPoints,
  });
  totalScore += savingsPoints;

  // 4. Phone number provided (0 or 15 points)
  // Providing phone indicates higher intent
  const phonePoints = contact.phone ? SCORING_WEIGHTS.phoneProvided : 0;
  factors.push({
    name: 'Phone Provided',
    value: !!contact.phone,
    points: phonePoints,
  });
  totalScore += phonePoints;

  // 5. Name provided (0 or 5 points)
  // Providing name indicates engagement
  const namePoints = contact.name ? SCORING_WEIGHTS.nameProvided : 0;
  factors.push({
    name: 'Name Provided',
    value: !!contact.name,
    points: namePoints,
  });
  totalScore += namePoints;

  // 6. Self-consumption ratio (0-10 points)
  // Higher self-consumption = better ROI
  const selfConsumptionPoints = Math.round(
    results.selfConsumptionRatio * SCORING_WEIGHTS.selfConsumption
  );
  factors.push({
    name: 'Self-Consumption',
    value: results.selfConsumptionRatio,
    points: selfConsumptionPoints,
  });
  totalScore += selfConsumptionPoints;

  // 7. Roof area adequacy (0-10 points)
  // Based on number of panels that can fit
  const roofAreaPoints =
    results.numberOfPanels >= 12
      ? SCORING_WEIGHTS.roofArea
      : Math.round((results.numberOfPanels / 12) * SCORING_WEIGHTS.roofArea);
  factors.push({
    name: 'Roof Area',
    value: results.numberOfPanels,
    points: roofAreaPoints,
  });
  totalScore += roofAreaPoints;

  // 8. Usage level (0-5 points)
  // Higher usage = bigger opportunity
  // 4000+ kWh annual generation potential = full points
  const usagePoints = Math.min(
    SCORING_WEIGHTS.usageLevel,
    Math.round((results.estimatedAnnualGeneration / 4000) * SCORING_WEIGHTS.usageLevel)
  );
  factors.push({
    name: 'Usage Level',
    value: results.estimatedAnnualGeneration,
    points: usagePoints,
  });
  totalScore += usagePoints;

  // Determine category based on total score
  const category: 'hot' | 'warm' | 'cool' =
    totalScore >= SCORE_THRESHOLDS.hot
      ? 'hot'
      : totalScore >= SCORE_THRESHOLDS.warm
        ? 'warm'
        : 'cool';

  return {
    totalScore,
    category,
    factors,
  };
}

/**
 * Get lead score summary for display
 */
export function getLeadScoreSummary(score: LeadScore): string {
  const categoryLabels = {
    hot: 'High-value lead - likely to convert',
    warm: 'Moderate potential - follow up recommended',
    cool: 'Lower priority - nurture over time',
  };

  return `${score.category.toUpperCase()} (${score.totalScore}/100) - ${categoryLabels[score.category]}`;
}

/**
 * Get lead score breakdown for admin display
 */
export function getLeadScoreBreakdown(score: LeadScore): string[] {
  return score.factors.map((factor) => `${factor.name}: ${factor.points} pts`);
}
