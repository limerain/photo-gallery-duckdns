import type { HTMLAttributes } from 'react'
import { cn } from './cn'

type Props = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/5 shadow-[0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur',
        className,
      )}
      {...props}
    />
  )
}

