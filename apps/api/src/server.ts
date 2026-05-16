/**
 * API server entry point.
 *
 * Starts the Fastify listener and handles graceful shutdown on SIGTERM / SIGINT.
 * Keep this file minimal — all app logic lives in app.ts and the route plugins.
 */

import { env } from '@riskforge/config';
import { createSimQueue, logger } from '@riskforge/infra';
import { buildApp } from './app.js';

const HOST = process.env['HOST'] ?? '0.0.0.0';

const queue = createSimQueue();
const app = buildApp(queue);

async function start(): Promise<void> {
  try {
    await app.listen({ port: env.PORT, host: HOST });
    logger.info({ port: env.PORT, host: HOST }, 'RiskForge API listening');
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutdown signal received');
  await app.close();
  await queue.close();
  logger.info('Server shut down gracefully');
  process.exit(0);
}

process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('SIGINT', () => { void shutdown('SIGINT'); });

void start();
