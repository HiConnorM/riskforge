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

/**
 * Content-hash result cache.
 *
 * Stores simulation results keyed by a deterministic ID derived from the
 * SHA-256 hashes of the simulation's input and config.  Two requests with
 * identical inputs will share the same cached result, avoiding redundant
 * computation even when they arrive with different BullMQ job IDs.
 *
 * The synthetic ID is stored in the same `riskforge:result:` namespace so
 * the existing `/result/:id` endpoint serves it without any changes — the
 * client polls once and finds the result immediately.
 *
 * Format: `ch_<inputHash[0..23]>_<configHash[0..7]>`
 * Example: `ch_a3f9b2e1d408c7f4e90c125d_3fa8c12e`
 */
export const contentHashCache = {
  /** Deterministic synthetic job ID derived from content hashes. */
  syntheticId(inputHash: string, configHash: string): string {
    return `ch_${inputHash.slice(0, 24)}_${configHash.slice(0, 8)}`;
  },

  async get<T>(inputHash: string, configHash: string): Promise<T | null> {
    return cacheGet<T>('result', this.syntheticId(inputHash, configHash));
  },

  async set(
    inputHash: string,
    configHash: string,
    result: unknown,
    ttlSeconds = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    return cacheSet('result', this.syntheticId(inputHash, configHash), result, ttlSeconds);
  },
};
