/**
 * Personal cashflow simulation processor.
 *
 * Same pattern as the portfolio processor: validate, simulate, cache, return.
 */

import { UnrecoverableError, type Job } from 'bullmq';
import { env } from '@riskforge/config';
import { PersonalCashflowInputSchema, CashflowSimConfigSchema } from '@riskforge/domain';
import type { PersonalCashflowResult } from '@riskforge/domain';
import { simulatePersonalCashflow } from '@riskforge/engine';
import { resultCache, logger } from '@riskforge/infra';

interface CashflowJobData {
  kind: 'personal_cashflow_risk';
  input: unknown;
  config: unknown;
  inputHash: string;
  configHash: string;
  engineVersion: string;
  seed: number;
}

export async function processPersonalCashflow(job: Job): Promise<PersonalCashflowResult> {
  const data = job.data as CashflowJobData;

  const inputParse = PersonalCashflowInputSchema.safeParse(data.input);
  if (!inputParse.success) {
    throw new UnrecoverableError(
      `INVALID_INPUT: ${JSON.stringify(inputParse.error.flatten())}`,
    );
  }

  const configParse = CashflowSimConfigSchema.safeParse(data.config);
  if (!configParse.success) {
    throw new UnrecoverableError(
      `INVALID_CONFIG: ${JSON.stringify(configParse.error.flatten())}`,
    );
  }

  const input = inputParse.data;
  const config = configParse.data;

  await job.updateProgress(0);

  logger.info(
    {
      jobId: job.id,
      paths: config.paths,
      horizonMonths: input.horizonMonths,
      riskEvents: input.riskEvents.length,
    },
    'Personal cashflow simulation started',
  );

  const result = simulatePersonalCashflow(input, config, env.ENGINE_VERSION);

  await job.updateProgress(100);

  await resultCache.set(job.id!, result, env.RESULT_TTL_SECONDS);

  logger.info(
    {
      jobId: job.id,
      elapsedMs: result.meta.elapsedMs,
      paths: result.meta.paths,
      resilienceLevel: result.interpretation.resilienceLevel,
      probBelowZero: result.summary.probabilityBelowZero,
    },
    'Personal cashflow simulation completed',
  );

  return result;
}
