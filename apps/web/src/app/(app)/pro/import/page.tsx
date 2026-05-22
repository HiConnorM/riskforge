'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Database, Link2, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const integrations = [
  { id: 'brokerage', name: 'Brokerage Import', description: 'Connect Interactive Brokers, Schwab, Fidelity, TD Ameritrade', icon: Link2, status: 'available' },
  { id: 'csv', name: 'CSV / Excel Upload', description: 'Upload your own holdings file. Download our template.', icon: FileText, status: 'available' },
  { id: 'bloomberg', name: 'Bloomberg Terminal', description: 'Import portfolio data from Bloomberg via API key', icon: Database, status: 'pro' },
  { id: 'api', name: 'REST API', description: 'Push portfolio data programmatically via our API', icon: Database, status: 'available' },
]

const recentImports = [
  { file: 'portfolio_may2026.csv', date: '2026-05-20', status: 'success', positions: 10, errors: 0 },
  { file: 'holdings_export.xlsx', date: '2026-04-15', status: 'partial', positions: 8, errors: 2 },
  { file: 'portfolio_march.csv', date: '2026-03-01', status: 'success', positions: 9, errors: 0 },
]

export default function ImportPage() {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    setUploading(true)
    await new Promise(r => setTimeout(r, 2000))
    setUploading(false)
    setUploaded(true)
  }

  return (
    <div className="p-6 space-y-6 max-w-[900px]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Data Import</h2>
          <p className="text-sm text-text-muted">Import your portfolio holdings from brokerages, CSV files, or via API</p>
        </div>
      </motion.div>

      {/* Integration options */}
      <div className="grid grid-cols-2 gap-4">
        {integrations.map((intg, i) => {
          const Icon = intg.icon
          return (
            <motion.div
              key={intg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-base rounded-xl p-5 hover:border-white/[0.1] transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-text-primary group-hover:text-white transition-colors">{intg.name}</h4>
                    {intg.status === 'pro' && (
                      <span className="text-2xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-semibold">PRO</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{intg.description}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* CSV upload zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-base rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold text-text-primary mb-4">Upload Holdings File</h3>

        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center transition-all',
            dragging ? 'border-brand-500/60 bg-brand-500/8' : 'border-white/[0.1] hover:border-white/[0.2]',
            uploaded && 'border-emerald-500/40 bg-emerald-500/5',
          )}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              <p className="text-sm text-text-secondary">Processing your file...</p>
            </div>
          ) : uploaded ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-emerald-400">10 positions imported successfully</p>
              <Button variant="secondary" size="sm" onClick={() => setUploaded(false)}>Upload another file</Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <Upload className="w-6 h-6 text-text-muted" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Drop your file here, or click to browse</p>
                <p className="text-xs text-text-muted mt-1">Supports CSV, XLS, XLSX · Max 10MB</p>
              </div>
              <Button variant="secondary" size="sm">Choose File</Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-text-muted">Required columns: Symbol, Shares, Average Cost</p>
          <Button variant="ghost" size="sm" className="text-xs text-brand-400">
            Download template
          </Button>
        </div>
      </motion.div>

      {/* Recent imports */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card-base rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-text-primary mb-4">Recent Imports</h3>
        <div className="space-y-2">
          {recentImports.map(imp => (
            <div key={imp.file} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{imp.file}</p>
                  <p className="text-xs text-text-muted">{imp.date} · {imp.positions} positions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {imp.errors > 0 && (
                  <span className="text-xs text-amber-400">{imp.errors} errors</span>
                )}
                <span className={cn(
                  'text-xs px-2.5 py-1 rounded-full font-semibold border',
                  imp.status === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                )}>
                  {imp.status === 'success' ? 'Success' : 'Partial'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
