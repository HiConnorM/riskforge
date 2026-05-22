'use client'

import { motion } from 'framer-motion'
import { FileText, Download, Share2, Plus, BarChart3, TrendingUp, Shield, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const proReports = [
  {
    id: 'pr-001',
    name: 'May 2026 Risk Report',
    type: 'Monthly',
    date: '2026-06-01',
    status: 'ready',
    size: '2.4 MB',
    pages: 22,
    highlights: ['VaR breached 3 times', 'Crypto allocation 13.2%', 'Sharpe ratio: 1.42'],
    icon: Shield,
  },
  {
    id: 'pr-002',
    name: 'Q1 2026 Portfolio Analysis',
    type: 'Quarterly',
    date: '2026-04-01',
    status: 'ready',
    size: '4.1 MB',
    pages: 38,
    highlights: ['23% YTD return', 'Beta reduced to 0.94', 'Max drawdown: -18.6%'],
    icon: TrendingUp,
  },
  {
    id: 'pr-003',
    name: 'Stress Test Results — 2026-05',
    type: 'Stress Test',
    date: '2026-05-15',
    status: 'ready',
    size: '1.8 MB',
    pages: 15,
    highlights: ['4 scenarios modeled', '2008 scenario: -41.2%', 'Soft landing: +31.2%'],
    icon: Activity,
  },
  {
    id: 'pr-004',
    name: 'Crypto Risk Deep Dive',
    type: 'Focused',
    date: '2026-05-20',
    status: 'ready',
    size: '1.2 MB',
    pages: 9,
    highlights: ['13.2% portfolio exposure', 'Exceeds 10% threshold', 'Reduction recommendations'],
    icon: BarChart3,
  },
  {
    id: 'pr-005',
    name: 'June 2026 Risk Report',
    type: 'Monthly',
    date: '2026-07-01',
    status: 'scheduled',
    size: null,
    pages: null,
    highlights: [],
    icon: Shield,
  },
]

export default function ProReportsPage() {
  return (
    <div className="p-6 space-y-5 max-w-[1000px]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Pro Reports</h2>
          <p className="text-sm text-text-muted">Institutional-grade risk reports and analytics exports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Share2 className="w-4 h-4 mr-1.5" />
            Share workspace
          </Button>
          <Button variant="brand" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Generate Report
          </Button>
        </div>
      </motion.div>

      <div className="space-y-3">
        {proReports.map((report, i) => {
          const Icon = report.icon
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card-base rounded-xl p-5 hover:border-white/[0.1] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-sm font-semibold text-text-primary">{report.name}</h4>
                      <Badge variant={report.status === 'scheduled' ? 'secondary' : 'default'}>
                        {report.status === 'scheduled' ? 'Scheduled' : 'Ready'}
                      </Badge>
                      <Badge variant="secondary">{report.type}</Badge>
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
                      {report.pages && ` · ${report.pages} pages · ${report.size}`}
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
          )
        })}
      </div>
    </div>
  )
}
