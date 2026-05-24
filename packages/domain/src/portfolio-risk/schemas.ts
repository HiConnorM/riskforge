import { z } from 'zod';

export const PortfolioAssetSchema = z.object({
  name: z.string().min(1).max(100),
  symbol: z.string().max(20).optional(),
  assetClass: z
    .enum(['stock', 'bond', 'crypto', 'commodity', 'reit', 'cash', 'custom'])
    .optional(),
  weight: z.number().gt(0).lte(1),
  mu: z.number().gte(-1).lte(10),    // −100 % to +1000 % annualised
  sigma: z.number().gt(0).lte(10),   // strictly positive
});

export const StressConfigSchema = z.object({
  volMultiplier: z.number().gt(0).lte(10).optional(),
  corrTarget: z.number().gte(-1).lte(1).optional(),
  corrBlend: z.number().gte(0).lte(1).optional(),
});

export const PortfolioSimConfigSchema = z.object({
  paths: z.number().int().min(1_000).max(5_000_000),
  horizonDays: z.number().int().min(1).max(5_000),
  distribution: z.enum(['normal', 'student_t']),
  df: z.number().int().min(3).max(100).optional(),
  seed: z.number().int().optional(),
  stress: StressConfigSchema.optional(),
  garchParams: z.object({
    alpha: z.number().gt(0).lt(1),
    beta: z.number().gt(0).lt(1),
  }).optional(),
  jumps: z.object({
    lambda: z.number().gt(0).lte(50),
    muJ: z.number().gte(-0.5).lte(0.1),
    sigmaJ: z.number().gt(0).lte(0.5),
  }).optional(),
  computeFrontier: z.boolean().default(false).optional(),
  antitheticVariates: z.boolean().default(false).optional(),
  useGarch: z.boolean().default(false).optional(),
});

export const PortfolioRiskInputSchema = z
  .object({
    assets: z.array(PortfolioAssetSchema).min(1).max(50),
    corr: z.array(z.array(z.number().gte(-1).lte(1))),
  })
  .superRefine((d, ctx) => {
    const n = d.assets.length;

    if (d.corr.length !== n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `corr must have ${n} rows (one per asset), got ${d.corr.length}`,
      });
    }
    for (let i = 0; i < d.corr.length; i++) {
      const row = d.corr[i];
      if (!row || row.length !== n) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `corr row ${i} must have ${n} columns`,
        });
      }
    }

    const weightSum = d.assets.reduce((s, a) => s + a.weight, 0);
    if (Math.abs(weightSum - 1) > 1e-5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Asset weights must sum to 1, got ${weightSum.toFixed(6)}`,
      });
    }

    for (let i = 0; i < n; i++) {
      const diag = d.corr[i]?.[i];
      if (diag === undefined || Math.abs(diag - 1) > 1e-9) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `corr[${i}][${i}] must equal 1`,
        });
      }
    }
  });

export const PortfolioSimulationRequestSchema = z.object({
  kind: z.literal('portfolio_risk'),
  input: PortfolioRiskInputSchema,
  config: PortfolioSimConfigSchema,
});
