import { z } from 'zod';
import { PortfolioSimulationRequestSchema } from './portfolio-risk/schemas.js';
import { PersonalSimulationRequestSchema } from './personal-cashflow/schemas.js';

// Discriminated union — the canonical request shape for all simulation types.
export const SimulationRequestSchema = z.discriminatedUnion('kind', [
  PortfolioSimulationRequestSchema,
  PersonalSimulationRequestSchema,
]);

export type SimulationRequest = z.infer<typeof SimulationRequestSchema>;

// Re-export everything so consumers only need this package.
export type { SimulationKind } from './simulation-kind.js';

export type {
  JobStatus,
  SimulationJob,
  AppErrorCode,
  SimulationErrorCode,
} from './common/types.js';

export type {
  AssetClass,
  Distribution,
  PortfolioAsset,
  PortfolioRiskInput,
  StressConfig,
  PortfolioSimConfig,
  PortfolioRiskResult,
} from './portfolio-risk/types.js';

export {
  PortfolioAssetSchema,
  StressConfigSchema,
  PortfolioSimConfigSchema,
  PortfolioRiskInputSchema,
  PortfolioSimulationRequestSchema,
} from './portfolio-risk/schemas.js';

export type {
  RiskEventCategory,
  RiskEvent,
  PersonalCashflowInput,
  CashflowSimConfig,
  ResilienceLevel,
  PersonalCashflowResult,
} from './personal-cashflow/types.js';

export {
  RiskEventSchema,
  PersonalCashflowInputSchema,
  CashflowSimConfigSchema,
  PersonalSimulationRequestSchema,
} from './personal-cashflow/schemas.js';
