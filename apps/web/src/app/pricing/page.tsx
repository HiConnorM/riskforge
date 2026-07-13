'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShieldCheck, Check, HelpCircle, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const tiers = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Start understanding your financial risk',
    features: [
      '3 risk scenarios',
      'Basic risk score',
      'Emergency fund calculator',
      '30-day risk timeline',
      'Community support',
    ],
    excluded: ['Budget stress testing', 'Emergency plans', 'AI Coach', 'Pro features'],
    cta: 'Get started free',
    href: '/signup',
  },
  {
    id: 'plus',
    name: 'Everyday Plus',
    monthlyPrice: 12,
    annualPrice: 9,
    description: 'Complete personal risk management',
    mode: 'Everyday',
    features: [
      'Everything in Free',
      'Unlimited scenarios',
      'Full risk timeline',
      'Budget stress testing',
      'Emergency plan builder',
      'AI Financial Coach',
      'Monthly risk reports',
      'Priority email support',
    ],
    excluded: ['Portfolio risk tools', 'VaR & metrics', 'Business risk module'],
    cta: 'Start free trial',
    href: '/signup',
    popular: true,
    color: '#4f8ef7',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 49,
    annualPrice: 39,
    description: 'Professional portfolio risk toolkit',
    mode: 'Pro',
    features: [
      'Everything in Plus',
      'Portfolio stress testing',
      'VaR & CVaR metrics',
      'Risk correlation heatmaps',
      'Custom alert engine',
      'Business risk workspace',
      'CSV / brokerage import',
      'Pro reports & exports',
    ],
    excluded: [],
    cta: 'Start free trial',
    href: '/signup',
    color: '#38bdf8',
  },
  {
    id: 'pro-advanced',
    name: 'Pro Advanced',
    monthlyPrice: 149,
    annualPrice: 119,
    description: 'For professional risk managers & teams',
    mode: 'Pro',
    features: [
      'Everything in Pro',
      'Multi-portfolio management',
      'REST API access',
      'Custom risk models',
      'Team collaboration',
      'Dedicated onboarding',
      'SLA support',
    ],
    excluded: [],
    cta: 'Contact sales',
    href: '/signup',
    color: '#a78bfa',
  },
]

const faqs = [
  { q: 'Is the free trial really free?', a: 'Yes — no credit card required. You get 14 days of full access to whichever paid plan you choose.' },
  { q: 'Can I switch between Everyday and Pro modes?', a: "Absolutely. Both modes are accessible from the same account. Upgrade to Pro to unlock the portfolio and business risk tools." },
  { q: 'What does "portfolio stress testing" include?', a: 'You can replay historical crises (2008, 2020, 2022), run custom scenarios, and model the impact on each holding in your portfolio.' },
  { q: "Is my financial data secure?", a: 'RiskForge is in active development. Data is encrypted in transit, account access is read-only by design, and we never sell your data. Formal security certifications (such as SOC 2) will be pursued before general availability — we will not claim them until they are complete.' },
  { q: "Can I cancel anytime?", a: 'Yes. Cancel any time directly from your billing settings. No cancellation fees.' },
  { q: 'Do you offer annual billing?', a: 'Yes — save up to 20% with annual billing. Toggle to see annual prices above.' },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-base-950">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 border-b border-white/[0.05] bg-base-950/80 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-sm">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-text-primary">
            Risk<span className="gradient-text-brand">Forge</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link href="/signup"><Button variant="brand" size="sm">Get started free</Button></Link>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-6 md:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-5xl font-bold text-text-primary mb-4">
            Start free. Upgrade when you&apos;re ready.
          </h1>
          <p className="text-lg text-text-secondary mb-8">
            Every plan includes a 14-day free trial. No credit card required.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', !annual ? 'bg-white/[0.08] text-text-primary' : 'text-text-muted hover:text-text-secondary')}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2', annual ? 'bg-white/[0.08] text-text-primary' : 'text-text-muted hover:text-text-secondary')}
            >
              Annual
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Save 20%</span>
            </button>
          </div>
        </motion.div>

        {/* Pricing grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto mb-20">
          {tiers.map((tier, i) => {
            const price = annual ? tier.annualPrice : tier.monthlyPrice
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={cn(
                  'relative rounded-2xl p-6 border',
                  tier.popular ? 'border-brand-500/40 bg-brand-500/5' : 'card-base'
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand-500 text-white text-xs font-bold">
                    Most Popular
                  </div>
                )}

                {tier.mode && (
                  <span
                    className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold mb-3"
                    style={{ background: `${tier.color}15`, color: tier.color, border: `1px solid ${tier.color}25` }}
                  >
                    {tier.mode} mode
                  </span>
                )}

                <h3 className="text-lg font-bold text-text-primary mb-1">{tier.name}</h3>
                <p className="text-xs text-text-muted mb-4">{tier.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-text-primary tabular">${price}</span>
                    {price > 0 && <span className="text-text-muted text-sm">/month</span>}
                  </div>
                  {annual && price > 0 && (
                    <p className="text-xs text-emerald-400 mt-0.5">
                      Billed ${price * 12}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {tier.excluded.slice(0, 2).map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-disabled">
                      <span className="w-4 h-4 flex-shrink-0 mt-0.5 flex items-center justify-center opacity-40">—</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={tier.href}>
                  <Button
                    variant={tier.popular ? 'brand' : tier.id === 'pro-advanced' ? 'secondary' : 'secondary'}
                    className="w-full"
                  >
                    {tier.cta}
                    {tier.id !== 'free' && tier.id !== 'pro-advanced' && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="card-base rounded-xl p-5"
              >
                <h4 className="text-sm font-semibold text-text-primary mb-2">{faq.q}</h4>
                <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
