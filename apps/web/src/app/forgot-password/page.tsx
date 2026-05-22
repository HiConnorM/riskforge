'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-base-950 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm">
            <ShieldCheck className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-bold text-text-primary">
            Risk<span className="gradient-text-brand">Forge</span>
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-3xl font-bold text-text-primary mb-2">Reset your password</h1>
              <p className="text-text-muted mb-8">
                Enter your email address and we&apos;ll send you a secure link to reset your password.
              </p>

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

                <Button type="submit" variant="brand" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5">
                <MailCheck className="w-8 h-8 text-brand-400" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-3">Check your inbox</h2>
              <p className="text-text-secondary mb-6">
                We&apos;ve sent a password reset link to <strong className="text-text-primary">{email}</strong>.
                Check your spam folder if you don&apos;t see it within a few minutes.
              </p>
              <Button variant="secondary" className="w-full" onClick={() => setSent(false)}>
                Try a different email
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8">
          <Link href="/login" className="flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
