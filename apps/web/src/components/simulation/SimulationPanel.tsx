'use client'

/**
 * SimulationPanel — reusable component for displaying simulation status and
 * results. Used across the Pro Portfolio and Stress Testing pages.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { SimStatus } from '@/hooks/useSimulation'
import { cn } from '@/lib/utils'

interface SimulationPanelProps {
  status: SimStatus
  error: string | null
  elapsedMs: number
  onRun: () => void
  onReset: () => void
  children: React.ReactNode
  className?: string
}

export function SimulationPanel({
  status,
  error,
  elapsedMs,
  onRun,
  onReset,
  children,
  className,
}: SimulationPanelProps) {
  const isLoading = status === 'queued' || status === 'running'

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status bar */}
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-sm text-text-muted">
                Run a Monte Carlo simulation to see live risk metrics
              </span>
            </div>
            <Button variant="brand" size="sm" onClick={onRun}>
              Run Simulation
            </Button>
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl border border-brand-500/20 bg-brand-500/5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                <span className="text-sm text-brand-300 font-medium">
                  {status === 'queued' ? 'Queuing simulation…' : 'Running Monte Carlo…'}
                </span>
              </div>
              <span className="text-xs text-text-muted tabular">
                {(elapsedMs / 1000).toFixed(1)}s
              </span>
            </div>
            <Progress
              value={Math.min(95, (elapsedMs / 3000) * 100)}
              className="h-1"
              indicatorClassName="bg-brand-500"
            />
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-start justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-300">Simulation failed</p>
                <p className="text-xs text-text-muted mt-0.5">{error}</p>
                {error?.includes('NETWORK_ERROR') && (
                  <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    Make sure the API is running:{' '}
                    <code className="text-brand-400">
                      {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}
                    </code>
                  </p>
                )}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={onReset} className="flex-shrink-0">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retry
            </Button>
          </motion.div>
        )}

        {status === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">
                Simulation complete
              </span>
              <span className="text-xs text-text-muted">
                · {(elapsedMs / 1000).toFixed(2)}s
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={onRun}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Re-run
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results area — shown when done */}
      <AnimatePresence>
        {status === 'done' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
