import { Queue } from 'bullmq';

export const SIM_QUEUE_NAME = 'riskforge:sims';

/**
 * Create the simulation job queue.
 *
 * BullMQ manages its own ioredis connections internally; we pass the URL
 * rather than sharing an existing client to avoid version-mismatch issues
 * between independently installed ioredis packages.
 *
 * Job retention:
 *   - Completed: keep latest 500  (results live in Redis cache + DB)
 *   - Failed:    keep latest 2000 (for debugging and support)
 */
export function createSimQueue(): Queue {
  const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

  return new Queue(SIM_QUEUE_NAME, {
    connection: { url: redisUrl },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1_000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 2_000 },
    },
  });
}
