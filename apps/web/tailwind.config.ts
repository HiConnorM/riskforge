import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base backgrounds
        base: {
          950: '#08090c',
          900: '#0f1117',
          800: '#161b26',
          700: '#1e2535',
          600: '#252d40',
          500: '#2d3650',
        },
        // Brand blues
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#4f8ef7',
          600: '#3b7cf8',
          700: '#2563eb',
          800: '#1d4ed8',
          900: '#1e40af',
        },
        // Cyan accent
        cyan: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        // Semantic colors
        risk: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#f97316',
          critical: '#ef4444',
        },
        // Borders
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          subtle: 'rgba(255,255,255,0.04)',
          strong: 'rgba(255,255,255,0.12)',
        },
        // Text
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#64748b',
          disabled: '#475569',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
        numeric: ['var(--font-geist-mono)', 'tabular-nums', 'ui-monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        card: '0.75rem',
        panel: '1rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glow: '0 0 20px rgba(79, 142, 247, 0.15)',
        'glow-sm': '0 0 12px rgba(79, 142, 247, 0.1)',
        'glow-lg': '0 0 40px rgba(79, 142, 247, 0.2)',
        card: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
        panel: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
        elevated: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #4f8ef7 0%, #38bdf8 100%)',
        'gradient-brand-dark': 'linear-gradient(135deg, #3b7cf8 0%, #0ea5e9 100%)',
        'gradient-surface': 'linear-gradient(180deg, #161b26 0%, #0f1117 100%)',
        'gradient-glow': 'radial-gradient(ellipse at center, rgba(79, 142, 247, 0.15) 0%, transparent 70%)',
        'gradient-card': 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        glowPulse: {
          '0%': { boxShadow: '0 0 20px rgba(79, 142, 247, 0.1)' },
          '100%': { boxShadow: '0 0 30px rgba(79, 142, 247, 0.25)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
