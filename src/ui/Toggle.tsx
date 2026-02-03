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
        'relative inline-flex h-7 w-12 items-center rounded-full border transition',
        checked
          ? 'border-accent bg-accent'
          : 'border-border-default bg-surface-elevated',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full transition',
          checked
            ? 'translate-x-6 bg-accent-text'
            : 'translate-x-1 bg-content-secondary',
        )}
      />
    </button>
  )
}

