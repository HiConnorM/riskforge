/**
 * Convert a ScenarioDefinition + user's financial profile into an API
 * simulation request, ready to be passed to `useSimulation().run()`.
 */

import type { ScenarioDefinition } from './types'
import type { CashflowSimRequest, PortfolioSimRequest, AssetInput } from '@/lib/api-client'

// ─── User financial profile (pulled from state / form) ────────────────────────

export interface UserProfile {
  monthlyIncome: number
  monthlyFixedExpenses: number
  monthlyVariableExpenses: number
  currentSavings: number
}

// Default profile to use if the user hasn't entered real data.
export const DEFAULT_PROFILE: UserProfile = {
  monthlyIncome: 5_200,
  monthlyFixedExpenses: 2_100,
  monthlyVariableExpenses: 1_200,
  currentSavings: 8_500,
}

// ─── Build cashflow request ────────────────────────────────────────────────────

/**
 * Build a personal_cashflow_risk simulation request from a scenario and a
 * user financial profile. Income shocks and expense modifiers from the
 * scenario are layered on top of the baseline profile.
 */
export function toCashflowRequest(
  scenario: ScenarioDefinition,
  profile: UserProfile = DEFAULT_PROFILE,
  paths = 5_000,
): CashflowSimRequest {
  const mod = scenario.expenseModifiers ?? {}

  // Apply expense modifiers.
  const fixedMultiplier  = 1 + (mod.fixedIncreasePct  ?? 0)
  const varMultiplier    = 1 + (mod.variableIncreasePct ?? 0)
  const fixedExpenses    = profile.monthlyFixedExpenses * fixedMultiplier + (mod.fixedIncreaseFlat ?? 0)
  const variableExpenses = profile.monthlyVariableExpenses * varMultiplier + (mod.variableIncreaseFlat ?? 0)

  // Build riskEvents array (domain format).
  const riskEvents = (scenario.riskEvents ?? []).map((ev) => ({
    name: ev.name,
    category: ev.category,
    probabilityPerMonth: ev.probabilityPerMonth,
    minCost: ev.minCost,
    ...(ev.likelyCost !== undefined && { likelyCost: ev.likelyCost }),
    maxCost: ev.maxCost,
    ...(ev.maxOccurrences !== undefined && { maxOccurrences: ev.maxOccurrences }),
  }))

  // Build incomeShocks array (domain format).
  const incomeShocks = (scenario.incomeShocks ?? []).map((s) => ({
    name: s.name,
    probabilityPerYear: s.probabilityPerYear,
    incomeFractionLost: s.incomeFractionLost,
    durationMonthsMin: s.durationMonthsMin,
    durationMonthsMax: s.durationMonthsMax,
  }))

  return {
    kind: 'personal_cashflow_risk',
    input: {
      monthlyIncome: profile.monthlyIncome,
      monthlyFixedExpenses: Math.max(0, fixedExpenses),
      monthlyVariableExpenses: Math.max(0, variableExpenses),
      currentSavings: profile.currentSavings,
      horizonMonths: Math.min(60, Math.max(1, scenario.horizonMonths)),
      riskEvents: riskEvents.slice(0, 20), // domain max: 20
      ...(incomeShocks.length > 0 && { incomeShocks: incomeShocks.slice(0, 5) }),
      ...(scenario.inflationRate !== undefined && { inflationRate: scenario.inflationRate }),
    },
    config: {
      paths,
    },
  }
}

// ─── Build portfolio request from scenario ────────────────────────────────────

const DEFAULT_MU_BY_CLASS: Record<string, number> = {
  equity: 0.08,
  'fixed-income': 0.04,
  crypto: 0.20,
  commodities: 0.05,
  cash: 0.04,
  alternatives: 0.07,
}

export interface PortfolioHoldingInput {
  name: string
  weight: number    // 0–100 (percent)
  volatility: number // annualised, percent (e.g. 22 = 22%)
  assetClass?: string
  mu?: number       // optional override
}

/**
 * Build a portfolio_risk simulation request from a scenario and the user's
 * current holdings.
 */
export function toPortfolioRequest(
  scenario: ScenarioDefinition,
  holdings: PortfolioHoldingInput[],
  // Default within MAX_PATHS_ANONYMOUS (5k): the API rejects anonymous
  // requests above it with 402 until real auth + plan tiers exist.
  paths = 5_000,
): PortfolioSimRequest | null {
  if (!scenario.portfolioParams) return null

  const params = scenario.portfolioParams
  const active = holdings.filter((h) => h.weight > 0)
  if (active.length === 0) return null

  const totalWeight = active.reduce((s, h) => s + h.weight, 0)

  const assets: AssetInput[] = active.map((h) => ({
    name: h.name,
    weight: h.weight / totalWeight,
    mu: h.mu ?? DEFAULT_MU_BY_CLASS[h.assetClass ?? 'equity'] ?? 0.06,
    sigma: Math.max(h.volatility / 100, 0.001),
  }))

  const n = assets.length
  const corr = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  )

  return {
    kind: 'portfolio_risk',
    input: { assets, corr },
    config: {
      paths,
      horizonDays: params.horizonDays,
      distribution: params.distribution,
      ...(params.df !== undefined && { df: params.df }),
      stress: {
        volMultiplier: params.stressFactor,
        corrTarget: params.targetCorr,
      },
    },
  }
}
