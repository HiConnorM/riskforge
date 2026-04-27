/**
 * Fastify application factory.
 *
 * Separated from server.ts so the app instance can be imported in tests
 * without starting a TCP listener.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { Queue } from 'bullmq';
import { toErrorResponse, AppError } from './errors.js';
import { healthRoutes } from './routes/health.routes.js';
import { simulationRoutes } from './routes/simulations.routes.js';

export function buildApp(queue: Queue): FastifyInstance {
  const fastify = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
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

    // Unexpected errors — log full detail server-side, return generic client response.
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
  // Routes.
  // ---------------------------------------------------------------------------
  fastify.register(healthRoutes);
  fastify.register(simulationRoutes, { queue });

  return fastify;
}
