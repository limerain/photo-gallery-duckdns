import type { ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-border-hover disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'border border-accent bg-accent text-accent-text hover:bg-accent-hover hover:border-accent-hover',
  secondary:
    'border border-border-default bg-surface-elevated text-content-primary hover:bg-surface-elevated-hover',
  ghost: 'text-content-secondary hover:bg-surface-elevated',
  danger: 'border border-danger-border bg-danger-bg text-danger-text hover:bg-danger-bg/80',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
}

export function Button({
  className,
  variant = 'secondary',
  size = 'md',
  ...props
}: Props) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
}

