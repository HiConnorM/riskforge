'use client'

/**
 * useSimulation — React hook for running Monte Carlo simulations against the
 * RiskForge API.
 *
 * Lifecycle:
 *   idle → queued (POST /v1/simulations) → running (polling /result every 1s)
 *       → done (result received) or error
 *
 * The hook automatically cleans up its polling interval on unmount.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  createSimulation,
  getSimulationResult,
  ApiError,
  type PortfolioSimRequest,
  type CashflowSimRequest,
} from '@/lib/api-client'

export type SimStatus = 'idle' | 'queued' | 'running' | 'done' | 'error'

interface UseSimulationOptions<TResult> {
  /** How often to poll for results. Default: 800 ms. */
  pollIntervalMs?: number
  /** Called once when simulation completes successfully. */
  onSuccess?: (result: TResult) => void
  /** Called when the simulation fails (network error, job failure, etc.). */
  onError?: (error: Error) => void
}

export interface SimulationState<TResult> {
  /** Current lifecycle phase. */
  status: SimStatus
  /** Result payload — non-null only when status === 'done'. */
  result: TResult | null
  /** Human-readable error — non-null only when status === 'error'. */
  error: string | null
  /** True while status is 'queued' or 'running'. */
  isLoading: boolean
  /** Elapsed wall-clock time in ms since `run()` was called. */
  elapsedMs: number
  /** Enqueue and start a new simulation. Resets any previous state. */
  run: (payload: PortfolioSimRequest | CashflowSimRequest) => void
  /** Reset to idle, cancelling any in-progress poll. */
  reset: () => void
}

export function useSimulation<TResult = unknown>(
  options: UseSimulationOptions<TResult> = {},
): SimulationState<TResult> {
  const { pollIntervalMs = 800, onSuccess, onError } = options

  const [status, setStatus] = useState<SimStatus>('idle')
  const [result, setResult] = useState<TResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  // Stable refs — avoid stale closure problems without re-subscribing effects.
  const jobIdRef = useRef<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Callbacks stabilised via ref so `poll` doesn't change identity.
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  const stopAll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null }
  }, [])

  // Cleanup on unmount.
  useEffect(() => stopAll, [stopAll])

  const poll = useCallback(async () => {
    const jobId = jobIdRef.current
    if (!jobId) return

    try {
      const data = await getSimulationResult<TResult>(jobId)
      stopAll()
      setElapsedMs(Date.now() - startTimeRef.current)
      setResult(data)
      setStatus('done')
      onSuccessRef.current?.(data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 202) {
        // Job still running — stay in 'running', keep polling.
        setStatus('running')
        return
      }
      stopAll()
      const msg =
        err instanceof ApiError
          ? `${err.code}: ${err.message}`
          : err instanceof Error
          ? err.message
          : 'Unknown error'
      setElapsedMs(Date.now() - startTimeRef.current)
      setError(msg)
      setStatus('error')
      onErrorRef.current?.(err instanceof Error ? err : new Error(msg))
    }
  }, [stopAll])

  const run = useCallback(
    async (payload: PortfolioSimRequest | CashflowSimRequest) => {
      stopAll()
      setStatus('queued')
      setResult(null)
      setError(null)
      setElapsedMs(0)
      startTimeRef.current = Date.now()

      // Elapsed-time ticker (updates every 100 ms while loading).
      elapsedRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current)
      }, 100)

      try {
        const { jobId } = await createSimulation(payload)
        jobIdRef.current = jobId
        setStatus('running')
        // Start polling — first check after one interval.
        pollRef.current = setInterval(poll, pollIntervalMs)
      } catch (err) {
        stopAll()
        const msg =
          err instanceof ApiError
            ? `${err.code}: ${err.message}`
            : err instanceof Error
            ? err.message
            : 'Failed to create simulation'
        setElapsedMs(Date.now() - startTimeRef.current)
        setError(msg)
        setStatus('error')
        onErrorRef.current?.(err instanceof Error ? err : new Error(msg))
      }
    },
    [stopAll, poll, pollIntervalMs],
  )

  const reset = useCallback(() => {
    stopAll()
    jobIdRef.current = null
    setStatus('idle')
    setResult(null)
    setError(null)
    setElapsedMs(0)
  }, [stopAll])

  return {
    status,
    result,
    error,
    isLoading: status === 'queued' || status === 'running',
    elapsedMs,
    run,
    reset,
  }
}
