'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const features = [
  'Risk score & scenario modeling',
  'Budget stress testing',
  'Emergency plan builder',
  '14-day free trial, no credit card',
]

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const strengthColors = ['', '#ef4444', '#f59e0b', '#10b981']
  const strengthLabels = ['', 'Too short', 'Good', 'Strong']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    window.location.href = '/onboarding'
  }

  return (
    <div className="min-h-screen bg-base-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-gradient-to-br from-base-900 to-base-950 border-r border-white/[0.05] p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-500/6 blur-[80px]" />
        </div>

        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm">
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">
              Risk<span className="gradient-text-brand">Forge</span>
            </span>
          </Link>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold text-text-primary mb-3">
            Your next best move starts here.
          </h2>
          <p className="text-text-secondary leading-relaxed mb-8">
            In 5 minutes, you&apos;ll have a complete risk profile — and a clear path to financial resilience.
          </p>
          <ul className="space-y-3">
            {features.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-text-secondary">
                <div className="w-5 h-5 rounded-full bg-brand-500/15 border border-brand-500/25 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-brand-400" />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-text-disabled">© 2026 RiskForge Inc.</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary">
              Risk<span className="gradient-text-brand">Forge</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Create your account</h1>
            <p className="text-text-muted">Start your 14-day free trial — no credit card required</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Alex Rivera"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= passwordStrength ? strengthColors[passwordStrength] : 'rgba(255,255,255,0.08)' }}
                      />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: strengthColors[passwordStrength] }}>
                    {strengthLabels[passwordStrength]}
                  </span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create free account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <p className="text-xs text-text-muted text-center">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-brand-400 hover:text-brand-300">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-brand-400 hover:text-brand-300">Privacy Policy</a>.
            </p>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-white/[0.06]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-base-950 px-3 text-xs text-text-muted">Or sign up with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {['Google', 'GitHub'].map(provider => (
              <Button key={provider} variant="secondary" className="h-11">
                {provider}
              </Button>
            ))}
          </div>

          <p className="text-center text-sm text-text-muted mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
