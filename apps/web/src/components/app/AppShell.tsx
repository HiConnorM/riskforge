'use client'

import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-screen bg-base-950">
      <Sidebar />
      <TopBar />
      <main
        className={cn(
          'ml-[240px] pt-16 min-h-screen',
          'transition-all duration-300',
          className
        )}
      >
        {children}
      </main>
    </div>
  )
}
