'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn, getChangeClass } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'stable'
  icon?: LucideIcon
  iconColor?: string
  description?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  delay?: number
  highlight?: boolean
  footer?: React.ReactNode
}

export function MetricCard({
  title,
  value,
  unit,
  change,
  changeLabel,
  trend,
  icon: Icon,
  iconColor = '#4f8ef7',
  description,
  className,
  size = 'md',
  delay = 0,
  highlight = false,
  footer,
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'card-base rounded-xl p-5 hover:card-hover transition-all duration-200',
        highlight && 'border-brand-500/30 bg-gradient-to-br from-brand-500/5 to-transparent',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${iconColor}15`, border: `1px solid ${iconColor}20` }}
            >
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
            </div>
          )}
          <span className="text-sm font-medium text-text-secondary">{title}</span>
        </div>
        {(change !== undefined || trend) && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', change !== undefined ? getChangeClass(change) : 'text-text-muted')}>
            <TrendIcon className="w-3.5 h-3.5" />
            {change !== undefined && (
              <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
            )}
          </div>
        )}
      </div>

      <div className={cn('flex items-baseline gap-1', size === 'sm' ? 'mb-1' : 'mb-2')}>
        <span className={cn(
          'font-bold text-text-primary tabular',
          size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl'
        )}>
          {value}
        </span>
        {unit && <span className="text-sm text-text-muted font-medium">{unit}</span>}
      </div>

      {description && (
        <p className="text-xs text-text-muted leading-relaxed">{description}</p>
      )}
      {changeLabel && (
        <p className="text-xs text-text-muted mt-1">{changeLabel}</p>
      )}
      {footer && <div className="mt-3 pt-3 border-t border-white/[0.06]">{footer}</div>}
    </motion.div>
  )
}
