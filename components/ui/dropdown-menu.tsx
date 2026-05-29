'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ── Context ────────────────────────────────────────────────────
const DropdownContext = React.createContext<{
  open: boolean
  setOpen: (v: boolean) => void
}>({ open: false, setOpen: () => {} })

// ── DropdownMenu ───────────────────────────────────────────────
export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  )
}

// ── Trigger ────────────────────────────────────────────────────
export function DropdownMenuTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const { open, setOpen } = React.useContext(DropdownContext)
  const child = React.Children.only(children) as React.ReactElement<any>
  return React.cloneElement(child, {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      setOpen(!open)
      child.props.onClick?.(e)
    },
  })
}

// ── Content ────────────────────────────────────────────────────
export function DropdownMenuContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { open } = React.useContext(DropdownContext)
  if (!open) return null
  return (
    <div
      className={cn(
        'absolute right-0 z-50 mt-1 min-w-[140px] rounded-lg border border-border bg-card shadow-xl shadow-black/30 py-1',
        className
      )}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

// ── Item ───────────────────────────────────────────────────────
export function DropdownMenuItem({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  const { setOpen } = React.useContext(DropdownContext)
  return (
    <button
      className={cn(
        'w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors',
        className
      )}
      onClick={() => {
        onClick?.()
        setOpen(false)
      }}
    >
      {children}
    </button>
  )
}
