import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface LegendItem {
  color: string
  label: string
}

interface ChartCardProps {
  title: string
  description?: string
  legend?: LegendItem[]
  action?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  bodyClassName?: string
  height?: number
}

export function ChartCard({
  title,
  description,
  legend,
  action,
  children,
  className,
  headerClassName,
  bodyClassName,
  height = 240,
}: ChartCardProps) {
  return (
    <div className={cn('card-base rounded-xl p-5', className)}>
      <div className={cn('flex items-start justify-between mb-4', headerClassName)}>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {description && (
            <p className="text-xs text-text-muted mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {legend && (
            <div className="flex items-center gap-3">
              {legend.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: item.color }}
                  />
                  <span className="text-xs text-text-muted">{item.label}</span>
                </div>
              ))}
            </div>
          )}
          {action}
        </div>
      </div>
      <div className={cn('', bodyClassName)} style={{ height }}>
        {children}
      </div>
    </div>
  )
}
