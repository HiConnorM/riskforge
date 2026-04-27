import { z } from 'zod';
import {
  RiskEventSchema,
  PersonalCashflowInputSchema,
  CashflowSimConfigSchema,
} from './schemas.js';

// Derive from Zod schemas so types always stay in sync with validation.
export type RiskEvent = z.infer<typeof RiskEventSchema>;
export type PersonalCashflowInput = z.infer<typeof PersonalCashflowInputSchema>;
export type CashflowSimConfig = z.infer<typeof CashflowSimConfigSchema>;

// Literals not easily derived from schemas.
export type RiskEventCategory =
  | 'car'
  | 'pet'
  | 'medical'
  | 'housing'
  | 'food'
  | 'shopping'
  | 'job'
  | 'family'
  | 'utility'
  | 'appliance'
  | 'other';

export type ResilienceLevel = 'stable' | 'watch' | 'fragile' | 'critical';

export type PersonalCashflowResult = {
  summary: {
    probabilityBelowZero: number;
    probabilityBelowEmergencyThreshold: number;
    medianEndingBalance: number;
    p10EndingBalance: number;
    p05EndingBalance: number;
    worstCaseEndingBalance: number;
    recommendedEmergencyFund: number;
    mostFragileMonth: number;
    expectedTotalEventCost: number;
  };
  interpretation: {
    resilienceLevel: ResilienceLevel;
    topRiskEvents: string[];
    plainEnglishSummary: string;
    suggestedActions: string[];
  };
  meta: {
    paths: number;
    horizonMonths: number;
    seed: number;
    engineVersion: string;
    elapsedMs: number;
  };
};
