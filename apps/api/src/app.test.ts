/**
 * Integration tests for the Fastify app.
 *
 * Strategy: build the app with a mock Queue so Redis is not required.
 * @riskforge/infra is fully mocked so no Redis connection is attempted.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Queue } from 'bullmq';

// ─── Mock @riskforge/infra before any app imports ─────────────────────────────
vi.mock('@riskforge/infra', () => ({
  idempotency: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  },
  resultCache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  },
  contentHashCache: {
    syntheticId: vi.fn().mockReturnValue('ch_test000000000000000000_testtest'),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  },
  logger: {
    info:  vi.fn(),
    warn:  vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
  // Health route calls getCacheRedisClient().ping() — return a mock that resolves 'PONG'.
  // @fastify/rate-limit will attempt to use this client; skipOnError: true means
  // any failures are swallowed, so tests proceed without a real Redis connection.
  getCacheRedisClient: vi.fn().mockReturnValue({
    ping: vi.fn().mockResolvedValue('PONG'),
  }),
  createRedisClient: vi.fn().mockReturnValue({
    ping: vi.fn().mockResolvedValue('PONG'),
  }),
}));

import { buildApp } from './app.js';
import { idempotency, resultCache, contentHashCache } from '@riskforge/infra';

// ─── Mock Queue factory ───────────────────────────────────────────────────────

function makeMockQueue(overrides: Record<string, unknown> = {}): Queue {
  return {
    add: vi.fn().mockResolvedValue({ id: 'job-test-1' }),
    getJob: vi.fn().mockResolvedValue(null),
    // Default to 0 waiting jobs so queue depth guard never triggers in tests.
    getWaitingCount: vi.fn().mockResolvedValue(0),
    ...overrides,
  } as unknown as Queue;
}

// ─── valid fixtures ───────────────────────────────────────────────────────────

const validPortfolioBody = {
  kind: 'portfolio_risk',
  input: {
    assets: [
      { name: 'Stocks', weight: 0.6, mu: 0.08, sigma: 0.16 },
      { name: 'Bonds',  weight: 0.4, mu: 0.03, sigma: 0.06 },
    ],
    corr: [[1, -0.1], [-0.1, 1]],
  },
  config: { paths: 1_000, horizonDays: 63, distribution: 'normal' },
};

const validCashflowBody = {
  kind: 'personal_cashflow_risk',
  input: {
    monthlyIncome: 4_200,
    monthlyFixedExpenses: 2_600,
    monthlyVariableExpenses: 700,
    currentSavings: 1_500,
    horizonMonths: 12,
    riskEvents: [],
  },
  config: { paths: 1_000, seed: 42 },
};

// ─── health endpoint ──────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const app = buildApp(makeMockQueue());
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(body['status']).toBe('ok');
  });

  it('returns version string', async () => {
    const app = buildApp(makeMockQueue());
    const res = await app.inject({ method: 'GET', url: '/health' });
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(typeof body['version']).toBe('string');
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────

describe('Not-found handler', () => {
  it('returns 404 for unknown routes', async () => {
    const app = buildApp(makeMockQueue());
    const res = await app.inject({ method: 'GET', url: '/does-not-exist' });
    expect(res.statusCode).toBe(404);
  });
});

// ─── POST /v1/simulations — validation ────────────────────────────────────────

describe('POST /v1/simulations — validation errors', () => {
  it('returns 400 for missing body', async () => {
    const app = buildApp(makeMockQueue());
    const res = await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: { 'content-type': 'application/json' },
      payload: '{}',
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect((body['error'] as Record<string, unknown>)['code']).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for unknown kind', async () => {
    const app = buildApp(makeMockQueue());
    const res = await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ kind: 'alien_risk', input: {}, config: {} }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for portfolio_risk with weights not summing to 1', async () => {
    const app = buildApp(makeMockQueue());
    const bad = {
      ...validPortfolioBody,
      input: {
        ...validPortfolioBody.input,
        assets: [
          { name: 'A', weight: 0.3, mu: 0.08, sigma: 0.16 },
          { name: 'B', weight: 0.3, mu: 0.03, sigma: 0.06 },
        ],
        corr: [[1, 0], [0, 1]],
      },
    };
    const res = await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(bad),
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for personal with horizonMonths = 0', async () => {
    const app = buildApp(makeMockQueue());
    const bad = { ...validCashflowBody, input: { ...validCashflowBody.input, horizonMonths: 0 } };
    const res = await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(bad),
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-JSON content type', async () => {
    const app = buildApp(makeMockQueue());
    const res = await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: { 'content-type': 'text/plain' },
      payload: 'not json',
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── POST /v1/simulations — path cap ─────────────────────────────────────────

describe('POST /v1/simulations — plan limit', () => {
  it('returns 402 when paths exceed anonymous cap', async () => {
    const app = buildApp(makeMockQueue());
    const overCap = {
      ...validPortfolioBody,
      config: { ...validPortfolioBody.config, paths: 999_999 },
    };
    const res = await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(overCap),
    });
    expect(res.statusCode).toBe(402);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect((body['error'] as Record<string, unknown>)['code']).toBe('PLAN_LIMIT_EXCEEDED');
  });
});

// ─── POST /v1/simulations — successful enqueue ────────────────────────────────

describe('POST /v1/simulations — successful enqueue', () => {
  beforeEach(() => {
    vi.mocked(idempotency.get).mockResolvedValue(null);
    vi.mocked(idempotency.set).mockResolvedValue(undefined);
  });

  it('returns 202 with jobId for a valid portfolio simulation', async () => {
    const queue = makeMockQueue();
    const app = buildApp(queue);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(validPortfolioBody),
    });
    expect(res.statusCode).toBe(202);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(body['jobId']).toBe('job-test-1');
    expect(body['status']).toBe('queued');
  });

  it('returns 202 with jobId for a valid cashflow simulation', async () => {
    const queue = makeMockQueue();
    const app = buildApp(queue);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(validCashflowBody),
    });
    expect(res.statusCode).toBe(202);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(typeof body['jobId']).toBe('string');
  });

  it('calls queue.add exactly once per request', async () => {
    const queue = makeMockQueue();
    const app = buildApp(queue);
    await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(validPortfolioBody),
    });
    expect(queue.add).toHaveBeenCalledTimes(1);
  });
});

// ─── POST /v1/simulations — idempotency ──────────────────────────────────────

describe('POST /v1/simulations — idempotency key', () => {
  it('returns 200 with cached: true when idempotency key is already mapped', async () => {
    vi.mocked(idempotency.get).mockResolvedValueOnce('existing-job-id');
    const queue = makeMockQueue();
    const app = buildApp(queue);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'test-key-123',
      },
      payload: JSON.stringify(validPortfolioBody),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(body['cached']).toBe(true);
    expect(body['jobId']).toBe('existing-job-id');
    // Should NOT have called queue.add
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('stores new idempotency key after successful enqueue', async () => {
    vi.mocked(idempotency.get).mockResolvedValueOnce(null);
    vi.mocked(idempotency.set).mockResolvedValueOnce(undefined);
    const queue = makeMockQueue();
    const app = buildApp(queue);

    await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'new-key-abc',
      },
      payload: JSON.stringify(validPortfolioBody),
    });

    expect(idempotency.set).toHaveBeenCalledWith('new-key-abc', 'job-test-1');
  });
});

// ─── GET /v1/simulations/:id ──────────────────────────────────────────────────

describe('GET /v1/simulations/:id', () => {
  it('returns 404 when job is not found', async () => {
    const queue = makeMockQueue({ getJob: vi.fn().mockResolvedValue(null) });
    const app = buildApp(queue);
    const res = await app.inject({ method: 'GET', url: '/v1/simulations/unknown-id' });
    expect(res.statusCode).toBe(404);
  });

  it('returns job state for an existing job', async () => {
    const mockJob = {
      id: 'job-abc',
      data: { kind: 'portfolio_risk' },
      timestamp: Date.now(),
      processedOn: undefined,
      finishedOn: undefined,
      progress: undefined,
      getState: vi.fn().mockResolvedValue('active'),
    };
    const queue = makeMockQueue({ getJob: vi.fn().mockResolvedValue(mockJob) });
    const app = buildApp(queue);
    const res = await app.inject({ method: 'GET', url: '/v1/simulations/job-abc' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(body['status']).toBe('active');
    expect(body['jobId']).toBe('job-abc');
    expect(body['kind']).toBe('portfolio_risk');
  });
});

// ─── GET /v1/simulations/:id/result ──────────────────────────────────────────

describe('GET /v1/simulations/:id/result', () => {
  it('returns 200 with cached result when available', async () => {
    const cachedResult = { summary: { probabilityBelowZero: 0.05 } };
    vi.mocked(resultCache.get).mockResolvedValueOnce(cachedResult);
    const app = buildApp(makeMockQueue());
    const res = await app.inject({ method: 'GET', url: '/v1/simulations/job-with-result/result' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual(cachedResult);
  });

  it('returns 404 when job does not exist', async () => {
    vi.mocked(resultCache.get).mockResolvedValueOnce(null);
    const queue = makeMockQueue({ getJob: vi.fn().mockResolvedValue(null) });
    const app = buildApp(queue);
    const res = await app.inject({ method: 'GET', url: '/v1/simulations/ghost/result' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 202 when job is still running', async () => {
    vi.mocked(resultCache.get).mockResolvedValueOnce(null);
    const mockJob = {
      id: 'running-job',
      data: {},
      failedReason: undefined,
      returnvalue: undefined,
      getState: vi.fn().mockResolvedValue('active'),
    };
    const queue = makeMockQueue({ getJob: vi.fn().mockResolvedValue(mockJob) });
    const app = buildApp(queue);
    const res = await app.inject({ method: 'GET', url: '/v1/simulations/running-job/result' });
    expect(res.statusCode).toBe(202);
  });

  it('returns 422 when job has failed', async () => {
    vi.mocked(resultCache.get).mockResolvedValueOnce(null);
    const mockJob = {
      id: 'failed-job',
      data: {},
      failedReason: 'Invalid matrix',
      returnvalue: undefined,
      getState: vi.fn().mockResolvedValue('failed'),
    };
    const queue = makeMockQueue({ getJob: vi.fn().mockResolvedValue(mockJob) });
    const app = buildApp(queue);
    const res = await app.inject({ method: 'GET', url: '/v1/simulations/failed-job/result' });
    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect((body['error'] as Record<string, unknown>)['code']).toBe('JOB_FAILED');
  });
});

// ─── POST /v1/simulations — queue depth guard ─────────────────────────────────

describe('POST /v1/simulations — queue depth guard', () => {
  it('returns 503 when the queue waiting count is at or above QUEUE_MAX_WAITING', async () => {
    // Default QUEUE_MAX_WAITING env default is 500; mock waiting = 500 → triggers guard.
    const queue = makeMockQueue({
      getWaitingCount: vi.fn().mockResolvedValue(500),
    });
    const app = buildApp(queue);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(validPortfolioBody),
    });

    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect((body['error'] as Record<string, unknown>)['code']).toBe('QUEUE_FULL');
    // Should NOT have called queue.add
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('proceeds normally when queue depth is below the ceiling', async () => {
    const queue = makeMockQueue({
      getWaitingCount: vi.fn().mockResolvedValue(499),
    });
    const app = buildApp(queue);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(validPortfolioBody),
    });

    expect(res.statusCode).toBe(202);
    expect(queue.add).toHaveBeenCalledTimes(1);
  });
});

// ─── POST /v1/simulations — content-hash deduplication ───────────────────────

describe('POST /v1/simulations — content-hash deduplication', () => {
  it('returns 200 with cached: true when content hash matches a previous result', async () => {
    const cachedResult = { summary: { probabilityBelowZero: 0.1 } };
    vi.mocked(contentHashCache.get).mockResolvedValueOnce(cachedResult);

    const queue = makeMockQueue();
    const app = buildApp(queue);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(validCashflowBody),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(body['cached']).toBe(true);
    expect(typeof body['jobId']).toBe('string');
    // No new job should have been created.
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('creates a new job when content hash has no prior result', async () => {
    vi.mocked(contentHashCache.get).mockResolvedValueOnce(null);

    const queue = makeMockQueue();
    const app = buildApp(queue);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/simulations',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(validPortfolioBody),
    });

    expect(res.statusCode).toBe(202);
    expect(queue.add).toHaveBeenCalledTimes(1);
  });
});
