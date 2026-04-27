import { Redis } from 'ioredis';

// ioredis requires maxRetriesPerRequest: null for BullMQ compatibility.
const BULLMQ_OPTIONS = { maxRetriesPerRequest: null } as const;

/**
 * Create a new ioredis client.
 *
 * BullMQ requires separate Redis connections for queue producers and workers
 * (it manages its own blocking connections internally). Call this function
 * once per logical role; do not share a single client between BullMQ and
 * regular cache operations.
 */
export function createRedisClient(url?: string): Redis {
  const redisUrl = url ?? process.env['REDIS_URL'] ?? 'redis://localhost:6379';

  const client = new Redis(redisUrl, {
    ...BULLMQ_OPTIONS,
    enableReadyCheck: false,
    lazyConnect: false,
    retryStrategy(times) {
      // Exponential back-off capped at 3 s.
      return Math.min(times * 200, 3_000);
    },
  });

  client.on('error', (err: Error) => {
    // Avoid circular dependency on logger; use stderr directly.
    process.stderr.write(
      JSON.stringify({ level: 'error', msg: 'Redis client error', err: err.message }) + '\n',
    );
  });

  return client;
}

/** Singleton cache/general-purpose client (not for BullMQ internals). */
let _cacheClient: Redis | null = null;

export function getCacheRedisClient(): Redis {
  if (!_cacheClient) {
    _cacheClient = createRedisClient();
  }
  return _cacheClient;
}
