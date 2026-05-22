'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, Plus, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from '@/components/common/RiskBadge'
import { timelineEvents } from '@/lib/mock-data/everyday'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/types'

const levelColor: Record<RiskLevel, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}

const levelBg: Record<RiskLevel, string> = {
  low: 'bg-emerald-500/10 border-emerald-500/20',
  medium: 'bg-amber-500/10 border-amber-500/20',
  high: 'bg-orange-500/10 border-orange-500/20',
  critical: 'bg-red-500/10 border-red-500/20',
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function TimelinePage() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  const totalImpact = timelineEvents.reduce((acc, e) => acc + (e.amount ?? 0), 0)
  const highRiskCount = timelineEvents.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical').length

  const sortedEvents = [...timelineEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const groupedByMonth = sortedEvents.reduce((acc, evt) => {
    const date = new Date(evt.date)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    if (!acc[key]) acc[key] = { label: `${months[date.getMonth()]} ${date.getFullYear()}`, events: [] }
    acc[key].events.push(evt)
    return acc
  }, {} as Record<string, { label: string; events: typeof timelineEvents }>)

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Risk Timeline</h2>
          <p className="text-sm text-text-muted">
            {timelineEvents.length} upcoming events · {formatCurrency(totalImpact)} total projected impact
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-lg p-1">
            {(['list', 'calendar'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                  viewMode === mode
                    ? 'bg-white/[0.08] text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          <Button variant="brand" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Event
          </Button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Upcoming events', value: timelineEvents.length, color: '#4f8ef7' },
          { label: 'High priority', value: highRiskCount, color: '#f97316' },
          { label: 'Total projected cost', value: formatCurrency(totalImpact, { compact: true }), color: '#f59e0b' },
          { label: 'Next event', value: '11 days', color: '#10b981' },
        ].map(m => (
          <div key={m.label} className="card-base rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1.5">{m.label}</p>
            <p className="text-xl font-bold tabular" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(groupedByMonth).map(([key, group], gi) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.08, duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Calendar className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-sm font-semibold text-text-secondary">{group.label}</span>
              </div>
              <span className="text-xs text-text-muted">{group.events.length} events</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <div className="space-y-3 pl-4 border-l border-white/[0.06]">
              {group.events.map((evt, i) => {
                const daysLeft = Math.floor((new Date(evt.date).getTime() - Date.now()) / 86400000)
                const isSelected = selectedEvent === evt.id

                return (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: gi * 0.05 + i * 0.04 }}
                    className={cn(
                      'relative -ml-[1px] rounded-xl border p-4 cursor-pointer transition-all duration-200',
                      levelBg[evt.riskLevel],
                      isSelected ? 'shadow-card' : 'hover:border-white/[0.12]'
                    )}
                    onClick={() => setSelectedEvent(isSelected ? null : evt.id)}
                  >
                    {/* Timeline dot */}
                    <div
                      className="absolute -left-[13px] top-5 w-3 h-3 rounded-full border-2 border-base-950"
                      style={{ background: levelColor[evt.riskLevel] }}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-sm font-semibold text-text-primary">{evt.title}</h4>
                          {evt.isRecurring && (
                            <span className="text-2xs px-1.5 py-0.5 rounded bg-white/[0.06] text-text-muted border border-white/[0.06]">
                              Recurring
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mb-2">{evt.description}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-text-muted">
                            {formatDate(evt.date)}
                            {daysLeft >= 0 && (
                              <span className={cn('ml-1.5 font-semibold', daysLeft <= 30 ? 'text-amber-400' : 'text-text-secondary')}>
                                ({daysLeft === 0 ? 'today' : `${daysLeft}d away`})
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-text-muted">{evt.category}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <RiskBadge level={evt.riskLevel} size="sm" />
                        {evt.amount != null && evt.amount > 0 && (
                          <span className="text-sm font-bold tabular text-text-primary">
                            {formatCurrency(evt.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
