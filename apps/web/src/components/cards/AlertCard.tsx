'use client'

import { motion } from 'framer-motion'
import { Bell, X, ChevronRight } from 'lucide-react'
import { SeverityPill } from '@/components/common/SeverityPill'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import type { ProAlert } from '@/types'

interface AlertCardProps {
  alert: ProAlert
  delay?: number
  onDismiss?: (id: string) => void
  compact?: boolean
  className?: string
}

export function AlertCard({ alert, delay = 0, onDismiss, compact = false, className }: AlertCardProps) {
  const severityBorder = {
    low: 'border-emerald-500/20',
    medium: 'border-amber-500/20',
    high: 'border-orange-500/25',
    critical: 'border-red-500/30',
  }

  const severityBg = {
    low: 'bg-emerald-500/5',
    medium: 'bg-amber-500/5',
    high: 'bg-orange-500/5',
    critical: 'bg-red-500/8',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        'rounded-xl border p-4',
        !alert.isRead && 'border-l-2',
        severityBorder[alert.severity],
        severityBg[alert.severity],
        compact && 'p-3',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <SeverityPill severity={alert.severity} pulse={!alert.isRead} />
            {!alert.isRead && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
            )}
          </div>
          <h4 className={cn('font-semibold text-text-primary', compact ? 'text-xs' : 'text-sm')}>
            {alert.title}
          </h4>
          {!compact && (
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              {alert.description}
            </p>
          )}
          {alert.metric && alert.currentValue !== undefined && !compact && (
            <div className="flex items-center gap-4 mt-2">
              <div>
                <span className="text-2xs text-text-muted">Current </span>
                <span className="text-xs font-bold text-text-primary tabular">{alert.currentValue}</span>
              </div>
              {alert.threshold !== undefined && (
                <div>
                  <span className="text-2xs text-text-muted">Threshold </span>
                  <span className="text-xs font-semibold text-text-secondary tabular">{alert.threshold}</span>
                </div>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDismiss(alert.id)}
            className="flex-shrink-0 opacity-60 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {alert.action && !compact && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <p className="text-xs text-text-muted">
            <span className="font-medium text-text-secondary">Suggested: </span>
            {alert.action}
          </p>
        </div>
      )}
    </motion.div>
  )
}
