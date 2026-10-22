'use client'
import clsx from 'clsx'
import { useId } from 'react'

/**
 * An on/off setting: a label, a line saying what it does, and a switch. The switch
 * is a button with the `switch` role, so the keyboard and screen readers treat it as
 * one, and it takes effect as soon as it is pressed.
 */
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-ink font-semibold">
          {label}
        </p>
        <p id={`${id}-description`} className="text-ink-soft text-sm">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description`}
        onClick={() => onChange(!checked)}
        className={clsx(
          'focus-visible:outline-cold relative mt-0.5 h-8 w-14 shrink-0 rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none pointer-coarse:h-9 pointer-coarse:w-16',
          checked ? 'bg-ink border-ink' : 'bg-plate border-ink/30',
        )}
      >
        <span
          aria-hidden="true"
          className={clsx(
            'absolute top-1/2 left-0.5 size-6 -translate-y-1/2 rounded-full transition-transform motion-reduce:transition-none pointer-coarse:size-7',
            checked
              ? 'bg-paper translate-x-6 pointer-coarse:translate-x-7'
              : 'bg-ink-soft',
          )}
        />
      </button>
    </div>
  )
}
