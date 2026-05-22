'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, CheckCircle2, Circle, AlertCircle, Phone, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { emergencyPlans } from '@/lib/mock-data/everyday'
import { formatCurrency, cn } from '@/lib/utils'

const statusConfig = {
  ready: { label: 'Ready', color: '#10b981', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  partial: { label: 'Partial', color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertCircle },
  'not-ready': { label: 'Not Ready', color: '#ef4444', bg: 'bg-red-500/10 border-red-500/20', icon: Circle },
}

export default function EmergencyPlanPage() {
  const [expanded, setExpanded] = useState<string | null>('plan-001')

  const readyCount = emergencyPlans.filter(p => p.status === 'ready').length
  const totalFunding = emergencyPlans.reduce((acc, p) => acc + p.estimatedCost, 0)
  const readinessScore = Math.round((readyCount / emergencyPlans.length) * 100)

  return (
    <div className="p-6 space-y-6 max-w-[1100px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Emergency Plans</h2>
          <p className="text-sm text-text-muted">Pre-built response plans for your highest-priority risk scenarios</p>
        </div>
        <Button variant="brand" size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Create Plan
        </Button>
      </motion.div>

      {/* Readiness overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card-base rounded-xl p-6"
      >
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-text-primary mb-2">Overall Readiness Score</h3>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-text-primary tabular">{readinessScore}</span>
              <span className="text-lg text-text-muted">/100</span>
              <span className="text-sm text-amber-400 font-medium">{readinessScore < 50 ? 'Needs work' : readinessScore < 80 ? 'Getting there' : 'Well prepared'}</span>
            </div>
            <Progress value={readinessScore} className="h-2.5" indicatorClassName="bg-amber-500" />
          </div>

          <div className="flex gap-6">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = emergencyPlans.filter(p => p.status === status).length
              return (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold tabular" style={{ color: config.color }}>{count}</div>
                  <div className="text-xs text-text-muted mt-0.5">{config.label}</div>
                </div>
              )
            })}
          </div>

          <div className="card-base rounded-xl p-4 min-w-[160px]">
            <p className="text-xs text-text-muted mb-1">Total funds needed</p>
            <p className="text-xl font-bold text-text-primary tabular">{formatCurrency(totalFunding, { compact: true })}</p>
            <p className="text-xs text-text-muted mt-1">Across {emergencyPlans.length} scenarios</p>
          </div>
        </div>
      </motion.div>

      {/* Plans */}
      <div className="space-y-4">
        {emergencyPlans.map((plan, i) => {
          const config = statusConfig[plan.status]
          const StatusIcon = config.icon
          const isExpanded = expanded === plan.id

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn('rounded-xl border overflow-hidden', config.bg)}
            >
              {/* Plan header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : plan.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${config.color}15`, border: `1px solid ${config.color}25` }}
                  >
                    <Shield className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-text-primary">{plan.title}</h4>
                      <span
                        className="text-2xs px-2 py-0.5 rounded-full font-semibold border"
                        style={{ color: config.color, borderColor: `${config.color}30`, background: `${config.color}10` }}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">{plan.category} · Est. cost: {formatCurrency(plan.estimatedCost)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {plan.contactPhone && (
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted">
                      <Phone className="w-3.5 h-3.5" />
                      {plan.contactName}
                    </div>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-t border-white/[0.06] px-5 pb-5 pt-4"
                >
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Steps */}
                    <div className="md:col-span-2">
                      <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                        Response Steps
                      </h5>
                      <ol className="space-y-2.5">
                        {plan.steps.map((step, si) => (
                          <li key={si} className="flex items-start gap-3">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                              style={{ background: `${config.color}15`, color: config.color }}
                            >
                              {si + 1}
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      {plan.contactName && (
                        <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.06]">
                          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Key Contact</p>
                          <p className="text-sm font-semibold text-text-primary">{plan.contactName}</p>
                          {plan.contactPhone && (
                            <a
                              href={`tel:${plan.contactPhone}`}
                              className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 mt-1"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {plan.contactPhone}
                            </a>
                          )}
                        </div>
                      )}

                      <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Funding</p>
                        <p className="text-sm font-semibold text-text-primary">{formatCurrency(plan.estimatedCost)}</p>
                        <p className="text-xs text-text-muted mt-0.5">Source: {plan.fundingSource}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="flex-1 text-xs">Edit Plan</Button>
                        <Button variant="default" size="sm" className="flex-1 text-xs">Mark Ready</Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
