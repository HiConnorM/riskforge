/**
 * Simulation API routes.
 *
 * POST /v1/simulations       — create a simulation job
 * GET  /v1/simulations/:id   — poll job status
 * GET  /v1/simulations/:id/result — retrieve completed result
 *
 * Security:
 *   - Request bodies are validated with Zod before the job is enqueued.
 *   - An optional Idempotency-Key header prevents duplicate jobs on retry.
 *   - Input and config are hashed (SHA-256) for cache key construction and
 *     stored on the job record for reproducibility and auditability.
 *
 * Compute abuse protection:
 *   - paths is capped to MAX_PATHS_ANONYMOUS (env) for unauthenticated requests.
 *   - All limits are enforced before touching the queue.
 */

import type { FastifyInstance } from 'fastify';
import { Queue } from 'bullmq';
import { createHash } from 'node:crypto';
import { env } from '@riskforge/config';
import { SimulationRequestSchema } from '@riskforge/domain';
import { idempotency, resultCache, logger } from '@riskforge/infra';
import { ValidationError, NotFoundError, PlanLimitError } from '../errors.js';

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function extractPaths(body: unknown): number {
  if (
    body !== null &&
    typeof body === 'object' &&
    'config' in body &&
    body.config !== null &&
    typeof body.config === 'object' &&
    'paths' in body.config &&
    typeof body.config.paths === 'number'
  ) {
    return body.config.paths;
  }
  return 0;
}

export async function simulationRoutes(
  fastify: FastifyInstance,
  opts: { queue: Queue },
): Promise<void> {
  const { queue } = opts;

  // ---------------------------------------------------------------------------
  // POST /v1/simulations — create job
  // ---------------------------------------------------------------------------
  fastify.post('/v1/simulations', async (req, reply) => {
    // 1. Parse and validate body.
    const parseResult = SimulationRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError(
        'Invalid simulation request body',
        parseResult.error.flatten(),
      );
    }

    const simReq = parseResult.data;

    // 2. Compute abuse protection: cap paths for anonymous callers.
    // TODO: replace with plan-aware check once auth is wired up.
    const requestedPaths = extractPaths(simReq);
    if (requestedPaths > env.MAX_PATHS_ANONYMOUS) {
      throw new PlanLimitError(
        `paths ${requestedPaths} exceeds the anonymous limit of ${env.MAX_PATHS_ANONYMOUS}. ` +
          'Create an account and upgrade your plan to run larger simulations.',
      );
    }

    // 3. Idempotency — deduplicate retries within 24 h.
    const iKey = req.headers['idempotency-key'];
    const idempotencyKey = typeof iKey === 'string' ? iKey : undefined;

    if (idempotencyKey) {
      const existing = await idempotency.get(idempotencyKey);
      if (existing) {
        logger.info({ idempotencyKey, jobId: existing }, 'Idempotency hit — returning existing job');
        return reply.code(200).send({ jobId: existing, status: 'queued', cached: true });
      }
    }

    // 4. Hash input + config for cache lookup and auditability.
    const inputStr = JSON.stringify(simReq.input);
    const configStr = JSON.stringify(simReq.config);
    const inputHash = sha256(inputStr);
    const configHash = sha256(configStr);

    // 5. Assign seed if not provided.
    const config = simReq.config as Record<string, unknown>;
    if (config['seed'] === undefined || config['seed'] === null) {
      config['seed'] = Math.floor(Math.random() * 0xffff_ffff);
    }
    const seed = config['seed'] as number;

    // 6. Enqueue job.
    const jobData = {
      kind: simReq.kind,
      input: simReq.input,
      config,
      inputHash,
      configHash,
      engineVersion: env.ENGINE_VERSION,
      seed,
    };

    const job = await queue.add(simReq.kind, jobData);

    const jobId = job.id!;

    // 7. Store idempotency mapping.
    if (idempotencyKey) {
      await idempotency.set(idempotencyKey, jobId);
    }

    logger.info({ jobId, kind: simReq.kind, paths: requestedPaths, inputHash }, 'Simulation job enqueued');

    return reply.code(202).send({ jobId, status: 'queued' });
  });

  // ---------------------------------------------------------------------------
  // GET /v1/simulations/:id — job status
  // ---------------------------------------------------------------------------
  fastify.get<{ Params: { id: string } }>(
    '/v1/simulations/:id',
    async (req, reply) => {
      const { id } = req.params;

      const job = await queue.getJob(id);
      if (!job) {
        throw new NotFoundError('SimulationJob', id);
      }

      const state = await job.getState();
      const progress = typeof job.progress === 'number' ? job.progress : undefined;

      return reply.send({
        jobId: id,
        kind: (job.data as Record<string, unknown>)['kind'],
        status: state,
        ...(progress !== undefined ? { progress } : {}),
        createdAt: new Date(job.timestamp).toISOString(),
        ...(job.processedOn ? { startedAt: new Date(job.processedOn).toISOString() } : {}),
        ...(job.finishedOn ? { finishedAt: new Date(job.finishedOn).toISOString() } : {}),
      });
    },
  );

  // ---------------------------------------------------------------------------
  // GET /v1/simulations/:id/result — fetch completed result
  // ---------------------------------------------------------------------------
  fastify.get<{ Params: { id: string } }>(
    '/v1/simulations/:id/result',
    async (req, reply) => {
      const { id } = req.params;

      // Check Redis result cache first.
      const cached = await resultCache.get<unknown>(id);
      if (cached !== null) {
        return reply.send(cached);
      }

      // Fall back to job state check so we can give a meaningful error.
      const job = await queue.getJob(id);
      if (!job) {
        throw new NotFoundError('SimulationJob', id);
      }

      const state = await job.getState();
      if (state === 'failed') {
        return reply.code(422).send({
          error: {
            code: 'JOB_FAILED',
            message: 'Simulation job failed',
            details: { jobId: id, failedReason: job.failedReason },
          },
        });
      }

      if (state !== 'completed') {
        return reply.code(202).send({
          jobId: id,
          status: state,
          message: 'Simulation is not yet complete. Poll GET /v1/simulations/:id for status.',
        });
      }

      // Completed but no cache entry — return BullMQ return value as fallback.
      const returnValue = job.returnvalue as unknown;
      if (returnValue !== null && returnValue !== undefined) {
        return reply.send(returnValue);
      }

      throw new NotFoundError('SimulationResult', id);
    },
  );
}
