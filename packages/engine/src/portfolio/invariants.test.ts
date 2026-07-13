/**
 * Quantitative invariants for the portfolio engine.
 *
 * These encode relationships that must hold for ANY correct implementation,
 * independent of parameter choices — the audit-mandated guardrails against
 * silent quantitative regressions.
 */

import { describe, it, expect } from 'vitest';
import { simulatePortfolio } from './simulatePortfolio.js';
import type { PortfolioRiskInput, PortfolioSimConfig } from '@riskforge/domain';

const threeAssetInput: PortfolioRiskInput = {
  assets: [
    { name: 'US Stocks', weight: 0.6, mu: 0.08, sigma: 0.16 },
    { name: 'Bonds',     weight: 0.3, mu: 0.03, sigma: 0.06 },
    { name: 'Crypto',    weight: 0.1, mu: 0.15, sigma: 0.80 },
  ],
  corr: [
    [1, -0.1, 0.05],
    [-0.1, 1, -0.05],
    [0.05, -0.05, 1],
  ],
};

const baseConfig: PortfolioSimConfig = {
  paths: 20_000,
  horizonDays: 21,
  distribution: 'normal',
  seed: 1234,
};

describe('portfolio invariants — coherence of risk measures', () => {
  const r = simulatePortfolio(threeAssetInput, baseConfig);

  it('Expected Shortfall dominates VaR at the same confidence level', () => {
    expect(r.summary.expectedShortfall95).toBeGreaterThanOrEqual(r.summary.valueAtRisk95);
    expect(r.summary.expectedShortfall99).toBeGreaterThanOrEqual(r.summary.valueAtRisk99);
  });

  it('risk measures are monotone in the confidence level', () => {
    expect(r.summary.valueAtRisk99).toBeGreaterThanOrEqual(r.summary.valueAtRisk95);
    expect(r.summary.expectedShortfall99).toBeGreaterThanOrEqual(r.summary.expectedShortfall95);
  });

  it('drawdown probabilities are monotone in the threshold', () => {
    const s = r.summary;
    expect(s.probabilityDrawdownOver10).toBeGreaterThanOrEqual(s.probabilityDrawdownOver20);
    expect(s.probabilityDrawdownOver20).toBeGreaterThanOrEqual(s.probabilityDrawdownOver30);
    expect(s.probabilityDrawdownOver30).toBeGreaterThanOrEqual(s.probabilityDrawdownOver50);
  });
});

describe('portfolio invariants — Expected Shortfall attribution (Euler)', () => {
  const r = simulatePortfolio(threeAssetInput, baseConfig);

  it('component ES sums to portfolio ES at 95%', () => {
    const sum = r.attribution.componentExpectedShortfall95.reduce((a, b) => a + b, 0);
    const es = r.summary.expectedShortfall95;
    expect(Math.abs(sum - es) / es).toBeLessThan(0.02);
  });

  it('component ES sums to portfolio ES at 99%', () => {
    const sum = r.attribution.componentExpectedShortfall99.reduce((a, b) => a + b, 0);
    const es = r.summary.expectedShortfall99;
    // 99% tail holds only ~200 of 20k paths — allow wider sampling tolerance.
    expect(Math.abs(sum - es) / es).toBeLessThan(0.05);
  });

  it('percent contributions sum to 1', () => {
    const sum95 = r.attribution.expectedShortfallContributions95.reduce((a, b) => a + b, 0);
    const sum99 = r.attribution.expectedShortfallContributions99.reduce((a, b) => a + b, 0);
    expect(sum95).toBeCloseTo(1, 6);
    expect(sum99).toBeCloseTo(1, 6);
  });

  it('marginal ES equals component ES divided by weight', () => {
    for (let i = 0; i < threeAssetInput.assets.length; i++) {
      const w = threeAssetInput.assets[i]!.weight;
      const ces = r.attribution.componentExpectedShortfall95[i]!;
      const mes = r.attribution.marginalExpectedShortfall95[i]!;
      expect(mes).toBeCloseTo(ces / w, 10);
    }
  });

  it('is reproducible under a fixed seed', () => {
    const r2 = simulatePortfolio(threeAssetInput, baseConfig);
    expect(r2.attribution.componentExpectedShortfall95).toEqual(
      r.attribution.componentExpectedShortfall95,
    );
    expect(r2.summary.expectedShortfall95).toBe(r.summary.expectedShortfall95);
  });
});

describe('portfolio invariants — stress must actually stress', () => {
  it('volatility + correlation stress increases tail risk at a fixed seed', () => {
    const baseline = simulatePortfolio(threeAssetInput, baseConfig);
    const stressed = simulatePortfolio(threeAssetInput, {
      ...baseConfig,
      stress: { volMultiplier: 3, corrTarget: 0.9, corrBlend: 1 },
    });

    expect(baseline.meta.stressed).toBe(false);
    expect(stressed.meta.stressed).toBe(true);

    // 3× volatility with crisis correlation must produce materially worse tails.
    expect(stressed.summary.valueAtRisk95).toBeGreaterThan(baseline.summary.valueAtRisk95 * 1.5);
    expect(stressed.summary.expectedShortfall95).toBeGreaterThan(
      baseline.summary.expectedShortfall95 * 1.5,
    );
    expect(stressed.summary.annualizedVolatility).toBeGreaterThan(
      baseline.summary.annualizedVolatility * 1.5,
    );
  });

  it('an empty stress object changes nothing but the stressed flag', () => {
    const baseline = simulatePortfolio(threeAssetInput, baseConfig);
    const emptyStress = simulatePortfolio(threeAssetInput, { ...baseConfig, stress: {} });
    // This documents the silent-stripping failure mode: if a client sends
    // wrong stress field names, Zod reduces stress to {} and the run is
    // reported "stressed" while being numerically identical to baseline.
    expect(emptyStress.meta.stressed).toBe(true);
    expect(emptyStress.summary.valueAtRisk95).toBe(baseline.summary.valueAtRisk95);
  });
});

describe('portfolio invariants — diversification limits', () => {
  it('near-perfectly correlated identical assets provide no diversification benefit', () => {
    const twins: PortfolioRiskInput = {
      assets: [
        { name: 'A', weight: 0.5, mu: 0.07, sigma: 0.2 },
        { name: 'B', weight: 0.5, mu: 0.07, sigma: 0.2 },
      ],
      corr: [
        [1, 0.9999],
        [0.9999, 1],
      ],
    };
    const r = simulatePortfolio(twins, baseConfig);
    expect(Math.abs(r.attribution.diversificationBenefit95)).toBeLessThan(0.02);
  });

  it('annualized volatility recovers the input sigma for a single GBM asset', () => {
    // Log total returns over 1y have std = sigma exactly under GBM, so the
    // reported annualized volatility must land on the input, not explode
    // with the lognormal right tail of simple returns.
    const single: PortfolioRiskInput = {
      assets: [{ name: 'Equity', weight: 1, mu: 0.07, sigma: 0.2 }],
      corr: [[1]],
    };
    const r = simulatePortfolio(single, { ...baseConfig, horizonDays: 252 });
    expect(r.summary.annualizedVolatility).toBeGreaterThan(0.18);
    expect(r.summary.annualizedVolatility).toBeLessThan(0.22);
  });

  it('a near-zero-volatility (cash-like) portfolio has near-zero risk', () => {
    const cash: PortfolioRiskInput = {
      assets: [{ name: 'Cash', weight: 1, mu: 0.04, sigma: 0.001 }],
      corr: [[1]],
    };
    const r = simulatePortfolio(cash, { ...baseConfig, horizonDays: 252 });
    // With a positive drift and ~0 vol, the 5th-percentile outcome is a gain,
    // so VaR is at or below zero; drawdowns are negligible.
    expect(r.summary.valueAtRisk95).toBeLessThan(0.005);
    expect(r.summary.medianMaxDrawdown).toBeLessThan(0.01);
  });
});
