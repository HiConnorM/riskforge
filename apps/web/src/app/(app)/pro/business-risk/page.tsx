'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Plus, ChevronDown, ChevronUp, User, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RiskBadge } from '@/components/common/RiskBadge'
import { Progress } from '@/components/ui/progress'
import { businessRisks } from '@/lib/mock-data/pro'
import { getRiskColor, cn } from '@/lib/utils'
import type { RiskLevel } from '@/types'

const statusConfig = {
  identified: { label: 'Identified', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  assessed: { label: 'Assessed', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  mitigated: { label: 'Mitigated', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  monitored: { label: 'Monitored', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
}

export default function BusinessRiskPage() {
  const [expanded, setExpanded] = useState<string | null>('br-001')

  const avgScore = Math.round(businessRisks.reduce((acc, r) => acc + r.riskScore, 0) / businessRisks.length)

  return (
    <div className="p-6 space-y-6 max-w-[1100px]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Business Risk Workspace</h2>
          <p className="text-sm text-text-muted">Enterprise risk register — track, assess, and mitigate business risks</p>
        </div>
        <Button variant="brand" size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Risk
        </Button>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total risks', value: businessRisks.length, color: '#4f8ef7' },
          { label: 'Critical/High', value: businessRisks.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high').length, color: '#ef4444' },
          { label: 'Avg risk score', value: avgScore, color: '#f59e0b' },
          { label: 'Mitigated', value: businessRisks.filter(r => r.status === 'mitigated').length, color: '#10b981' },
        ].map(m => (
          <div key={m.label} className="card-base rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1.5">{m.label}</p>
            <p className="text-2xl font-bold tabular" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Risk register */}
      <div className="space-y-4">
        {businessRisks.map((risk, i) => {
          const isExpanded = expanded === risk.id
          const riskColor = getRiskColor(risk.riskLevel)
          const sc = statusConfig[risk.status]

          return (
            <motion.div
              key={risk.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card-base rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(isExpanded ? null : risk.id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${riskColor}15`, border: `1px solid ${riskColor}25` }}
                  >
                    <Briefcase className="w-5 h-5" style={{ color: riskColor }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h4 className="text-sm font-semibold text-text-primary">{risk.title}</h4>
                      <span className={cn('text-2xs px-2 py-0.5 rounded-full border font-medium', sc.className)}>
                        {sc.label}
                      </span>
                      <RiskBadge level={risk.riskLevel} size="sm" />
                    </div>
                    <p className="text-xs text-text-muted">{risk.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-lg font-bold tabular" style={{ color: riskColor }}>{risk.riskScore}</p>
                    <p className="text-xs text-text-muted">Risk Score</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                </div>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="border-t border-white/[0.06] px-5 pb-5 pt-4"
                >
                  <div className="grid md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <p className="text-sm text-text-secondary leading-relaxed mb-4">{risk.description}</p>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                          <p className="text-xs text-text-muted mb-1">Likelihood</p>
                          <div className="flex items-center gap-2">
                            <Progress value={risk.likelihood} className="flex-1 h-2" />
                            <span className="text-sm font-bold tabular" style={{ color: riskColor }}>{risk.likelihood}%</span>
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                          <p className="text-xs text-text-muted mb-1">Impact</p>
                          <div className="flex items-center gap-2">
                            <Progress value={risk.impact} className="flex-1 h-2" indicatorClassName="bg-amber-500" />
                            <span className="text-sm font-bold text-amber-400 tabular">{risk.impact}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Mitigation Actions</p>
                        <ul className="space-y-1.5">
                          {risk.mitigations.map((m, mi) => (
                            <li key={mi} className="flex items-start gap-2 text-sm text-text-secondary">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {risk.owner && (
                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                          <p className="text-xs text-text-muted mb-1">Risk Owner</p>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-brand-400" />
                            <span className="text-sm text-text-primary">{risk.owner}</span>
                          </div>
                        </div>
                      )}
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                        <p className="text-xs text-text-muted mb-1">Next Review</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-text-muted" />
                          <span className="text-sm text-text-primary">{new Date(risk.reviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="flex-1 text-xs">Edit</Button>
                        <Button variant="default" size="sm" className="flex-1 text-xs">Update Status</Button>
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
