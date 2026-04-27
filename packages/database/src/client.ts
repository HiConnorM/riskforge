/**
 * Prisma client singleton.
 *
 * In development, reuse the client across hot-reloads to avoid exhausting
 * the Postgres connection pool. In production, create once and export.
 *
 * Call `prisma.$disconnect()` in process shutdown handlers (SIGTERM/SIGINT).
 */

import { PrismaClient } from '@prisma/client';

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

// Global reuse across tsx --watch hot-reloads.
const globalForPrisma = globalThis as typeof globalThis & {
  _prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma._prisma ?? createPrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma._prisma = prisma;
}
