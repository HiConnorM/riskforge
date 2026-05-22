'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-brand-500 text-white hover:bg-brand-600 shadow-glow-sm hover:shadow-glow',
        secondary:
          'bg-white/[0.06] text-text-primary border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.12]',
        ghost:
          'text-text-secondary hover:bg-white/[0.06] hover:text-text-primary',
        destructive:
          'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
        outline:
          'border border-white/[0.1] text-text-primary hover:bg-white/[0.06] hover:border-white/[0.15]',
        brand:
          'bg-gradient-to-r from-brand-500 to-cyan-400 text-white font-semibold hover:from-brand-600 hover:to-cyan-500 shadow-glow hover:shadow-glow-lg',
        link: 'text-brand-500 hover:text-brand-400 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-6 text-base',
        xl: 'h-14 rounded-xl px-8 text-base font-semibold',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7 rounded-md',
        'icon-lg': 'h-11 w-11 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
