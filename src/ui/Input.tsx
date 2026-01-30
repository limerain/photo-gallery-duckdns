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
        'h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-white/20 focus:bg-white/7',
        className,
      )}
      {...props}
    />
  )
})

