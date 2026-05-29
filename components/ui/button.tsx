import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90':           variant === 'default',
          'border border-border bg-transparent hover:bg-accent text-foreground': variant === 'outline',
          'bg-transparent hover:bg-accent text-foreground':                    variant === 'ghost',
          'bg-danger text-white hover:bg-danger/90':                          variant === 'destructive',
        },
        {
          'h-9 px-4 text-sm':   size === 'default',
          'h-7 px-3 text-xs':   size === 'sm',
          'h-11 px-6 text-base': size === 'lg',
          'h-9 w-9':             size === 'icon',
        },
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button }
