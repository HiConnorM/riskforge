'use client'

import { motion } from 'framer-motion'
import { BarChart3, Activity, TrendingDown, Zap, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { riskMetrics, portfolioSummary, volatilityData } from '@/lib/mock-data/pro'
import { formatCurrency, cn } from '@/lib/utils'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'

const metrics = [
  {
    category: 'Value at Risk',
    items: [
      { label: '1-Day VaR (95%)', value: formatCurrency(Math.abs(riskMetrics.portfolioVaR95)), description: 'Maximum 1-day loss at 95% confidence', color: '#f59e0b', status: 'warning' },
      { label: '1-Day VaR (99%)', value: formatCurrency(Math.abs(riskMetrics.portfolioVaR99)), description: 'Maximum 1-day loss at 99% confidence', color: '#f97316', status: 'warning' },
      { label: 'CVaR / Expected Shortfall', value: formatCurrency(Math.abs(riskMetrics.cVar)), description: 'Average loss when VaR is breached', color: '#ef4444', status: 'high' },
    ],
  },
  {
    category: 'Return Metrics',
    items: [
      { label: 'Sharpe Ratio', value: riskMetrics.sharpeRatio.toFixed(2), description: 'Risk-adjusted return vs risk-free rate', color: '#10b981', status: 'good' },
      { label: 'Sortino Ratio', value: riskMetrics.sortino.toFixed(2), description: 'Downside risk-adjusted return', color: '#10b981', status: 'good' },
      { label: 'Alpha', value: `+${riskMetrics.alpha.toFixed(1)}%`, description: 'Excess return vs benchmark', color: '#10b981', status: 'good' },
      { label: 'Information Ratio', value: riskMetrics.informationRatio.toFixed(2), description: 'Active return per unit of tracking error', color: '#4f8ef7', status: 'neutral' },
    ],
  },
  {
    category: 'Risk Metrics',
    items: [
      { label: 'Portfolio Beta', value: riskMetrics.beta.toFixed(2), description: 'Sensitivity to market movements', color: '#4f8ef7', status: 'neutral' },
      { label: 'Annualized Volatility', value: `${riskMetrics.volatility.toFixed(1)}%`, description: '30-day rolling, annualized', color: '#f59e0b', status: 'warning' },
      { label: 'Max Drawdown', value: `${riskMetrics.maxDrawdown}%`, description: 'Largest peak-to-trough decline (12M)', color: '#ef4444', status: 'high' },
      { label: 'Tracking Error', value: `${riskMetrics.trackingError.toFixed(1)}%`, description: 'Deviation from benchmark', color: '#f59e0b', status: 'warning' },
    ],
  },
]

const statusConfig = {
  good: { label: 'Good', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  neutral: { label: 'Normal', className: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  warning: { label: 'Elevated', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  high: { label: 'High', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

// VaR distribution data
const varDistData = Array.from({ length: 30 }, (_, i) => ({
  x: -60 + i * 4,
  freq: Math.exp(-Math.pow((-60 + i * 4 - 5) / 15, 2) / 2) * 100,
}))

export default function RiskModelsPage() {
  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Risk Models</h2>
          <p className="text-sm text-text-muted">Institutional-grade risk analytics for your portfolio</p>
        </div>
        <Button variant="secondary" size="sm">
          <BarChart3 className="w-4 h-4 mr-1.5" />
          Configure Models
        </Button>
      </motion.div>

      {/* VaR distribution chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card-base rounded-xl p-5"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Portfolio Return Distribution</h3>
            <p className="text-xs text-text-muted">1-day returns, parametric normal approximation</p>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500/50" />
              <span className="text-text-muted">VaR 95%: {formatCurrency(Math.abs(riskMetrics.portfolioVaR95))}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500/50" />
              <span className="text-text-muted">VaR 99%: {formatCurrency(Math.abs(riskMetrics.portfolioVaR99))}</span>
            </div>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={varDistData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="distGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="20%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="60%" stopColor="#4f8ef7" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="x" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <ReferenceLine x={-4.72} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'VaR95', fill: '#f59e0b', fontSize: 10 }} />
              <ReferenceLine x={-7.28} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'VaR99', fill: '#ef4444', fontSize: 10 }} />
              <Area type="monotone" dataKey="freq" stroke="#4f8ef7" strokeWidth={2} fill="url(#distGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Metric sections */}
      {metrics.map((section, si) => (
        <motion.div
          key={section.category}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + si * 0.05 }}
        >
          <h3 className="text-sm font-semibold text-text-secondary mb-3">{section.category}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {section.items.map((item, i) => {
              const sc = statusConfig[item.status as keyof typeof statusConfig]
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + si * 0.05 + i * 0.03 }}
                  className="card-base rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-text-muted leading-snug">{item.label}</p>
                    <span className={cn('text-2xs px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ml-2', sc.className)}>
                      {sc.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold tabular" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{item.description}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
