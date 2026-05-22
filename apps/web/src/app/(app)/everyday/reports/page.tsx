'use client'

import { motion } from 'framer-motion'
import { Download, FileText, Calendar, TrendingDown, BarChart2, Shield, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RiskGauge } from '@/components/charts/RiskGauge'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { riskScoreHistory, everydayProfile } from '@/lib/mock-data/everyday'

const reports = [
  {
    id: 'rpt-001',
    name: 'Monthly Risk Digest — May 2026',
    type: 'Monthly',
    date: '2026-06-01',
    status: 'ready',
    pages: 8,
    highlights: ['Risk score improved 3 points', 'Entertainment over-budget for 3rd month', '47 days until lease renewal'],
  },
  {
    id: 'rpt-002',
    name: 'Q1 2026 Financial Health Report',
    type: 'Quarterly',
    date: '2026-04-01',
    status: 'ready',
    pages: 14,
    highlights: ['13-point risk score improvement', 'Emergency fund +$2,400', '3 scenarios resolved'],
  },
  {
    id: 'rpt-003',
    name: 'Emergency Fund Analysis',
    type: 'Focused',
    date: '2026-05-10',
    status: 'ready',
    pages: 5,
    highlights: ['66-day current buffer', 'Target: 90 days', 'Actionable 6-month plan'],
  },
  {
    id: 'rpt-004',
    name: 'Monthly Risk Digest — June 2026',
    type: 'Monthly',
    date: '2026-07-01',
    status: 'scheduled',
    pages: null,
    highlights: [],
  },
]

export default function EverydayReportsPage() {
  return (
    <div className="p-6 space-y-6 max-w-[1100px]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Reports</h2>
          <p className="text-sm text-text-muted">Your personalized financial risk reports and digests</p>
        </div>
        <Button variant="brand" size="sm">
          <FileText className="w-4 h-4 mr-1.5" />
          Generate Report
        </Button>
      </motion.div>

      {/* Risk score trend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        <div className="card-base rounded-xl p-5 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Current Risk Score</p>
          <RiskGauge score={everydayProfile.riskScore} size="md" />
        </div>

        <div className="md:col-span-2 card-base rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Risk Score History</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskScoreHistory} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[30, 70]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e2535', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px', color: '#f1f5f9' }}
                />
                <Line type="monotone" dataKey="score" stroke="#4f8ef7" strokeWidth={2} dot={{ fill: '#4f8ef7', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-emerald-400 mt-2">↓ 13 points improvement since November 2025</p>
        </div>
      </motion.div>

      {/* Reports list */}
      <div className="space-y-3">
        {reports.map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="card-base rounded-xl p-5 hover:border-white/[0.1] transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-sm font-semibold text-text-primary">{report.name}</h4>
                    <Badge variant={report.status === 'scheduled' ? 'secondary' : 'default'} className="text-2xs">
                      {report.status === 'scheduled' ? 'Scheduled' : 'Ready'}
                    </Badge>
                    <Badge variant="secondary" className="text-2xs">{report.type}</Badge>
                  </div>
                  {report.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {report.highlights.map(h => (
                        <span key={h} className="text-2xs px-2 py-0.5 rounded-full bg-white/[0.04] text-text-muted border border-white/[0.06]">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-text-muted mt-1.5">
                    {report.status === 'scheduled' ? 'Generates' : 'Generated'}: {new Date(report.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {report.pages && ` · ${report.pages} pages`}
                  </p>
                </div>
              </div>

              {report.status === 'ready' && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="ghost" size="icon-sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
