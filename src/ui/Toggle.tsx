import { cn } from './cn'

type Props = {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  disabled?: boolean
}

export function Toggle({ checked, onCheckedChange, disabled }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 items-center rounded-full border border-white/10 bg-white/5 transition',
        checked && 'bg-white text-zinc-900',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-zinc-200 transition',
          checked ? 'translate-x-6 bg-zinc-900' : 'translate-x-1',
        )}
      />
    </button>
  )
}

