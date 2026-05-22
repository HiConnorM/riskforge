'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine,
} from 'recharts'
import { Activity, Play, ChevronDown, ChevronUp, TrendingDown, TrendingUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { stressTests, portfolioSummary } from '@/lib/mock-data/pro'
import { formatCurrency, cn } from '@/lib/utils'

export default function StressTestingPage() {
  const [expanded, setExpanded] = useState<string>('st-001')
  const [running, setRunning] = useState(false)

  const runTest = async () => {
    setRunning(true)
    await new Promise(r => setTimeout(r, 2000))
    setRunning(false)
  }

  const chartData = stressTests.map(t => ({
    name: t.name.split(' ').slice(0, 2).join(' '),
    impact: t.portfolioImpactPct,
    value: t.portfolioImpact,
  }))

  return (
    <div className="p-6 space-y-5 max-w-[1300px]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Stress Testing</h2>
          <p className="text-sm text-text-muted">Replay historical crises and custom scenarios against your portfolio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Custom Scenario
          </Button>
          <Button variant="brand" size="sm" onClick={runTest} disabled={running}>
            <Play className={cn('w-4 h-4 mr-1.5', running && 'animate-pulse')} />
            {running ? 'Running...' : 'Run All Tests'}
          </Button>
        </div>
      </motion.div>

      {/* Summary chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card-base rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-text-primary mb-4">Scenario Impact Overview</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" />
              <Tooltip
                contentStyle={{ background: '#1e2535', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px', color: '#f1f5f9' }}
                formatter={(v: number) => [`${v.toFixed(1)}%`, 'Impact']}
              />
              <Bar dataKey="impact" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.impact < 0 ? '#ef4444' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Individual tests */}
      <div className="space-y-4">
        {stressTests.map((test, i) => {
          const isExpanded = expanded === test.id
          const isNegative = test.portfolioImpactPct < 0

          return (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                'rounded-xl border overflow-hidden transition-all',
                isNegative ? 'border-red-500/20 bg-red-500/3' : 'border-emerald-500/20 bg-emerald-500/3'
              )}
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(isExpanded ? '' : test.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    isNegative ? 'bg-red-500/15 border border-red-500/25' : 'bg-emerald-500/15 border border-emerald-500/25'
                  )}>
                    {isNegative
                      ? <TrendingDown className="w-5 h-5 text-red-400" />
                      : <TrendingUp className="w-5 h-5 text-emerald-400" />
                    }
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{test.name}</h4>
                    <p className="text-xs text-text-muted">{test.probability}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={cn('text-lg font-bold tabular', isNegative ? 'text-red-400' : 'text-emerald-400')}>
                      {isNegative ? '' : '+'}{test.portfolioImpactPct.toFixed(1)}%
                    </p>
                    <p className="text-xs text-text-muted tabular">
                      {formatCurrency(test.portfolioImpact, { compact: true })}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                </div>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="border-t border-white/[0.06] px-5 pb-5 pt-4"
                >
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-sm text-text-secondary mb-3 leading-relaxed">{test.description}</p>
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 mb-3">
                        <p className="text-xs font-semibold text-text-muted mb-1">Scenario conditions</p>
                        <p className="text-xs text-text-secondary">{test.scenario}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-text-muted mb-1">Best performer</p>
                          <p className="text-sm font-semibold text-emerald-400">{test.bestHolding}</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted mb-1">Worst performer</p>
                          <p className="text-sm font-semibold text-red-400">{test.worstHolding}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Holdings Impact</p>
                      <div className="space-y-2">
                        {test.holdingsImpact.map(h => (
                          <div key={h.symbol} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-text-secondary w-16">{h.symbol}</span>
                            <div className="flex-1 mx-3">
                              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, Math.abs(h.impactPct))}%`,
                                    background: h.impactPct < 0 ? '#ef4444' : '#10b981',
                                  }}
                                />
                              </div>
                            </div>
                            <span className={cn('text-xs font-bold tabular w-16 text-right', h.impactPct < 0 ? 'text-red-400' : 'text-emerald-400')}>
                              {h.impactPct > 0 ? '+' : ''}{h.impactPct.toFixed(1)}%
                            </span>
                            <span className={cn('text-xs tabular ml-2 w-20 text-right', h.impact < 0 ? 'text-red-400/70' : 'text-emerald-400/70')}>
                              {formatCurrency(h.impact, { compact: true })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
