'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Sector,
} from 'recharts'
import { TrendingUp, TrendingDown, Activity, AlertTriangle, BarChart3, ArrowRight, Shield } from 'lucide-react'
import { MetricCard } from '@/components/cards/MetricCard'
import { AlertCard } from '@/components/cards/AlertCard'
import { ChartCard } from '@/components/charts/ChartCard'
import { RiskBadge } from '@/components/common/RiskBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  portfolioSummary,
  portfolioHoldings,
  riskMetrics,
  proAlerts,
  volatilityData,
  assetAllocation,
  stressTests,
  watchlist,
} from '@/lib/mock-data/pro'
import { formatCurrency, formatPercent, getChangeClass, cn } from '@/lib/utils'

const ALLOC_COLORS = ['#4f8ef7', '#f59e0b', '#10b981', '#64748b', '#38bdf8']

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-base-800 border border-white/[0.08] rounded-lg px-3 py-2 shadow-panel text-xs">
        <p className="text-text-muted mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value.toFixed(1)}%</p>
        ))}
      </div>
    )
  }
  return null
}

// Risk heatmap cells
const assets = ['NVDA', 'MSFT', 'SPY', 'BTC', 'GLD', 'TLT']
const heatmapData: number[][] = [
  [1, 0.62, 0.74, 0.38, -0.12, -0.31],
  [0.62, 1, 0.81, 0.29, -0.08, -0.18],
  [0.74, 0.81, 1, 0.41, 0.05, -0.42],
  [0.38, 0.29, 0.41, 1, 0.22, -0.15],
  [-0.12, -0.08, 0.05, 0.22, 1, 0.31],
  [-0.31, -0.18, -0.42, -0.15, 0.31, 1],
]

function getCorrelationColor(v: number): string {
  if (v === 1) return '#1e2535'
  if (v > 0.7) return '#ef4444'
  if (v > 0.4) return '#f97316'
  if (v > 0.1) return '#f59e0b'
  if (v > -0.1) return '#64748b'
  if (v > -0.4) return '#38bdf8'
  return '#4f8ef7'
}

export default function ProDashboard() {
  const unreadAlerts = proAlerts.filter(a => !a.isRead)
  const topHoldings = [...portfolioHoldings].sort((a, b) => b.weight - a.weight).slice(0, 5)

  return (
    <div className="p-6 space-y-6 max-w-[1800px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Portfolio Overview</h2>
          <p className="text-sm text-text-muted">
            Last updated: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pro/alerts">
            <Button variant="destructive" size="sm" className="gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              {unreadAlerts.length} Alerts
            </Button>
          </Link>
          <Link href="/pro/stress-testing">
            <Button variant="brand" size="sm">Run Stress Test</Button>
          </Link>
        </div>
      </motion.div>

      {/* Top metrics row */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        <motion.div variants={fadeUp}>
          <MetricCard
            title="Total Portfolio Value"
            value={formatCurrency(portfolioSummary.totalValue, { compact: true })}
            change={portfolioSummary.yearChangePct}
            changeLabel={`${formatPercent(portfolioSummary.dayChangePct)} today`}
            icon={TrendingUp}
            iconColor="#4f8ef7"
            size="lg"
            highlight
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <MetricCard
            title="Day P&L"
            value={formatCurrency(portfolioSummary.dayChange)}
            change={portfolioSummary.dayChangePct}
            icon={Activity}
            iconColor={portfolioSummary.dayChange >= 0 ? '#10b981' : '#ef4444'}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <MetricCard
            title="Portfolio VaR (95%)"
            value={formatCurrency(Math.abs(riskMetrics.portfolioVaR95), { compact: true })}
            unit="1-day"
            icon={Shield}
            iconColor="#f59e0b"
            description="Max expected daily loss at 95% confidence"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <MetricCard
            title="Max Drawdown"
            value={`${riskMetrics.maxDrawdown}%`}
            icon={TrendingDown}
            iconColor="#ef4444"
            description="Peak to trough, trailing 12 months"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <MetricCard
            title="Sharpe Ratio"
            value={riskMetrics.sharpeRatio.toFixed(2)}
            icon={BarChart3}
            iconColor="#10b981"
            description="Risk-adjusted returns vs risk-free rate"
          />
        </motion.div>
      </motion.div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Volatility chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <ChartCard
            title="Volatility Trend"
            description="30-day rolling volatility vs benchmark"
            legend={[
              { color: '#4f8ef7', label: 'Portfolio' },
              { color: '#64748b', label: 'S&P 500' },
              { color: '#f59e0b', label: 'VIX' },
            ]}
            height={220}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volatilityData.slice(-10)} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="portfolioVol" name="Portfolio" stroke="#4f8ef7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="benchmarkVol" name="S&P 500" stroke="#64748b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="vix" name="VIX" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Allocation donut */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <ChartCard title="Asset Allocation" height={220}>
            <div className="flex items-center gap-4 h-full">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={assetAllocation}
                    innerRadius="55%"
                    outerRadius="80%"
                    dataKey="value"
                    strokeWidth={0}
                    paddingAngle={2}
                  >
                    {assetAllocation.map((entry, i) => (
                      <Cell key={entry.name} fill={ALLOC_COLORS[i % ALLOC_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e2535', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px', color: '#f1f5f9' }}
                    formatter={(v: number) => `${v.toFixed(1)}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1">
                {assetAllocation.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ALLOC_COLORS[i] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-secondary truncate">{entry.name}</p>
                    </div>
                    <span className="text-xs font-semibold text-text-primary tabular">{entry.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </motion.div>
      </div>

      {/* Third row: correlation heatmap + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Correlation heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-base rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-text-primary mb-4">Correlation Heatmap</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left text-text-muted font-medium pb-2 w-12" />
                  {assets.map(a => (
                    <th key={a} className="text-text-muted font-medium pb-2 px-1 w-12">{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map((rowAsset, ri) => (
                  <tr key={rowAsset}>
                    <td className="text-text-muted font-medium py-1 pr-2">{rowAsset}</td>
                    {assets.map((_, ci) => {
                      const val = heatmapData[ri]?.[ci] ?? 0
                      const bg = getCorrelationColor(val)
                      return (
                        <td key={ci} className="px-1 py-1">
                          <div
                            className="w-10 h-10 rounded-md flex items-center justify-center text-2xs font-semibold"
                            style={{
                              background: bg === '#1e2535' ? 'rgba(255,255,255,0.04)' : `${bg}25`,
                              color: bg === '#1e2535' ? '#475569' : bg,
                              border: `1px solid ${bg === '#1e2535' ? 'rgba(255,255,255,0.06)' : bg + '30'}`,
                            }}
                          >
                            {val.toFixed(2)}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-4 mt-4 text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-500/30" />
                <span>High positive</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-slate-500/30" />
                <span>Neutral</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-brand-500/30" />
                <span>Negative (diversifying)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Alerts panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card-base rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Active Alerts</h3>
            <Link href="/pro/alerts">
              <Button variant="ghost" size="icon-sm" className="text-text-muted">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {proAlerts.slice(0, 4).map((alert, i) => (
              <AlertCard key={alert.id} alert={alert} delay={i * 0.04} compact />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Holdings table + stress test summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Holdings table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 card-base rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Top Holdings</h3>
            <Link href="/pro/portfolio">
              <Button variant="ghost" size="sm" className="text-xs text-text-muted">
                View all {portfolioHoldings.length} holdings <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Asset', 'Weight', 'Value', 'Day Change', 'Volatility', 'Risk Contrib'].map(h => (
                    <th key={h} className="text-left pb-2.5 text-xs font-medium text-text-muted px-2 first:pl-0 last:pr-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {topHoldings.map(h => (
                  <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pl-0 pr-2">
                      <div>
                        <p className="font-semibold text-text-primary">{h.symbol}</p>
                        <p className="text-xs text-text-muted truncate max-w-[120px]">{h.name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2 tabular text-text-secondary">{h.weight.toFixed(1)}%</td>
                    <td className="py-3 px-2 tabular text-text-primary font-medium">{formatCurrency(h.value, { compact: true })}</td>
                    <td className={cn('py-3 px-2 tabular font-medium', getChangeClass(h.dayChangePct))}>
                      {h.dayChangePct > 0 ? '+' : ''}{h.dayChangePct.toFixed(2)}%
                    </td>
                    <td className="py-3 px-2 tabular text-text-secondary">{h.volatility.toFixed(1)}%</td>
                    <td className="py-3 pr-0 pl-2 tabular text-amber-400 font-medium">{h.riskContribution.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Stress test summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card-base rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Stress Test Summary</h3>
            <Link href="/pro/stress-testing">
              <Button variant="ghost" size="icon-sm" className="text-text-muted">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {stressTests.map(test => (
              <div key={test.id} className="rounded-xl border border-white/[0.06] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-primary truncate pr-2">{test.name}</span>
                  <span className={cn('text-xs font-bold tabular flex-shrink-0', test.portfolioImpactPct > 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {test.portfolioImpactPct > 0 ? '+' : ''}{test.portfolioImpactPct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', test.portfolioImpactPct > 0 ? 'bg-emerald-500' : 'bg-red-500')}
                    style={{ width: `${Math.min(100, Math.abs(test.portfolioImpactPct))}%` }}
                  />
                </div>
                <p className="text-2xs text-text-muted mt-1.5">{test.probability}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
