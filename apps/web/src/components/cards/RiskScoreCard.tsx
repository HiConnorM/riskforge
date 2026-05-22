'use client'

import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp, Info } from 'lucide-react'
import { RiskGauge } from '@/components/charts/RiskGauge'
import { cn, scoreToRiskLevel, getRiskColor, getRiskLabel } from '@/lib/utils'

interface RiskScoreCardProps {
  score: number
  previousScore?: number
  label?: string
  description?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function RiskScoreCard({
  score,
  previousScore,
  label = 'Overall Risk Score',
  description,
  className,
  size = 'lg',
}: RiskScoreCardProps) {
  const riskLevel = scoreToRiskLevel(score)
  const color = getRiskColor(riskLevel)
  const riskLabel = getRiskLabel(riskLevel)
  const change = previousScore !== undefined ? score - previousScore : undefined
  const improved = change !== undefined && change < 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'card-base rounded-xl p-6 flex flex-col items-center text-center',
        'relative overflow-hidden',
        className
      )}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, ${color} 0%, transparent 70%)`,
        }}
      />

      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 relative">
        {label}
      </p>

      <div className="relative">
        <RiskGauge score={score} size={size} showLabel={false} />
      </div>

      {/* Risk level pill */}
      <div
        className="flex items-center gap-2 rounded-full px-3 py-1 mt-2 mb-3"
        style={{
          background: `${color}15`,
          border: `1px solid ${color}30`,
        }}
      >
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
        <span className="text-sm font-semibold" style={{ color }}>
          {riskLabel} Risk
        </span>
      </div>

      {change !== undefined && (
        <div className={cn(
          'flex items-center gap-1.5 text-sm font-medium mb-2',
          improved ? 'text-emerald-400' : 'text-red-400'
        )}>
          {improved ? (
            <TrendingDown className="w-4 h-4" />
          ) : (
            <TrendingUp className="w-4 h-4" />
          )}
          <span>
            {improved ? '↓' : '↑'} {Math.abs(change)} points vs last month
          </span>
        </div>
      )}

      {description && (
        <p className="text-xs text-text-muted max-w-xs leading-relaxed">{description}</p>
      )}
    </motion.div>
  )
}
