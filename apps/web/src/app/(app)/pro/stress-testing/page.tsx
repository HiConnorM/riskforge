'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine,
} from 'recharts'
import { Activity, Play, ChevronDown, ChevronUp, TrendingDown, TrendingUp, Plus, BookOpen, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { stressTests, portfolioSummary } from '@/lib/mock-data/pro'
import { portfolioHoldings } from '@/lib/mock-data/pro'
import { useSimulation } from '@/hooks/useSimulation'
import { SCENARIOS } from '@/lib/scenarios/definitions'
import { toPortfolioRequest } from '@/lib/scenarios/to-request'
import type { ScenarioDefinition } from '@/lib/scenarios/types'
import { BUNDLES } from '@/lib/scenarios/bundles'
import { formatCurrency, cn } from '@/lib/utils'
import type { PortfolioRiskResult, PortfolioSimRequest, AssetInput } from '@/lib/api-client'

// Scenarios with portfolio params (macro + market_portfolio)
const MACRO_SCENARIOS = SCENARIOS.filter(
  (s) =>
    (s.group === 'macro_historical' || s.group === 'market_portfolio') &&
    s.portfolioParams,
)

// Portfolio bundle IDs for the bundle gauntlet feature
const PORTFOLIO_BUNDLES = BUNDLES.filter((b) => b.tier === 'pro')

const defaultMuByClass: Record<string, number> = {
  equity: 0.08,
  'fixed-income': 0.04,
  crypto: 0.20,
  commodities: 0.05,
  cash: 0.04,
  alternatives: 0.07,
}

/** Stress scenario definitions — map to API stress parameters. */
const STRESS_SCENARIOS = [
  {
    id: 'gfc',
    name: '2008 Global Financial Crisis',
    description: 'Severe credit contraction, interbank freeze, correlated equity selloff.',
    factor: 3.5,
    targetCorr: 0.85,
    horizonDays: 252,
  },
  {
    id: 'dot-com',
    name: '2000 Dot-com Crash',
    description: 'Tech sector implosion, prolonged bear market over 30 months.',
    factor: 2.8,
    targetCorr: 0.70,
    horizonDays: 63,
  },
  {
    id: 'covid',
    name: 'COVID-19 Crash (Mar 2020)',
    description: 'Sudden liquidity shock, 34% peak-to-trough in 33 days.',
    factor: 4.0,
    targetCorr: 0.90,
    horizonDays: 21,
  },
  {
    id: 'rate-shock',
    name: '2022 Rate Shock',
    description: 'Aggressive Fed hiking cycle, equity/bond correlation turns positive.',
    factor: 2.0,
    targetCorr: 0.60,
    horizonDays: 252,
  },
  {
    id: 'mild',
    name: 'Mild Correction (-15%)',
    description: 'Normal market correction, typical risk-off environment.',
    factor: 1.5,
    targetCorr: 0.55,
    horizonDays: 21,
  },
] as const

type ScenarioId = (typeof STRESS_SCENARIOS)[number]['id']

function buildStressRequest(scenarioId: ScenarioId, paths: number): PortfolioSimRequest {
  const scenario = STRESS_SCENARIOS.find((s) => s.id === scenarioId)!
  const active = portfolioHoldings.filter((h) => h.weight > 0)
  const totalWeight = active.reduce((s, h) => s + h.weight, 0)

  const assets: AssetInput[] = active.map((h) => ({
    name: h.symbol,
    weight: h.weight / totalWeight,
    mu: defaultMuByClass[h.assetClass] ?? 0.06,
    sigma: Math.max(h.volatility / 100, 0.001),
  }))

  const n = assets.length
  const corr = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  )

  return {
    kind: 'portfolio_risk',
    input: { assets, corr },
    config: {
      paths,
      horizonDays: scenario.horizonDays,
      distribution: 'student_t',
      df: 4,
      stress: { factor: scenario.factor, targetCorr: scenario.targetCorr },
    },
  }
}

export default function StressTestingPage() {
  const [expanded, setExpanded]         = useState<string>('st-001')
  const [activeScenario, setActiveScenario] = useState<ScenarioId | null>(null)
  const [paths, setPaths]               = useState(20_000)
  const [liveResults, setLiveResults]   = useState<Record<ScenarioId, PortfolioRiskResult | null>>(
    {} as Record<ScenarioId, PortfolioRiskResult | null>,
  )

  // Macro scenario state
  const [macroRunningId, setMacroRunningId]   = useState<string | null>(null)
  const [macroResults, setMacroResults]       = useState<Record<string, PortfolioRiskResult>>({})
  const [macroErrors, setMacroErrors]         = useState<Record<string, string>>({})
  const [expandedMacro, setExpandedMacro]     = useState<string | null>(null)

  const sim = useSimulation<PortfolioRiskResult>({
    onSuccess: (result) => {
      if (activeScenario) {
        setLiveResults((prev) => ({ ...prev, [activeScenario]: result }))
      }
    },
  })

  // Separate sim instance for macro scenarios to avoid conflict
  const macroSim = useSimulation<PortfolioRiskResult>({
    onSuccess: (result) => {
      if (macroRunningId) {
        setMacroResults((r) => ({ ...r, [macroRunningId]: result }))
        setMacroRunningId(null)
      }
    },
    onError: (err) => {
      if (macroRunningId) {
        setMacroErrors((e) => ({ ...e, [macroRunningId]: err.message }))
        setMacroRunningId(null)
      }
    },
  })

  const runMacroScenario = useCallback(
    (scenario: ScenarioDefinition) => {
      const holdings = portfolioHoldings
        .filter((h) => h.weight > 0)
        .map((h) => ({
          name: h.symbol,
          weight: h.weight,
          volatility: h.volatility,
          assetClass: h.assetClass,
        }))
      const req = toPortfolioRequest(scenario, holdings, Math.min(paths, 20_000))
      if (!req) return
      setMacroRunningId(scenario.id)
      setMacroErrors((e) => { const n = { ...e }; delete n[scenario.id]; return n })
      macroSim.run(req)
    },
    [macroSim, paths],
  )

  const runScenario = useCallback(
    (scenarioId: ScenarioId) => {
      setActiveScenario(scenarioId)
      sim.run(buildStressRequest(scenarioId, paths))
    },
    [sim, paths],
  )

  const runAll = useCallback(async () => {
    // Run scenarios sequentially (can't parallelise — one API connection).
    for (const scenario of STRESS_SCENARIOS) {
      setActiveScenario(scenario.id)
      await new Promise<void>((resolve) => {
        sim.run(buildStressRequest(scenario.id, Math.min(paths, 10_000)))
        // Poll until done — hacky but works without saga infrastructure.
        const tid = setInterval(() => {
          if (sim.status === 'done' || sim.status === 'error') {
            clearInterval(tid)
            resolve()
          }
        }, 200)
      })
    }
  }, [sim, paths])

  // Use static stressTests for the accordion/chart, but overlay live data if available.
  const chartData = STRESS_SCENARIOS.map((s) => {
    const live = liveResults[s.id]
    return {
      name: s.name.split(' ').slice(0, 2).join(' '),
      id: s.id,
      impact: live
        ? -(live.summary.portfolioVaR99 * 100)
        : stressTests.find((t) => t.id === 'st-' + (STRESS_SCENARIOS.indexOf(s) + 1).toString().padStart(3, '0'))?.portfolioImpactPct ?? -10,
      isLive: !!live,
    }
  })

  return (
    <div className="p-6 space-y-5 max-w-[1300px]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Stress Testing</h2>
          <p className="text-sm text-text-muted">
            Replay historical crises and custom scenarios against your portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Paths selector */}
          <div className="flex gap-1">
            {[
              { label: '5k', n: 5_000 },
              { label: '20k', n: 20_000 },
              { label: '50k', n: 50_000 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => setPaths(p.n)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  paths === p.n
                    ? 'bg-brand-500/20 text-brand-400 border-brand-500/30'
                    : 'text-text-muted border-white/[0.07]',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Custom Scenario
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={runAll}
            disabled={sim.isLoading}
          >
            <Play className={cn('w-4 h-4 mr-1.5', sim.isLoading && 'animate-pulse')} />
            {sim.isLoading ? 'Running…' : 'Run All Tests'}
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="custom">
        <TabsList>
          <TabsTrigger value="custom">
            <Activity className="w-3.5 h-3.5 mr-1.5" />
            Custom Scenarios
          </TabsTrigger>
          <TabsTrigger value="historical">
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            Historical Events ({MACRO_SCENARIOS.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="custom" className="space-y-5 mt-4">

      {/* Running indicator */}
      {sim.isLoading && activeScenario && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/5 border border-brand-500/20"
        >
          <Activity className="w-4 h-4 text-brand-400 animate-pulse" />
          <span className="text-sm text-brand-300">
            Running{' '}
            <span className="font-semibold">
              {STRESS_SCENARIOS.find((s) => s.id === activeScenario)?.name}
            </span>{' '}
            · {(sim.elapsedMs / 1000).toFixed(1)}s
          </span>
        </motion.div>
      )}

      {/* Error state */}
      {sim.status === 'error' && (
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-sm text-red-400">
          {sim.error}
        </div>
      )}

      {/* Summary chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card-base rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Scenario Impact Overview</h3>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />
            Live simulation
            <span className="w-2 h-2 rounded-full bg-slate-600 inline-block ml-2" />
            Estimated
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" />
              <Tooltip
                contentStyle={{ background: '#1e2535', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px', color: '#f1f5f9' }}
                formatter={(v: number) => [`${v.toFixed(1)}%`, 'VaR 99% impact']}
              />
              <Bar dataKey="impact" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.isLive
                        ? entry.impact < 0
                          ? '#ef4444'
                          : '#10b981'
                        : entry.impact < 0
                        ? '#4b5563'
                        : '#374151'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Individual scenario cards */}
      <div className="space-y-4">
        {STRESS_SCENARIOS.map((scenario, i) => {
          const live = liveResults[scenario.id]
          const isExpanded = expanded === scenario.id
          const isRunning = sim.isLoading && activeScenario === scenario.id
          const var99Pct = live ? -(live.summary.portfolioVaR99 * 100) : null
          const isNegative = (var99Pct ?? -1) < 0

          return (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                'rounded-xl border overflow-hidden transition-all',
                live
                  ? isNegative
                    ? 'border-red-500/20 bg-red-500/3'
                    : 'border-emerald-500/20 bg-emerald-500/3'
                  : 'border-white/[0.08] bg-white/[0.01]',
              )}
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(isExpanded ? '' : scenario.id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      live
                        ? isNegative
                          ? 'bg-red-500/15 border border-red-500/25'
                          : 'bg-emerald-500/15 border border-emerald-500/25'
                        : 'bg-white/[0.05] border border-white/[0.08]',
                    )}
                  >
                    {isRunning ? (
                      <Activity className="w-5 h-5 text-brand-400 animate-pulse" />
                    ) : live ? (
                      isNegative ? (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      )
                    ) : (
                      <Play className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{scenario.name}</h4>
                    <p className="text-xs text-text-muted">{scenario.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {live ? (
                    <div className="text-right">
                      <p className={cn('text-lg font-bold tabular', isNegative ? 'text-red-400' : 'text-emerald-400')}>
                        {var99Pct!.toFixed(1)}%
                      </p>
                      <p className="text-xs text-text-muted">VaR 99% · {scenario.horizonDays}d</p>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        runScenario(scenario.id)
                      }}
                      disabled={sim.isLoading}
                      className="text-xs"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Run
                    </Button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  )}
                </div>
              </button>

              {isExpanded && live && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="border-t border-white/[0.06] px-5 pb-5 pt-4"
                >
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                        {live.interpretation.summary}
                      </p>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {[
                          { label: 'VaR 95%', value: `${(live.summary.portfolioVaR95 * 100).toFixed(2)}%`, color: '#f59e0b' },
                          { label: 'VaR 99%', value: `${(live.summary.portfolioVaR99 * 100).toFixed(2)}%`, color: '#ef4444' },
                          { label: 'ES 95%', value: `${(live.summary.expectedShortfall95 * 100).toFixed(2)}%`, color: '#ef4444' },
                          { label: 'Max Drawdown', value: `${(live.summary.maxDrawdown * 100).toFixed(2)}%`, color: '#ef4444' },
                          { label: 'Sharpe', value: live.summary.sharpeRatio.toFixed(2), color: '#10b981' },
                          { label: 'Prob. Loss', value: `${(live.summary.probabilityOfLoss * 100).toFixed(1)}%`, color: '#f59e0b' },
                        ].map((m) => (
                          <div key={m.label} className="card-base rounded-lg p-3">
                            <p className="text-xs text-text-muted">{m.label}</p>
                            <p className="text-base font-bold tabular" style={{ color: m.color }}>
                              {m.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      {live.interpretation.drivers.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                            Risk Drivers
                          </p>
                          <ul className="space-y-2">
                            {live.interpretation.drivers.map((d, di) => (
                              <li key={di} className="flex items-start gap-2 text-sm text-text-secondary">
                                <span className="text-red-400 mt-0.5">•</span>
                                {d}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      <p className="text-xs text-text-muted mt-4">
                        {live.meta.paths.toLocaleString()} paths · {live.meta.distribution} ·{' '}
                        {live.meta.elapsedMs}ms
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {isExpanded && !live && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="border-t border-white/[0.06] px-5 pb-5 pt-4"
                >
                  <p className="text-sm text-text-muted mb-3">{scenario.description}</p>
                  <div className="flex gap-2">
                    <div className="text-xs text-text-muted">
                      <span className="text-text-secondary font-medium">Stress factor:</span>{' '}
                      {scenario.factor}×
                    </div>
                    <div className="text-xs text-text-muted ml-4">
                      <span className="text-text-secondary font-medium">Target correlation:</span>{' '}
                      {(scenario.targetCorr * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-text-muted ml-4">
                      <span className="text-text-secondary font-medium">Horizon:</span>{' '}
                      {scenario.horizonDays}d
                    </div>
                  </div>
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={() => runScenario(scenario.id)}
                    disabled={sim.isLoading}
                    className="mt-4"
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5" />
                    Run this scenario
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
        </TabsContent>

        {/* ── Historical Events tab ──────────────────────────────────────────── */}
        <TabsContent value="historical" className="space-y-4 mt-4">
          <p className="text-sm text-text-muted">
            Real-world-inspired scenarios grounded in historical data. Each runs your current
            portfolio through the stress parameters that characterized that event.
          </p>

          {/* Macro scenario running indicator */}
          {macroSim.isLoading && macroRunningId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/5 border border-brand-500/20"
            >
              <Activity className="w-4 h-4 text-brand-400 animate-pulse" />
              <span className="text-sm text-brand-300">
                Running{' '}
                <span className="font-semibold">
                  {MACRO_SCENARIOS.find((s) => s.id === macroRunningId)?.name}
                </span>{' '}
                · {(macroSim.elapsedMs / 1000).toFixed(1)}s
              </span>
            </motion.div>
          )}

          <div className="space-y-3">
            {MACRO_SCENARIOS.map((scenario, i) => {
              const live   = macroResults[scenario.id]
              const err    = macroErrors[scenario.id]
              const isRunning = macroRunningId === scenario.id && macroSim.isLoading
              const isExp  = expandedMacro === scenario.id
              const params = scenario.portfolioParams!
              const var99  = live ? live.summary.portfolioVaR99 * 100 : null

              return (
                <motion.div
                  key={scenario.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    'rounded-xl border overflow-hidden transition-colors',
                    live
                      ? 'border-red-500/20 bg-red-500/3'
                      : 'border-white/[0.08] bg-white/[0.01]',
                  )}
                >
                  {/* Header */}
                  <button
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedMacro(isExp ? null : scenario.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-semibold text-text-primary">{scenario.name}</h4>
                        <span className="text-2xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium capitalize">
                          {scenario.severity}
                        </span>
                        <span className="text-2xs text-text-muted">
                          {params.horizonDays}d horizon · {params.distribution}
                          {params.df && ` df=${params.df}`}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted line-clamp-1">{scenario.description}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {live && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-400 tabular">
                            {var99!.toFixed(2)}%
                          </p>
                          <p className="text-xs text-text-muted">VaR 99%</p>
                        </div>
                      )}
                      {isRunning ? (
                        <span className="text-xs text-brand-400 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 animate-pulse" />
                          {(macroSim.elapsedMs / 1000).toFixed(1)}s
                        </span>
                      ) : (
                        <Button
                          variant={live ? 'secondary' : 'brand'}
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); runMacroScenario(scenario) }}
                          disabled={macroSim.isLoading}
                          className="text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          {live ? 'Re-run' : 'Simulate'}
                        </Button>
                      )}
                      {isExp ? (
                        <ChevronUp className="w-4 h-4 text-text-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-text-muted" />
                      )}
                    </div>
                  </button>

                  {/* Expanded */}
                  <AnimatePresence>
                    {isExp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/[0.06] px-4 pb-4 pt-3"
                      >
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-text-secondary leading-relaxed mb-3">
                              {scenario.description}
                            </p>
                            {scenario.historicalRef && (
                              <div className="flex items-start gap-2 text-xs text-text-muted bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.05] mb-3">
                                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-brand-400" />
                                <span>{scenario.historicalRef}</span>
                              </div>
                            )}
                            <div className="text-xs text-text-muted bg-white/[0.03] rounded-lg p-3">
                              <p className="font-medium text-text-secondary mb-1">Model parameters</p>
                              <p>{params.description}</p>
                              <div className="flex gap-4 mt-2">
                                <span>Stress factor: <strong className="text-red-400">{params.stressFactor}×</strong></span>
                                <span>Target corr: <strong className="text-amber-400">{(params.targetCorr * 100).toFixed(0)}%</strong></span>
                              </div>
                            </div>
                          </div>

                          {err && (
                            <div className="text-xs text-red-400 bg-red-500/5 rounded-lg p-3 border border-red-500/20">
                              {err}
                            </div>
                          )}

                          {live && !err && (
                            <div className="space-y-3">
                              <p className="text-sm text-text-secondary leading-relaxed">
                                {live.interpretation.summary}
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { label: 'VaR 95%', value: `${(live.summary.portfolioVaR95 * 100).toFixed(2)}%`, color: '#f59e0b' },
                                  { label: 'VaR 99%', value: `${(live.summary.portfolioVaR99 * 100).toFixed(2)}%`, color: '#ef4444' },
                                  { label: 'ES 95%', value: `${(live.summary.expectedShortfall95 * 100).toFixed(2)}%`, color: '#ef4444' },
                                  { label: 'Max Drawdown', value: `${(live.summary.maxDrawdown * 100).toFixed(2)}%`, color: '#ef4444' },
                                  { label: 'Sharpe', value: live.summary.sharpeRatio.toFixed(2), color: '#10b981' },
                                  { label: 'Prob. Loss', value: `${(live.summary.probabilityOfLoss * 100).toFixed(1)}%`, color: '#f59e0b' },
                                ].map((m) => (
                                  <div key={m.label} className="bg-white/[0.03] rounded-lg p-2">
                                    <p className="text-xs text-text-muted">{m.label}</p>
                                    <p className="text-sm font-bold tabular" style={{ color: m.color }}>{m.value}</p>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-text-muted">
                                {live.meta.paths.toLocaleString()} paths · {live.meta.horizonDays}d · {live.meta.elapsedMs}ms
                              </p>
                            </div>
                          )}

                          {!live && !err && !isRunning && (
                            <div className="flex items-center justify-center text-text-muted text-sm">
                              <div className="text-center">
                                <Play className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p>Simulate to see how your portfolio holds up</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
