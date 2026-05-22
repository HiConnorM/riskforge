'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine,
} from 'recharts'
import { AlertTriangle, TrendingDown, Check, Zap, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { budgetCategories, everydayProfile } from '@/lib/mock-data/everyday'
import { formatCurrency, cn } from '@/lib/utils'

const shocks = [
  { id: 'income_cut', label: 'Income Cut 20%', icon: TrendingDown, modifier: { income: -0.2 }, color: '#f59e0b' },
  { id: 'job_loss', label: 'Job Loss (3 months)', icon: AlertTriangle, modifier: { income: -1.0, duration: 3 }, color: '#ef4444' },
  { id: 'rent_hike', label: 'Rent +$300', icon: DollarSign, modifier: { housing: 300 }, color: '#f97316' },
  { id: 'medical', label: 'Medical Emergency', icon: AlertTriangle, modifier: { oneTime: 6500 }, color: '#ef4444' },
  { id: 'car_repair', label: 'Major Car Repair', icon: Zap, modifier: { oneTime: 3200 }, color: '#f59e0b' },
  { id: 'custom', label: 'Custom Shock', icon: Zap, modifier: {}, color: '#4f8ef7' },
]

export default function BudgetStressTestPage() {
  const [activeShock, setActiveShock] = useState<string | null>(null)
  const [incomeShock, setIncomeShock] = useState(0)
  const [housingShock, setHousingShock] = useState(0)
  const [foodShock, setFoodShock] = useState(0)
  const [oneTimeShock, setOneTimeShock] = useState(0)
  const [months, setMonths] = useState(3)

  const baseline = {
    income: everydayProfile.monthlyIncome,
    expenses: everydayProfile.monthlyExpenses,
    savings: everydayProfile.savingsBalance,
  }

  const shocked = {
    income: baseline.income * (1 - incomeShock / 100),
    expenses: baseline.expenses + housingShock + foodShock,
  }

  const monthlyDeficit = shocked.expenses - shocked.income
  const monthsUntilDepleted = monthlyDeficit > 0
    ? (baseline.savings - oneTimeShock) / monthlyDeficit
    : Infinity

  const runwayMonths = monthsUntilDepleted === Infinity
    ? '∞'
    : monthsUntilDepleted <= 0
    ? '0'
    : monthsUntilDepleted.toFixed(1)

  const applyShock = (shock: typeof shocks[0]) => {
    setActiveShock(shock.id)
    const m = shock.modifier as any
    if (m.income !== undefined) setIncomeShock(Math.abs(m.income) * 100)
    if (m.housing !== undefined) setHousingShock(m.housing)
    if (m.oneTime !== undefined) setOneTimeShock(m.oneTime)
  }

  // Build chart data showing month-by-month impact
  const cashflowData = Array.from({ length: months }, (_, i) => {
    const remainingSavings = Math.max(0, baseline.savings - oneTimeShock - (monthlyDeficit > 0 ? monthlyDeficit * (i + 1) : 0))
    const inflow = shocked.income
    const outflow = shocked.expenses
    return {
      month: `Mo ${i + 1}`,
      income: Math.round(inflow),
      expenses: Math.round(outflow),
      savings: Math.round(remainingSavings),
      deficit: outflow > inflow ? Math.round(outflow - inflow) : 0,
    }
  })

  const categoryImpact = budgetCategories.map(cat => ({
    name: cat.name.split(' ')[0],
    budgeted: cat.budgeted,
    actual: cat.actual,
    over: cat.actual > cat.budgeted,
  }))

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
          <p className="text-sm text-text-muted">See how your budget holds up under real financial shocks</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Controls */}
        <div className="space-y-5">
          {/* Preset shocks */}
          <div className="card-base rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Preset Scenarios</h3>
            <div className="grid grid-cols-2 gap-2">
              {shocks.map(shock => {
                const Icon = shock.icon
                return (
                  <button
                    key={shock.id}
                    onClick={() => applyShock(shock)}
                    className={cn(
                      'flex flex-col items-start gap-1.5 p-3 rounded-lg border text-left transition-all text-xs',
                      activeShock === shock.id
                        ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                        : 'border-white/[0.07] text-text-muted hover:border-white/[0.12] hover:text-text-secondary'
                    )}
                  >
                    <Icon className="w-4 h-4" style={{ color: activeShock === shock.id ? '#4f8ef7' : shock.color }} />
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
              <Slider value={[incomeShock]} onValueChange={([v]) => { setIncomeShock(v ?? 0); setActiveShock('custom') }} min={0} max={100} step={5} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-text-secondary">Housing increase</span>
                <span className="font-semibold text-amber-400 tabular">+{formatCurrency(housingShock)}</span>
              </div>
              <Slider value={[housingShock]} onValueChange={([v]) => { setHousingShock(v ?? 0); setActiveShock('custom') }} min={0} max={1000} step={50} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-text-secondary">One-time expense</span>
                <span className="font-semibold text-orange-400 tabular">{formatCurrency(oneTimeShock)}</span>
              </div>
              <Slider value={[oneTimeShock]} onValueChange={([v]) => { setOneTimeShock(v ?? 0); setActiveShock('custom') }} min={0} max={20000} step={500} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-text-secondary">Scenario duration</span>
                <span className="font-semibold text-brand-400">{months} months</span>
              </div>
              <Slider value={[months]} onValueChange={([v]) => setMonths(v ?? 3)} min={1} max={24} step={1} />
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => {
                setIncomeShock(0); setHousingShock(0); setFoodShock(0); setOneTimeShock(0); setActiveShock(null)
              }}
            >
              Reset to baseline
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-5">
          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'Monthly Cashflow',
                value: monthlyDeficit > 0
                  ? formatCurrency(-monthlyDeficit)
                  : '+' + formatCurrency(shocked.income - shocked.expenses),
                color: monthlyDeficit > 0 ? '#ef4444' : '#10b981',
                sub: monthlyDeficit > 0 ? 'Monthly deficit' : 'Monthly surplus',
              },
              {
                label: 'Savings Runway',
                value: runwayMonths === '∞' ? '∞ months' : `${runwayMonths} months`,
                color: monthsUntilDepleted < 3 ? '#ef4444' : monthsUntilDepleted < 6 ? '#f59e0b' : '#10b981',
                sub: 'Until savings depleted',
              },
              {
                label: 'Stressed Income',
                value: formatCurrency(shocked.income),
                color: '#f1f5f9',
                sub: `Down ${formatCurrency(baseline.income - shocked.income)} vs baseline`,
              },
            ].map(m => (
              <div key={m.label} className="card-base rounded-xl p-4">
                <p className="text-xs text-text-muted mb-2">{m.label}</p>
                <p className="text-xl font-bold tabular" style={{ color: m.color }}>{m.value}</p>
                <p className="text-xs text-text-muted mt-1">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Cashflow chart */}
          <div className="card-base rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Month-by-Month Cashflow</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
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
              {categoryImpact.map(cat => {
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
                      <p className="text-xs font-semibold tabular text-text-primary">{formatCurrency(cat.actual)}</p>
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
