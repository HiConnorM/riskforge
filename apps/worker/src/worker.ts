/**
 * RiskForge worker service entry point.
 *
 * Consumes simulation jobs from BullMQ and routes them to the appropriate
 * processor based on the `kind` field.  Runs N concurrent jobs (configured
 * via WORKER_CONCURRENCY env var, default 4).
 *
 * Error handling:
 *   - Validation failures (INVALID_INPUT / INVALID_CONFIG) are non-retryable.
 *   - Engine errors (SimulationError with a code) are non-retryable.
 *   - Redis / network errors are retryable (BullMQ handles back-off).
 *
 * Observability:
 *   - Each job logs: kind, jobId, elapsedMs, paths, status.
 *   - Failures log the error code and message (no stack in production).
 */

import { Worker, type Job, UnrecoverableError } from 'bullmq';
import { SIM_QUEUE_NAME, logger } from '@riskforge/infra';
import { processPortfolioRisk } from './processors/portfolio-risk.processor.js';
import { processPersonalCashflow } from './processors/personal-cashflow.processor.js';

const CONCURRENCY = parseInt(process.env['WORKER_CONCURRENCY'] ?? '4', 10);

// Non-retryable error code prefixes (as set by processors).
const NON_RETRYABLE_PREFIXES = ['INVALID_INPUT:', 'INVALID_CONFIG:', 'CORRELATION_MATRIX', 'WEIGHTS_DO_NOT', 'STUDENT_T_DF', 'UNSUPPORTED_SIMULATION'];

function isNonRetryable(err: Error): boolean {
  return NON_RETRYABLE_PREFIXES.some((prefix) => err.message.startsWith(prefix));
}

async function processJob(job: Job): Promise<unknown> {
  const kind = (job.data as { kind?: string })['kind'];

  switch (kind) {
    case 'portfolio_risk':
      return processPortfolioRisk(job);

    case 'personal_cashflow_risk':
      return processPersonalCashflow(job);

    default:
      // Unknown kind — fail immediately without retrying.
      throw new UnrecoverableError(`Unsupported simulation kind: ${String(kind)}`);
  }
}

const worker = new Worker(
  SIM_QUEUE_NAME,
  async (job: Job) => {
    try {
      return await processJob(job);
    } catch (err) {
      if (err instanceof Error && isNonRetryable(err)) {
        // Wrap in UnrecoverableError so BullMQ skips remaining attempts.
        throw new UnrecoverableError(err.message);
      }
      throw err;
    }
  },
  {
    connection: { url: process.env['REDIS_URL'] ?? 'redis://localhost:6379' },
    concurrency: CONCURRENCY,
  },
);

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
  { queue: SIM_QUEUE_NAME, concurrency: CONCURRENCY },
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
