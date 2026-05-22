import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/types'

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showDot?: boolean
}

const riskConfig: Record<RiskLevel, { label: string; className: string; dotColor: string }> = {
  low: {
    label: 'Low',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dotColor: 'bg-emerald-400',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dotColor: 'bg-amber-400',
  },
  high: {
    label: 'High',
    className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    dotColor: 'bg-orange-400',
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
    dotColor: 'bg-red-400',
  },
}

const sizeConfig = {
  sm: 'text-2xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
}

export function RiskBadge({ level, className, size = 'md', showDot = true }: RiskBadgeProps) {
  const config = riskConfig[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border',
        config.className,
        sizeConfig[size],
        className
      )}
    >
      {showDot && (
        <span className={cn('rounded-full flex-shrink-0', config.dotColor, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      )}
      {config.label}
    </span>
  )
}
