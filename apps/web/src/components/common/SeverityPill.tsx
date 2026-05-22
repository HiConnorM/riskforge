import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/types'

interface SeverityPillProps {
  severity: RiskLevel
  className?: string
  pulse?: boolean
}

const config: Record<RiskLevel, { label: string; className: string; pulseColor: string }> = {
  low: {
    label: 'Low',
    className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
    pulseColor: 'bg-emerald-400',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
    pulseColor: 'bg-amber-400',
  },
  high: {
    label: 'High',
    className: 'bg-orange-500/15 text-orange-300 border border-orange-500/25',
    pulseColor: 'bg-orange-400',
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-500/15 text-red-300 border border-red-500/30',
    pulseColor: 'bg-red-400',
  },
}

export function SeverityPill({ severity, className, pulse = false }: SeverityPillProps) {
  const c = config[severity]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        c.className,
        className
      )}
    >
      {pulse ? (
        <span className="relative flex h-2 w-2">
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', c.pulseColor)} />
          <span className={cn('relative inline-flex rounded-full h-2 w-2', c.pulseColor)} />
        </span>
      ) : (
        <span className={cn('rounded-full w-2 h-2', c.pulseColor)} />
      )}
      {c.label}
    </span>
  )
}
