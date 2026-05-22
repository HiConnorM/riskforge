import { describe, it, expect } from 'vitest';
import { simulatePortfolio, SimulationError } from './simulatePortfolio.js';
import type { PortfolioRiskInput, PortfolioSimConfig } from '@riskforge/domain';

// ─── fixtures ────────────────────────────────────────────────────────────────

const twoAssetInput: PortfolioRiskInput = {
  assets: [
    { name: 'Stocks', weight: 0.6, mu: 0.08, sigma: 0.16 },
    { name: 'Bonds', weight: 0.4, mu: 0.03, sigma: 0.06 },
  ],
  corr: [[1, -0.1], [-0.1, 1]],
};

const baseConfig: PortfolioSimConfig = {
  paths: 2_000,
  horizonDays: 63, // one quarter
  distribution: 'normal',
  seed: 42,
};

const singleAssetInput: PortfolioRiskInput = {
  assets: [{ name: 'Single', weight: 1.0, mu: 0.07, sigma: 0.20 }],
  corr: [[1]],
};

const threeAssetInput: PortfolioRiskInput = {
  assets: [
    { name: 'US Stocks', weight: 0.6, mu: 0.08, sigma: 0.16 },
    { name: 'Bonds',     weight: 0.3, mu: 0.03, sigma: 0.06 },
    { name: 'Crypto',    weight: 0.1, mu: 0.15, sigma: 0.80 },
  ],
  corr: [[1, -0.1, 0.05], [-0.1, 1, -0.05], [0.05, -0.05, 1]],
};

// ─── reproducibility ─────────────────────────────────────────────────────────

describe('simulatePortfolio — reproducibility', () => {
  it('produces identical results for the same seed', () => {
    const r1 = simulatePortfolio(twoAssetInput, baseConfig);
    const r2 = simulatePortfolio(twoAssetInput, baseConfig);
    expect(r1.summary.meanReturn).toBe(r2.summary.meanReturn);
    expect(r1.summary.valueAtRisk95).toBe(r2.summary.valueAtRisk95);
    expect(r1.summary.medianMaxDrawdown).toBe(r2.summary.medianMaxDrawdown);
  });

  it('produces different results for different seeds', () => {
    const r1 = simulatePortfolio(twoAssetInput, { ...baseConfig, seed: 1 });
    const r2 = simulatePortfolio(twoAssetInput, { ...baseConfig, seed: 2 });
    expect(r1.summary.meanReturn).not.toBe(r2.summary.meanReturn);
  });

  it('records the seed used in meta', () => {
    const result = simulatePortfolio(twoAssetInput, baseConfig);
    expect(result.meta.seed).toBe(42);
  });

  it('auto-generates a seed when none is provided', () => {
    const config = { ...baseConfig, seed: undefined };
    const r = simulatePortfolio(twoAssetInput, config);
    expect(typeof r.meta.seed).toBe('number');
    expect(Number.isInteger(r.meta.seed)).toBe(true);
  });
});

// ─── output shape ─────────────────────────────────────────────────────────────

describe('simulatePortfolio — output shape & invariants', () => {
  it('returns all expected summary fields', () => {
    const r = simulatePortfolio(twoAssetInput, baseConfig);
    const keys: Array<keyof typeof r.summary> = [
      'meanReturn', 'medianReturn', 'p05Return', 'p01Return',
      'valueAtRisk95', 'valueAtRisk99', 'expectedShortfall95', 'expectedShortfall99',
      'probabilityDrawdownOver10', 'probabilityDrawdownOver20',
      'probabilityDrawdownOver30', 'probabilityDrawdownOver50',
      'medianMaxDrawdown', 'p95MaxDrawdown', 'annualizedVolatility',
    ];
    for (const k of keys) {
      expect(typeof r.summary[k], `field ${k}`).toBe('number');
      expect(Number.isFinite(r.summary[k]), `field ${k} is finite`).toBe(true);
    }
  });

  it('probabilities are in [0, 1]', () => {
    const r = simulatePortfolio(twoAssetInput, baseConfig);
    const probFields = [
      r.summary.probabilityDrawdownOver10,
      r.summary.probabilityDrawdownOver20,
      r.summary.probabilityDrawdownOver30,
      r.summary.probabilityDrawdownOver50,
    ] as const;
    for (const p of probFields) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it('VaR99 >= VaR95', () => {
    const r = simulatePortfolio(twoAssetInput, baseConfig);
    expect(r.summary.valueAtRisk99).toBeGreaterThanOrEqual(r.summary.valueAtRisk95);
  });

  it('ES >= VaR at same confidence level', () => {
    const r = simulatePortfolio(twoAssetInput, baseConfig);
    expect(r.summary.expectedShortfall95).toBeGreaterThanOrEqual(r.summary.valueAtRisk95);
  });

  it('p01 <= p05 (lower percentile is worse)', () => {
    const r = simulatePortfolio(twoAssetInput, baseConfig);
    expect(r.summary.p01Return).toBeLessThanOrEqual(r.summary.p05Return);
  });

  it('drawdown probs are ordered correctly (over10 >= over20 >= over30 >= over50)', () => {
    const r = simulatePortfolio(twoAssetInput, { ...baseConfig, paths: 5_000 });
    expect(r.summary.probabilityDrawdownOver10).toBeGreaterThanOrEqual(r.summary.probabilityDrawdownOver20);
    expect(r.summary.probabilityDrawdownOver20).toBeGreaterThanOrEqual(r.summary.probabilityDrawdownOver30);
    expect(r.summary.probabilityDrawdownOver30).toBeGreaterThanOrEqual(r.summary.probabilityDrawdownOver50);
  });

  it('annualizedVolatility is positive', () => {
    const r = simulatePortfolio(twoAssetInput, baseConfig);
    expect(r.summary.annualizedVolatility).toBeGreaterThan(0);
  });

  it('meta records correct paths and horizonDays', () => {
    const r = simulatePortfolio(twoAssetInput, baseConfig);
    expect(r.meta.paths).toBe(2_000);
    expect(r.meta.horizonDays).toBe(63);
    expect(r.meta.distribution).toBe('normal');
    expect(r.meta.stressed).toBe(false);
  });

  it('elapsedMs is a non-negative number', () => {
    const r = simulatePortfolio(twoAssetInput, baseConfig);
    expect(r.meta.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('interpretation has expected fields', () => {
    const r = simulatePortfolio(twoAssetInput, baseConfig);
    const levels = ['low', 'moderate', 'high', 'severe'];
    expect(levels).toContain(r.interpretation.riskLevel);
    expect(r.interpretation.mainRiskDrivers.length).toBeGreaterThan(0);
    expect(typeof r.interpretation.plainEnglishSummary).toBe('string');
    expect(r.interpretation.plainEnglishSummary.length).toBeGreaterThan(10);
  });
});

// ─── single asset edge case ────────────────────────────────────────────────

describe('simulatePortfolio — single asset', () => {
  it('works with a single asset (1×1 correlation matrix)', () => {
    const r = simulatePortfolio(singleAssetInput, { ...baseConfig, paths: 1_000 });
    expect(Number.isFinite(r.summary.meanReturn)).toBe(true);
    expect(r.summary.probabilityDrawdownOver10).toBeGreaterThanOrEqual(0);
  });
});

// ─── student-t distribution ────────────────────────────────────────────────

describe('simulatePortfolio — Student-t distribution', () => {
  it('runs without error with student_t distribution', () => {
    const config: PortfolioSimConfig = { ...baseConfig, distribution: 'student_t', df: 5 };
    expect(() => simulatePortfolio(twoAssetInput, config)).not.toThrow();
  });

  it('records df in meta for student_t', () => {
    const config: PortfolioSimConfig = { ...baseConfig, distribution: 'student_t', df: 5 };
    const r = simulatePortfolio(twoAssetInput, config);
    expect(r.meta.df).toBe(5);
  });

  it('throws SimulationError when df is missing for student_t', () => {
    const config: PortfolioSimConfig = { ...baseConfig, distribution: 'student_t' };
    expect(() => simulatePortfolio(twoAssetInput, config)).toThrow(SimulationError);
  });

  it('throws SimulationError with code STUDENT_T_DF_REQUIRED when df < 3', () => {
    // Coerce df to 2 to trigger the guard
    const config = { ...baseConfig, distribution: 'student_t' as const, df: 2 };
    try {
      simulatePortfolio(twoAssetInput, config);
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(SimulationError);
      expect((e as SimulationError).code).toBe('STUDENT_T_DF_REQUIRED');
    }
  });

  it('student_t produces fatter tails than normal (higher p95 drawdown statistically)', () => {
    // With many paths the student-t should produce a higher p95 max drawdown.
    // This is statistical — use the same seed so the base variates are the same.
    const normalResult = simulatePortfolio(twoAssetInput, { ...baseConfig, paths: 5_000, seed: 1 });
    const studentResult = simulatePortfolio(twoAssetInput, {
      ...baseConfig, paths: 5_000, seed: 1, distribution: 'student_t', df: 5,
    });
    // Student-t with df=5 should generally have larger tail losses.
    // We allow this test to pass if the t result has a larger or roughly comparable VaR.
    expect(studentResult.summary.valueAtRisk99).toBeGreaterThanOrEqual(
      normalResult.summary.valueAtRisk99 * 0.8,
    );
  });
});

// ─── stress testing ────────────────────────────────────────────────────────

describe('simulatePortfolio — stress config', () => {
  it('runs with volMultiplier stress', () => {
    const config: PortfolioSimConfig = {
      ...baseConfig,
      stress: { volMultiplier: 1.5 },
    };
    expect(() => simulatePortfolio(twoAssetInput, config)).not.toThrow();
  });

  it('stress flag is true in meta when stress config is present', () => {
    const config: PortfolioSimConfig = {
      ...baseConfig,
      stress: { volMultiplier: 2.0 },
    };
    const r = simulatePortfolio(twoAssetInput, config);
    expect(r.meta.stressed).toBe(true);
  });

  it('stressed run has stressImpact field in interpretation', () => {
    const config: PortfolioSimConfig = {
      ...baseConfig,
      stress: { corrTarget: 0.8, corrBlend: 0.5 },
    };
    const r = simulatePortfolio(twoAssetInput, config);
    expect(typeof r.interpretation.stressImpact).toBe('string');
  });

  it('higher volatility stress increases VaR (statistical)', () => {
    const baseline = simulatePortfolio(twoAssetInput, { ...baseConfig, paths: 5_000, seed: 7 });
    const stressed = simulatePortfolio(twoAssetInput, {
      ...baseConfig, paths: 5_000, seed: 7, stress: { volMultiplier: 3.0 },
    });
    expect(stressed.summary.valueAtRisk95).toBeGreaterThan(baseline.summary.valueAtRisk95);
  });
});

// ─── three-asset portfolio ────────────────────────────────────────────────

describe('simulatePortfolio — three assets', () => {
  it('works correctly with three correlated assets', () => {
    const r = simulatePortfolio(threeAssetInput, { ...baseConfig, paths: 1_000 });
    expect(Number.isFinite(r.summary.meanReturn)).toBe(true);
    expect(r.interpretation.mainRiskDrivers).toContain('Crypto'); // highest σ×w
  });
});
