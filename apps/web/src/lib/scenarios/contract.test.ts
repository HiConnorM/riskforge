/**
 * API contract tests: every request the web app can build must validate
 * against the shared @riskforge/domain schema, and — critically — the stress
 * parameters must SURVIVE validation.
 *
 * Background: Zod silently strips unknown object keys. When the web sent
 * `stress: { factor, targetCorr }` instead of the schema's
 * `{ volMultiplier, corrTarget }`, validation passed but the stress config
 * arrived at the engine as `{}` — simulations reported "stressed" without
 * applying any stress. These tests make that class of bug loud.
 */

import { describe, it, expect } from 'vitest'
import { SimulationRequestSchema } from '@riskforge/domain'
import { SCENARIOS } from './definitions'
import { toCashflowRequest, toPortfolioRequest, DEFAULT_PROFILE } from './to-request'
import type { PortfolioHoldingInput } from './to-request'

const holdings: PortfolioHoldingInput[] = [
  { name: 'SPY', weight: 60, volatility: 18, assetClass: 'equity' },
  { name: 'AGG', weight: 30, volatility: 6, assetClass: 'fixed-income' },
  { name: 'BTC', weight: 10, volatility: 70, assetClass: 'crypto' },
]

describe('contract — cashflow requests', () => {
  const cashflowScenarios = SCENARIOS.filter(
    (s) => (s.riskEvents?.length ?? 0) > 0 || (s.incomeShocks?.length ?? 0) > 0 || s.expenseModifiers,
  )

  it('has scenarios to test', () => {
    expect(cashflowScenarios.length).toBeGreaterThan(0)
  })

  it.each(cashflowScenarios.map((s) => [s.id, s] as const))(
    'scenario %s builds a schema-valid personal_cashflow_risk request',
    (_id, scenario) => {
      const req = toCashflowRequest(scenario, DEFAULT_PROFILE)
      const parsed = SimulationRequestSchema.parse(req)
      expect(parsed.kind).toBe('personal_cashflow_risk')
    },
  )
})

describe('contract — portfolio requests preserve stress parameters', () => {
  const portfolioScenarios = SCENARIOS.filter((s) => s.portfolioParams)

  it('has scenarios to test', () => {
    expect(portfolioScenarios.length).toBeGreaterThan(0)
  })

  it.each(portfolioScenarios.map((s) => [s.id, s] as const))(
    'scenario %s: stress keys survive schema validation',
    (_id, scenario) => {
      const req = toPortfolioRequest(scenario, holdings)
      expect(req).not.toBeNull()

      const parsed = SimulationRequestSchema.parse(req)
      if (parsed.kind !== 'portfolio_risk') throw new Error('wrong kind')

      // The whole point: after Zod parsing, stress must still carry the
      // scenario's parameters — not be silently reduced to {}.
      expect(parsed.config.stress?.volMultiplier).toBe(scenario.portfolioParams!.stressFactor)
      expect(parsed.config.stress?.corrTarget).toBe(scenario.portfolioParams!.targetCorr)
    },
  )

  it('the Pro portfolio page stress-mode payload survives validation', () => {
    // Mirrors buildPortfolioRequest(..., stressed = true) in pro/portfolio/page.tsx.
    const req = {
      kind: 'portfolio_risk' as const,
      input: {
        assets: [
          { name: 'SPY', weight: 0.7, mu: 0.08, sigma: 0.18 },
          { name: 'AGG', weight: 0.3, mu: 0.04, sigma: 0.06 },
        ],
        corr: [
          [1, 0],
          [0, 1],
        ],
      },
      config: {
        paths: 10_000,
        horizonDays: 21,
        distribution: 'normal' as const,
        stress: { volMultiplier: 2.5, corrTarget: 0.75 },
      },
    }
    const parsed = SimulationRequestSchema.parse(req)
    if (parsed.kind !== 'portfolio_risk') throw new Error('wrong kind')
    expect(parsed.config.stress).toEqual({ volMultiplier: 2.5, corrTarget: 0.75 })
  })

  it('legacy stress field names are silently stripped — the bug this suite guards against', () => {
    const good = toPortfolioRequest(portfolioScenarios[0]!, holdings)!
    const legacy = {
      ...good,
      config: {
        ...good.config,
        // The pre-fix payload shape. Zod does not error on unknown keys…
        stress: { factor: 2.5, targetCorr: 0.75 } as unknown as { volMultiplier: number },
      },
    }
    const parsed = SimulationRequestSchema.parse(legacy)
    if (parsed.kind !== 'portfolio_risk') throw new Error('wrong kind')
    // …it strips them, leaving an empty stress object: a "stressed" run with
    // no stress applied. If this assertion ever fails, the schema started
    // rejecting or preserving unknown keys and this guard should be revisited.
    expect(parsed.config.stress).toEqual({})
  })
})
