import { describe, it, expect } from 'vitest';
import {
  PortfolioAssetSchema,
  PortfolioSimConfigSchema,
  PortfolioRiskInputSchema,
  PortfolioSimulationRequestSchema,
} from './schemas.js';

// ─── PortfolioAssetSchema ────────────────────────────────────────────────────

describe('PortfolioAssetSchema', () => {
  const valid = { name: 'US Stocks', weight: 0.6, mu: 0.08, sigma: 0.16 };

  it('accepts a valid asset', () => {
    expect(PortfolioAssetSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional fields (symbol, assetClass)', () => {
    const r = PortfolioAssetSchema.safeParse({ ...valid, symbol: 'VTI', assetClass: 'stock' });
    expect(r.success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(PortfolioAssetSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  it('rejects weight = 0 (must be > 0)', () => {
    expect(PortfolioAssetSchema.safeParse({ ...valid, weight: 0 }).success).toBe(false);
  });

  it('rejects weight > 1', () => {
    expect(PortfolioAssetSchema.safeParse({ ...valid, weight: 1.1 }).success).toBe(false);
  });

  it('allows weight = 1 exactly', () => {
    expect(PortfolioAssetSchema.safeParse({ ...valid, weight: 1 }).success).toBe(true);
  });

  it('rejects sigma = 0 (must be > 0)', () => {
    expect(PortfolioAssetSchema.safeParse({ ...valid, sigma: 0 }).success).toBe(false);
  });

  it('rejects sigma > 10', () => {
    expect(PortfolioAssetSchema.safeParse({ ...valid, sigma: 11 }).success).toBe(false);
  });

  it('rejects mu < -1', () => {
    expect(PortfolioAssetSchema.safeParse({ ...valid, mu: -1.5 }).success).toBe(false);
  });

  it('rejects invalid assetClass value', () => {
    expect(PortfolioAssetSchema.safeParse({ ...valid, assetClass: 'meme' }).success).toBe(false);
  });

  it('accepts all valid assetClass values', () => {
    const classes = ['stock', 'bond', 'crypto', 'commodity', 'reit', 'cash', 'custom'] as const;
    for (const cls of classes) {
      expect(PortfolioAssetSchema.safeParse({ ...valid, assetClass: cls }).success).toBe(true);
    }
  });
});

// ─── PortfolioSimConfigSchema ────────────────────────────────────────────────

describe('PortfolioSimConfigSchema', () => {
  const valid = { paths: 5_000, horizonDays: 252, distribution: 'normal' as const };

  it('accepts a valid normal config', () => {
    expect(PortfolioSimConfigSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts student_t with df', () => {
    const r = PortfolioSimConfigSchema.safeParse({ ...valid, distribution: 'student_t', df: 5 });
    expect(r.success).toBe(true);
  });

  it('rejects paths < 1000', () => {
    expect(PortfolioSimConfigSchema.safeParse({ ...valid, paths: 999 }).success).toBe(false);
  });

  it('rejects paths > 5_000_000', () => {
    expect(PortfolioSimConfigSchema.safeParse({ ...valid, paths: 5_000_001 }).success).toBe(false);
  });

  it('accepts paths = 1000 (boundary)', () => {
    expect(PortfolioSimConfigSchema.safeParse({ ...valid, paths: 1_000 }).success).toBe(true);
  });

  it('accepts paths = 5_000_000 (boundary)', () => {
    expect(PortfolioSimConfigSchema.safeParse({ ...valid, paths: 5_000_000 }).success).toBe(true);
  });

  it('rejects horizonDays < 1', () => {
    expect(PortfolioSimConfigSchema.safeParse({ ...valid, horizonDays: 0 }).success).toBe(false);
  });

  it('rejects horizonDays > 5000', () => {
    expect(PortfolioSimConfigSchema.safeParse({ ...valid, horizonDays: 5_001 }).success).toBe(false);
  });

  it('rejects df < 3 for student_t', () => {
    expect(PortfolioSimConfigSchema.safeParse({ ...valid, distribution: 'student_t', df: 2 }).success).toBe(false);
  });

  it('rejects unknown distribution type', () => {
    expect(PortfolioSimConfigSchema.safeParse({ ...valid, distribution: 'laplace' }).success).toBe(false);
  });

  it('accepts seed as optional', () => {
    expect(PortfolioSimConfigSchema.safeParse({ ...valid, seed: 42 }).success).toBe(true);
    expect(PortfolioSimConfigSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts stress config', () => {
    const r = PortfolioSimConfigSchema.safeParse({
      ...valid,
      stress: { volMultiplier: 1.5, corrTarget: 0.8, corrBlend: 0.5 },
    });
    expect(r.success).toBe(true);
  });
});

// ─── PortfolioRiskInputSchema ────────────────────────────────────────────────

describe('PortfolioRiskInputSchema', () => {
  const validTwoAsset = {
    assets: [
      { name: 'Stocks', weight: 0.6, mu: 0.08, sigma: 0.16 },
      { name: 'Bonds',  weight: 0.4, mu: 0.03, sigma: 0.06 },
    ],
    corr: [[1, -0.1], [-0.1, 1]],
  };

  it('accepts a valid 2-asset input', () => {
    expect(PortfolioRiskInputSchema.safeParse(validTwoAsset).success).toBe(true);
  });

  it('rejects when weights do not sum to 1', () => {
    const bad = {
      ...validTwoAsset,
      assets: [
        { name: 'A', weight: 0.5, mu: 0.08, sigma: 0.16 },
        { name: 'B', weight: 0.3, mu: 0.03, sigma: 0.06 },
      ],
    };
    expect(PortfolioRiskInputSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts weights that sum to 1 within tolerance (1e-5)', () => {
    const nearOne = {
      assets: [
        { name: 'A', weight: 0.333334, mu: 0.05, sigma: 0.10 },
        { name: 'B', weight: 0.333333, mu: 0.05, sigma: 0.10 },
        { name: 'C', weight: 0.333333, mu: 0.05, sigma: 0.10 },
      ],
      corr: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    };
    expect(PortfolioRiskInputSchema.safeParse(nearOne).success).toBe(true);
  });

  it('rejects corr matrix with wrong row count', () => {
    const bad = { ...validTwoAsset, corr: [[1]] }; // 1 row for 2 assets
    expect(PortfolioRiskInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects corr matrix with wrong column count', () => {
    const bad = { ...validTwoAsset, corr: [[1, -0.1, 0], [-0.1, 1, 0]] }; // 3 cols for 2 assets
    expect(PortfolioRiskInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects diagonal entry != 1', () => {
    const bad = { ...validTwoAsset, corr: [[0.9, -0.1], [-0.1, 1]] };
    expect(PortfolioRiskInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects corr entry outside [-1, 1]', () => {
    const bad = { ...validTwoAsset, corr: [[1, 1.5], [1.5, 1]] };
    expect(PortfolioRiskInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects empty asset array', () => {
    const bad = { assets: [], corr: [] };
    expect(PortfolioRiskInputSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts single asset with 1x1 corr matrix', () => {
    const single = {
      assets: [{ name: 'X', weight: 1.0, mu: 0.05, sigma: 0.15 }],
      corr: [[1]],
    };
    expect(PortfolioRiskInputSchema.safeParse(single).success).toBe(true);
  });
});

// ─── PortfolioSimulationRequestSchema ────────────────────────────────────────

describe('PortfolioSimulationRequestSchema', () => {
  const validRequest = {
    kind: 'portfolio_risk',
    input: {
      assets: [
        { name: 'A', weight: 0.5, mu: 0.08, sigma: 0.15 },
        { name: 'B', weight: 0.5, mu: 0.04, sigma: 0.08 },
      ],
      corr: [[1, 0.2], [0.2, 1]],
    },
    config: { paths: 2_000, horizonDays: 252, distribution: 'normal' },
  };

  it('accepts a valid request', () => {
    expect(PortfolioSimulationRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it('rejects wrong kind', () => {
    expect(PortfolioSimulationRequestSchema.safeParse({
      ...validRequest,
      kind: 'personal_cashflow_risk',
    }).success).toBe(false);
  });

  it('rejects missing kind', () => {
    const { kind: _, ...noKind } = validRequest;
    expect(PortfolioSimulationRequestSchema.safeParse(noKind).success).toBe(false);
  });
});
