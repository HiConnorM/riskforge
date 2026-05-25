import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  DATABASE_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(50).default(4),
  ENGINE_VERSION: z.string().default('1.0.0'),
  // per-tier simulation path limits
  MAX_PATHS_ANONYMOUS: z.coerce.number().int().min(100).default(5_000),
  MAX_PATHS_FREE: z.coerce.number().int().default(10_000),
  MAX_PATHS_PRO: z.coerce.number().int().default(500_000),
  MAX_PATHS_ENTERPRISE: z.coerce.number().int().default(5_000_000),
  // result TTL in Redis
  RESULT_TTL_SECONDS: z.coerce.number().int().default(86_400),

  // ── API security ────────────────────────────────────────────────────────────
  // Comma-separated list of allowed CORS origins (exact match only).
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  // Max requests per window for anonymous callers.
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(30),
  // Window length in milliseconds (default: 1 minute).
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1_000).default(60_000),
  // Return 503 if this many jobs are already waiting in the queue.
  QUEUE_MAX_WAITING: z.coerce.number().int().min(10).default(500),
});

export type Env = z.infer<typeof EnvSchema>;

function parseEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    // eslint-disable-next-line no-console
    console.error('[riskforge] Invalid environment variables:', JSON.stringify(errors, null, 2));
    process.exit(1);
  }
  // result.success === true guarantees result.data is defined.
  return result.data as Env;
}

// Parsed once at module load; fails fast on bad config.
export const env = parseEnv();
