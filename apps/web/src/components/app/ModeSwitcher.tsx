'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModeSwitcherProps {
  collapsed?: boolean
}

export function ModeSwitcher({ collapsed = false }: ModeSwitcherProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isEveryday = pathname.startsWith('/everyday')
  const isPro = pathname.startsWith('/pro')
  const activeMode = isPro ? 'pro' : 'everyday'

  const handleSwitch = (mode: 'everyday' | 'pro') => {
    router.push(mode === 'everyday' ? '/everyday' : '/pro')
  }

  if (collapsed) {
    return (
      <div className="flex flex-col gap-1 px-2">
        <button
          onClick={() => handleSwitch('everyday')}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150',
            activeMode === 'everyday'
              ? 'bg-brand-500/15 text-brand-400 border border-brand-500/25'
              : 'text-text-muted hover:bg-white/[0.06] hover:text-text-secondary'
          )}
          title="Everyday"
        >
          <User className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleSwitch('pro')}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150',
            activeMode === 'pro'
              ? 'bg-brand-500/15 text-brand-400 border border-brand-500/25'
              : 'text-text-muted hover:bg-white/[0.06] hover:text-text-secondary'
          )}
          title="Pro"
        >
          <BarChart3 className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="mx-3 mb-4">
      <div className="relative flex bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
        {/* Sliding indicator */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg bg-brand-500/15 border border-brand-500/25"
          initial={false}
          animate={{
            left: activeMode === 'everyday' ? '4px' : '50%',
            right: activeMode === 'everyday' ? '50%' : '4px',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
        <button
          onClick={() => handleSwitch('everyday')}
          className={cn(
            'relative z-10 flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors duration-150',
            activeMode === 'everyday' ? 'text-brand-400' : 'text-text-muted hover:text-text-secondary'
          )}
        >
          <User className="w-3.5 h-3.5" />
          Everyday
        </button>
        <button
          onClick={() => handleSwitch('pro')}
          className={cn(
            'relative z-10 flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors duration-150',
            activeMode === 'pro' ? 'text-brand-400' : 'text-text-muted hover:text-text-secondary'
          )}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Pro
        </button>
      </div>
    </div>
  )
}
