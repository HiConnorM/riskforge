import { z } from 'zod';
import {
  PortfolioAssetSchema,
  StressConfigSchema,
  PortfolioSimConfigSchema,
  PortfolioRiskInputSchema,
} from './schemas.js';

// Derive from Zod schemas so types always stay in sync with validation.
export type PortfolioAsset = z.infer<typeof PortfolioAssetSchema>;
export type StressConfig = z.infer<typeof StressConfigSchema>;
export type PortfolioSimConfig = z.infer<typeof PortfolioSimConfigSchema>;
export type PortfolioRiskInput = z.infer<typeof PortfolioRiskInputSchema>;

// Literals not easily derived from schemas.
export type AssetClass =
  | 'stock'
  | 'bond'
  | 'crypto'
  | 'commodity'
  | 'reit'
  | 'cash'
  | 'custom';

export type Distribution = 'normal' | 'student_t';

export type PortfolioRiskResult = {
  summary: {
    meanReturn: number;
    medianReturn: number;
    p05Return: number;
    p01Return: number;
    valueAtRisk95: number;
    valueAtRisk99: number;
    expectedShortfall95: number;
    expectedShortfall99: number;
    probabilityDrawdownOver10: number;
    probabilityDrawdownOver20: number;
    probabilityDrawdownOver30: number;
    probabilityDrawdownOver50: number;
    medianMaxDrawdown: number;
    p95MaxDrawdown: number;
    annualizedVolatility: number;
  };
  interpretation: {
    riskLevel: 'low' | 'moderate' | 'high' | 'severe';
    mainRiskDrivers: string[];
    plainEnglishSummary: string;
    stressImpact?: string | undefined;
  };
  meta: {
    paths: number;
    horizonDays: number;
    distribution: Distribution;
    df?: number | undefined;
    seed: number;
    engineVersion: string;
    elapsedMs: number;
    stressed: boolean;
  };
};
