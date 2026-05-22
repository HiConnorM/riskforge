'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { cn, scoreToRiskLevel, getRiskColor, getRiskLabel } from '@/lib/utils'

interface RiskGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  showScore?: boolean
  className?: string
  animated?: boolean
}

const sizes = {
  sm: { svg: 120, cx: 60, cy: 60, r: 44, stroke: 8, fontSize: 24, labelSize: 10 },
  md: { svg: 160, cx: 80, cy: 80, r: 60, stroke: 10, fontSize: 32, labelSize: 11 },
  lg: { svg: 220, cx: 110, cy: 110, r: 84, stroke: 12, fontSize: 44, labelSize: 13 },
  xl: { svg: 280, cx: 140, cy: 140, r: 108, stroke: 14, fontSize: 56, labelSize: 14 },
}

export function RiskGauge({
  score,
  size = 'md',
  showLabel = true,
  showScore = true,
  className,
  animated = true,
}: RiskGaugeProps) {
  const dim = sizes[size]
  const circumference = 2 * Math.PI * dim.r
  // We only use 270° of the circle (from 135° to 405°)
  const arcLength = circumference * 0.75
  const riskLevel = scoreToRiskLevel(score)
  const color = getRiskColor(riskLevel)
  const label = getRiskLabel(riskLevel)

  // strokeDashoffset: full = arcLength (empty), 0 = full
  const targetOffset = arcLength - (score / 100) * arcLength

  const motionScore = useMotionValue(0)
  const displayScore = useTransform(motionScore, (v) => Math.round(v).toString())

  const dashOffset = useMotionValue(arcLength)

  useEffect(() => {
    if (animated) {
      const controls = animate(motionScore, score, { duration: 1.5, ease: 'easeOut' })
      const offsetControls = animate(dashOffset, targetOffset, { duration: 1.5, ease: 'easeOut' })
      return () => {
        controls.stop()
        offsetControls.stop()
      }
    } else {
      motionScore.set(score)
      dashOffset.set(targetOffset)
    }
  }, [score, animated])

  // Track gauge starts at bottom-left (225°) and goes clockwise 270°
  const rotation = 135 // rotate to start at bottom-left

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={dim.svg}
        height={dim.svg * 0.75 + 20}
        viewBox={`0 0 ${dim.svg} ${dim.svg * 0.75 + 20}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <circle
          cx={dim.cx}
          cy={dim.cy}
          r={dim.r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={dim.stroke}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${dim.cx} ${dim.cy})`}
        />

        {/* Colored risk arc */}
        <motion.circle
          cx={dim.cx}
          cy={dim.cy}
          r={dim.r}
          fill="none"
          stroke={color}
          strokeWidth={dim.stroke}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${dim.cx} ${dim.cy})`}
          style={{
            filter: `drop-shadow(0 0 6px ${color}55)`,
          }}
        />

        {/* Score text */}
        {showScore && (
          <motion.text
            x={dim.cx}
            y={dim.cy + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize={dim.fontSize}
            fontWeight="700"
            fontFamily="system-ui"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {displayScore}
          </motion.text>
        )}

        {/* Label below score */}
        {showLabel && (
          <text
            x={dim.cx}
            y={dim.cy + dim.fontSize * 0.6 + 10}
            textAnchor="middle"
            fill="rgba(148,163,184,0.8)"
            fontSize={dim.labelSize}
            fontWeight="500"
          >
            {label} Risk
          </text>
        )}

        {/* Min / Max labels */}
        <text
          x={dim.cx - dim.r - dim.stroke / 2 - 2}
          y={dim.cy + dim.r * 0.72 + 4}
          textAnchor="middle"
          fill="rgba(100,116,139,0.7)"
          fontSize={size === 'sm' ? 8 : 10}
        >
          0
        </text>
        <text
          x={dim.cx + dim.r + dim.stroke / 2 + 2}
          y={dim.cy + dim.r * 0.72 + 4}
          textAnchor="middle"
          fill="rgba(100,116,139,0.7)"
          fontSize={size === 'sm' ? 8 : 10}
        >
          100
        </text>
      </svg>
    </div>
  )
}
