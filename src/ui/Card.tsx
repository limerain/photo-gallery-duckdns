import type { HTMLAttributes } from 'react'
import { cn } from './cn'

type Props = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border-default bg-surface-elevated shadow-sm backdrop-blur',
        className,
      )}
      {...props}
    />
  )
}

