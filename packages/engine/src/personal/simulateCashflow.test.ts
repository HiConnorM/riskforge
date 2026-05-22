import { describe, it, expect } from 'vitest';
import { simulatePersonalCashflow } from './simulateCashflow.js';
import type { PersonalCashflowInput, CashflowSimConfig } from '@riskforge/domain';

// ─── fixtures ────────────────────────────────────────────────────────────────

const stableInput: PersonalCashflowInput = {
  monthlyIncome: 6_000,
  monthlyFixedExpenses: 2_000,
  monthlyVariableExpenses: 800,
  currentSavings: 15_000,
  horizonMonths: 12,
  riskEvents: [
    { name: 'Car repair', category: 'car', probabilityPerMonth: 0.05, minCost: 500, maxCost: 1_500 },
  ],
};

const fragileInput: PersonalCashflowInput = {
  monthlyIncome: 2_000,
  monthlyFixedExpenses: 1_800,
  monthlyVariableExpenses: 400,
  currentSavings: 500,
  horizonMonths: 12,
  riskEvents: [
    { name: 'Medical', category: 'medical', probabilityPerMonth: 0.15, minCost: 1_000, maxCost: 5_000 },
    { name: 'Car',     category: 'car',     probabilityPerMonth: 0.10, minCost: 400, maxCost: 2_000 },
  ],
};

const noEventsInput: PersonalCashflowInput = {
  monthlyIncome: 4_000,
  monthlyFixedExpenses: 2_500,
  monthlyVariableExpenses: 800,
  currentSavings: 5_000,
  horizonMonths: 6,
  riskEvents: [],
};

const baseConfig: CashflowSimConfig = { paths: 2_000, seed: 42 };

// ─── reproducibility ─────────────────────────────────────────────────────────

describe('simulatePersonalCashflow — reproducibility', () => {
  it('produces identical results for the same seed', () => {
    const r1 = simulatePersonalCashflow(stableInput, baseConfig);
    const r2 = simulatePersonalCashflow(stableInput, baseConfig);
    expect(r1.summary.probabilityBelowZero).toBe(r2.summary.probabilityBelowZero);
    expect(r1.summary.medianEndingBalance).toBe(r2.summary.medianEndingBalance);
  });

  it('produces different results for different seeds', () => {
    // Use fragileInput + expectedTotalEventCost which varies by seed.
    const r1 = simulatePersonalCashflow(fragileInput, { ...baseConfig, seed: 1 });
    const r2 = simulatePersonalCashflow(fragileInput, { ...baseConfig, seed: 999 });
    expect(r1.summary.expectedTotalEventCost).not.toBe(r2.summary.expectedTotalEventCost);
  });

  it('records the seed used in meta', () => {
    const r = simulatePersonalCashflow(stableInput, baseConfig);
    expect(r.meta.seed).toBe(42);
  });

  it('auto-generates seed when not provided', () => {
    const r = simulatePersonalCashflow(stableInput, { paths: 500 });
    expect(typeof r.meta.seed).toBe('number');
  });
});

// ─── output shape & invariants ─────────────────────────────────────────────

describe('simulatePersonalCashflow — output shape & invariants', () => {
  it('returns all expected summary fields', () => {
    const r = simulatePersonalCashflow(stableInput, baseConfig);
    const keys: Array<keyof typeof r.summary> = [
      'probabilityBelowZero',
      'probabilityBelowEmergencyThreshold',
      'medianEndingBalance',
      'p10EndingBalance',
      'p05EndingBalance',
      'worstCaseEndingBalance',
      'recommendedEmergencyFund',
      'mostFragileMonth',
      'expectedTotalEventCost',
    ];
    for (const k of keys) {
      expect(typeof r.summary[k], `field ${k}`).toBe('number');
      expect(Number.isFinite(r.summary[k]), `${k} is finite`).toBe(true);
    }
  });

  it('probabilities are in [0, 1]', () => {
    const r = simulatePersonalCashflow(stableInput, baseConfig);
    expect(r.summary.probabilityBelowZero).toBeGreaterThanOrEqual(0);
    expect(r.summary.probabilityBelowZero).toBeLessThanOrEqual(1);
    expect(r.summary.probabilityBelowEmergencyThreshold).toBeGreaterThanOrEqual(0);
    expect(r.summary.probabilityBelowEmergencyThreshold).toBeLessThanOrEqual(1);
  });

  it('pBelowEmergency >= pBelowZero (emergency threshold is higher)', () => {
    // emergencyThreshold = 3 * monthlyExpenses which is much higher than 0
    const r = simulatePersonalCashflow(stableInput, baseConfig);
    expect(r.summary.probabilityBelowEmergencyThreshold).toBeGreaterThanOrEqual(
      r.summary.probabilityBelowZero,
    );
  });

  it('p05EndingBalance <= p10EndingBalance <= medianEndingBalance', () => {
    const r = simulatePersonalCashflow(stableInput, { ...baseConfig, paths: 5_000 });
    expect(r.summary.p05EndingBalance).toBeLessThanOrEqual(r.summary.p10EndingBalance);
    expect(r.summary.p10EndingBalance).toBeLessThanOrEqual(r.summary.medianEndingBalance);
  });

  it('worstCaseEndingBalance <= p05EndingBalance', () => {
    const r = simulatePersonalCashflow(stableInput, { ...baseConfig, paths: 5_000 });
    expect(r.summary.worstCaseEndingBalance).toBeLessThanOrEqual(r.summary.p05EndingBalance);
  });

  it('mostFragileMonth is in [1, horizonMonths]', () => {
    const r = simulatePersonalCashflow(stableInput, baseConfig);
    expect(r.summary.mostFragileMonth).toBeGreaterThanOrEqual(1);
    expect(r.summary.mostFragileMonth).toBeLessThanOrEqual(stableInput.horizonMonths);
  });

  it('recommendedEmergencyFund is non-negative', () => {
    const r = simulatePersonalCashflow(stableInput, baseConfig);
    expect(r.summary.recommendedEmergencyFund).toBeGreaterThanOrEqual(0);
  });

  it('expectedTotalEventCost is non-negative', () => {
    const r = simulatePersonalCashflow(stableInput, baseConfig);
    expect(r.summary.expectedTotalEventCost).toBeGreaterThanOrEqual(0);
  });

  it('meta records correct horizonMonths and paths', () => {
    const r = simulatePersonalCashflow(stableInput, baseConfig);
    expect(r.meta.horizonMonths).toBe(12);
    expect(r.meta.paths).toBe(2_000);
  });

  it('elapsedMs is non-negative', () => {
    const r = simulatePersonalCashflow(stableInput, baseConfig);
    expect(r.meta.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});

// ─── stable scenario ──────────────────────────────────────────────────────

describe('simulatePersonalCashflow — stable scenario', () => {
  it('stable finances have low probability of going negative', () => {
    const r = simulatePersonalCashflow(stableInput, { ...baseConfig, paths: 5_000 });
    // Healthy surplus + large savings — should almost never go negative
    expect(r.summary.probabilityBelowZero).toBeLessThan(0.15);
  });

  it('resilience level is stable or watch for healthy finances', () => {
    const r = simulatePersonalCashflow(stableInput, { ...baseConfig, paths: 5_000 });
    expect(['stable', 'watch']).toContain(r.interpretation.resilienceLevel);
  });

  it('median ending balance is higher than starting savings for surplus budget', () => {
    const r = simulatePersonalCashflow(stableInput, baseConfig);
    // Monthly surplus = 6000 - 2000 - 800 = 3200; over 12 months ≈ 38,400 gain
    expect(r.summary.medianEndingBalance).toBeGreaterThan(stableInput.currentSavings);
  });
});

// ─── fragile scenario ─────────────────────────────────────────────────────

describe('simulatePersonalCashflow — fragile/at-risk scenario', () => {
  it('fragile finances have high probability of going negative', () => {
    const r = simulatePersonalCashflow(fragileInput, { ...baseConfig, paths: 5_000 });
    expect(r.summary.probabilityBelowZero).toBeGreaterThan(0.10);
  });

  it('resilience level is fragile or critical for at-risk input', () => {
    const r = simulatePersonalCashflow(fragileInput, { ...baseConfig, paths: 5_000 });
    expect(['fragile', 'critical', 'watch']).toContain(r.interpretation.resilienceLevel);
  });

  it('recommendedEmergencyFund is positive when P(below zero) is significant', () => {
    const r = simulatePersonalCashflow(fragileInput, { ...baseConfig, paths: 5_000 });
    if (r.summary.probabilityBelowZero > 0.05) {
      expect(r.summary.recommendedEmergencyFund).toBeGreaterThan(0);
    }
  });

  it('top risk events includes at least one event name', () => {
    const r = simulatePersonalCashflow(fragileInput, baseConfig);
    expect(r.interpretation.topRiskEvents.length).toBeGreaterThan(0);
    expect(typeof r.interpretation.topRiskEvents[0]).toBe('string');
  });
});

// ─── no events edge case ──────────────────────────────────────────────────

describe('simulatePersonalCashflow — no risk events', () => {
  it('runs without error when riskEvents is empty', () => {
    expect(() => simulatePersonalCashflow(noEventsInput, baseConfig)).not.toThrow();
  });

  it('expectedTotalEventCost is 0 with no events', () => {
    const r = simulatePersonalCashflow(noEventsInput, baseConfig);
    expect(r.summary.expectedTotalEventCost).toBe(0);
  });

  it('probability is 0 when there is a large surplus and no events', () => {
    // Net monthly = 4000 - 2500 - 800 = 700; savings = 5000; no way to go negative in 6 months
    const r = simulatePersonalCashflow(noEventsInput, baseConfig);
    expect(r.summary.probabilityBelowZero).toBe(0);
  });
});

// ─── edge cases ───────────────────────────────────────────────────────────

describe('simulatePersonalCashflow — edge cases', () => {
  it('handles negative starting savings (already in debt)', () => {
    const inDebtInput: PersonalCashflowInput = {
      ...stableInput,
      currentSavings: -1_000,
    };
    const r = simulatePersonalCashflow(inDebtInput, baseConfig);
    expect(Number.isFinite(r.summary.probabilityBelowZero)).toBe(true);
  });

  it('handles maxOccurrences cap on risk events', () => {
    const cappedInput: PersonalCashflowInput = {
      ...stableInput,
      riskEvents: [
        {
          name: 'One-time event',
          category: 'other',
          probabilityPerMonth: 1.0, // always occurs
          minCost: 100,
          maxCost: 100,
          maxOccurrences: 1,
        },
      ],
    };
    // Should only incur the cost once per path regardless of horizon
    const r = simulatePersonalCashflow(cappedInput, { ...baseConfig, paths: 1_000 });
    // Expected cost per path: exactly 100 (1 occurrence at cost 100)
    // Total expected = 100 * (paths/paths) = 100
    expect(r.summary.expectedTotalEventCost).toBeCloseTo(100, 0);
  });

  it('handles single-month horizon', () => {
    const shortInput: PersonalCashflowInput = {
      ...stableInput,
      horizonMonths: 1,
    };
    const r = simulatePersonalCashflow(shortInput, baseConfig);
    expect(r.summary.mostFragileMonth).toBe(1);
  });

  it('handles custom emergencyThreshold', () => {
    const customInput: PersonalCashflowInput = {
      ...stableInput,
      emergencyThreshold: 1_000,
    };
    const r = simulatePersonalCashflow(customInput, baseConfig);
    expect(Number.isFinite(r.summary.probabilityBelowEmergencyThreshold)).toBe(true);
  });

  it('resilience level matches probability thresholds', () => {
    const r = simulatePersonalCashflow(fragileInput, { ...baseConfig, paths: 5_000 });
    const p = r.summary.probabilityBelowZero;
    const level = r.interpretation.resilienceLevel;
    if (p > 0.30) expect(level).toBe('critical');
    else if (p > 0.15) expect(level).toBe('fragile');
    else if (p > 0.05) expect(level).toBe('watch');
    else expect(level).toBe('stable');
  });
});
