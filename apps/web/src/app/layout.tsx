import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'RiskForge — Know Your Risk Before It Knows You',
    template: '%s | RiskForge',
  },
  description:
    'RiskForge turns financial uncertainty into clarity. Stress-test your budget, model portfolio risk, and build resilience — before anything goes wrong.',
  keywords: ['risk management', 'personal finance', 'portfolio risk', 'financial planning', 'stress testing'],
  themeColor: '#08090c',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'RiskForge — Know Your Risk Before It Knows You',
    description: 'Turn financial uncertainty into clarity. Risk intelligence for everyday decisions and professional portfolios.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-base-950 text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
