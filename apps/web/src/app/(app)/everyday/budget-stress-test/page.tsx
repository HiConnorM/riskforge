'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { AlertTriangle, TrendingDown, Check, Zap, DollarSign, Activity, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { budgetCategories, everydayProfile } from '@/lib/mock-data/everyday'
import { useSimulation } from '@/hooks/useSimulation'
import { formatCurrency, cn } from '@/lib/utils'
import type { CashflowRiskResult, CashflowSimRequest, RiskEvent } from '@/lib/api-client'

const shocks = [
  {
    id: 'income_cut',
    label: 'Income Cut 20%',
    icon: TrendingDown,
    modifier: { income: -0.2 },
    color: '#f59e0b',
  },
  {
    id: 'job_loss',
    label: 'Job Loss (3 months)',
    icon: AlertTriangle,
    modifier: { income: -1.0, duration: 3 },
    color: '#ef4444',
  },
  {
    id: 'rent_hike',
    label: 'Rent +$300',
    icon: DollarSign,
    modifier: { housing: 300 },
    color: '#f97316',
  },
  {
    id: 'medical',
    label: 'Medical Emergency',
    icon: AlertTriangle,
    modifier: { oneTime: 6500 },
    color: '#ef4444',
  },
  {
    id: 'car_repair',
    label: 'Major Car Repair',
    icon: Zap,
    modifier: { oneTime: 3200 },
    color: '#f59e0b',
  },
  { id: 'custom', label: 'Custom Shock', icon: Zap, modifier: {}, color: '#4f8ef7' },
]

/**
 * Build a cashflow simulation request from the current shock parameters.
 */
function buildCashflowRequest(
  income: number,
  fixedExpenses: number,
  variableExpenses: number,
  savings: number,
  months: number,
  riskEvents: RiskEvent[],
): CashflowSimRequest {
  return {
    kind: 'personal_cashflow_risk',
    input: {
      monthlyIncome: Math.max(1, income),
      monthlyFixedExpenses: Math.max(0, fixedExpenses),
      monthlyVariableExpenses: Math.max(0, variableExpenses),
      currentSavings: Math.max(0, savings),
      horizonMonths: Math.min(60, Math.max(1, months)),
      riskEvents,
      inflationRate: 0.03,
    },
    config: {
      paths: 5_000,
    },
  }
}

// ─── Resilience colour helpers ────────────────────────────────────────────────

function resilienceColor(level: string) {
  switch (level) {
    case 'stable':   return '#10b981'
    case 'watch':    return '#f59e0b'
    case 'fragile':  return '#f97316'
    case 'critical': return '#ef4444'
    default:         return '#64748b'
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BudgetStressTestPage() {
  const [activeShock, setActiveShock] = useState<string | null>(null)
  const [incomeShock, setIncomeShock]     = useState(0)
  const [housingShock, setHousingShock]   = useState(0)
  const [oneTimeShock, setOneTimeShock]   = useState(0)
  const [months, setMonths]               = useState(6)

  const sim = useSimulation<CashflowRiskResult>()

  const baseline = {
    income: everydayProfile.monthlyIncome,
    // Split everydayProfile.monthlyExpenses into fixed / variable (60/40 split).
    fixedExpenses:    Math.round(everydayProfile.monthlyExpenses * 0.6),
    variableExpenses: Math.round(everydayProfile.monthlyExpenses * 0.4),
    savings: everydayProfile.savingsBalance,
  }

  const shocked = {
    income:   baseline.income * (1 - incomeShock / 100),
    fixedExpenses: baseline.fixedExpenses + housingShock,
    variableExpenses: baseline.variableExpenses,
  }

  const monthlyDeficit =
    shocked.fixedExpenses + shocked.variableExpenses - shocked.income
  const monthsUntilDepleted =
    monthlyDeficit > 0
      ? (baseline.savings - oneTimeShock) / monthlyDeficit
      : Infinity

  const runwayMonths =
    monthsUntilDepleted === Infinity
      ? '∞'
      : monthsUntilDepleted <= 0
      ? '0'
      : monthsUntilDepleted.toFixed(1)

  const applyShock = (shock: (typeof shocks)[0]) => {
    setActiveShock(shock.id)
    const m = shock.modifier as Record<string, number>
    if (m['income'] !== undefined) setIncomeShock(Math.abs(m['income']) * 100)
    if (m['housing'] !== undefined) setHousingShock(m['housing'])
    if (m['oneTime'] !== undefined) setOneTimeShock(m['oneTime'])
  }

  const runMC = useCallback(() => {
    // Build risk events from the active shock.
    const riskEvents: RiskEvent[] = []

    if (oneTimeShock > 0) {
      riskEvents.push({
        name: 'One-time expense',
        category: 'other',
        probabilityPerMonth: 1 / months,
        minCost: oneTimeShock * 0.8,
        maxCost: oneTimeShock * 1.2,
        maxOccurrences: 1,
      })
    }

    if (activeShock === 'medical') {
      riskEvents.push({
        name: 'Medical emergency',
        category: 'medical',
        probabilityPerMonth: 0.1,
        minCost: 3000,
        maxCost: 12000,
        maxOccurrences: 2,
      })
    }

    if (activeShock === 'car_repair') {
      riskEvents.push({
        name: 'Car repair',
        category: 'car',
        probabilityPerMonth: 0.08,
        minCost: 1500,
        maxCost: 6000,
        maxOccurrences: 2,
      })
    }

    if (activeShock === 'job_loss') {
      riskEvents.push({
        name: 'Job loss',
        category: 'job',
        probabilityPerMonth: 1 / 3,  // ~1 occurrence over 3-month horizon
        minCost: shocked.income * 2,
        maxCost: shocked.income * 4,
        maxOccurrences: 1,
      })
    }

    sim.run(
      buildCashflowRequest(
        shocked.income,
        shocked.fixedExpenses,
        shocked.variableExpenses,
        baseline.savings - oneTimeShock,
        months,
        riskEvents,
      ),
    )
  }, [sim, shocked, baseline, oneTimeShock, months, activeShock])

  // Month-by-month chart data (deterministic estimate).
  const cashflowData = Array.from({ length: months }, (_, i) => {
    const remainingSavings = Math.max(
      0,
      baseline.savings - oneTimeShock - (monthlyDeficit > 0 ? monthlyDeficit * (i + 1) : 0),
    )
    return {
      month: `Mo ${i + 1}`,
      income:   Math.round(shocked.income),
      expenses: Math.round(shocked.fixedExpenses + shocked.variableExpenses),
      savings:  Math.round(remainingSavings),
    }
  })

  const categoryImpact = budgetCategories.map((cat) => ({
    name: cat.name.split(' ')[0],
    budgeted: cat.budgeted,
    actual: cat.actual,
    over: cat.actual > cat.budgeted,
  }))

  const r = sim.result

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Budget Stress Test</h2>
          <p className="text-sm text-text-muted">
            See how your budget holds up under real financial shocks
          </p>
        </div>
        <Button
          variant="brand"
          size="sm"
          onClick={runMC}
          disabled={sim.isLoading}
        >
          {sim.isLoading ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Activity className="w-4 h-4 mr-1.5" />
          )}
          {sim.isLoading ? 'Simulating…' : 'Run MC Forecast'}
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Controls */}
        <div className="space-y-5">
          {/* Preset shocks */}
          <div className="card-base rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Preset Scenarios</h3>
            <div className="grid grid-cols-2 gap-2">
              {shocks.map((shock) => {
                const Icon = shock.icon
                return (
                  <button
                    key={shock.id}
                    onClick={() => applyShock(shock)}
                    className={cn(
                      'flex flex-col items-start gap-1.5 p-3 rounded-lg border text-left transition-all text-xs',
                      activeShock === shock.id
                        ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                        : 'border-white/[0.07] text-text-muted hover:border-white/[0.12] hover:text-text-secondary',
                    )}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: activeShock === shock.id ? '#4f8ef7' : shock.color }}
                    />
                    <span className="font-medium leading-tight">{shock.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom sliders */}
          <div className="card-base rounded-xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-text-primary">Custom Parameters</h3>

            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-text-secondary">Income reduction</span>
                <span className="font-semibold text-red-400 tabular">{incomeShock.toFixed(0)}%</span>
              </div>
              <Slider
                value={[incomeShock]}
                onValueChange={([v]) => { setIncomeShock(v ?? 0); setActiveShock('custom') }}
                min={0} max={100} step={5}
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-text-secondary">Housing increase</span>
                <span className="font-semibold text-amber-400 tabular">+{formatCurrency(housingShock)}</span>
              </div>
              <Slider
                value={[housingShock]}
                onValueChange={([v]) => { setHousingShock(v ?? 0); setActiveShock('custom') }}
                min={0} max={1000} step={50}
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-text-secondary">One-time expense</span>
                <span className="font-semibold text-orange-400 tabular">{formatCurrency(oneTimeShock)}</span>
              </div>
              <Slider
                value={[oneTimeShock]}
                onValueChange={([v]) => { setOneTimeShock(v ?? 0); setActiveShock('custom') }}
                min={0} max={20000} step={500}
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-text-secondary">Scenario duration</span>
                <span className="font-semibold text-brand-400">{months} months</span>
              </div>
              <Slider
                value={[months]}
                onValueChange={([v]) => setMonths(v ?? 6)}
                min={1} max={24} step={1}
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => {
                setIncomeShock(0); setHousingShock(0); setOneTimeShock(0); setActiveShock(null)
                sim.reset()
              }}
            >
              Reset to baseline
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-5">
          {/* Key metrics (deterministic) */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'Monthly Cashflow',
                value:
                  monthlyDeficit > 0
                    ? formatCurrency(-monthlyDeficit)
                    : '+' + formatCurrency(shocked.income - shocked.fixedExpenses - shocked.variableExpenses),
                color: monthlyDeficit > 0 ? '#ef4444' : '#10b981',
                sub: monthlyDeficit > 0 ? 'Monthly deficit' : 'Monthly surplus',
              },
              {
                label: 'Savings Runway',
                value: runwayMonths === '∞' ? '∞ months' : `${runwayMonths} months`,
                color:
                  monthsUntilDepleted < 3
                    ? '#ef4444'
                    : monthsUntilDepleted < 6
                    ? '#f59e0b'
                    : '#10b981',
                sub: 'Until savings depleted',
              },
              {
                label: 'Stressed Income',
                value: formatCurrency(shocked.income),
                color: '#f1f5f9',
                sub: `Down ${formatCurrency(baseline.income - shocked.income)} vs baseline`,
              },
            ].map((m) => (
              <div key={m.label} className="card-base rounded-xl p-4">
                <p className="text-xs text-text-muted mb-2">{m.label}</p>
                <p className="text-xl font-bold tabular" style={{ color: m.color }}>
                  {m.value}
                </p>
                <p className="text-xs text-text-muted mt-1">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* MC simulation results */}
          <AnimatePresence>
            {sim.isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card-base rounded-xl p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                  <span className="text-sm text-brand-300 font-medium">
                    Running 5,000-path Monte Carlo simulation…
                  </span>
                  <span className="text-xs text-text-muted ml-auto">
                    {(sim.elapsedMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <Progress
                  value={Math.min(95, (sim.elapsedMs / 2000) * 100)}
                  className="h-1"
                  indicatorClassName="bg-brand-500"
                />
              </motion.div>
            )}

            {sim.status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card-base rounded-xl p-4 border border-red-500/20 bg-red-500/5 text-sm text-red-400"
              >
                {sim.error}
              </motion.div>
            )}

            {r && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card-base rounded-xl p-5 border border-brand-500/15 bg-brand-500/3"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: resilienceColor(r.interpretation.resilienceLevel) }}
                  />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Monte Carlo Results
                  </h3>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                    style={{
                      color: resilienceColor(r.interpretation.resilienceLevel),
                      background: `${resilienceColor(r.interpretation.resilienceLevel)}15`,
                    }}
                  >
                    {r.interpretation.resilienceLevel}
                  </span>
                  <span className="text-xs text-text-muted ml-auto">
                    {r.meta.paths.toLocaleString()} paths · {r.meta.elapsedMs}ms
                  </span>
                </div>

                <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                  {r.interpretation.plainEnglishSummary}
                </p>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    {
                      label: 'Prob. Depleted',
                      value: `${(r.summary.probabilityBelowZero * 100).toFixed(1)}%`,
                      color:
                        r.summary.probabilityBelowZero > 0.3
                          ? '#ef4444'
                          : r.summary.probabilityBelowZero > 0.1
                          ? '#f59e0b'
                          : '#10b981',
                    },
                    {
                      label: 'Median End Balance',
                      value: formatCurrency(r.summary.medianEndingBalance, { compact: true }),
                      color: r.summary.medianEndingBalance > 0 ? '#10b981' : '#ef4444',
                    },
                    {
                      label: 'Most Fragile Month',
                      value: r.summary.mostFragileMonth > 0 ? `Mo ${r.summary.mostFragileMonth}` : 'None',
                      color:
                        r.summary.mostFragileMonth > 0 && r.summary.mostFragileMonth < months
                          ? '#ef4444'
                          : '#10b981',
                    },
                  ].map((m) => (
                    <div key={m.label} className="rounded-lg bg-white/[0.03] p-3">
                      <p className="text-xs text-text-muted">{m.label}</p>
                      <p className="text-base font-bold tabular" style={{ color: m.color }}>
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>

                {r.interpretation.suggestedActions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Suggested Actions
                    </p>
                    <ul className="space-y-1.5">
                      {r.interpretation.suggestedActions.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cashflow chart */}
          <div className="card-base rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Month-by-Month Cashflow
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#1e2535', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px', color: '#f1f5f9' }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Bar dataKey="income" name="Income" fill="#4f8ef7" radius={[3, 3, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category drift */}
          <div className="card-base rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Current Budget Drift</h3>
            <div className="space-y-3">
              {categoryImpact.map((cat) => {
                const pct = ((cat.actual - cat.budgeted) / cat.budgeted) * 100
                const overBudget = cat.actual > cat.budgeted
                return (
                  <div key={cat.name} className="flex items-center gap-4">
                    <span className="text-sm text-text-secondary w-28 flex-shrink-0">{cat.name}</span>
                    <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (cat.actual / (cat.budgeted * 1.5)) * 100)}%`,
                          background: overBudget ? '#ef4444' : '#10b981',
                        }}
                      />
                    </div>
                    <div className="text-right flex-shrink-0 w-24">
                      <p className="text-xs font-semibold tabular text-text-primary">
                        {formatCurrency(cat.actual)}
                      </p>
                      <p className={cn('text-2xs tabular', overBudget ? 'text-red-400' : 'text-emerald-400')}>
                        {overBudget ? '+' : ''}{pct.toFixed(1)}% vs budget
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
