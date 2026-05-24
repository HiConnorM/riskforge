/**
 * Scenario library types.
 *
 * Each ScenarioDefinition holds everything needed to:
 * 1. Display the scenario in the UI (name, description, severity, category).
 * 2. Build a real API simulation request from a user's financial profile.
 */

// ─── Engine-aligned category enum ────────────────────────────────────────────
// Matches the `category` field in the domain RiskEventSchema.
export type RiskEventCategory =
  | 'car'
  | 'pet'
  | 'medical'
  | 'housing'
  | 'food'
  | 'shopping'
  | 'job'
  | 'family'
  | 'utility'
  | 'appliance'
  | 'other'

// ─── Scenario taxonomy ────────────────────────────────────────────────────────

export type ScenarioGroup =
  | 'income_job'
  | 'housing'
  | 'transportation'
  | 'health'
  | 'pet'
  | 'food_living'
  | 'debt_credit'
  | 'family'
  | 'disaster'
  | 'macro_historical'
  | 'market_portfolio'

export type Severity = 'mild' | 'moderate' | 'severe' | 'extreme'

export type Tier = 'everyday' | 'pro' | 'both'

// ─── Income shock definition (matches domain incomeShocks schema) ─────────────

export interface IncomeShockDef {
  name: string
  /** P(occurs at least once this year). 0 < value ≤ 1 */
  probabilityPerYear: number
  /** Fraction of income lost during the shock (0.5 = 50% reduction). */
  incomeFractionLost: number
  durationMonthsMin: number
  durationMonthsMax: number
}

// ─── Risk event definition (matches domain RiskEventSchema) ───────────────────

export interface RiskEventDef {
  name: string
  category: RiskEventCategory
  /** Per-month probability of this event occurring. */
  probabilityPerMonth: number
  /** Lower bound cost ($). */
  minCost: number
  /** Upper bound cost ($). PERT mode value (most likely). */
  likelyCost?: number
  /** Upper bound cost ($). */
  maxCost: number
  /** Cap on total occurrences over the horizon. Default: unlimited. */
  maxOccurrences?: number
}

// ─── Expense modifier (applied to the user's baseline) ───────────────────────

export interface ExpenseModifier {
  /** Multiply monthly fixed expenses by (1 + pct). E.g. 0.15 = 15% increase. */
  fixedIncreasePct?: number
  /** Multiply monthly variable expenses by (1 + pct). */
  variableIncreasePct?: number
  /** Add flat dollar amount to monthly fixed expenses. */
  fixedIncreaseFlat?: number
  /** Add flat dollar amount to monthly variable expenses. */
  variableIncreaseFlat?: number
}

// ─── Portfolio stress parameters (pro tier) ───────────────────────────────────

export interface PortfolioParams {
  /** Volatility multiplier applied to all assets' sigma values. */
  stressFactor: number
  /** Target correlation during stress (0-1). Default: 0 = no blending. */
  targetCorr: number
  /** Simulation horizon in calendar days. */
  horizonDays: number
  /** Return distribution. 'student_t' better captures fat tails. */
  distribution: 'normal' | 'student_t'
  /** Student-t degrees of freedom (lower = fatter tails). */
  df?: number
  /** Brief narrative for display. */
  description: string
}

// ─── Core scenario definition ─────────────────────────────────────────────────

export interface ScenarioDefinition {
  id: string
  name: string
  group: ScenarioGroup
  /** Sub-label shown in the UI. */
  subcategory?: string
  description: string
  /** Footnote with real-world context or historical grounding. */
  historicalRef?: string
  tier: Tier
  severity: Severity
  /**
   * Estimated annual probability of this scenario happening to the user.
   * Used for display only — not directly fed into the simulation.
   * Range: 0–100 (percent).
   */
  annualProbabilityPct: number

  // ── Cashflow simulation parameters ──────────────────────────────────────────
  /** Income shocks (job loss, reduced hours, etc.). */
  incomeShocks?: IncomeShockDef[]
  /** One-time or recurring cost events. */
  riskEvents?: RiskEventDef[]
  /** Adjustments to the user's baseline monthly expenses. */
  expenseModifiers?: ExpenseModifier
  /** Simulation horizon for this scenario. Default: 12. */
  horizonMonths: number
  /** Annual inflation rate to apply during this scenario. */
  inflationRate?: number

  // ── Portfolio simulation parameters (pro tier only) ──────────────────────────
  portfolioParams?: PortfolioParams
}

// ─── Bundle ───────────────────────────────────────────────────────────────────

export interface ScenarioBundle {
  id: string
  name: string
  description: string
  emoji: string
  color: string
  scenarioIds: string[]
  tier: Tier
}
