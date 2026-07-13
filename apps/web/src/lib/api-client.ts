/**
 * RiskForge API client.
 *
 * Thin, type-safe wrapper around the Fastify API. All methods throw `ApiError`
 * on non-2xx responses so callers can distinguish network failures from
 * domain errors.
 *
 * Simulation request/result types come from `@riskforge/domain` — the single
 * source of truth shared with the API and worker. Do NOT redeclare contract
 * types here; only HTTP-transport shapes (EnqueuedJob, JobState, ApiError)
 * belong in this file.
 *
 * Base URL is read from the `NEXT_PUBLIC_API_URL` environment variable and
 * defaults to `http://localhost:3001` (the API dev-server port).
 */

import type {
  SimulationRequest,
  PersonalCashflowInput,
  PersonalCashflowResult,
  PortfolioAsset,
} from '@riskforge/domain'

// ─── Shared simulation contract (re-exported from @riskforge/domain) ─────────

export type {
  SimulationRequest,
  PortfolioAsset,
  PortfolioRiskInput,
  PortfolioSimConfig,
  StressConfig,
  PortfolioRiskResult,
  RiskEvent,
  PersonalCashflowInput,
  CashflowSimConfig,
  PersonalCashflowResult,
} from '@riskforge/domain'

/** The `portfolio_risk` arm of the request union. */
export type PortfolioSimRequest = Extract<SimulationRequest, { kind: 'portfolio_risk' }>

/** The `personal_cashflow_risk` arm of the request union. */
export type CashflowSimRequest = Extract<SimulationRequest, { kind: 'personal_cashflow_risk' }>

/** Income shock input shape, derived from the domain input schema. */
export type IncomeShock = NonNullable<PersonalCashflowInput['incomeShocks']>[number]

// Legacy aliases so existing imports keep compiling. Prefer the domain names.
export type AssetInput = PortfolioAsset
export type CashflowRiskResult = PersonalCashflowResult

// ─── Error type ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── HTTP-transport response shapes (owned by this client) ───────────────────

export interface EnqueuedJob {
  jobId: string
  status: 'queued'
  cached?: boolean
}

export interface JobState {
  jobId: string
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
  kind: string
  enqueuedAt: number
  startedAt?: number
  finishedAt?: number
  progress?: number
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '')

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`

  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers as Record<string, string>),
      },
    })
  } catch (cause) {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      `Could not reach the RiskForge API at ${API_BASE}. Is the API server running?`,
    )
  }

  // 202 from result endpoint = "still processing" — caller decides what to do.
  if (res.status === 202 && path.endsWith('/result')) {
    throw new ApiError(202, 'STILL_PROCESSING', 'Simulation is still running')
  }

  let body: unknown
  try {
    body = await res.json()
  } catch {
    throw new ApiError(res.status, 'PARSE_ERROR', 'Invalid JSON from API')
  }

  if (!res.ok) {
    const err = (body as Record<string, unknown>)?.error as
      | Record<string, unknown>
      | undefined
    throw new ApiError(
      res.status,
      String(err?.code ?? 'UNKNOWN_ERROR'),
      String(err?.message ?? `HTTP ${res.status}`),
    )
  }

  return body as T
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * POST /v1/simulations
 * Enqueue a new simulation job. Returns the job ID immediately (202).
 */
export async function createSimulation(
  payload: SimulationRequest,
  idempotencyKey?: string,
): Promise<EnqueuedJob> {
  return request<EnqueuedJob>('/v1/simulations', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: idempotencyKey ? { 'idempotency-key': idempotencyKey } : {},
  })
}

/**
 * GET /v1/simulations/:id
 * Fetch the current state (queued / active / completed / failed) of a job.
 */
export async function getJobState(jobId: string): Promise<JobState> {
  return request<JobState>(`/v1/simulations/${jobId}`)
}

/**
 * GET /v1/simulations/:id/result
 * Fetch the final result of a completed simulation.
 * Throws `ApiError(202, 'STILL_PROCESSING')` when the job is not yet done.
 */
export async function getSimulationResult<T = unknown>(
  jobId: string,
): Promise<T> {
  return request<T>(`/v1/simulations/${jobId}/result`)
}

/** Convenience: check API health */
export async function checkHealth(): Promise<{ status: string; version: string }> {
  return request('/health')
}
