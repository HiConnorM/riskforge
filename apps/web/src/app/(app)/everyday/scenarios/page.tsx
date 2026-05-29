'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Play, Package, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Loader2, RefreshCw, BookOpen, Zap, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useSimulation } from '@/hooks/useSimulation'
import { SCENARIOS, SCENARIOS_BY_ID, getScenariosByTier } from '@/lib/scenarios/definitions'
import { BUNDLES } from '@/lib/scenarios/bundles'
import { toCashflowRequest, DEFAULT_PROFILE } from '@/lib/scenarios/to-request'
import type { ScenarioDefinition, ScenarioGroup, Severity } from '@/lib/scenarios/types'
import type { CashflowRiskResult } from '@/lib/api-client'
import { formatCurrency, cn } from '@/lib/utils'

// ─── Group display config ─────────────────────────────────────────────────────

const GROUPS: Record<ScenarioGroup, { label: string; emoji: string; color: string }> = {
  income_job:       { label: 'Income & Job',       emoji: '💼', color: '#4f8ef7' },
  housing:          { label: 'Housing',             emoji: '🏠', color: '#f59e0b' },
  transportation:   { label: 'Transportation',      emoji: '🚗', color: '#38bdf8' },
  health:           { label: 'Health',              emoji: '🏥', color: '#10b981' },
  pet:              { label: 'Pets',                emoji: '🐾', color: '#a78bfa' },
  food_living:      { label: 'Food & Living',       emoji: '🛒', color: '#f97316' },
  debt_credit:      { label: 'Debt & Credit',       emoji: '💳', color: '#ef4444' },
  family:           { label: 'Family',              emoji: '👨‍👩‍👧', color: '#6366f1' },
  disaster:         { label: 'Disasters',           emoji: '⚡', color: '#dc2626' },
  macro_historical: { label: 'Macro / Historical',  emoji: '🏛️', color: '#64748b' },
  market_portfolio: { label: 'Portfolio',           emoji: '📊', color: '#84cc16' },
}

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string }> = {
  mild:     { label: 'Mild',     color: '#10b981', bg: 'bg-emerald-500/10' },
  moderate: { label: 'Moderate', color: '#f59e0b', bg: 'bg-amber-500/10' },
  severe:   { label: 'Severe',   color: '#f97316', bg: 'bg-orange-500/10' },
  extreme:  { label: 'Extreme',  color: '#ef4444', bg: 'bg-red-500/10' },
}

// ─── Resilience colour ────────────────────────────────────────────────────────

function resilienceColor(level: string) {
  switch (level) {
    case 'stable':   return '#10b981'
    case 'watch':    return '#f59e0b'
    case 'fragile':  return '#f97316'
    case 'critical': return '#ef4444'
    default:         return '#64748b'
  }
}

// ─── Individual scenario card ─────────────────────────────────────────────────

function ScenarioRow({
  scenario,
  onRun,
  result,
  isRunning,
  elapsedMs,
  error,
  delay = 0,
}: {
  scenario: ScenarioDefinition
  onRun: (s: ScenarioDefinition) => void
  result: CashflowRiskResult | null
  isRunning: boolean
  elapsedMs: number
  error: string | null
  delay?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const sevConf = SEVERITY_CONFIG[scenario.severity]
  const groupConf = GROUPS[scenario.group]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'rounded-xl border overflow-hidden transition-colors',
        result
          ? result.interpretation.resilienceLevel === 'stable'
            ? 'border-emerald-500/20 bg-emerald-500/3'
            : result.interpretation.resilienceLevel === 'watch'
            ? 'border-amber-500/20 bg-amber-500/3'
            : 'border-red-500/20 bg-red-500/3'
          : 'border-white/[0.08] bg-white/[0.01]',
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        {/* Group icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `${groupConf.color}15` }}
        >
          {groupConf.emoji}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary">{scenario.name}</h3>
            <span
              className="text-2xs px-1.5 py-0.5 rounded font-medium"
              style={{ color: sevConf.color, background: `${sevConf.color}15` }}
            >
              {sevConf.label}
            </span>
            <span className="text-2xs text-text-muted">
              ~{scenario.annualProbabilityPct}%/yr
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{scenario.description}</p>
        </div>

        {/* Result badge or run button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {result && (
            <div className="text-right mr-1">
              <p
                className="text-sm font-bold tabular"
                style={{ color: resilienceColor(result.interpretation.resilienceLevel) }}
              >
                {result.interpretation.resilienceLevel.toUpperCase()}
              </p>
              <p className="text-xs text-text-muted">
                {(result.summary.probabilityBelowZero * 100).toFixed(0)}% depleted
              </p>
            </div>
          )}

          {isRunning ? (
            <div className="flex items-center gap-1.5 text-brand-400 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {(elapsedMs / 1000).toFixed(1)}s
            </div>
          ) : (
            <Button
              variant={result ? 'secondary' : 'brand'}
              size="sm"
              onClick={() => onRun(scenario)}
              className="text-xs"
            >
              <Play className="w-3 h-3 mr-1" />
              {result ? 'Re-run' : 'Simulate'}
            </Button>
          )}

          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1.5 text-text-muted hover:text-text-secondary transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.06] px-4 pb-4 pt-3"
          >
            <div className="grid md:grid-cols-2 gap-4">
              {/* Scenario description */}
              <div>
                <p className="text-sm text-text-secondary mb-2 leading-relaxed">
                  {scenario.description}
                </p>
                {scenario.historicalRef && (
                  <div className="flex items-start gap-1.5 text-xs text-text-muted bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.05]">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-brand-400" />
                    <span>{scenario.historicalRef}</span>
                  </div>
                )}
                <div className="flex gap-4 mt-3 text-xs">
                  <div>
                    <span className="text-text-muted">Horizon: </span>
                    <span className="text-text-secondary font-medium">{scenario.horizonMonths} months</span>
                  </div>
                  {scenario.inflationRate && (
                    <div>
                      <span className="text-text-muted">Inflation: </span>
                      <span className="text-text-secondary font-medium">
                        {(scenario.inflationRate * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {scenario.incomeShocks && scenario.incomeShocks.length > 0 && (
                    <div>
                      <span className="text-text-muted">Income loss: </span>
                      <span className="text-red-400 font-medium">
                        {(scenario.incomeShocks[0]!.incomeFractionLost * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Simulation results */}
              {error && (
                <div className="text-xs text-red-400 bg-red-500/5 rounded-lg p-3 border border-red-500/20">
                  {error}
                </div>
              )}

              {result && !error && (
                <div className="space-y-3">
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: resilienceColor(result.interpretation.resilienceLevel) }}
                  >
                    {result.interpretation.plainEnglishSummary}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        label: 'Depleted risk',
                        value: `${(result.summary.probabilityBelowZero * 100).toFixed(1)}%`,
                        color: result.summary.probabilityBelowZero > 0.3 ? '#ef4444' : '#f59e0b',
                      },
                      {
                        label: 'Median balance',
                        value: formatCurrency(result.summary.medianEndingBalance, { compact: true }),
                        color: result.summary.medianEndingBalance > 0 ? '#10b981' : '#ef4444',
                      },
                      {
                        label: 'Event cost',
                        value: formatCurrency(result.summary.expectedTotalEventCost, { compact: true }),
                        color: '#f59e0b',
                      },
                    ].map((m) => (
                      <div key={m.label} className="bg-white/[0.03] rounded-lg p-2">
                        <p className="text-xs text-text-muted">{m.label}</p>
                        <p className="text-sm font-bold tabular" style={{ color: m.color }}>
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {result.interpretation.suggestedActions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                        Suggested Actions
                      </p>
                      <ul className="space-y-1">
                        {result.interpretation.suggestedActions.slice(0, 3).map((a, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-text-muted">
                    {result.meta.paths.toLocaleString()} paths · {result.meta.elapsedMs}ms
                  </p>
                </div>
              )}

              {!result && !error && !isRunning && (
                <div className="flex items-center justify-center text-text-muted text-sm">
                  <div className="text-center">
                    <Play className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Run the simulation to see your personalized risk analysis</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Bundle card ──────────────────────────────────────────────────────────────

function BundleCard({
  bundle,
  onSelect,
  isSelected,
}: {
  bundle: (typeof BUNDLES)[0]
  onSelect: (b: typeof BUNDLES[0]) => void
  isSelected: boolean
}) {
  return (
    <button
      onClick={() => onSelect(bundle)}
      className={cn(
        'text-left p-4 rounded-xl border transition-all hover:bg-white/[0.03]',
        isSelected
          ? 'border-brand-500/40 bg-brand-500/8'
          : 'border-white/[0.08] bg-white/[0.01]',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{bundle.emoji}</span>
        <h3 className="text-sm font-semibold text-text-primary">{bundle.name}</h3>
        {isSelected && (
          <span className="text-xs text-brand-400 ml-auto">Selected</span>
        )}
      </div>
      <p className="text-xs text-text-muted mb-2 leading-relaxed">{bundle.description}</p>
      <p className="text-xs" style={{ color: bundle.color }}>
        {bundle.scenarioIds.length} scenarios
      </p>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScenariosPage() {
  const [search, setSearch]           = useState('')
  const [activeGroup, setActiveGroup] = useState<ScenarioGroup | 'all'>('all')
  const [sevFilter, setSevFilter]     = useState<Severity | 'all'>('all')
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null)
  const [activeTab, setActiveTab]     = useState('scenarios')

  // Per-scenario simulation state (track last-run result per scenario ID)
  const [runningId, setRunningId]   = useState<string | null>(null)
  const [results, setResults]       = useState<Record<string, CashflowRiskResult>>({})
  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [elapsedMap, setElapsedMap] = useState<Record<string, number>>({})

  const sim = useSimulation<CashflowRiskResult>({
    onSuccess: (result) => {
      if (runningId) {
        setResults((r) => ({ ...r, [runningId]: result }))
        setRunningId(null)
      }
    },
    onError: (err) => {
      if (runningId) {
        setErrors((e) => ({ ...e, [runningId]: err.message }))
        setRunningId(null)
      }
    },
  })

  // Sync elapsed time to the running scenario
  useMemo(() => {
    if (runningId && sim.isLoading) {
      setElapsedMap((m) => ({ ...m, [runningId]: sim.elapsedMs }))
    }
  }, [runningId, sim.isLoading, sim.elapsedMs])

  const handleRun = useCallback(
    (scenario: ScenarioDefinition) => {
      setRunningId(scenario.id)
      setErrors((e) => { const n = { ...e }; delete n[scenario.id]; return n })
      sim.run(toCashflowRequest(scenario, DEFAULT_PROFILE))
    },
    [sim],
  )

  const handleBundleSelect = useCallback((bundle: (typeof BUNDLES)[0]) => {
    setSelectedBundle((prev) => (prev === bundle.id ? null : bundle.id))
  }, [])

  const handleRunBundle = useCallback(() => {
    if (!selectedBundle) return
    const bundle = BUNDLES.find((b) => b.id === selectedBundle)
    if (!bundle) return
    // Run the first scenario in the bundle (sequential would require a queue)
    const firstId = bundle.scenarioIds[0]
    const scenario = firstId ? SCENARIOS_BY_ID.get(firstId) : undefined
    if (scenario) handleRun(scenario)
  }, [selectedBundle, handleRun])

  // Filter scenarios
  const everydayScenarios = useMemo(
    () => getScenariosByTier('everyday'),
    [],
  )

  const filtered = useMemo(() => {
    let list = everydayScenarios

    if (selectedBundle) {
      const bundle = BUNDLES.find((b) => b.id === selectedBundle)
      if (bundle) {
        list = bundle.scenarioIds
          .map((id) => SCENARIOS_BY_ID.get(id))
          .filter((s): s is ScenarioDefinition => !!s && (s.tier === 'everyday' || s.tier === 'both'))
      }
    }

    return list.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      const matchGroup = activeGroup === 'all' || s.group === activeGroup
      const matchSev   = sevFilter === 'all' || s.severity === sevFilter
      return matchSearch && matchGroup && matchSev
    })
  }, [everydayScenarios, search, activeGroup, sevFilter, selectedBundle])

  const totalExposure = useMemo(
    () =>
      everydayScenarios.reduce((sum, s) => {
        const maxEvent = Math.max(...(s.riskEvents?.map((e) => e.maxCost) ?? [0]))
        return sum + maxEvent * (s.annualProbabilityPct / 100)
      }, 0),
    [everydayScenarios],
  )

  const completedCount = Object.keys(results).length

  return (
    <div className="p-6 space-y-6 max-w-[1300px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Scenario Library</h2>
          <p className="text-sm text-text-muted">
            {everydayScenarios.length} real-world risk scenarios · run live Monte Carlo simulations
          </p>
        </div>
        <div className="flex gap-2">
          {completedCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-1.5 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {completedCount} simulated
            </div>
          )}
        </div>
      </motion.div>

      {/* Summary metrics */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total scenarios', value: everydayScenarios.length, color: '#4f8ef7' },
          {
            label: 'High/Extreme risk',
            value: everydayScenarios.filter((s) => s.severity === 'severe' || s.severity === 'extreme').length,
            color: '#ef4444',
          },
          {
            label: 'Expected annual exposure',
            value: `$${(totalExposure / 1000).toFixed(0)}K`,
            color: '#f59e0b',
          },
          { label: 'Simulations run', value: completedCount, color: '#10b981' },
        ].map((m) => (
          <div key={m.label} className="card-base rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1">{m.label}</p>
            <p className="text-2xl font-bold tabular" style={{ color: m.color }}>
              {m.value}
            </p>
          </div>
        ))}
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="scenarios">
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            Scenarios
          </TabsTrigger>
          <TabsTrigger value="bundles">
            <Package className="w-3.5 h-3.5 mr-1.5" />
            Bundles
          </TabsTrigger>
        </TabsList>

        {/* ── Scenarios tab ─────────────────────────────────────────────── */}
        <TabsContent value="scenarios" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Search scenarios…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'mild', 'moderate', 'severe', 'extreme'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSevFilter(s)}
                  className={cn(
                    'text-xs px-2.5 py-1.5 rounded-lg border transition-colors capitalize whitespace-nowrap',
                    sevFilter === s
                      ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                      : 'border-white/[0.07] text-text-muted hover:border-white/[0.12]',
                  )}
                >
                  {s === 'all' ? 'All severity' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Group tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveGroup('all')}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors',
                activeGroup === 'all'
                  ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                  : 'border-white/[0.07] text-text-muted hover:border-white/[0.12]',
              )}
            >
              All categories
            </button>
            {(Object.entries(GROUPS) as [ScenarioGroup, (typeof GROUPS)[ScenarioGroup]][])
              .filter(([key]) =>
                everydayScenarios.some((s) => s.group === key),
              )
              .map(([key, conf]) => (
                <button
                  key={key}
                  onClick={() => setActiveGroup(key)}
                  className={cn(
                    'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors',
                    activeGroup === key
                      ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                      : 'border-white/[0.07] text-text-muted hover:border-white/[0.12]',
                  )}
                >
                  <span>{conf.emoji}</span>
                  {conf.label}
                </button>
              ))}
          </div>

          {/* Active bundle indicator */}
          {selectedBundle && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-500/5 border border-brand-500/20">
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-brand-400" />
                <span className="text-brand-300 font-medium">
                  Bundle: {BUNDLES.find((b) => b.id === selectedBundle)?.name}
                </span>
                <span className="text-text-muted">— showing {filtered.length} scenarios</span>
              </div>
              <button
                onClick={() => setSelectedBundle(null)}
                className="text-xs text-text-muted hover:text-text-secondary"
              >
                Clear ×
              </button>
            </div>
          )}

          {/* Scenario list */}
          <div className="space-y-2">
            {filtered.map((s, i) => (
              <ScenarioRow
                key={s.id}
                scenario={s}
                delay={i * 0.02}
                onRun={handleRun}
                result={results[s.id] ?? null}
                isRunning={runningId === s.id && sim.isLoading}
                elapsedMs={elapsedMap[s.id] ?? 0}
                error={errors[s.id] ?? null}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-40" />
                <p className="text-text-muted">No scenarios match your filters.</p>
                <button
                  onClick={() => { setSearch(''); setActiveGroup('all'); setSevFilter('all') }}
                  className="text-brand-400 text-sm mt-2 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Bundles tab ─────────────────────────────────────────────────── */}
        <TabsContent value="bundles" className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              Curated scenario packs — select one, then simulate all scenarios in it
            </p>
            {selectedBundle && (
              <Button
                variant="brand"
                size="sm"
                onClick={() => {
                  setActiveTab('scenarios')
                }}
              >
                <Play className="w-3.5 h-3.5 mr-1.5" />
                View bundle scenarios
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BUNDLES.filter((b) => b.tier === 'everyday' || b.tier === 'both').map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                onSelect={handleBundleSelect}
                isSelected={selectedBundle === bundle.id}
              />
            ))}
          </div>

          {selectedBundle && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-base rounded-xl p-5 border border-brand-500/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary">
                  {BUNDLES.find((b) => b.id === selectedBundle)?.name} — Scenarios
                </h3>
                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => setActiveTab('scenarios')}
                >
                  Run all →
                </Button>
              </div>
              <div className="space-y-2">
                {(BUNDLES.find((b) => b.id === selectedBundle)?.scenarioIds ?? []).map((id) => {
                  const s = SCENARIOS_BY_ID.get(id)
                  if (!s) return null
                  const sevConf = SEVERITY_CONFIG[s.severity]
                  return (
                    <div key={id} className="flex items-center gap-3 text-sm">
                      <span className="text-lg">{GROUPS[s.group]?.emoji}</span>
                      <span className="text-text-secondary flex-1">{s.name}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ color: sevConf.color, background: `${sevConf.color}15` }}
                      >
                        {sevConf.label}
                      </span>
                      {results[id] && (
                        <span
                          className="text-xs font-medium"
                          style={{ color: resilienceColor(results[id]!.interpretation.resilienceLevel) }}
                        >
                          {results[id]!.interpretation.resilienceLevel}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
