'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Search, ChevronDown, User, Settings, LogOut, CreditCard, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { proAlerts } from '@/lib/mock-data/pro'

const pageLabels: Record<string, string> = {
  '/everyday': 'Dashboard',
  '/everyday/scenarios': 'Risk Scenarios',
  '/everyday/timeline': 'Risk Timeline',
  '/everyday/budget-stress-test': 'Budget Stress Test',
  '/everyday/emergency-plan': 'Emergency Plan',
  '/everyday/coach': 'AI Coach',
  '/everyday/reports': 'Reports',
  '/pro': 'Dashboard',
  '/pro/portfolio': 'Portfolio Overview',
  '/pro/stress-testing': 'Stress Testing',
  '/pro/risk-models': 'Risk Models',
  '/pro/alerts': 'Alerts & Monitoring',
  '/pro/business-risk': 'Business Risk',
  '/pro/import': 'Data Import',
  '/pro/reports': 'Reports',
  '/settings': 'Settings',
  '/billing': 'Billing & Upgrade',
}

export function TopBar() {
  const pathname = usePathname()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const unreadAlerts = proAlerts.filter(a => !a.isRead).length

  const pageTitle = pageLabels[pathname] ?? 'RiskForge'
  const isPro = pathname.startsWith('/pro')

  return (
    <header className="fixed top-0 right-0 left-[240px] h-16 z-30 flex items-center justify-between px-6 border-b border-white/[0.06] bg-base-950/80 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base font-semibold text-text-primary leading-none">{pageTitle}</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {isPro ? 'RiskForge Pro' : 'RiskForge Everyday'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        {showSearch ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <Input
              autoFocus
              placeholder="Search scenarios, metrics..."
              className="pl-9 w-64 h-9 text-sm"
              onBlur={() => setShowSearch(false)}
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(true)}
            className="text-text-muted hover:text-text-secondary"
          >
            <Search className="w-4 h-4" />
          </Button>
        )}

        {/* Notifications */}
        <Link href={isPro ? '/pro/alerts' : '/everyday'}>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-text-muted hover:text-text-secondary"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 border border-base-950" />
            )}
          </Button>
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/[0.06] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-glow-sm">
              AR
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-text-primary leading-none">Alex Rivera</p>
              <p className="text-2xs text-text-muted mt-0.5">Plus Plan</p>
            </div>
            <ChevronDown className={cn('w-3.5 h-3.5 text-text-muted transition-transform hidden sm:block', showUserMenu && 'rotate-180')} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-base-800 border border-white/[0.1] rounded-xl shadow-panel overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-sm font-semibold text-text-primary">Alex Rivera</p>
                <p className="text-xs text-text-muted">alex@example.com</p>
              </div>
              <div className="p-1">
                {[
                  { icon: User, label: 'Profile', href: '/settings' },
                  { icon: CreditCard, label: 'Billing', href: '/billing' },
                  { icon: HelpCircle, label: 'Help & Support', href: '#' },
                ].map(({ icon: Icon, label, href }) => (
                  <Link key={label} href={href} onClick={() => setShowUserMenu(false)}>
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-text-secondary hover:bg-white/[0.06] hover:text-text-primary transition-colors">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{label}</span>
                    </div>
                  </Link>
                ))}
                <div className="h-px bg-white/[0.06] my-1" />
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
