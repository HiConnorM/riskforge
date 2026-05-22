'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ShieldCheck, BarChart3, Zap, Calendar, TrendingUp, User,
  ArrowRight, Star, Check, Lock, ChevronRight, Activity,
  Shield, Lightbulb, AlertTriangle, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RiskGauge } from '@/components/charts/RiskGauge'

const features = [
  {
    icon: Zap,
    title: 'Risk Scenario Builder',
    description: 'Model car breakdowns, medical emergencies, job loss, and 50+ life scenarios with real probability and cost estimates.',
    mode: 'everyday',
    color: '#4f8ef7',
  },
  {
    icon: Activity,
    title: 'Portfolio Stress Testing',
    description: 'Replay 2008, 2020, and custom shocks against your actual holdings. See exactly where your portfolio breaks.',
    mode: 'pro',
    color: '#38bdf8',
  },
  {
    icon: Calendar,
    title: 'Risk Timeline',
    description: 'Your lease renewal, insurance premiums, tax payments — all mapped to a visual calendar with financial impact.',
    mode: 'everyday',
    color: '#4f8ef7',
  },
  {
    icon: BarChart3,
    title: 'VaR & Risk Metrics',
    description: 'Value at Risk, Sharpe ratio, max drawdown, beta — institutional-grade analytics built for serious investors.',
    mode: 'pro',
    color: '#38bdf8',
  },
  {
    icon: Shield,
    title: 'Emergency Plan Generator',
    description: 'Step-by-step action plans for every scenario you model, with contacts, funding sources, and estimated recovery time.',
    mode: 'everyday',
    color: '#4f8ef7',
  },
  {
    icon: AlertTriangle,
    title: 'Intelligent Alerts',
    description: 'VaR breaches, concentration risk, drawdown thresholds — get notified before risk becomes a problem.',
    mode: 'pro',
    color: '#38bdf8',
  },
]

const steps = [
  {
    number: '01',
    title: 'Build your risk profile',
    description: 'Tell us about your income, expenses, and what keeps you up at night. It takes 5 minutes.',
  },
  {
    number: '02',
    title: 'See your risk score',
    description: 'Your personalized risk score maps the probability and impact of everything that could go wrong.',
  },
  {
    number: '03',
    title: 'Get your action plan',
    description: 'Step-by-step guidance on exactly what to do — before anything actually goes wrong.',
  },
]

const testimonials = [
  {
    quote: "I used to lose sleep before my lease renewal. RiskForge showed me I had 47 days, a $200/month buffer, and a negotiation strategy. I slept fine.",
    name: 'M.K.',
    role: 'UX Designer, San Francisco',
    score: 72,
    improved: true,
  },
  {
    quote: "We run a $40M book. RiskForge Pro gave us stress test visibility we previously needed Bloomberg for. Onboarded in a day.",
    name: 'D.R.',
    role: 'Portfolio Manager, NY',
    score: 41,
    improved: true,
  },
  {
    quote: "The budget stress test told me my entertainment spending would bankrupt my emergency fund in 8 months if I didn't change. I changed.",
    name: 'T.W.',
    role: 'Freelance Developer',
    score: 38,
    improved: true,
  },
]

const pricingTiers = [
  {
    name: 'Free',
    price: 0,
    description: 'Start understanding your risk',
    features: ['3 risk scenarios', 'Basic risk score', 'Emergency fund calculator', '30-day timeline'],
    cta: 'Get started free',
    href: '/signup',
  },
  {
    name: 'Everyday Plus',
    price: 12,
    description: 'Complete personal risk management',
    features: ['Unlimited scenarios', 'Full risk timeline', 'Budget stress testing', 'Emergency plan builder', 'AI Coach', 'Monthly reports'],
    cta: 'Start free trial',
    href: '/signup',
    popular: true,
  },
  {
    name: 'Pro',
    price: 49,
    description: 'Institutional-grade portfolio risk',
    features: ['Everything in Plus', 'Portfolio stress testing', 'VaR & risk metrics', 'Risk heatmaps', 'Custom alerts', 'Business risk module'],
    cta: 'Start free trial',
    href: '/signup',
  },
]

const trustBadges = [
  { icon: Lock, label: 'Bank-level encryption', description: 'AES-256 at rest, TLS 1.3 in transit' },
  { icon: Shield, label: 'SOC 2 Type II', description: 'Independently audited security controls' },
  { icon: Globe, label: 'GDPR & CCPA compliant', description: 'Your data belongs to you' },
  { icon: ShieldCheck, label: 'Read-only access', description: 'We never move your money' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] } }),
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base-950">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 border-b border-white/[0.05] bg-base-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-sm">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-text-primary">
            Risk<span className="gradient-text-brand">Forge</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm text-text-secondary hover:text-text-primary transition-colors">How it works</Link>
          <Link href="/pricing" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button variant="brand" size="sm">Get started free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-400/4 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              Risk Intelligence Platform
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              custom={0.1}
              variants={fadeUp}
              className="text-5xl md:text-6xl font-bold text-text-primary leading-[1.1] mb-6"
            >
              Risk is not the{' '}
              <br />
              problem.{' '}
              <span className="gradient-text-brand">Unseen risk</span>{' '}
              is.
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={0.2}
              variants={fadeUp}
              className="text-lg text-text-secondary leading-relaxed mb-8 max-w-lg"
            >
              RiskForge turns financial uncertainty into a clear action plan — whether you're protecting a household budget or managing a $50M portfolio.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={0.3}
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link href="/signup">
                <Button variant="brand" size="lg" className="w-full sm:w-auto">
                  Build your risk profile — free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/everyday">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  See live demo
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={0.4}
              variants={fadeUp}
              className="flex items-center gap-6 mt-8"
            >
              <div className="flex -space-x-2">
                {['AM', 'JL', 'RK', 'SP'].map((initials, i) => (
                  <div key={initials} className={`w-8 h-8 rounded-full border-2 border-base-950 flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${i % 2 === 0 ? 'from-brand-500 to-cyan-500' : 'from-purple-500 to-brand-500'}`}>
                    {initials[0]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-0.5">Trusted by 12,000+ users</p>
              </div>
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative card-base rounded-2xl p-6 border border-white/[0.08] shadow-elevated">
              {/* Mock dashboard preview */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Your Risk Score</h3>
                  <p className="text-xs text-text-muted">Updated today</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  Medium Risk
                </span>
              </div>

              <div className="flex justify-center mb-5">
                <RiskGauge score={42} size="lg" animated />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Emergency Buffer', value: '66 days', color: '#10b981' },
                  { label: 'Monthly Stability', value: '82%', color: '#4f8ef7' },
                  { label: 'Top Risk', value: 'Medical', color: '#f59e0b' },
                  { label: 'Preparedness', value: '43/100', color: '#f97316' },
                ].map((item) => (
                  <div key={item.label} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                    <p className="text-2xs text-text-muted mb-1">{item.label}</p>
                    <p className="text-sm font-bold tabular" style={{ color: item.color }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg p-3 bg-brand-500/8 border border-brand-500/20">
                <p className="text-xs font-semibold text-brand-400 mb-0.5">Your next best move</p>
                <p className="text-xs text-text-secondary">Build your medical emergency cushion — biggest gap in your profile</p>
              </div>
            </div>

            {/* Floating cards */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-8 top-1/3 card-base rounded-xl p-3 w-44 border border-white/[0.1] shadow-panel"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs font-semibold text-text-primary">New Alert</span>
              </div>
              <p className="text-2xs text-text-muted">Crypto exposure exceeds 10% threshold</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -right-6 bottom-1/4 card-base rounded-xl p-3 w-44 border border-white/[0.1] shadow-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Improvement</span>
              </div>
              <p className="text-2xs text-text-muted">Risk score ↓13 pts this month</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mode comparison */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              One platform. Two modes.
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Whether you're protecting your household or managing institutional capital — RiskForge has a mode built for you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Everyday */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="rounded-2xl p-8 border border-brand-500/15 bg-gradient-to-br from-brand-500/5 to-transparent relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-[60px]" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center border border-brand-500/25">
                  <User className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary">RiskForge Everyday</h3>
                  <p className="text-sm text-text-muted">Personal financial risk</p>
                </div>
              </div>
              <p className="text-text-secondary mb-6 leading-relaxed">
                For households managing real-life risk — car breakdowns, medical emergencies, job loss, rent increases. Calm, clear, supportive guidance.
              </p>
              <ul className="space-y-2.5 mb-8">
                {['Risk score & timeline', 'Budget stress testing', 'Emergency plan builder', 'AI financial coach', 'Scenario modeling'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/everyday">
                <Button variant="default" className="w-full">
                  Try Everyday <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0.1}
              variants={fadeUp}
              className="rounded-2xl p-8 border border-cyan-500/15 bg-gradient-to-br from-cyan-500/5 to-transparent relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-[60px]" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center border border-cyan-500/25">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary">RiskForge Pro</h3>
                  <p className="text-sm text-text-muted">Portfolio & business risk</p>
                </div>
              </div>
              <p className="text-text-secondary mb-6 leading-relaxed">
                For traders, investors, portfolio managers, and founders who need institutional risk intelligence without the Bloomberg price tag.
              </p>
              <ul className="space-y-2.5 mb-8">
                {['Portfolio stress testing', 'VaR & CVaR metrics', 'Correlation heatmaps', 'Custom alert engine', 'Business risk workspace'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/pro">
                <Button variant="secondary" className="w-full border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
                  Try Pro <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Everything you need to master risk
            </h2>
            <p className="text-lg text-text-secondary max-w-xl mx-auto">
              From personal budget shocks to portfolio drawdowns — RiskForge has every angle covered.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i * 0.05}
                  variants={fadeUp}
                  className="card-base rounded-xl p-6 hover:card-hover transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}25` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feature.color }} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-text-primary">{feature.title}</h3>
                    <span
                      className="text-2xs px-1.5 py-0.5 rounded font-semibold uppercase"
                      style={{ background: `${feature.color}15`, color: feature.color }}
                    >
                      {feature.mode}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Up and running in 5 minutes
            </h2>
            <p className="text-lg text-text-secondary">
              No spreadsheets. No financial jargon. Just a clear picture of your risk in minutes.
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-8 top-10 bottom-10 w-px bg-gradient-to-b from-brand-500/30 via-brand-500/20 to-transparent hidden md:block" />
            <div className="space-y-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i * 0.1}
                  variants={fadeUp}
                  className="flex items-start gap-6 md:pl-0"
                >
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0 relative z-10">
                    <span className="text-lg font-bold gradient-text-brand">{step.number}</span>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">{step.title}</h3>
                    <p className="text-text-secondary leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Real results from real users
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                variants={fadeUp}
                className="card-base rounded-xl p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-sm text-text-secondary leading-relaxed mb-5 italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-text-secondary">
              Start free. Upgrade when you need more power.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                variants={fadeUp}
                className={`relative rounded-xl p-6 border ${tier.popular ? 'border-brand-500/40 bg-brand-500/5' : 'card-base'}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-base font-semibold text-text-primary mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-text-primary">${tier.price}</span>
                  {tier.price > 0 && <span className="text-text-muted text-sm">/mo</span>}
                </div>
                <p className="text-xs text-text-muted mb-5">{tier.description}</p>
                <ul className="space-y-2 mb-6">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={tier.href}>
                  <Button
                    variant={tier.popular ? 'brand' : 'secondary'}
                    className="w-full"
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-text-muted mt-8">
            All plans include a 14-day free trial. No credit card required.{' '}
            <Link href="/pricing" className="text-brand-400 hover:text-brand-300">
              View full pricing <ChevronRight className="inline w-3 h-3" />
            </Link>
          </p>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              Built with security at every layer
            </h2>
            <p className="text-text-secondary">Your financial data stays private, protected, and under your control.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trustBadges.map((badge, i) => {
              const Icon = badge.icon
              return (
                <motion.div
                  key={badge.label}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i * 0.05}
                  variants={fadeUp}
                  className="flex flex-col items-center text-center p-5 card-base rounded-xl"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-1">{badge.label}</p>
                  <p className="text-xs text-text-muted">{badge.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
              Your next best move starts here
            </h2>
            <p className="text-lg text-text-secondary mb-8">
              Join 12,000+ people who stopped guessing and started knowing their risk.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup">
                <Button variant="brand" size="xl" className="w-full sm:w-auto">
                  Get started for free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/pro">
                <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                  Explore Pro features
                </Button>
              </Link>
            </div>
            <p className="text-sm text-text-muted mt-4">No credit card required · 14-day trial · Cancel anytime</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-text-primary">Risk<span className="gradient-text-brand">Forge</span></span>
              </div>
              <p className="text-sm text-text-muted max-w-xs">Turn financial uncertainty into clarity, confidence, and your next best move.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
              {[
                { heading: 'Product', links: ['Everyday', 'Pro', 'Pricing', 'Changelog'] },
                { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
                { heading: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookie Policy'] },
              ].map(col => (
                <div key={col.heading}>
                  <h4 className="font-semibold text-text-primary mb-3">{col.heading}</h4>
                  <ul className="space-y-2">
                    {col.links.map(link => (
                      <li key={link}>
                        <a href="#" className="text-text-muted hover:text-text-secondary transition-colors">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-text-disabled">© 2026 RiskForge Inc. All rights reserved.</p>
            <p className="text-xs text-text-disabled">Not financial advice. Educational purposes only.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
