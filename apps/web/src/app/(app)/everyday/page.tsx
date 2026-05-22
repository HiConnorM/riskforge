'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { Shield, Zap, Calendar, MessageCircle, ArrowRight, TrendingDown, Wallet, Activity } from 'lucide-react'
import { RiskScoreCard } from '@/components/cards/RiskScoreCard'
import { MetricCard } from '@/components/cards/MetricCard'
import { ScenarioCard } from '@/components/cards/ScenarioCard'
import { InsightCard } from '@/components/cards/InsightCard'
import { ChartCard } from '@/components/charts/ChartCard'
import { Button } from '@/components/ui/button'
import {
  everydayProfile,
  riskScoreHistory,
  riskScenarios,
  spendingData,
  timelineEvents,
  insights,
  budgetCategories,
} from '@/lib/mock-data/everyday'
import { formatCurrency, calcEmergencyBufferDays } from '@/lib/utils'

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-base-800 border border-white/[0.08] rounded-lg px-3 py-2 shadow-panel text-xs">
        <p className="text-text-muted mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function EverydayDashboard() {
  const bufferDays = calcEmergencyBufferDays(everydayProfile.savingsBalance, everydayProfile.monthlyExpenses)
  const stabilityScore = Math.round((1 - (everydayProfile.monthlyExpenses / everydayProfile.monthlyIncome)) * 100 + 30)
  const topRisks = riskScenarios.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').slice(0, 3)
  const upcomingEvents = timelineEvents.slice(0, 3)

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      {/* Welcome + top action strip */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Good morning, {everydayProfile.name.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-text-muted">Your financial risk profile, updated today</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/everyday/coach">
            <Button variant="secondary" size="sm" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Ask AI Coach
            </Button>
          </Link>
          <Link href="/everyday/scenarios">
            <Button variant="brand" size="sm" className="gap-2">
              <Zap className="w-4 h-4" />
              Add Scenario
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Main grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-4 gap-5"
      >
        {/* Risk Score Card — spans 1 column */}
        <motion.div variants={fadeUp}>
          <RiskScoreCard
            score={everydayProfile.riskScore}
            previousScore={49}
            description="Based on 8 modeled risk scenarios, your emergency fund level, and monthly cash flow."
            className="h-full"
            size="lg"
          />
        </motion.div>

        {/* Metrics — 3 columns */}
        <motion.div variants={fadeUp}>
          <MetricCard
            title="Emergency Buffer"
            value={bufferDays}
            unit="days"
            icon={Shield}
            iconColor="#10b981"
            description={`${formatCurrency(everydayProfile.savingsBalance)} saved · Target: 90 days`}
            change={8.2}
            changeLabel="↑ 5 days vs last month"
            delay={0.05}
            footer={
              <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (bufferDays / 90) * 100)}%` }} />
              </div>
            }
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <MetricCard
            title="Monthly Stability"
            value={`${stabilityScore}%`}
            icon={Activity}
            iconColor="#4f8ef7"
            description={`Surplus: ${formatCurrency(everydayProfile.monthlyIncome - everydayProfile.monthlyExpenses)}/mo`}
            change={3.1}
            changeLabel="↑ 3.1% vs last month"
            delay={0.1}
            footer={
              <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                <div className="bg-brand-500 h-full rounded-full" style={{ width: `${stabilityScore}%` }} />
              </div>
            }
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <MetricCard
            title="Total Scenario Exposure"
            value={formatCurrency(riskScenarios.reduce((acc, s) => acc + s.estimatedCost * (s.probability / 100), 0), { compact: true })}
            icon={Wallet}
            iconColor="#f59e0b"
            description={`Across ${riskScenarios.length} modeled scenarios`}
            trend="down"
            changeLabel="Expected annual exposure"
            delay={0.15}
          />
        </motion.div>
      </motion.div>

      {/* Second row: spending chart + top risks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Spending drift chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <ChartCard
            title="Spending vs Budget"
            description="6-month trend with projections"
            legend={[
              { color: '#ef4444', label: 'Actual' },
              { color: '#4f8ef7', label: 'Budget' },
              { color: '#64748b', label: 'Projected' },
            ]}
            height={220}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="budget" name="Budget" stroke="#4f8ef7" strokeWidth={1.5} fill="url(#budgetGrad)" strokeDasharray="4 4" dot={false} />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#ef4444" strokeWidth={2} fill="url(#spendGrad)" dot={{ fill: '#ef4444', r: 3 }} />
                <Area type="monotone" dataKey="projected" name="Projected" stroke="#64748b" strokeWidth={1.5} fill="none" strokeDasharray="3 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Top risks */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="card-base rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Top Active Risks</h3>
            <Link href="/everyday/scenarios">
              <Button variant="ghost" size="icon-sm" className="text-text-muted">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-1">
            {topRisks.map((scenario, i) => (
              <ScenarioCard key={scenario.id} scenario={scenario} delay={i * 0.05} compact />
            ))}
          </div>
          <Link href="/everyday/scenarios">
            <Button variant="secondary" size="sm" className="w-full mt-3">
              View all {riskScenarios.length} scenarios
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Third row: upcoming timeline + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Timeline preview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card-base rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Upcoming Risk Windows</h3>
            <Link href="/everyday/timeline">
              <Button variant="ghost" size="icon-sm" className="text-text-muted">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map((evt, i) => {
              const daysLeft = Math.floor((new Date(evt.date).getTime() - Date.now()) / 86400000)
              const levelColors = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }
              return (
                <div key={evt.id} className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: levelColors[evt.riskLevel] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{evt.title}</p>
                    <p className="text-xs text-text-muted">
                      {daysLeft > 0 ? `In ${daysLeft} days` : 'Today'} · {evt.category}
                    </p>
                  </div>
                  {evt.amount && (
                    <span className="text-xs font-semibold text-text-secondary tabular flex-shrink-0">
                      {formatCurrency(evt.amount, { compact: true })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <Link href="/everyday/timeline">
            <Button variant="secondary" size="sm" className="w-full mt-4">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              View full timeline
            </Button>
          </Link>
        </motion.div>

        {/* Insights panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="lg:col-span-2 space-y-3"
        >
          <h3 className="text-sm font-semibold text-text-primary">Your Next Best Moves</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insights.slice(0, 4).map((insight, i) => (
              <InsightCard key={insight.id} insight={insight} delay={i * 0.06} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: 'Add a scenario', href: '/everyday/scenarios', icon: Zap, color: '#4f8ef7' },
          { label: 'Test my budget', href: '/everyday/budget-stress-test', icon: TrendingDown, color: '#f59e0b' },
          { label: 'Update emergency plan', href: '/everyday/emergency-plan', icon: Shield, color: '#10b981' },
          { label: 'Ask AI Coach', href: '/everyday/coach', icon: MessageCircle, color: '#38bdf8' },
        ].map(action => {
          const Icon = action.icon
          return (
            <Link key={action.label} href={action.href}>
              <div
                className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] hover:border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${action.color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: action.color }} />
                </div>
                <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                  {action.label}
                </span>
              </div>
            </Link>
          )
        })}
      </motion.div>
    </div>
  )
}
