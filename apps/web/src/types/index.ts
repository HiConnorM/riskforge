// ============================================================
// SHARED TYPES
// ============================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type AppMode = 'everyday' | 'pro'
export type TimeFrame = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'
export type TrendDirection = 'up' | 'down' | 'stable'

// ============================================================
// EVERYDAY TYPES
// ============================================================

export interface EverydayUserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  monthlyIncome: number
  monthlyExpenses: number
  savingsBalance: number
  emergencyFundTarget: number
  riskScore: number
  riskLevel: RiskLevel
  memberSince: string
  plan: 'free' | 'plus' | 'pro'
}

export interface RiskScoreHistory {
  date: string
  score: number
}

export interface BudgetCategory {
  id: string
  name: string
  budgeted: number
  actual: number
  icon: string
  trend: TrendDirection
  changePercent: number
}

export interface RiskScenario {
  id: string
  title: string
  description: string
  probability: number
  impact: number
  riskLevel: RiskLevel
  category: string
  estimatedCost: number
  preparednessScore: number
  tags: string[]
  lastUpdated: string
  monthlyImpact?: number
  daysUntil?: number
}

export interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  riskLevel: RiskLevel
  category: string
  amount?: number
  isRecurring: boolean
  status: 'upcoming' | 'active' | 'resolved'
}

export interface EmergencyPlan {
  id: string
  category: string
  title: string
  steps: string[]
  contactName?: string
  contactPhone?: string
  estimatedCost: number
  fundingSource: string
  status: 'ready' | 'partial' | 'not-ready'
}

export interface SpendingDataPoint {
  month: string
  actual: number
  budget: number
  projected: number
}

export interface InsightCard {
  id: string
  type: 'action' | 'warning' | 'achievement' | 'tip'
  title: string
  description: string
  cta?: string
  ctaHref?: string
  priority: number
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// ============================================================
// PRO TYPES
// ============================================================

export interface PortfolioHolding {
  id: string
  symbol: string
  name: string
  assetClass: 'equity' | 'fixed-income' | 'crypto' | 'commodities' | 'cash' | 'alternatives'
  weight: number
  value: number
  quantity: number
  avgCost: number
  currentPrice: number
  dayChange: number
  dayChangePct: number
  beta: number
  volatility: number
  riskContribution: number
  sector?: string
  region?: string
}

export interface RiskMetrics {
  portfolioVaR95: number
  portfolioVaR99: number
  cVar: number
  sharpeRatio: number
  sortino: number
  maxDrawdown: number
  beta: number
  alpha: number
  trackingError: number
  informationRatio: number
  volatility: number
  correlationMatrix?: Record<string, Record<string, number>>
}

export interface StressTest {
  id: string
  name: string
  description: string
  scenario: string
  portfolioImpact: number
  portfolioImpactPct: number
  worstHolding: string
  bestHolding: string
  probability: string
  historicalPrecedent?: string
  holdingsImpact: Array<{
    symbol: string
    impact: number
    impactPct: number
  }>
}

export interface ProAlert {
  id: string
  type: 'var_breach' | 'concentration' | 'drawdown' | 'volatility' | 'correlation' | 'liquidity' | 'custom'
  severity: RiskLevel
  title: string
  description: string
  metric?: string
  threshold?: number
  currentValue?: number
  triggeredAt: string
  isRead: boolean
  action?: string
}

export interface VolatilityDataPoint {
  date: string
  portfolioVol: number
  benchmarkVol: number
  vix?: number
}

export interface AllocationSlice {
  name: string
  value: number
  color: string
}

export interface RiskHeatmapCell {
  row: string
  col: string
  value: number
  label: string
}

export interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  volume: string
  marketCap: string
  riskScore: number
  riskLevel: RiskLevel
  alert?: string
}

export interface BusinessRisk {
  id: string
  category: string
  title: string
  description: string
  likelihood: number
  impact: number
  riskScore: number
  riskLevel: RiskLevel
  owner?: string
  mitigations: string[]
  status: 'identified' | 'assessed' | 'mitigated' | 'monitored'
  reviewDate: string
}

// ============================================================
// NAVIGATION TYPES
// ============================================================

export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: string | number
  isNew?: boolean
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

// ============================================================
// PRICING TYPES
// ============================================================

export interface PricingTier {
  id: string
  name: string
  description: string
  monthlyPrice: number
  annualPrice: number
  mode: AppMode | 'both'
  features: string[]
  highlights: string[]
  isPopular?: boolean
  ctaLabel: string
}
