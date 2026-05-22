'use client'

import { motion } from 'framer-motion'
import { Lightbulb, AlertTriangle, Trophy, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { InsightCard as InsightCardType } from '@/types'

interface InsightCardProps {
  insight: InsightCardType
  delay?: number
  className?: string
}

const insightConfig = {
  action: {
    icon: Lightbulb,
    color: '#4f8ef7',
    bg: 'rgba(79, 142, 247, 0.08)',
    border: 'rgba(79, 142, 247, 0.2)',
    label: 'Action Needed',
  },
  warning: {
    icon: AlertTriangle,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.2)',
    label: 'Heads Up',
  },
  achievement: {
    icon: Trophy,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.2)',
    label: 'Achievement',
  },
  tip: {
    icon: Sparkles,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.2)',
    label: 'Tip',
  },
}

export function InsightCard({ insight, delay = 0, className }: InsightCardProps) {
  const config = insightConfig[insight.type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-xl p-4 border',
        className
      )}
      style={{ background: config.bg, borderColor: config.border }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${config.color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-2xs font-bold uppercase tracking-wider"
              style={{ color: config.color }}
            >
              {config.label}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-text-primary mb-1 leading-snug">
            {insight.title}
          </h4>
          <p className="text-xs text-text-muted leading-relaxed mb-3">
            {insight.description}
          </p>
          {insight.cta && (
            <Link href={insight.ctaHref ?? '#'}>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs -ml-2" style={{ color: config.color }}>
                {insight.cta}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}
