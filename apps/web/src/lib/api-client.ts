/**
 * RiskForge API client.
 *
 * Thin, type-safe wrapper around the Fastify API. All methods throw `ApiError`
 * on non-2xx responses so callers can distinguish network failures from
 * domain errors.
 *
 * Base URL is read from the `NEXT_PUBLIC_API_URL` environment variable and
 * defaults to `http://localhost:3001` (the API dev-server port).
 */

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '')

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

// ─── Response shapes ─────────────────────────────────────────────────────────

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

// ─── Portfolio simulation types ───────────────────────────────────────────────

export interface AssetInput {
  name: string
  /** Portfolio weight in [0, 1]. All weights must sum to 1. */
  weight: number
  /** Annualised expected return (e.g. 0.08 = 8%). */
  mu: number
  /** Annualised volatility (e.g. 0.16 = 16%). */
  sigma: number
}

export interface PortfolioSimRequest {
  kind: 'portfolio_risk'
  input: {
    assets: AssetInput[]
    /** n×n correlation matrix. Row/col order matches `assets`. */
    corr: number[][]
  }
  config: {
    paths: number
    horizonDays: number
    distribution?: 'normal' | 'student_t'
    df?: number
    seed?: number
    stress?: { factor: number; targetCorr: number }
  }
}

export interface PortfolioRiskResult {
  summary: {
    portfolioVaR95: number
    portfolioVaR99: number
    expectedShortfall95: number
    expectedShortfall99: number
    portfolioVolatility: number
    sharpeRatio: number
    maxDrawdown: number
    probabilityOfLoss: number
    meanReturn: number
    medianReturn: number
    skewness: number
    kurtosis: number
    returnAtP5: number
    returnAtP25: number
    returnAtP75: number
  }
  interpretation: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    drivers: string[]
    summary: string
    stressImpact?: string
  }
  meta: {
    paths: number
    horizonDays: number
    distribution: string
    seed: number
    engineVersion: string
    elapsedMs: number
    stressed: boolean
  }
  attribution?: {
    componentVaR95: number[]
    componentVaR99: number[]
    percentContributions95: number[]
    percentContributions99: number[]
    marginalVaR95: number[]
    diversificationBenefit95: number
  }
}

// ─── Cashflow simulation types ────────────────────────────────────────────────

export interface RiskEvent {
  name: string
  /** Must match the domain RiskEventSchema category enum. */
  category:
    | 'car'
    | 'pet'
    | 'medical'
    | 'housing'
    | 'food'
    | 'shopping'
    | 'job'
    | 'family'
    | 'utility'
    | 'appliance'
    | 'other'
  probabilityPerMonth: number
  minCost: number
  likelyCost?: number
  maxCost: number
  maxOccurrences?: number
}

export interface IncomeShock {
  name: string
  probabilityPerYear: number
  incomeFractionLost: number
  durationMonthsMin: number
  durationMonthsMax: number
}

export interface CashflowSimRequest {
  kind: 'personal_cashflow_risk'
  input: {
    monthlyIncome: number
    monthlyFixedExpenses: number
    monthlyVariableExpenses: number
    currentSavings: number
    horizonMonths: number
    riskEvents: RiskEvent[]
    emergencyThreshold?: number
    inflationRate?: number
    incomeShocks?: IncomeShock[]
  }
  config: {
    paths: number
    seed?: number
  }
}

export interface CashflowRiskResult {
  summary: {
    probabilityBelowZero: number
    probabilityBelowEmergencyThreshold: number
    medianEndBalance: number
    meanEndBalance: number
    worstCaseBalance: number
    bestCaseBalance: number
    expectedTotalEventCost: number
    mostFragileMonth: number
    monthsToDepletionP50: number
  }
  interpretation: {
    resilienceLevel: 'stable' | 'watch' | 'fragile' | 'critical'
    topRiskEvents: string[]
    summary: string
    suggestedActions: string[]
  }
  meta: {
    paths: number
    horizonMonths: number
    seed: number
    engineVersion: string
    elapsedMs: number
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        'content-type': 'application/json',
        ...(init?.headers as Record<string, string>),
      },
      ...init,
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
  payload: PortfolioSimRequest | CashflowSimRequest,
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
