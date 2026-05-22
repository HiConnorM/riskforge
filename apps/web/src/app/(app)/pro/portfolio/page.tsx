'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Plus, Filter, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { portfolioHoldings, portfolioSummary, riskMetrics } from '@/lib/mock-data/pro'
import { formatCurrency, formatPercent, getChangeClass, cn } from '@/lib/utils'

const assetClassColors: Record<string, string> = {
  equity: '#4f8ef7',
  'fixed-income': '#10b981',
  crypto: '#f59e0b',
  commodities: '#38bdf8',
  cash: '#64748b',
  alternatives: '#a78bfa',
}

export default function PortfolioPage() {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof typeof portfolioHoldings[0]>('weight')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = portfolioHoldings
    .filter(h =>
      h.symbol.toLowerCase().includes(search.toLowerCase()) ||
      h.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortKey] as number
      const bv = b[sortKey] as number
      return sortDir === 'desc' ? bv - av : av - bv
    })

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const riskMetricCards = [
    { label: 'VaR 95% (1-day)', value: formatCurrency(Math.abs(riskMetrics.portfolioVaR95)), color: '#f59e0b' },
    { label: 'VaR 99% (1-day)', value: formatCurrency(Math.abs(riskMetrics.portfolioVaR99)), color: '#f97316' },
    { label: 'CVaR (Expected Shortfall)', value: formatCurrency(Math.abs(riskMetrics.cVar)), color: '#ef4444' },
    { label: 'Sharpe Ratio', value: riskMetrics.sharpeRatio.toFixed(2), color: '#10b981' },
    { label: 'Sortino Ratio', value: riskMetrics.sortino.toFixed(2), color: '#10b981' },
    { label: 'Max Drawdown', value: `${riskMetrics.maxDrawdown}%`, color: '#ef4444' },
    { label: 'Portfolio Beta', value: riskMetrics.beta.toFixed(2), color: '#4f8ef7' },
    { label: 'Annualized Vol', value: `${riskMetrics.volatility.toFixed(1)}%`, color: '#f59e0b' },
  ]

  return (
    <div className="p-6 space-y-5 max-w-[1600px]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Portfolio Overview</h2>
          <p className="text-sm text-text-muted">{portfolioHoldings.length} positions · {formatCurrency(portfolioSummary.totalValue, { compact: true })} AUM</p>
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

      {/* Portfolio summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Value', value: formatCurrency(portfolioSummary.totalValue, { compact: true }), change: portfolioSummary.yearChangePct, changeSub: 'YTD' },
          { label: 'Today', value: formatCurrency(portfolioSummary.dayChange), change: portfolioSummary.dayChangePct, changeSub: 'Day P&L' },
          { label: 'This Week', value: formatCurrency(portfolioSummary.weekChange), change: portfolioSummary.weekChangePct, changeSub: 'Week P&L' },
          { label: 'This Month', value: formatCurrency(portfolioSummary.monthChange), change: portfolioSummary.monthChangePct, changeSub: 'Month P&L' },
        ].map(m => (
          <div key={m.label} className="card-base rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1.5">{m.label}</p>
            <p className={cn('text-xl font-bold tabular', getChangeClass(m.change))}>{m.value}</p>
            <p className={cn('text-xs tabular mt-0.5', getChangeClass(m.change))}>
              {m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}% {m.changeSub}
            </p>
          </div>
        ))}
      </motion.div>

      <Tabs defaultValue="holdings">
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="risk">Risk Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings">
          {/* Search */}
          <div className="flex gap-3 mb-4">
            <Input
              placeholder="Search by symbol or name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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
                    ].map(col => (
                      <th
                        key={col.key}
                        className="text-left px-4 py-3 text-xs font-medium text-text-muted cursor-pointer hover:text-text-secondary transition-colors whitespace-nowrap"
                        onClick={() => handleSort(col.key as any)}
                      >
                        {col.label}
                        {sortKey === col.key && <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>}
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
                            style={{ background: assetClassColors[h.assetClass] + '30', color: assetClassColors[h.assetClass] }}
                          >
                            {h.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{h.symbol}</p>
                            <p className="text-xs text-text-muted max-w-[120px] truncate">{h.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{ background: `${assetClassColors[h.assetClass]}15`, color: assetClassColors[h.assetClass] }}
                        >
                          {h.assetClass}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 tabular text-text-secondary font-medium">{h.weight.toFixed(1)}%</td>
                      <td className="px-4 py-3.5 tabular text-text-primary font-semibold">{formatCurrency(h.value, { compact: true })}</td>
                      <td className="px-4 py-3.5 tabular text-text-secondary">{formatCurrency(h.currentPrice, { decimals: 2 })}</td>
                      <td className={cn('px-4 py-3.5 tabular font-semibold', getChangeClass(h.dayChangePct))}>
                        {h.dayChangePct >= 0 ? '+' : ''}{h.dayChangePct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3.5 tabular text-text-secondary">{h.beta.toFixed(2)}</td>
                      <td className="px-4 py-3.5 tabular text-text-secondary">{h.volatility.toFixed(1)}%</td>
                      <td className={cn('px-4 py-3.5 tabular font-semibold', h.riskContribution > 15 ? 'text-red-400' : h.riskContribution > 8 ? 'text-amber-400' : 'text-text-secondary')}>
                        {h.riskContribution.toFixed(1)}%
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="risk">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {riskMetricCards.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card-base rounded-xl p-4"
              >
                <p className="text-xs text-text-muted mb-2">{m.label}</p>
                <p className="text-2xl font-bold tabular" style={{ color: m.color }}>{m.value}</p>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
