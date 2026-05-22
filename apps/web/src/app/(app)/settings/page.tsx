'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, Palette, CreditCard, Key, Trash2, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { everydayProfile } from '@/lib/mock-data/everyday'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState(everydayProfile.name)
  const [email, setEmail] = useState(everydayProfile.email)

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyDigest: true,
    riskScoreChange: true,
    budgetWarning: false,
    proAlerts: true,
    mobileNotifications: false,
  })

  const save = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-[900px]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-xl font-semibold text-text-primary">Settings</h2>
        <p className="text-sm text-text-muted">Manage your account, notifications, and preferences</p>
      </motion.div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Avatar */}
            <div className="card-base rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Profile Photo</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xl font-bold shadow-glow-sm">
                  {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <Button variant="secondary" size="sm">Upload photo</Button>
                  <p className="text-xs text-text-muted mt-1.5">JPG, PNG or GIF · Max 2MB</p>
                </div>
              </div>
            </div>

            {/* Profile info */}
            <div className="card-base rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Email address</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Phone (optional)</Label>
                  <Input placeholder="+1 (555) 000-0000" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input placeholder="San Francisco, CA" className="h-11" />
                </div>
              </div>
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}
              </Button>
            </div>

            {/* Danger zone */}
            <div className="rounded-xl p-5 border border-red-500/20 bg-red-500/5">
              <h3 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h3>
              <p className="text-xs text-text-muted mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete account
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-base rounded-xl p-5 space-y-5"
          >
            <h3 className="text-sm font-semibold text-text-primary">Notification Preferences</h3>
            {Object.entries(notifications).map(([key, value]) => {
              const labels: Record<string, { label: string; desc: string }> = {
                emailAlerts: { label: 'Email Alerts', desc: 'Receive critical risk alerts by email' },
                weeklyDigest: { label: 'Weekly Digest', desc: 'Weekly summary of your risk profile' },
                riskScoreChange: { label: 'Risk Score Changes', desc: 'Notify when your score changes significantly' },
                budgetWarning: { label: 'Budget Warnings', desc: 'Alert when spending exceeds budget' },
                proAlerts: { label: 'Pro Alerts', desc: 'VaR breaches, concentration alerts, drawdowns' },
                mobileNotifications: { label: 'Mobile Push', desc: 'Push notifications on your phone' },
              }
              const l = labels[key]
              return (
                <div key={key} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{l?.label}</p>
                    <p className="text-xs text-text-muted">{l?.desc}</p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={checked => setNotifications(prev => ({ ...prev, [key]: checked }))}
                  />
                </div>
              )
            })}
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="card-base rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Change Password</h3>
              {['Current password', 'New password', 'Confirm new password'].map(f => (
                <div key={f} className="space-y-2">
                  <Label>{f}</Label>
                  <Input type="password" placeholder="••••••••" className="h-11" />
                </div>
              ))}
              <Button className="gap-2">
                <Key className="w-4 h-4" />
                Update password
              </Button>
            </div>

            <div className="card-base rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Two-Factor Authentication</h3>
              <p className="text-xs text-text-muted mb-4">Add an extra layer of security to your account.</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-400 font-medium">Not enabled</span>
                <Button variant="secondary" size="sm">Enable 2FA</Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="preferences">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-base rounded-xl p-5 space-y-5"
          >
            <h3 className="text-sm font-semibold text-text-primary">App Preferences</h3>
            {[
              { label: 'Default mode', desc: 'Start app in Everyday or Pro mode', options: ['Everyday', 'Pro'] },
              { label: 'Currency', desc: 'Display currency for financial figures', options: ['USD', 'EUR', 'GBP', 'CAD'] },
              { label: 'Number format', desc: 'How to display large numbers', options: ['1,234,567', '1.234.567', '1 234 567'] },
            ].map(pref => (
              <div key={pref.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="text-sm font-medium text-text-primary">{pref.label}</p>
                  <p className="text-xs text-text-muted">{pref.desc}</p>
                </div>
                <div className="flex gap-1.5">
                  {pref.options.slice(0, 3).map((opt, i) => (
                    <button
                      key={opt}
                      className={cn(
                        'text-xs px-2.5 py-1.5 rounded-lg border transition-colors',
                        i === 0
                          ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                          : 'border-white/[0.07] text-text-muted hover:border-white/[0.12]'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
