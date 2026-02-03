import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from './cn'

type Props = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-lg border border-border-default bg-surface-elevated px-3 text-sm text-content-primary placeholder:text-content-muted outline-none transition focus:border-border-hover focus:bg-surface-elevated-hover',
        className,
      )}
      {...props}
    />
  )
})

