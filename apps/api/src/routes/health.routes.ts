import type { FastifyInstance } from 'fastify';
import { env } from '@riskforge/config';
import { getCacheRedisClient } from '@riskforge/infra';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async (_req, reply) => {
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
      version: env.ENGINE_VERSION,
      timestamp: new Date().toISOString(),
      dependencies: {
        redis: redisOk ? 'ok' : 'unreachable',
      },
    });
  });
}
