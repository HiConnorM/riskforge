'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ShieldCheck, User, BarChart3, Building2, Coins, Check,
  ArrowRight, ArrowLeft, DollarSign, Home, Heart, Car,
  Briefcase, TrendingUp, LayoutDashboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn, formatCurrency } from '@/lib/utils'

type OnboardingMode = 'everyday' | 'pro' | 'both' | null

const TOTAL_STEPS_EVERYDAY = 7
const TOTAL_STEPS_PRO = 6

interface EverydayData {
  income: number
  employmentType: string
  housing: number
  food: number
  transport: number
  other: number
  savings: number
  emergencyFund: number
  topRisks: string[]
  name: string
}

interface ProData {
  userType: string
  portfolioSize: number
  assetClasses: string[]
  riskMetrics: string[]
  experience: string
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [mode, setMode] = useState<OnboardingMode>(null)
  const [everydayData, setEverydayData] = useState<EverydayData>({
    income: 6000,
    employmentType: '',
    housing: 1500,
    food: 600,
    transport: 400,
    other: 500,
    savings: 500,
    emergencyFund: 8000,
    topRisks: [],
    name: '',
  })
  const [proData, setProData] = useState<ProData>({
    userType: '',
    portfolioSize: 250000,
    assetClasses: [],
    riskMetrics: [],
    experience: '',
  })

  const totalSteps = mode === 'pro' ? TOTAL_STEPS_PRO : TOTAL_STEPS_EVERYDAY

  const goNext = () => {
    setDirection(1)
    setStep(s => s + 1)
  }

  const goBack = () => {
    setDirection(-1)
    setStep(s => s - 1)
  }

  const toggleRisk = (risk: string) => {
    setEverydayData(d => ({
      ...d,
      topRisks: d.topRisks.includes(risk)
        ? d.topRisks.filter(r => r !== risk)
        : [...d.topRisks, risk],
    }))
  }

  const toggleAsset = (asset: string) => {
    setProData(d => ({
      ...d,
      assetClasses: d.assetClasses.includes(asset)
        ? d.assetClasses.filter(a => a !== asset)
        : [...d.assetClasses, asset],
    }))
  }

  const everydayExpenses = everydayData.housing + everydayData.food + everydayData.transport + everydayData.other + everydayData.savings
  const surplus = everydayData.income - everydayExpenses
  const progress = step === 0 ? 0 : mode ? ((step) / (totalSteps + 1)) * 100 : 5

  const renderStep = () => {
    // Step 0: Mode selection
    if (step === 0) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome to RiskForge</h1>
            <p className="text-text-secondary">How will you be using RiskForge? You can always switch modes later.</p>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'everyday' as const,
                icon: User,
                title: 'RiskForge Everyday',
                description: 'Personal financial risk — budget stress tests, emergency planning, life scenario modeling',
                color: '#4f8ef7',
                tags: ['Budget protection', 'Emergency plans', 'Life scenarios'],
              },
              {
                id: 'pro' as const,
                icon: BarChart3,
                title: 'RiskForge Pro',
                description: 'Portfolio & business risk — VaR, stress testing, risk metrics, business risk workspace',
                color: '#38bdf8',
                tags: ['Portfolio risk', 'Stress testing', 'VaR metrics'],
              },
              {
                id: 'both' as const,
                icon: Building2,
                title: 'Both modes',
                description: 'Full access to personal and professional risk tools in one unified workspace',
                color: '#10b981',
                tags: ['Everything', 'All tools', 'Most powerful'],
              },
            ].map((option) => {
              const Icon = option.icon
              const selected = mode === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => setMode(option.id)}
                  className={cn(
                    'w-full text-left rounded-xl p-5 border transition-all duration-150',
                    selected
                      ? 'border-brand-500/40 bg-brand-500/8'
                      : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${option.color}15`, border: `1px solid ${option.color}25` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: option.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-text-primary">{option.title}</h3>
                        {selected && <Check className="w-4 h-4 text-brand-400" />}
                      </div>
                      <p className="text-xs text-text-muted mb-3">{option.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {option.tags.map(tag => (
                          <span key={tag} className="text-2xs px-2 py-0.5 rounded-full bg-white/[0.06] text-text-muted border border-white/[0.06]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <Button
            variant="brand"
            size="lg"
            className="w-full"
            disabled={!mode}
            onClick={goNext}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )
    }

    // Everyday steps
    if (mode === 'everyday' || mode === 'both') {
      if (step === 1) {
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">What&apos;s your monthly income?</h2>
              <p className="text-text-secondary text-sm">After-tax take-home pay. Include all sources.</p>
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold gradient-text-brand tabular">
                  {formatCurrency(everydayData.income, { compact: true })}
                </span>
                <span className="text-text-muted">/month</span>
              </div>
              <Slider
                value={[everydayData.income]}
                onValueChange={([v]) => setEverydayData(d => ({ ...d, income: v ?? d.income }))}
                min={1000}
                max={25000}
                step={100}
              />
              <div className="flex justify-between text-xs text-text-muted mt-2">
                <span>$1,000</span>
                <span>$25,000</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Employment type</Label>
              <div className="grid grid-cols-2 gap-2">
                {['Full-time employee', 'Freelancer / Contract', 'Part-time', 'Self-employed', 'Multiple income streams', 'Other'].map(type => (
                  <button
                    key={type}
                    onClick={() => setEverydayData(d => ({ ...d, employmentType: type }))}
                    className={cn(
                      'text-xs px-3 py-2.5 rounded-lg border text-left transition-colors',
                      everydayData.employmentType === type
                        ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                        : 'border-white/[0.07] text-text-muted hover:border-white/[0.12]'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      }

      if (step === 2) {
        const categories = [
          { key: 'housing', label: 'Housing (rent/mortgage)', icon: Home, max: 5000, step: 50 },
          { key: 'food', label: 'Food & Dining', icon: DollarSign, max: 2000, step: 25 },
          { key: 'transport', label: 'Transportation', icon: Car, max: 1500, step: 25 },
          { key: 'other', label: 'All other expenses', icon: Heart, max: 3000, step: 50 },
          { key: 'savings', label: 'Monthly savings goal', icon: Coins, max: 3000, step: 50 },
        ]

        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Monthly expenses</h2>
              <p className="text-text-secondary text-sm">Rough estimates are fine — we can refine these later.</p>
            </div>

            <div className="space-y-5">
              {categories.map(cat => {
                const Icon = cat.icon
                const value = everydayData[cat.key as keyof typeof everydayData] as number
                return (
                  <div key={cat.key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-text-muted" />
                        <Label className="text-sm">{cat.label}</Label>
                      </div>
                      <span className="text-sm font-semibold text-text-primary tabular">{formatCurrency(value)}</span>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={([v]) => setEverydayData(d => ({ ...d, [cat.key]: v ?? value }))}
                      min={0}
                      max={cat.max}
                      step={cat.step}
                    />
                  </div>
                )
              })}
            </div>

            <div className={cn(
              'rounded-xl p-4 border',
              surplus >= 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
            )}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Monthly surplus</span>
                <span className={cn('text-lg font-bold tabular', surplus >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {surplus >= 0 ? '+' : ''}{formatCurrency(surplus)}
                </span>
              </div>
            </div>
          </div>
        )
      }

      if (step === 3) {
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Emergency fund status</h2>
              <p className="text-text-secondary text-sm">How much do you have in liquid savings right now?</p>
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold gradient-text-brand tabular">
                  {formatCurrency(everydayData.emergencyFund, { compact: true })}
                </span>
              </div>
              <Slider
                value={[everydayData.emergencyFund]}
                onValueChange={([v]) => setEverydayData(d => ({ ...d, emergencyFund: v ?? d.emergencyFund }))}
                min={0}
                max={100000}
                step={500}
              />
              <div className="flex justify-between text-xs text-text-muted mt-2">
                <span>$0</span>
                <span>$100K+</span>
              </div>
            </div>

            <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.06]">
              <p className="text-xs text-text-muted mb-1">Based on your expenses of {formatCurrency(everydayExpenses)}/month:</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Emergency buffer</span>
                <span className="text-sm font-bold text-brand-400">
                  {Math.floor(everydayData.emergencyFund / everydayExpenses * 30)} days
                </span>
              </div>
              <div className="mt-2 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (everydayData.emergencyFund / (everydayExpenses * 3)) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">Target: 3 months ({formatCurrency(everydayExpenses * 3)})</p>
            </div>
          </div>
        )
      }

      if (step === 4) {
        const risks = [
          { id: 'car', label: 'Car breakdown', icon: Car },
          { id: 'medical', label: 'Medical emergency', icon: Heart },
          { id: 'job', label: 'Job loss', icon: Briefcase },
          { id: 'rent', label: 'Rent increase', icon: Home },
          { id: 'pet', label: 'Pet emergency', icon: '🐾' },
          { id: 'identity', label: 'Identity theft', icon: '🔐' },
          { id: 'disability', label: 'Short-term disability', icon: '🏥' },
          { id: 'family', label: 'Family emergency', icon: '👨‍👩‍👧' },
          { id: 'appliance', label: 'Home appliance failure', icon: '🏠' },
        ]

        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">What risks concern you most?</h2>
              <p className="text-text-secondary text-sm">Select all that apply. We&apos;ll prioritize these in your risk profile.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {risks.map(risk => {
                const selected = everydayData.topRisks.includes(risk.id)
                const Icon = typeof risk.icon === 'string' ? null : risk.icon
                return (
                  <button
                    key={risk.id}
                    onClick={() => toggleRisk(risk.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all',
                      selected
                        ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                        : 'border-white/[0.07] text-text-muted hover:border-white/[0.12] hover:text-text-secondary'
                    )}
                  >
                    {typeof risk.icon === 'string' ? (
                      <span className="text-lg">{risk.icon}</span>
                    ) : Icon ? (
                      <Icon className="w-5 h-5" />
                    ) : null}
                    <span className="text-center leading-tight">{risk.label}</span>
                    {selected && <Check className="w-3 h-3" />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      }

      if (step === 5) {
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">What&apos;s your name?</h2>
              <p className="text-text-secondary text-sm">We&apos;ll personalize your risk insights.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">First name</Label>
              <Input
                id="name"
                placeholder="Alex"
                value={everydayData.name}
                onChange={e => setEverydayData(d => ({ ...d, name: e.target.value }))}
                className="h-12 text-lg"
              />
            </div>
          </div>
        )
      }

      if (step === 6) {
        // Summary step
        const bufferDays = Math.floor(everydayData.emergencyFund / everydayExpenses * 30)
        const riskScore = Math.max(20, Math.min(80, 80 - (everydayData.emergencyFund / (everydayExpenses * 6)) * 40 - (surplus > 0 ? 10 : 0)))

        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                {everydayData.name ? `${everydayData.name}, here's` : "Here's"} your starting risk profile
              </h2>
              <p className="text-text-secondary text-sm">We&apos;ll refine this as we learn more about your situation.</p>
            </div>

            <div className="rounded-xl p-6 border border-brand-500/20 bg-brand-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Initial Risk Score</span>
                <span className="text-2xl font-bold text-amber-400 tabular">{Math.round(riskScore)}</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${riskScore}%` }} />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { label: 'Monthly Income', value: formatCurrency(everydayData.income) },
                  { label: 'Monthly Surplus', value: formatCurrency(surplus), color: surplus >= 0 ? '#10b981' : '#ef4444' },
                  { label: 'Emergency Buffer', value: `${bufferDays} days` },
                  { label: 'Risks Tracked', value: `${everydayData.topRisks.length} selected` },
                ].map(item => (
                  <div key={item.label} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                    <p className="text-xs text-text-muted mb-1">{item.label}</p>
                    <p className="text-sm font-bold tabular" style={{ color: item.color ?? '#f1f5f9' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/everyday">
              <Button variant="brand" size="lg" className="w-full">
                <LayoutDashboard className="w-4 h-4" />
                Go to my dashboard
              </Button>
            </Link>
          </div>
        )
      }
    }

    // Pro steps
    if (mode === 'pro') {
      if (step === 1) {
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">What best describes you?</h2>
              <p className="text-text-secondary text-sm">We&apos;ll tailor your risk workspace accordingly.</p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'retail', label: 'Individual / Retail Investor', description: 'Managing my own portfolio' },
                { id: 'pm', label: 'Portfolio Manager', description: 'Managing funds or institutional capital' },
                { id: 'rta', label: 'RIA / Financial Advisor', description: 'Managing client portfolios' },
                { id: 'trader', label: 'Active Trader', description: 'Day, swing, or algo trading' },
                { id: 'founder', label: 'Founder / CFO', description: 'Business financial risk management' },
                { id: 'quant', label: 'Quantitative Analyst', description: 'Model development and research' },
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => setProData(d => ({ ...d, userType: option.id }))}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl border transition-colors',
                    proData.userType === option.id
                      ? 'border-cyan-500/40 bg-cyan-500/8 text-cyan-400'
                      : 'border-white/[0.07] hover:border-white/[0.12] text-text-secondary'
                  )}
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="text-xs text-text-muted">{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        )
      }

      if (step === 2) {
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Portfolio size</h2>
              <p className="text-text-secondary text-sm">Approximate AUM or personal portfolio value.</p>
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold gradient-text-brand tabular">
                  {formatCurrency(proData.portfolioSize, { compact: true })}
                </span>
              </div>
              <Slider
                value={[proData.portfolioSize]}
                onValueChange={([v]) => setProData(d => ({ ...d, portfolioSize: v ?? d.portfolioSize }))}
                min={10000}
                max={10000000}
                step={10000}
              />
              <div className="flex justify-between text-xs text-text-muted mt-2">
                <span>$10K</span>
                <span>$10M+</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Asset classes you manage</Label>
              <div className="flex flex-wrap gap-2">
                {['US Equities', 'International', 'Fixed Income', 'Crypto', 'Commodities', 'Real Estate', 'Private Equity', 'Cash'].map(asset => (
                  <button
                    key={asset}
                    onClick={() => toggleAsset(asset)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border transition-colors',
                      proData.assetClasses.includes(asset)
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                        : 'border-white/[0.08] text-text-muted hover:border-white/[0.14]'
                    )}
                  >
                    {asset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      }

      if (step >= 3) {
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Your Pro workspace is ready</h2>
              <p className="text-text-secondary text-sm">We&apos;ve configured RiskForge Pro based on your profile.</p>
            </div>

            <div className="rounded-xl p-6 border border-cyan-500/20 bg-cyan-500/5 space-y-4">
              {[
                { label: 'Portfolio Tracking', value: 'Active', color: '#10b981' },
                { label: 'VaR Engine', value: '95% & 99% CL', color: '#38bdf8' },
                { label: 'Stress Test Scenarios', value: '4 scenarios loaded', color: '#4f8ef7' },
                { label: 'Alert Engine', value: 'Configured', color: '#10b981' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{item.label}</span>
                  <span className="text-sm font-semibold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>

            <Link href="/pro">
              <Button variant="default" size="lg" className="w-full bg-cyan-600 hover:bg-cyan-500">
                <TrendingUp className="w-4 h-4" />
                Open Pro Dashboard
              </Button>
            </Link>
          </div>
        )
      }
    }

    return null
  }

  return (
    <div className="min-h-screen bg-base-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-text-primary">RiskForge</span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.max(1, totalSteps + 1) }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full transition-all duration-300',
                  i === step
                    ? 'w-6 h-2 bg-brand-500'
                    : i < step
                    ? 'w-2 h-2 bg-brand-500/60'
                    : 'w-2 h-2 bg-white/[0.12]'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-text-muted">
            {step + 1} of {totalSteps + 1}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/[0.06]">
        <motion.div
          className="h-full bg-brand-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderStep()}

              {/* Navigation for non-final steps */}
              {step > 0 && step < totalSteps && (
                <div className="flex gap-3 mt-8">
                  <Button variant="secondary" onClick={goBack} className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button variant="brand" onClick={goNext} className="flex-1">
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {step === 0 && (
                <button
                  onClick={goBack}
                  className="w-full mt-4 text-xs text-text-muted hover:text-text-secondary transition-colors"
                >
                  Skip — take me straight to the app
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
