import type { ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-white text-zinc-900 hover:bg-zinc-200',
  secondary:
    'border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10',
  ghost: 'text-zinc-200 hover:bg-white/5',
  danger: 'border border-red-400/30 bg-red-500/10 text-red-100 hover:bg-red-500/20',
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

