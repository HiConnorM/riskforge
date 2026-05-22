'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { ScenarioCard } from '@/components/cards/ScenarioCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { riskScenarios } from '@/lib/mock-data/everyday'
import type { RiskLevel } from '@/types'
import { cn } from '@/lib/utils'

const categories = ['All', 'Vehicle', 'Health', 'Income', 'Housing', 'Pet', 'Home', 'Financial Security']
const levelFilters: Array<{ label: string; value: RiskLevel | 'all' }> = [
  { label: 'All levels', value: 'all' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
]

export default function ScenariosPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')
  const [sort, setSort] = useState<'impact' | 'probability' | 'cost'>('impact')

  const filtered = riskScenarios
    .filter(s => {
      const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      const matchCategory = activeCategory === 'All' || s.category === activeCategory
      const matchRisk = riskFilter === 'all' || s.riskLevel === riskFilter
      return matchSearch && matchCategory && matchRisk
    })
    .sort((a, b) => {
      if (sort === 'impact') return b.impact - a.impact
      if (sort === 'probability') return b.probability - a.probability
      return b.estimatedCost - a.estimatedCost
    })

  const totalExposure = riskScenarios.reduce((acc, s) => acc + s.estimatedCost * (s.probability / 100), 0)
  const avgPreparedness = Math.round(riskScenarios.reduce((acc, s) => acc + s.preparednessScore, 0) / riskScenarios.length)

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Risk Scenarios</h2>
          <p className="text-sm text-text-muted">
            {riskScenarios.length} scenarios modeled · Avg preparedness: {avgPreparedness}/100
          </p>
        </div>
        <Button variant="brand" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New Scenario
        </Button>
      </motion.div>

      {/* Summary metrics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total scenarios', value: riskScenarios.length, color: '#4f8ef7' },
          { label: 'High/Critical', value: riskScenarios.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length, color: '#ef4444' },
          { label: 'Expected annual exposure', value: `$${(totalExposure * 12 / 1000).toFixed(0)}K`, color: '#f59e0b' },
          { label: 'Avg preparedness', value: `${avgPreparedness}/100`, color: '#10b981' },
        ].map(metric => (
          <div key={metric.label} className="card-base rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1.5">{metric.label}</p>
            <p className="text-2xl font-bold tabular" style={{ color: metric.color }}>{metric.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search scenarios..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            {levelFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setRiskFilter(f.value)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap',
                  riskFilter === f.value
                    ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                    : 'border-white/[0.07] text-text-muted hover:border-white/[0.12]'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors',
                  activeCategory === cat
                    ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                    : 'border-white/[0.07] text-text-muted hover:border-white/[0.12]'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-text-muted">Sort:</span>
            {(['impact', 'probability', 'cost'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={cn(
                  'text-xs px-2.5 py-1.5 rounded-lg border transition-colors capitalize',
                  sort === s
                    ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                    : 'border-white/[0.07] text-text-muted hover:border-white/[0.12]'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Scenario grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((scenario, i) => (
          <ScenarioCard key={scenario.id} scenario={scenario} delay={i * 0.04} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <p className="text-text-muted">No scenarios match your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
