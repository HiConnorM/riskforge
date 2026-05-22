'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Zap,
  Calendar,
  CreditCard,
  Shield,
  MessageCircle,
  FileText,
  TrendingUp,
  BarChart2,
  Activity,
  Bell,
  Database,
  Briefcase,
  Settings,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Flame,
} from 'lucide-react'
import { ModeSwitcher } from './ModeSwitcher'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

const everydayNav: NavItem[] = [
  { label: 'Dashboard', href: '/everyday', icon: LayoutDashboard },
  { label: 'Scenarios', href: '/everyday/scenarios', icon: Zap },
  { label: 'Timeline', href: '/everyday/timeline', icon: Calendar },
  { label: 'Budget Stress Test', href: '/everyday/budget-stress-test', icon: CreditCard },
  { label: 'Emergency Plan', href: '/everyday/emergency-plan', icon: Shield },
  { label: 'AI Coach', href: '/everyday/coach', icon: MessageCircle, badge: '3' },
  { label: 'Reports', href: '/everyday/reports', icon: FileText },
]

const proNav: NavItem[] = [
  { label: 'Dashboard', href: '/pro', icon: LayoutDashboard },
  { label: 'Portfolio', href: '/pro/portfolio', icon: TrendingUp },
  { label: 'Stress Testing', href: '/pro/stress-testing', icon: Activity },
  { label: 'Risk Models', href: '/pro/risk-models', icon: BarChart2 },
  { label: 'Alerts', href: '/pro/alerts', icon: Bell, badge: 3 },
  { label: 'Business Risk', href: '/pro/business-risk', icon: Briefcase },
  { label: 'Data Import', href: '/pro/import', icon: Database },
  { label: 'Reports', href: '/pro/reports', icon: FileText },
]

const bottomNav: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Billing', href: '/billing', icon: Receipt },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const isPro = pathname.startsWith('/pro')
  const navItems = isPro ? proNav : everydayNav

  const isActive = (href: string) => {
    if (href === '/everyday' || href === '/pro') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="fixed left-0 top-0 h-screen z-40 flex flex-col border-r border-white/[0.06] bg-base-900/95 backdrop-blur-xl overflow-hidden"
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 border-b border-white/[0.06] flex-shrink-0',
        collapsed ? 'justify-center px-2' : 'px-4 gap-3'
      )}>
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-glow-sm">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="text-base font-bold text-text-primary">
                Risk<span className="gradient-text-brand">Forge</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mode switcher */}
      <div className={cn('pt-4 flex-shrink-0', collapsed ? 'px-2' : '')}>
        <ModeSwitcher collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        <div className={cn('mb-2', !collapsed && 'px-3')}>
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-2xs font-semibold uppercase tracking-widest text-text-disabled"
              >
                {isPro ? 'Pro Tools' : 'Everyday'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'relative flex items-center rounded-lg transition-all duration-150 cursor-pointer',
                  collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-2.5 px-3 py-2',
                  active
                    ? 'bg-brand-500/12 text-brand-400 border border-brand-500/20'
                    : 'text-text-muted hover:bg-white/[0.05] hover:text-text-secondary border border-transparent'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn('flex-shrink-0', collapsed ? 'w-4.5 h-4.5' : 'w-4 h-4')} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium flex-1 whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.badge && !collapsed && (
                  <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-brand-500/20 text-brand-400 text-2xs font-bold flex items-center justify-center px-1 border border-brand-500/30">
                    {item.badge}
                  </span>
                )}
                {item.badge && collapsed && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 text-white text-2xs font-bold flex items-center justify-center">
                    {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-2 pb-3 space-y-0.5 border-t border-white/[0.06] pt-3 flex-shrink-0">
        {bottomNav.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center rounded-lg transition-all duration-150 cursor-pointer',
                  collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-2.5 px-3 py-2',
                  active
                    ? 'bg-brand-500/12 text-brand-400'
                    : 'text-text-muted hover:bg-white/[0.05] hover:text-text-secondary'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-base-800 border border-white/[0.1] flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-base-700 transition-all z-50 shadow-card"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  )
}
