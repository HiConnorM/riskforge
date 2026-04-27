import type { FastifyInstance } from 'fastify';
import { getCacheRedisClient } from '@riskforge/infra';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async (_req, reply) => {
    // Shallow Redis liveness check.
    let redisOk = false;
    try {
      const pong = await getCacheRedisClient().ping();
      redisOk = pong === 'PONG';
    } catch {
      redisOk = false;
    }

    const status = redisOk ? 'ok' : 'degraded';
    const statusCode = redisOk ? 200 : 503;

    return reply.code(statusCode).send({
      status,
      version: process.env['ENGINE_VERSION'] ?? '1.0.0',
      timestamp: new Date().toISOString(),
      dependencies: {
        redis: redisOk ? 'ok' : 'unreachable',
      },
    });
  });
}
