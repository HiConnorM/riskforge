import { describe, it, expect } from 'vitest';
import {
  RiskEventSchema,
  PersonalCashflowInputSchema,
  CashflowSimConfigSchema,
  PersonalSimulationRequestSchema,
} from './schemas.js';

// ─── RiskEventSchema ─────────────────────────────────────────────────────────

describe('RiskEventSchema', () => {
  const valid = {
    name: 'Car repair',
    category: 'car' as const,
    probabilityPerMonth: 0.06,
    minCost: 600,
    maxCost: 2_000,
  };

  it('accepts a valid risk event', () => {
    expect(RiskEventSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts all valid category values', () => {
    const categories = ['car', 'pet', 'medical', 'housing', 'food', 'shopping',
      'job', 'family', 'utility', 'appliance', 'other'] as const;
    for (const category of categories) {
      expect(RiskEventSchema.safeParse({ ...valid, category }).success).toBe(true);
    }
  });

  it('rejects invalid category', () => {
    expect(RiskEventSchema.safeParse({ ...valid, category: 'volcano' }).success).toBe(false);
  });

  it('rejects probabilityPerMonth = 0 (must be > 0)', () => {
    expect(RiskEventSchema.safeParse({ ...valid, probabilityPerMonth: 0 }).success).toBe(false);
  });

  it('rejects probabilityPerMonth > 1', () => {
    expect(RiskEventSchema.safeParse({ ...valid, probabilityPerMonth: 1.1 }).success).toBe(false);
  });

  it('accepts probabilityPerMonth = 1 (certain each month)', () => {
    expect(RiskEventSchema.safeParse({ ...valid, probabilityPerMonth: 1 }).success).toBe(true);
  });

  it('rejects maxCost < minCost', () => {
    expect(RiskEventSchema.safeParse({ ...valid, minCost: 1_000, maxCost: 500 }).success).toBe(false);
  });

  it('accepts maxCost = minCost (fixed cost event)', () => {
    expect(RiskEventSchema.safeParse({ ...valid, minCost: 500, maxCost: 500 }).success).toBe(true);
  });

  it('rejects minCost < 0', () => {
    expect(RiskEventSchema.safeParse({ ...valid, minCost: -1 }).success).toBe(false);
  });

  it('rejects maxCost = 0 (must be > 0)', () => {
    expect(RiskEventSchema.safeParse({ ...valid, minCost: 0, maxCost: 0 }).success).toBe(false);
  });

  it('accepts optional maxOccurrences', () => {
    expect(RiskEventSchema.safeParse({ ...valid, maxOccurrences: 2 }).success).toBe(true);
  });

  it('rejects maxOccurrences < 1', () => {
    expect(RiskEventSchema.safeParse({ ...valid, maxOccurrences: 0 }).success).toBe(false);
  });

  it('rejects empty name', () => {
    expect(RiskEventSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });
});

// ─── PersonalCashflowInputSchema ─────────────────────────────────────────────

describe('PersonalCashflowInputSchema', () => {
  const valid = {
    monthlyIncome: 4_200,
    monthlyFixedExpenses: 2_600,
    monthlyVariableExpenses: 700,
    currentSavings: 1_500,
    horizonMonths: 12,
    riskEvents: [
      { name: 'Car repair', category: 'car', probabilityPerMonth: 0.06, minCost: 600, maxCost: 2_000 },
    ],
  };

  it('accepts a valid cashflow input', () => {
    expect(PersonalCashflowInputSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts negative currentSavings (already in debt)', () => {
    expect(PersonalCashflowInputSchema.safeParse({ ...valid, currentSavings: -500 }).success).toBe(true);
  });

  it('accepts empty riskEvents array', () => {
    expect(PersonalCashflowInputSchema.safeParse({ ...valid, riskEvents: [] }).success).toBe(true);
  });

  it('rejects horizonMonths < 1', () => {
    expect(PersonalCashflowInputSchema.safeParse({ ...valid, horizonMonths: 0 }).success).toBe(false);
  });

  it('rejects horizonMonths > 60', () => {
    expect(PersonalCashflowInputSchema.safeParse({ ...valid, horizonMonths: 61 }).success).toBe(false);
  });

  it('accepts horizonMonths = 1 (boundary)', () => {
    expect(PersonalCashflowInputSchema.safeParse({ ...valid, horizonMonths: 1 }).success).toBe(true);
  });

  it('accepts horizonMonths = 60 (boundary)', () => {
    expect(PersonalCashflowInputSchema.safeParse({ ...valid, horizonMonths: 60 }).success).toBe(true);
  });

  it('rejects monthlyIncome < 0', () => {
    expect(PersonalCashflowInputSchema.safeParse({ ...valid, monthlyIncome: -1 }).success).toBe(false);
  });

  it('rejects monthlyFixedExpenses < 0', () => {
    expect(PersonalCashflowInputSchema.safeParse({ ...valid, monthlyFixedExpenses: -100 }).success).toBe(false);
  });

  it('rejects more than 20 risk events', () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => ({
      name: `Event ${i}`,
      category: 'other' as const,
      probabilityPerMonth: 0.01,
      minCost: 100,
      maxCost: 500,
    }));
    expect(PersonalCashflowInputSchema.safeParse({ ...valid, riskEvents: tooMany }).success).toBe(false);
  });

  it('accepts exactly 20 risk events (boundary)', () => {
    const twenty = Array.from({ length: 20 }, (_, i) => ({
      name: `Event ${i}`,
      category: 'other' as const,
      probabilityPerMonth: 0.01,
      minCost: 100,
      maxCost: 500,
    }));
    expect(PersonalCashflowInputSchema.safeParse({ ...valid, riskEvents: twenty }).success).toBe(true);
  });

  it('accepts optional emergencyThreshold', () => {
    expect(PersonalCashflowInputSchema.safeParse({ ...valid, emergencyThreshold: 5_000 }).success).toBe(true);
  });

  it('rejects emergencyThreshold < 0', () => {
    expect(PersonalCashflowInputSchema.safeParse({ ...valid, emergencyThreshold: -1 }).success).toBe(false);
  });
});

// ─── CashflowSimConfigSchema ─────────────────────────────────────────────────

describe('CashflowSimConfigSchema', () => {
  it('accepts valid config with seed', () => {
    expect(CashflowSimConfigSchema.safeParse({ paths: 5_000, seed: 42 }).success).toBe(true);
  });

  it('accepts config without seed', () => {
    expect(CashflowSimConfigSchema.safeParse({ paths: 5_000 }).success).toBe(true);
  });

  it('rejects paths < 1000', () => {
    expect(CashflowSimConfigSchema.safeParse({ paths: 999 }).success).toBe(false);
  });

  it('rejects paths > 100_000', () => {
    expect(CashflowSimConfigSchema.safeParse({ paths: 100_001 }).success).toBe(false);
  });

  it('accepts paths = 1000 (boundary)', () => {
    expect(CashflowSimConfigSchema.safeParse({ paths: 1_000 }).success).toBe(true);
  });

  it('accepts paths = 100_000 (boundary)', () => {
    expect(CashflowSimConfigSchema.safeParse({ paths: 100_000 }).success).toBe(true);
  });

  it('rejects non-integer paths', () => {
    expect(CashflowSimConfigSchema.safeParse({ paths: 1000.5 }).success).toBe(false);
  });
});

// ─── PersonalSimulationRequestSchema ─────────────────────────────────────────

describe('PersonalSimulationRequestSchema', () => {
  const validRequest = {
    kind: 'personal_cashflow_risk',
    input: {
      monthlyIncome: 4_200,
      monthlyFixedExpenses: 2_600,
      monthlyVariableExpenses: 700,
      currentSavings: 1_500,
      horizonMonths: 12,
      riskEvents: [],
    },
    config: { paths: 5_000, seed: 42 },
  };

  it('accepts a valid request', () => {
    expect(PersonalSimulationRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it('rejects wrong kind', () => {
    expect(PersonalSimulationRequestSchema.safeParse({
      ...validRequest,
      kind: 'portfolio_risk',
    }).success).toBe(false);
  });

  it('rejects missing kind', () => {
    const { kind: _, ...noKind } = validRequest;
    expect(PersonalSimulationRequestSchema.safeParse(noKind).success).toBe(false);
  });

  it('rejects invalid input nested inside request', () => {
    expect(PersonalSimulationRequestSchema.safeParse({
      ...validRequest,
      input: { ...validRequest.input, horizonMonths: 0 },
    }).success).toBe(false);
  });
});
