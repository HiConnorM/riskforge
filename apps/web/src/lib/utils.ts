import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { RiskLevel } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  value: number,
  options: { compact?: boolean; decimals?: number } = {}
): string {
  const { compact = false, decimals = 0 } = options

  if (!isFinite(value)) return '$—'

  if (compact) {
    if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`
    }
    if (Math.abs(value) >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}K`
    }
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

export function formatNumber(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`
    }
    if (Math.abs(value) >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`
    }
  }
  return new Intl.NumberFormat('en-US').format(value)
}

export function getRiskColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  }
  return colors[level]
}

export function getRiskBgColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: 'rgba(16, 185, 129, 0.1)',
    medium: 'rgba(245, 158, 11, 0.1)',
    high: 'rgba(249, 115, 22, 0.1)',
    critical: 'rgba(239, 68, 68, 0.1)',
  }
  return colors[level]
}

export function getRiskLabel(level: RiskLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

export function scoreToRiskLevel(score: number): RiskLevel {
  if (score < 30) return 'low'
  if (score < 55) return 'medium'
  if (score < 75) return 'high'
  return 'critical'
}

export function getScoreColor(score: number): string {
  return getRiskColor(scoreToRiskLevel(score))
}

export function formatRiskScore(score: number): string {
  return score.toFixed(0)
}

export function calcEmergencyBufferDays(
  savingsBalance: number,
  monthlyExpenses: number
): number {
  return Math.floor((savingsBalance / monthlyExpenses) * 30)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function daysUntil(dateString: string): number {
  const target = new Date(dateString)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getChangeClass(value: number): string {
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-red-400'
  return 'text-slate-400'
}

export function getTrendIcon(value: number): string {
  if (value > 0) return '↑'
  if (value < 0) return '↓'
  return '→'
}
