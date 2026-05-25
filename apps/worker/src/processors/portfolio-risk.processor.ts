/**
 * Portfolio risk simulation processor.
 *
 * Validates the raw BullMQ job data, delegates to the pure engine, writes
 * the result to the Redis cache, and returns the result so BullMQ stores it
 * as the job return value (useful for debugging via Bull Board).
 */

import { UnrecoverableError, type Job } from 'bullmq';
import { env } from '@riskforge/config';
import { PortfolioRiskInputSchema, PortfolioSimConfigSchema } from '@riskforge/domain';
import type { PortfolioRiskResult } from '@riskforge/domain';
import { simulatePortfolio, SimulationError } from '@riskforge/engine';
import { resultCache, contentHashCache, logger } from '@riskforge/infra';

interface PortfolioJobData {
  kind: 'portfolio_risk';
  input: unknown;
  config: unknown;
  inputHash: string;
  configHash: string;
  engineVersion: string;
  seed: number;
}

export async function processPortfolioRisk(job: Job): Promise<PortfolioRiskResult> {
  const data = job.data as PortfolioJobData;

  // Re-validate — defence-in-depth against corrupted queue payloads.
  const inputParse = PortfolioRiskInputSchema.safeParse(data.input);
  if (!inputParse.success) {
    throw new UnrecoverableError(
      `INVALID_INPUT: ${JSON.stringify(inputParse.error.flatten())}`,
    );
  }

  const configParse = PortfolioSimConfigSchema.safeParse(data.config);
  if (!configParse.success) {
    throw new UnrecoverableError(
      `INVALID_CONFIG: ${JSON.stringify(configParse.error.flatten())}`,
    );
  }

  const input = inputParse.data;
  const config = configParse.data;

  // Signal progress: 0 % started.
  await job.updateProgress(0);

  logger.info(
    {
      jobId: job.id,
      paths: config.paths,
      horizonDays: config.horizonDays,
      assets: input.assets.length,
      distribution: config.distribution,
      stressed: !!config.stress,
    },
    'Portfolio simulation started',
  );

  let result: PortfolioRiskResult;
  try {
    result = simulatePortfolio(input, config, env.ENGINE_VERSION);
  } catch (err) {
    if (err instanceof SimulationError) {
      // Deterministic engine failures — retrying won't help, fail fast.
      throw new UnrecoverableError(`${err.code}: ${err.message}`);
    }
    throw err;
  }

  // Signal progress: 100 % complete.
  await job.updateProgress(100);

  // Write to Redis cache under the real jobId so the API can serve it immediately.
  await resultCache.set(job.id!, result, env.RESULT_TTL_SECONDS);

  // Also write under the content-hash synthetic ID so future requests with
  // identical inputs are served from cache without creating a new job.
  await contentHashCache.set(data.inputHash, data.configHash, result, env.RESULT_TTL_SECONDS);

  logger.info(
    {
      jobId: job.id,
      elapsedMs: result.meta.elapsedMs,
      paths: result.meta.paths,
      riskLevel: result.interpretation.riskLevel,
    },
    'Portfolio simulation completed',
  );

  return result;
}
