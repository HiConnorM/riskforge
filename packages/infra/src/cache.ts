import { getCacheRedisClient } from './redis.js';

const DEFAULT_TTL_SECONDS = 86_400; // 24 hours

/**
 * Thin Redis cache utilities.
 *
 * Keys are namespaced under "riskforge:" to avoid collisions if Redis is
 * shared with other services.
 *
 * All values are stored as JSON strings. Large simulation results can
 * approach 10s of KB; Redis handles this fine but avoid storing arrays of
 * per-path data (those belong in object storage).
 */

function key(namespace: string, id: string): string {
  return `riskforge:${namespace}:${id}`;
}

/** Write a value with an optional TTL in seconds. */
export async function cacheSet(
  namespace: string,
  id: string,
  value: unknown,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): Promise<void> {
  const client = getCacheRedisClient();
  await client.set(key(namespace, id), JSON.stringify(value), 'EX', ttlSeconds);
}

/** Read a value, returning null if absent or expired. */
export async function cacheGet<T>(
  namespace: string,
  id: string,
): Promise<T | null> {
  const client = getCacheRedisClient();
  const raw = await client.get(key(namespace, id));
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Delete a cache entry. */
export async function cacheDel(namespace: string, id: string): Promise<void> {
  const client = getCacheRedisClient();
  await client.del(key(namespace, id));
}

/** Check whether a cache entry exists. */
export async function cacheExists(
  namespace: string,
  id: string,
): Promise<boolean> {
  const client = getCacheRedisClient();
  const exists = await client.exists(key(namespace, id));
  return exists === 1;
}

/**
 * Idempotency key cache.
 *
 * Stores the jobId for a given idempotency key so that duplicate API
 * requests return the same job rather than creating a new one.
 */
export const idempotency = {
  async get(ikey: string): Promise<string | null> {
    return cacheGet<string>('idempotency', ikey);
  },
  async set(ikey: string, jobId: string): Promise<void> {
    // Idempotency keys expire after 24 h — matches typical retry windows.
    return cacheSet('idempotency', ikey, jobId, 86_400);
  },
};

/**
 * Simulation result cache.
 *
 * Results are cached under their jobId. The worker writes here after
 * completing a job; the API reads here to serve results.
 */
export const resultCache = {
  async get<T>(jobId: string): Promise<T | null> {
    return cacheGet<T>('result', jobId);
  },
  async set(
    jobId: string,
    result: unknown,
    ttlSeconds = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    return cacheSet('result', jobId, result, ttlSeconds);
  },
};
