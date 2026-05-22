'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Plus, Settings, CheckCheck, Filter } from 'lucide-react'
import { AlertCard } from '@/components/cards/AlertCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { proAlerts } from '@/lib/mock-data/pro'
import type { ProAlert } from '@/types'
import { cn } from '@/lib/utils'

const filterOptions = ['All', 'Unread', 'Critical', 'High', 'Medium', 'Low']

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<ProAlert[]>(proAlerts)
  const [filter, setFilter] = useState('All')

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })))
  }

  const filtered = alerts.filter(a => {
    if (filter === 'All') return true
    if (filter === 'Unread') return !a.isRead
    return a.severity === filter.toLowerCase()
  })

  const unreadCount = alerts.filter(a => !a.isRead).length

  return (
    <div className="p-6 space-y-5 max-w-[900px]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-text-primary">Alerts</h2>
            {unreadCount > 0 && (
              <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted">Risk threshold breaches and portfolio warnings</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={markAllRead}>
              <CheckCheck className="w-4 h-4 mr-1.5" />
              Mark all read
            </Button>
          )}
          <Button variant="secondary" size="sm">
            <Settings className="w-4 h-4 mr-1.5" />
            Configure
          </Button>
          <Button variant="brand" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            New Alert Rule
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-4 gap-4"
      >
        {[
          { label: 'Total', value: alerts.length, color: '#4f8ef7' },
          { label: 'Unread', value: unreadCount, color: '#f59e0b' },
          { label: 'Critical/High', value: alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length, color: '#ef4444' },
          { label: 'Resolved today', value: 2, color: '#10b981' },
        ].map(m => (
          <div key={m.label} className="card-base rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1">{m.label}</p>
            <p className="text-2xl font-bold tabular" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filterOptions.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg border transition-colors',
              filter === f
                ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                : 'border-white/[0.07] text-text-muted hover:border-white/[0.12]'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <AlertCard alert={alert} onDismiss={handleDismiss} />
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-10 h-10 text-text-disabled mx-auto mb-3" />
            <p className="text-text-muted">No alerts match your filter.</p>
          </div>
        )}
      </div>

      {/* Alert rules section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-base rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-text-primary mb-4">Active Alert Rules</h3>
        <div className="space-y-2">
          {[
            { rule: 'Crypto allocation > 10%', type: 'Concentration', status: 'triggered', lastCheck: '2 hours ago' },
            { rule: 'Portfolio volatility > 20%', type: 'Volatility', status: 'triggered', lastCheck: '1 day ago' },
            { rule: 'BTC drawdown > -10%', type: 'Drawdown', status: 'monitoring', lastCheck: '1 hour ago' },
            { rule: '1-Day VaR > $50,000', type: 'VaR', status: 'triggered', lastCheck: '30 min ago' },
            { rule: 'Cash < 10% of portfolio', type: 'Liquidity', status: 'triggered', lastCheck: '2 days ago' },
          ].map(rule => (
            <div key={rule.rule} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
              <div>
                <p className="text-sm text-text-primary">{rule.rule}</p>
                <p className="text-xs text-text-muted">{rule.type} · Last checked: {rule.lastCheck}</p>
              </div>
              <span className={cn(
                'text-xs px-2.5 py-1 rounded-full font-semibold border',
                rule.status === 'triggered'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              )}>
                {rule.status === 'triggered' ? 'Triggered' : 'Monitoring'}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
