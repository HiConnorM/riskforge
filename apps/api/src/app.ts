/**
 * Fastify application factory.
 *
 * Separated from server.ts so the app instance can be imported in tests
 * without starting a TCP listener.
 *
 * Plugin registration order matters — Fastify loads plugins in the order
 * they are registered, so security plugins (cors, rate-limit) must be
 * registered before route plugins so they apply to all incoming requests.
 *
 * `AppOptions.rateLimitRedis` is optional so that tests can omit it and
 * use the in-process in-memory store instead of a real Redis connection.
 * In production, server.ts passes the shared cache client so limits are
 * shared across all API instances behind the load balancer.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { type Queue } from 'bullmq';
import { env } from '@riskforge/config';
import { toErrorResponse, AppError } from './errors.js';
import { healthRoutes } from './routes/health.routes.js';
import { simulationRoutes } from './routes/simulations.routes.js';

export interface AppOptions {
  /**
   * Optional ioredis Redis client for distributed rate-limit counters.
   *
   * When provided, rate-limit state is stored in Redis so all API instances
   * share the same counter per IP / user. When omitted (e.g. in tests), the
   * plugin falls back to an in-process LRU cache — correct for single-instance
   * local dev, but not suitable for multi-instance deployments.
   *
   * Typed as `unknown` to avoid ioredis version conflicts between the infra
   * package's peer dependency and @fastify/rate-limit's peer dependency.
   */
  rateLimitRedis?: unknown;
}

export function buildApp(queue: Queue, options: AppOptions = {}): FastifyInstance {
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      timestamp: () => `,"time":"${new Date().toISOString()}"`,
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie'],
        censor: '[REDACTED]',
      },
    },
    // Trust proxy headers (X-Forwarded-For) when behind a load balancer.
    trustProxy: true,
    // Discard unknown properties in request bodies (defence-in-depth).
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: false,
      },
    },
  });

  // ---------------------------------------------------------------------------
  // Request size guard — prevent payload amplification attacks.
  // ---------------------------------------------------------------------------
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'string', bodyLimit: 512 * 1024 }, // 512 KB max
    (req, body, done) => {
      try {
        done(null, JSON.parse(body as string));
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  // ---------------------------------------------------------------------------
  // CORS — allow requests from the configured front-end origin(s).
  //
  // Origins are provided as a comma-separated env var so the same image works
  // in dev (localhost:3000), staging, and production without a rebuild.
  // ---------------------------------------------------------------------------
  const allowedOrigins = env.ALLOWED_ORIGINS
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  fastify.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Idempotency-Key', 'Authorization'],
    // Browser can cache the preflight response for 1 hour.
    maxAge: 3_600,
    // Credentials are intentionally NOT allowed — we use bearer tokens in the
    // Authorization header, which is listed in allowedHeaders above.
    credentials: false,
  });

  // ---------------------------------------------------------------------------
  // Rate limiting — distributed via Redis when rateLimitRedis is provided.
  //
  // Anonymous callers: RATE_LIMIT_MAX req / RATE_LIMIT_WINDOW_MS ms (per IP).
  // After auth ships, replace the keyGenerator with a userId so that limits
  // are per-account rather than per-IP (IP-based limits are gameable with VPNs
  // and cause false positives for users behind shared NAT).
  //
  // skipOnError: true — if Redis is temporarily unavailable, fail open rather
  // than taking down the API entirely. Fix Redis at the infra level, not here.
  // ---------------------------------------------------------------------------
  fastify.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    // TODO: replace ip-based key with userId once auth is wired up.
    keyGenerator: (req) => req.ip,
    // Omitting redis uses the in-process LRU store (tests / single-instance dev).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(options.rateLimitRedis ? { redis: options.rateLimitRedis as any } : {}),
    skipOnError: true,
    errorResponseBuilder: (_req, ctx) => ({
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests — retry in ${ctx.after}.`,
        retryAfter: ctx.after,
      },
    }),
  });

  // ---------------------------------------------------------------------------
  // Centralised error handler.
  // ---------------------------------------------------------------------------
  fastify.setErrorHandler((err: Error & { statusCode?: number }, req, reply) => {
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send(toErrorResponse(err));
    }

    // Fastify validation errors (rare — we validate with Zod manually).
    if (err.statusCode === 400) {
      return reply.code(400).send(
        toErrorResponse(new AppError('VALIDATION_ERROR', err.message, 400)),
      );
    }

    // Unexpected errors — log full detail server-side, return generic response.
    fastify.log.error({ err: err.message, reqId: req.id }, 'Unhandled error');
    return reply.code(500).send(toErrorResponse(err));
  });

  // ---------------------------------------------------------------------------
  // Not-found handler.
  // ---------------------------------------------------------------------------
  fastify.setNotFoundHandler((_req, reply) => {
    return reply.code(404).send({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  // ---------------------------------------------------------------------------
  // Routes — registered after security plugins.
  // ---------------------------------------------------------------------------
  fastify.register(healthRoutes);
  fastify.register(simulationRoutes, { queue });

  return fastify;
}
