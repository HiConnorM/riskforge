'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Plus, Download, Activity, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { portfolioHoldings, portfolioSummary } from '@/lib/mock-data/pro'
import { SimulationPanel } from '@/components/simulation/SimulationPanel'
import { useSimulation } from '@/hooks/useSimulation'
import { formatCurrency, formatPercent, getChangeClass, cn } from '@/lib/utils'
import type {
  PortfolioRiskResult,
  PortfolioSimRequest,
  AssetInput,
} from '@/lib/api-client'

const assetClassColors: Record<string, string> = {
  equity: '#4f8ef7',
  'fixed-income': '#10b981',
  crypto: '#f59e0b',
  commodities: '#38bdf8',
  cash: '#64748b',
  alternatives: '#a78bfa',
}

// Default expected-return assumptions by asset class (annualised).
// These are conservative estimates used when building the simulation input
// from the holdings table. Users can customise later.
const defaultMuByClass: Record<string, number> = {
  equity: 0.08,
  'fixed-income': 0.04,
  crypto: 0.20,
  commodities: 0.05,
  cash: 0.04,
  alternatives: 0.07,
}

/**
 * Build a PortfolioSimRequest from the current portfolio holdings.
 * - Weights are normalised so they sum exactly to 1.
 * - Mu is taken from asset-class defaults (conservative).
 * - Sigma comes from the `volatility` field on each holding (annualised %).
 * - Correlation matrix: identity (no cross-asset correlation assumed). A
 *   future version will let users enter a custom matrix.
 * - Cash-like positions (beta ≈ 0, vol ≈ 0) are included as low-risk assets.
 */
function buildPortfolioRequest(
  horizonDays: number,
  paths: number,
  stressed: boolean,
): PortfolioSimRequest {
  // Exclude holdings with zero weight.
  const active = portfolioHoldings.filter((h) => h.weight > 0)

  // Normalise weights.
  const totalWeight = active.reduce((s, h) => s + h.weight, 0)

  const assets: AssetInput[] = active.map((h) => ({
    name: h.symbol,
    weight: h.weight / totalWeight,
    mu: defaultMuByClass[h.assetClass] ?? 0.06,
    // volatility is stored as a percentage (e.g. 22.1 → 0.221).
    sigma: Math.max(h.volatility / 100, 0.001),
  }))

  // Identity correlation matrix.
  const n = assets.length
  const corr = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  )

  return {
    kind: 'portfolio_risk',
    input: { assets, corr },
    config: {
      paths,
      horizonDays,
      distribution: 'normal',
      ...(stressed
        ? { stress: { factor: 2.5, targetCorr: 0.75 } }
        : {}),
    },
  }
}

// ─── Risk metric result card ──────────────────────────────────────────────────

function ResultMetric({
  label,
  value,
  color,
  sub,
}: {
  label: string
  value: string
  color: string
  sub?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base rounded-xl p-4"
    >
      <p className="text-xs text-text-muted mb-2">{label}</p>
      <p className="text-2xl font-bold tabular" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof (typeof portfolioHoldings)[0]>('weight')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [horizonDays, setHorizonDays] = useState(21)
  const [paths, setPaths] = useState(10_000)
  const [stressed, setStressed] = useState(false)

  const sim = useSimulation<PortfolioRiskResult>()

  const runSim = useCallback(() => {
    sim.run(buildPortfolioRequest(horizonDays, paths, stressed))
  }, [sim, horizonDays, paths, stressed])

  const filtered = portfolioHoldings
    .filter(
      (h) =>
        h.symbol.toLowerCase().includes(search.toLowerCase()) ||
        h.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const av = a[sortKey] as number
      const bv = b[sortKey] as number
      return sortDir === 'desc' ? bv - av : av - bv
    })

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const r = sim.result

  return (
    <div className="p-6 space-y-5 max-w-[1600px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Portfolio Overview</h2>
          <p className="text-sm text-text-muted">
            {portfolioHoldings.length} positions ·{' '}
            {formatCurrency(portfolioSummary.totalValue, { compact: true })} AUM
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
          <Button variant="brand" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Position
          </Button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          {
            label: 'Total Value',
            value: formatCurrency(portfolioSummary.totalValue, { compact: true }),
            change: portfolioSummary.yearChangePct,
            changeSub: 'YTD',
          },
          {
            label: 'Today',
            value: formatCurrency(portfolioSummary.dayChange),
            change: portfolioSummary.dayChangePct,
            changeSub: 'Day P&L',
          },
          {
            label: 'This Week',
            value: formatCurrency(portfolioSummary.weekChange),
            change: portfolioSummary.weekChangePct,
            changeSub: 'Week P&L',
          },
          {
            label: 'This Month',
            value: formatCurrency(portfolioSummary.monthChange),
            change: portfolioSummary.monthChangePct,
            changeSub: 'Month P&L',
          },
        ].map((m) => (
          <div key={m.label} className="card-base rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1.5">{m.label}</p>
            <p className={cn('text-xl font-bold tabular', getChangeClass(m.change))}>
              {m.value}
            </p>
            <p className={cn('text-xs tabular mt-0.5', getChangeClass(m.change))}>
              {m.change >= 0 ? '+' : ''}
              {m.change.toFixed(2)}% {m.changeSub}
            </p>
          </div>
        ))}
      </motion.div>

      <Tabs defaultValue="holdings">
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="risk">
            <Activity className="w-3.5 h-3.5 mr-1.5" />
            Live Risk Analysis
          </TabsTrigger>
        </TabsList>

        {/* Holdings tab */}
        <TabsContent value="holdings">
          <div className="flex gap-3 mb-4">
            <Input
              placeholder="Search by symbol or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="card-base rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    {[
                      { key: 'symbol', label: 'Asset' },
                      { key: 'assetClass', label: 'Class' },
                      { key: 'weight', label: 'Weight' },
                      { key: 'value', label: 'Value' },
                      { key: 'currentPrice', label: 'Price' },
                      { key: 'dayChangePct', label: 'Day %' },
                      { key: 'beta', label: 'Beta' },
                      { key: 'volatility', label: 'Vol %' },
                      { key: 'riskContribution', label: 'Risk Contrib' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        className="text-left px-4 py-3 text-xs font-medium text-text-muted cursor-pointer hover:text-text-secondary transition-colors whitespace-nowrap"
                        onClick={() => handleSort(col.key as typeof sortKey)}
                      >
                        {col.label}
                        {sortKey === col.key && (
                          <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map((h, i) => (
                    <motion.tr
                      key={h.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{
                              background: `${assetClassColors[h.assetClass] ?? '#64748b'}30`,
                              color: assetClassColors[h.assetClass] ?? '#64748b',
                            }}
                          >
                            {h.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{h.symbol}</p>
                            <p className="text-xs text-text-muted max-w-[120px] truncate">
                              {h.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{
                            background: `${assetClassColors[h.assetClass] ?? '#64748b'}15`,
                            color: assetClassColors[h.assetClass] ?? '#64748b',
                          }}
                        >
                          {h.assetClass}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 tabular text-text-secondary font-medium">
                        {h.weight.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3.5 tabular text-text-primary font-semibold">
                        {formatCurrency(h.value, { compact: true })}
                      </td>
                      <td className="px-4 py-3.5 tabular text-text-secondary">
                        {formatCurrency(h.currentPrice, { decimals: 2 })}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3.5 tabular font-semibold',
                          getChangeClass(h.dayChangePct),
                        )}
                      >
                        {h.dayChangePct >= 0 ? '+' : ''}
                        {h.dayChangePct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3.5 tabular text-text-secondary">
                        {h.beta.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 tabular text-text-secondary">
                        {h.volatility.toFixed(1)}%
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3.5 tabular font-semibold',
                          h.riskContribution > 15
                            ? 'text-red-400'
                            : h.riskContribution > 8
                            ? 'text-amber-400'
                            : 'text-text-secondary',
                        )}
                      >
                        {h.riskContribution.toFixed(1)}%
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Live Risk Analysis tab */}
        <TabsContent value="risk" className="space-y-4">
          {/* Simulation controls */}
          <div className="card-base rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Simulation Parameters
            </h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-xs text-text-muted block mb-1.5">Horizon</label>
                <div className="flex gap-1">
                  {[
                    { label: '1D', days: 1 },
                    { label: '1W', days: 5 },
                    { label: '1M', days: 21 },
                    { label: '3M', days: 63 },
                    { label: '1Y', days: 252 },
                  ].map((h) => (
                    <button
                      key={h.label}
                      onClick={() => setHorizonDays(h.days)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        horizonDays === h.days
                          ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                          : 'text-text-muted hover:text-text-secondary border border-white/[0.07]',
                      )}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-text-muted block mb-1.5">Paths</label>
                <div className="flex gap-1">
                  {[
                    { label: '5k', n: 5_000 },
                    { label: '10k', n: 10_000 },
                    { label: '50k', n: 50_000 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setPaths(p.n)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        paths === p.n
                          ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                          : 'text-text-muted hover:text-text-secondary border border-white/[0.07]',
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-text-muted block mb-1.5">Mode</label>
                <button
                  onClick={() => setStressed((s) => !s)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    stressed
                      ? 'bg-red-500/15 text-red-400 border-red-500/30'
                      : 'text-text-muted border-white/[0.07] hover:text-text-secondary',
                  )}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {stressed ? 'Stress Mode ON' : 'Stress Mode'}
                </button>
              </div>

              <Button
                variant="brand"
                size="sm"
                onClick={runSim}
                disabled={sim.isLoading}
                className="ml-auto"
              >
                <Activity className="w-4 h-4 mr-1.5" />
                {sim.isLoading ? 'Running…' : 'Run Simulation'}
              </Button>
            </div>
          </div>

          {/* Results panel */}
          <SimulationPanel
            status={sim.status}
            error={sim.error}
            elapsedMs={sim.elapsedMs}
            onRun={runSim}
            onReset={sim.reset}
          >
            {r && (
              <div className="space-y-4">
                {/* Risk interpretation banner */}
                <div
                  className={cn(
                    'rounded-xl p-4 border text-sm',
                    r.interpretation.riskLevel === 'low' &&
                      'bg-emerald-500/5 border-emerald-500/20',
                    r.interpretation.riskLevel === 'medium' &&
                      'bg-amber-500/5 border-amber-500/20',
                    r.interpretation.riskLevel === 'high' &&
                      'bg-orange-500/5 border-orange-500/20',
                    r.interpretation.riskLevel === 'critical' &&
                      'bg-red-500/5 border-red-500/20',
                  )}
                >
                  <p className="text-text-secondary leading-relaxed">
                    {r.interpretation.plainEnglishSummary}
                  </p>
                </div>

                {/* Key metrics grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ResultMetric
                    label={`VaR 95% (${horizonDays}d)`}
                    value={`${(r.summary.portfolioVaR95 * 100).toFixed(2)}%`}
                    color="#f59e0b"
                    sub={formatCurrency(
                      portfolioSummary.totalValue * r.summary.portfolioVaR95,
                    )}
                  />
                  <ResultMetric
                    label={`VaR 99% (${horizonDays}d)`}
                    value={`${(r.summary.portfolioVaR99 * 100).toFixed(2)}%`}
                    color="#f97316"
                    sub={formatCurrency(
                      portfolioSummary.totalValue * r.summary.portfolioVaR99,
                    )}
                  />
                  <ResultMetric
                    label="Expected Shortfall 95%"
                    value={`${(r.summary.expectedShortfall95 * 100).toFixed(2)}%`}
                    color="#ef4444"
                    sub="Average tail loss"
                  />
                  <ResultMetric
                    label="Max Drawdown"
                    value={`${(r.summary.maxDrawdown * 100).toFixed(2)}%`}
                    color="#ef4444"
                    sub="Worst path"
                  />
                  <ResultMetric
                    label="Annualised Vol"
                    value={`${(r.summary.portfolioVolatility * 100).toFixed(1)}%`}
                    color="#4f8ef7"
                  />
                  <ResultMetric
                    label="Sharpe Ratio"
                    value={r.summary.sharpeRatio.toFixed(2)}
                    color={r.summary.sharpeRatio >= 1 ? '#10b981' : '#f59e0b'}
                    sub="Risk-free: 4.5%"
                  />
                  <ResultMetric
                    label="Prob. of Loss"
                    value={`${(r.summary.probabilityOfLoss * 100).toFixed(1)}%`}
                    color={r.summary.probabilityOfLoss > 0.4 ? '#ef4444' : '#f59e0b'}
                  />
                  <ResultMetric
                    label="Median Return"
                    value={`${(r.summary.medianReturn * 100).toFixed(2)}%`}
                    color={r.summary.medianReturn >= 0 ? '#10b981' : '#ef4444'}
                    sub={`(${horizonDays}d horizon)`}
                  />
                </div>

                {/* Attribution */}
                {r.attribution && (
                  <div className="card-base rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-4">
                      Risk Attribution (Component VaR 95%)
                    </h3>
                    <div className="space-y-3">
                      {portfolioHoldings
                        .filter((h) => h.weight > 0)
                        .map((h, i) => {
                          const contrib =
                            r.attribution?.percentContributions95[i] ?? 0
                          const cvар =
                            r.attribution?.componentVaR95[i] ?? 0
                          return (
                            <div key={h.symbol} className="flex items-center gap-3">
                              <span className="text-sm font-medium text-text-secondary w-16">
                                {h.symbol}
                              </span>
                              <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, contrib * 100)}%`,
                                    background:
                                      contrib > 0.2 ? '#ef4444' : contrib > 0.1 ? '#f59e0b' : '#4f8ef7',
                                  }}
                                />
                              </div>
                              <div className="text-right w-24">
                                <p className="text-xs font-semibold text-text-primary tabular">
                                  {(contrib * 100).toFixed(1)}%
                                </p>
                                <p className="text-2xs text-text-muted tabular">
                                  CVaR: {(cvар * 100).toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                    {r.attribution.diversificationBenefit95 > 0 && (
                      <p className="text-xs text-emerald-400 mt-3">
                        Diversification benefit:{' '}
                        {(r.attribution.diversificationBenefit95 * 100).toFixed(1)}% risk
                        reduction vs. undiversified
                      </p>
                    )}
                  </div>
                )}

                {/* Risk drivers */}
                {r.interpretation.drivers.length > 0 && (
                  <div className="card-base rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-text-primary mb-3">
                      Key Risk Drivers
                    </h3>
                    <ul className="space-y-2">
                      {r.interpretation.drivers.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="text-brand-400 mt-0.5">•</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Meta */}
                <p className="text-xs text-text-muted">
                  {r.meta.paths.toLocaleString()} paths · {r.meta.horizonDays}d horizon ·{' '}
                  {r.meta.distribution} · engine {r.meta.engineVersion} · {r.meta.elapsedMs}ms
                </p>
              </div>
            )}
          </SimulationPanel>
        </TabsContent>
      </Tabs>
    </div>
  )
}
