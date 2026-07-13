/**
 * Quantitative invariants for the personal-cashflow engine.
 *
 * Guards the two audit findings:
 *   1. recommendedEmergencyFund must cover intra-horizon dips (per-path
 *      minimum balance), not just the ending balance.
 *   2. incomeShockImpact must measure ONLY income lost to shocks — not be
 *      confounded with risk-event costs.
 */

import { describe, it, expect } from 'vitest';
import { simulatePersonalCashflow } from './simulateCashflow.js';
import type { PersonalCashflowInput, CashflowSimConfig } from '@riskforge/domain';

const config: CashflowSimConfig = { paths: 20_000, seed: 777 };

describe('cashflow invariants — emergency fund', () => {
  it('covers intra-horizon dips even when paths recover by the end', () => {
    // Nearly-certain $5,000 hit early on, thin $1,000 starting buffer, but a
    // +$500/month surplus: paths dip to ≈ -$3,500 and recover to ≈ +$8,000.
    const input: PersonalCashflowInput = {
      monthlyIncome: 3_000,
      monthlyFixedExpenses: 1_500,
      monthlyVariableExpenses: 1_000,
      currentSavings: 1_000,
      horizonMonths: 24,
      riskEvents: [
        {
          name: 'Major repair',
          category: 'housing',
          probabilityPerMonth: 0.99,
          minCost: 5_000,
          maxCost: 5_000,
          maxOccurrences: 1,
        },
      ],
    };

    const r = simulatePersonalCashflow(input, config);

    // Ending balances look healthy…
    expect(r.summary.p05EndingBalance).toBeGreaterThan(0);
    // …but the recommendation must still cover the mid-horizon dip.
    expect(r.summary.recommendedEmergencyFund).toBeGreaterThan(2_000);
  });

  it('is never negative', () => {
    const input: PersonalCashflowInput = {
      monthlyIncome: 10_000,
      monthlyFixedExpenses: 2_000,
      monthlyVariableExpenses: 1_000,
      currentSavings: 100_000,
      horizonMonths: 12,
      riskEvents: [],
    };
    const r = simulatePersonalCashflow(input, config);
    expect(r.summary.recommendedEmergencyFund).toBeGreaterThanOrEqual(0);
    expect(r.summary.recommendedEmergencyFund).toBe(0);
  });
});

describe('cashflow invariants — income shock impact isolation', () => {
  const shockOnly: PersonalCashflowInput = {
    monthlyIncome: 5_000,
    monthlyFixedExpenses: 2_000,
    monthlyVariableExpenses: 1_000,
    currentSavings: 20_000,
    horizonMonths: 24,
    riskEvents: [],
    incomeShocks: [
      {
        name: 'Job loss',
        probabilityPerYear: 1,
        incomeFractionLost: 1,
        durationMonthsMin: 3,
        durationMonthsMax: 3,
      },
    ],
  };

  it('is reported when shocks are configured, absent otherwise', () => {
    const withShocks = simulatePersonalCashflow(shockOnly, config);
    expect(withShocks.summary.incomeShockImpact).toBeDefined();
    expect(withShocks.summary.incomeShockImpact!).toBeGreaterThan(0);

    const noShocks = simulatePersonalCashflow(
      { ...shockOnly, incomeShocks: undefined },
      config,
    );
    expect(noShocks.summary.incomeShockImpact).toBeUndefined();
  });

  it('is not inflated by risk-event costs', () => {
    const a = simulatePersonalCashflow(shockOnly, config);

    const withNoisyEvents: PersonalCashflowInput = {
      ...shockOnly,
      riskEvents: [
        {
          name: 'Car trouble',
          category: 'car',
          probabilityPerMonth: 0.5,
          minCost: 500,
          maxCost: 3_000,
        },
      ],
    };
    const b = simulatePersonalCashflow(withNoisyEvents, config);

    // Expected event spend here is ≈ $21k over the horizon. Before the fix,
    // incomeShockImpact absorbed all of it; now the two runs must agree on
    // the shock-only loss up to Monte Carlo noise.
    const impactA = a.summary.incomeShockImpact!;
    const impactB = b.summary.incomeShockImpact!;
    expect(b.summary.expectedTotalEventCost).toBeGreaterThan(10_000);
    expect(Math.abs(impactB - impactA) / impactA).toBeLessThan(0.15);
  });

  it('shock loss is bounded by total income at full loss fraction', () => {
    const r = simulatePersonalCashflow(shockOnly, config);
    const maxPossible = shockOnly.monthlyIncome * shockOnly.horizonMonths;
    expect(r.summary.incomeShockImpact!).toBeLessThan(maxPossible);
  });
});
