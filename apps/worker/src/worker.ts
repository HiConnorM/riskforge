/**
 * RiskForge worker service entry point.
 *
 * Consumes simulation jobs from BullMQ and routes them to the appropriate
 * processor based on the `kind` field.  Runs N concurrent jobs (configured
 * via WORKER_CONCURRENCY env var, default 4).
 *
 * Error handling:
 *   - Processors throw UnrecoverableError for deterministic failures
 *     (validation, engine SimulationError). BullMQ skips remaining attempts.
 *   - Any other Error is treated as transient — BullMQ retries with back-off.
 *
 * Observability:
 *   - Each job logs: kind, jobId, elapsedMs, paths, status.
 *   - Failures log the error code and message (no stack in production).
 */

import { Worker, type Job, UnrecoverableError } from 'bullmq';
import { env } from '@riskforge/config';
import { SIM_QUEUE_NAME, logger } from '@riskforge/infra';
import { processPortfolioRisk } from './processors/portfolio-risk.processor.js';
import { processPersonalCashflow } from './processors/personal-cashflow.processor.js';

async function processJob(job: Job): Promise<unknown> {
  const kind = (job.data as { kind?: string })['kind'];

  switch (kind) {
    case 'portfolio_risk':
      return processPortfolioRisk(job);

    case 'personal_cashflow_risk':
      return processPersonalCashflow(job);

    default:
      throw new UnrecoverableError(`Unsupported simulation kind: ${String(kind)}`);
  }
}

const worker = new Worker(SIM_QUEUE_NAME, processJob, {
  connection: { url: env.REDIS_URL },
  concurrency: env.WORKER_CONCURRENCY,
});

worker.on('active', (job) => {
  logger.info({ jobId: job.id, kind: (job.data as { kind?: string })['kind'] }, 'Job started');
});

worker.on('completed', (job, result) => {
  const meta = (result as { meta?: { elapsedMs?: number; paths?: number } } | null)?.meta;
  logger.info(
    {
      jobId: job.id,
      kind: (job.data as { kind?: string })['kind'],
      elapsedMs: meta?.elapsedMs,
      paths: meta?.paths,
    },
    'Job completed',
  );
});

worker.on('failed', (job, err) => {
  logger.error(
    {
      jobId: job?.id,
      kind: (job?.data as { kind?: string } | undefined)?.['kind'],
      err: err.message,
      attempts: job?.attemptsMade,
    },
    'Job failed',
  );
});

worker.on('error', (err) => {
  logger.error({ err: err.message }, 'Worker connection error');
});

logger.info(
  { queue: SIM_QUEUE_NAME, concurrency: env.WORKER_CONCURRENCY },
  'RiskForge worker started',
);

// Graceful shutdown.
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Worker shutdown signal received');
  await worker.close();
  logger.info('Worker shut down gracefully');
  process.exit(0);
}

process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('SIGINT', () => { void shutdown('SIGINT'); });
