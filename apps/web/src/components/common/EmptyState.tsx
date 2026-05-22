import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  compact?: boolean
}

export function EmptyState({ icon: Icon, title, description, action, className, compact = false }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-8',
        className
      )}
    >
      {Icon && (
        <div className={cn(
          'flex items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-4',
          compact ? 'w-12 h-12' : 'w-16 h-16'
        )}>
          <Icon className={cn('text-text-muted', compact ? 'w-5 h-5' : 'w-7 h-7')} />
        </div>
      )}
      <h3 className={cn('font-semibold text-text-primary mb-1', compact ? 'text-sm' : 'text-base')}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-text-muted max-w-xs leading-relaxed', compact ? 'text-xs mb-3' : 'text-sm mb-5')}>
          {description}
        </p>
      )}
      {action && (
        <Button variant="secondary" size={compact ? 'sm' : 'default'} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
