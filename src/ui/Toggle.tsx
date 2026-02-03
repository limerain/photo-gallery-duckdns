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
        'relative inline-flex h-7 w-12 items-center rounded-full border border-border-default bg-surface-elevated transition',
        checked && 'bg-accent text-accent-text',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-content-secondary transition',
          checked ? 'translate-x-6 bg-accent-text' : 'translate-x-1',
        )}
      />
    </button>
  )
}

