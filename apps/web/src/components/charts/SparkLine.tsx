'use client'

import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'

interface SparkLineProps {
  data: Array<{ value: number; label?: string }>
  color?: string
  height?: number
  className?: string
  showTooltip?: boolean
  width?: number
}

export function SparkLine({
  data,
  color = '#4f8ef7',
  height = 40,
  className,
  showTooltip = false,
  width,
}: SparkLineProps) {
  const lastValue = data[data.length - 1]?.value ?? 0
  const firstValue = data[0]?.value ?? 0
  const isPositive = lastValue >= firstValue
  const lineColor = color === 'auto' ? (isPositive ? '#10b981' : '#ef4444') : color

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width={width ?? '100%'} height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={true}
            animationDuration={800}
          />
          {showTooltip && (
            <Tooltip
              contentStyle={{
                background: '#1e2535',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#f1f5f9',
              }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
