import { z } from 'zod';

export const RiskEventSchema = z
  .object({
    name: z.string().min(1).max(100),
    category: z.enum([
      'car',
      'pet',
      'medical',
      'housing',
      'food',
      'shopping',
      'job',
      'family',
      'utility',
      'appliance',
      'other',
    ]),
    probabilityPerMonth: z.number().gt(0).lte(1),
    minCost: z.number().gte(0),
    maxCost: z.number().gt(0),
    maxOccurrences: z.number().int().min(1).optional(),
  })
  .refine((e) => e.maxCost >= e.minCost, {
    message: 'maxCost must be >= minCost',
  });

export const PersonalCashflowInputSchema = z.object({
  monthlyIncome: z.number().gte(0),
  monthlyFixedExpenses: z.number().gte(0),
  monthlyVariableExpenses: z.number().gte(0),
  currentSavings: z.number(),  // can be negative (already in debt)
  horizonMonths: z.number().int().min(1).max(60),
  riskEvents: z.array(RiskEventSchema).max(20),
  emergencyThreshold: z.number().gte(0).optional(),
});

export const CashflowSimConfigSchema = z.object({
  paths: z.number().int().min(1_000).max(100_000),
  seed: z.number().int().optional(),
});

export const PersonalSimulationRequestSchema = z.object({
  kind: z.literal('personal_cashflow_risk'),
  input: PersonalCashflowInputSchema,
  config: CashflowSimConfigSchema,
});
