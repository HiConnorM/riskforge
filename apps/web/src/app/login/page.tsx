'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    // In real app: handle auth
    window.location.href = '/everyday'
  }

  return (
    <div className="min-h-screen bg-base-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-gradient-to-br from-base-900 to-base-950 border-r border-white/[0.05] p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-[100px]" />
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

        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-text-primary mb-3 leading-tight">
              Risk is not the problem. Unseen risk is.
            </h2>
            <p className="text-text-secondary leading-relaxed">
              Sign back in to check your risk score, review your emergency plan, and stay ahead of the next financial surprise.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { metric: '42', label: 'Average risk score improvement', sub: 'in first 90 days' },
              { metric: '12K+', label: 'Users who stopped guessing', sub: 'and started knowing' },
              { metric: '94%', label: 'Report feeling more confident', sub: 'about financial decisions' },
            ].map((stat) => (
              <div key={stat.metric} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-2xl font-bold gradient-text-brand w-16 flex-shrink-0 tabular">{stat.metric}</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{stat.label}</p>
                  <p className="text-xs text-text-muted">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-xs text-text-disabled">© 2026 RiskForge Inc. Not financial advice.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary">
              Risk<span className="gradient-text-brand">Forge</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome back</h1>
            <p className="text-text-muted">Sign in to your RiskForge account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
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
            </div>

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-white/[0.06]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-base-950 px-3 text-xs text-text-muted">Or continue with</span>
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
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
