'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Shield, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { RiskBadge } from '@/components/common/RiskBadge'
import { Progress } from '@/components/ui/progress'
import { cn, formatCurrency, getRiskColor } from '@/lib/utils'
import type { RiskScenario } from '@/types'

interface ScenarioCardProps {
  scenario: RiskScenario
  delay?: number
  compact?: boolean
  className?: string
}

export function ScenarioCard({ scenario, delay = 0, compact = false, className }: ScenarioCardProps) {
  const riskColor = getRiskColor(scenario.riskLevel)

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.3 }}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group',
          className
        )}
      >
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: riskColor, boxShadow: `0 0 6px ${riskColor}50` }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{scenario.title}</p>
          <p className="text-xs text-text-muted">{formatCurrency(scenario.estimatedCost)} est. cost</p>
        </div>
        <RiskBadge level={scenario.riskLevel} size="sm" />
        <ChevronRight className="w-4 h-4 text-text-disabled group-hover:text-text-muted transition-colors" />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'card-base rounded-xl p-5 hover:border-white/[0.1] transition-all duration-200 group cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${riskColor}15`, border: `1px solid ${riskColor}25` }}
          >
            <AlertTriangle className="w-4 h-4" style={{ color: riskColor }} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-text-primary group-hover:text-white transition-colors truncate">
              {scenario.title}
            </h4>
            <span className="text-xs text-text-muted">{scenario.category}</span>
          </div>
        </div>
        <RiskBadge level={scenario.riskLevel} size="sm" className="flex-shrink-0 ml-2" />
      </div>

      <p className="text-xs text-text-muted leading-relaxed mb-4 line-clamp-2">
        {scenario.description}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-sm font-bold text-text-primary tabular">{scenario.probability}%</div>
          <div className="text-2xs text-text-muted mt-0.5">Probability</div>
        </div>
        <div className="text-center border-x border-white/[0.06]">
          <div className="text-sm font-bold text-text-primary tabular">{formatCurrency(scenario.estimatedCost, { compact: true })}</div>
          <div className="text-2xs text-text-muted mt-0.5">Est. Cost</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold" style={{ color: riskColor }}>{scenario.impact}</div>
          <div className="text-2xs text-text-muted mt-0.5">Impact</div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-2xs text-text-muted flex items-center gap-1">
            <Shield className="w-3 h-3" /> Preparedness
          </span>
          <span className="text-2xs font-semibold text-text-secondary">{scenario.preparednessScore}/100</span>
        </div>
        <Progress
          value={scenario.preparednessScore}
          className="h-1.5"
          indicatorClassName={cn(
            scenario.preparednessScore >= 70
              ? 'bg-emerald-500'
              : scenario.preparednessScore >= 40
              ? 'bg-amber-500'
              : 'bg-red-500'
          )}
        />
      </div>
    </motion.div>
  )
}
