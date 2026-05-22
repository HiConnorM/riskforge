'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, disabled }, ref) => {
    const currentValue = value[0] ?? 0
    const percentage = ((currentValue - min) / (max - min)) * 100

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange([Number(e.target.value)])
    }

    return (
      <div ref={ref} className={cn('relative flex w-full touch-none select-none items-center', className)}>
        <div className="relative h-2 w-full rounded-full bg-white/[0.08]">
          <div
            className="absolute h-full rounded-full bg-brand-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div
          className="absolute h-5 w-5 rounded-full border-2 border-brand-500 bg-base-900 shadow-glow-sm"
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    )
  }
)
Slider.displayName = 'Slider'

export { Slider }
