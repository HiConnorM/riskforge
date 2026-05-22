'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, CreditCard, Zap, ArrowRight, Receipt, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    features: ['3 risk scenarios', 'Basic risk score', 'Emergency fund calc'],
    current: false,
    cta: 'Current plan',
  },
  {
    id: 'plus',
    name: 'Everyday Plus',
    price: 12,
    period: 'per month',
    features: ['Unlimited scenarios', 'Full risk timeline', 'Budget stress testing', 'Emergency plans', 'AI Coach', 'Monthly reports'],
    current: true,
    cta: 'Current plan',
    color: '#4f8ef7',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    period: 'per month',
    features: ['Everything in Plus', 'Portfolio stress testing', 'VaR & risk metrics', 'Risk heatmaps', 'Custom alerts', 'Business risk module'],
    current: false,
    cta: 'Upgrade to Pro',
    color: '#38bdf8',
    recommended: true,
  },
]

const invoices = [
  { date: '2026-05-01', amount: 12, status: 'paid', plan: 'Everyday Plus' },
  { date: '2026-04-01', amount: 12, status: 'paid', plan: 'Everyday Plus' },
  { date: '2026-03-01', amount: 12, status: 'paid', plan: 'Everyday Plus' },
  { date: '2026-02-01', amount: 12, status: 'paid', plan: 'Everyday Plus' },
]

export default function BillingPage() {
  return (
    <div className="p-6 space-y-6 max-w-[1000px]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-semibold text-text-primary">Billing & Upgrade</h2>
        <p className="text-sm text-text-muted">Manage your subscription and payment details</p>
      </motion.div>

      {/* Current plan */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl p-5 border border-brand-500/25 bg-brand-500/5"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-text-primary">Everyday Plus</h3>
              <Badge variant="default">Current Plan</Badge>
            </div>
            <p className="text-sm text-text-muted">$12/month · Renews June 1, 2026</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">Cancel subscription</Button>
            <Button variant="ghost" size="sm">Manage payment</Button>
          </div>
        </div>
      </motion.div>

      {/* Plan comparison */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-semibold text-text-secondary mb-4">Compare Plans</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <div
              key={plan.id}
              className={cn(
                'rounded-xl p-5 border relative',
                plan.current ? 'border-brand-500/30 bg-brand-500/5' : 'card-base',
                plan.recommended && !plan.current && 'border-cyan-500/25 bg-cyan-500/5'
              )}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-white text-xs font-bold whitespace-nowrap">
                  Upgrade recommended
                </div>
              )}
              <h4 className="text-sm font-semibold text-text-primary mb-0.5">{plan.name}</h4>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-bold text-text-primary">${plan.price}</span>
                <span className="text-xs text-text-muted">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-text-secondary">
                    <Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.recommended ? 'brand' : plan.current ? 'secondary' : 'secondary'}
                size="sm"
                className="w-full"
                disabled={plan.current}
              >
                {plan.cta}
                {plan.recommended && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </Button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Payment method */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card-base rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-text-primary mb-4">Payment Method</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 rounded bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Visa ending in 4242</p>
              <p className="text-xs text-text-muted">Expires 12/2027</p>
            </div>
          </div>
          <Button variant="secondary" size="sm">Update</Button>
        </div>
      </motion.div>

      {/* Invoice history */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-base rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Invoice History</h3>
          <Button variant="ghost" size="sm" className="text-xs text-text-muted">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export all
          </Button>
        </div>
        <div className="space-y-0.5">
          {invoices.map(inv => (
            <div key={inv.date} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4 text-text-muted flex-shrink-0" />
                <div>
                  <p className="text-sm text-text-primary">{inv.plan}</p>
                  <p className="text-xs text-text-muted">{new Date(inv.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-text-primary tabular">${inv.amount}.00</span>
                <Badge variant="success" className="text-2xs">Paid</Badge>
                <Button variant="ghost" size="icon-sm">
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
