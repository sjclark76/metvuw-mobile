'use client'
import Link from 'next/link'
import { FormEvent, KeyboardEvent, useId, useState } from 'react'

import { actionClasses } from '@/components/StatusMessage'
import {
  chartsShowing,
  MAX_LABEL_LENGTH,
  type Pin,
} from '@/shared/helpers/pins/pins'

/** One pin's chart label, edited where it is. Enter saves, Escape cancels, blank clears. */
function LabelEditor({
  pin,
  onSave,
  onCancel,
}: {
  pin: Pin
  onSave: (label: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(pin.label ?? '')
  const inputId = useId()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave(value)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onCancel()
    }
  }

  return (
    <form onSubmit={submit} onKeyDown={onKeyDown} className="mt-2">
      <label htmlFor={inputId} className="text-ink-soft block text-xs">
        Label for {pin.name} on the charts (up to {MAX_LABEL_LENGTH} characters;
        leave blank to use the name)
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={inputId}

          autoFocus
          value={value}
          maxLength={MAX_LABEL_LENGTH}
          onChange={(event) => setValue(event.target.value)}
          className="border-rule bg-plate text-ink focus-visible:outline-cold min-h-11 min-w-0 flex-1 rounded border px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <button type="submit" className={actionClasses.primary}>
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={actionClasses.secondary}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

/**
 * The pinned places, in the style of the saved pages: the full name (and the label
 * that stands for it on the charts, if there is one), what and where it is, which
 * charts show it (each a link to that chart), and Label and Remove.
 */
export function PinList({
  pins,
  onLabel,
  onRemove,
}: {
  pins: Pin[]
  onLabel: (id: string, label: string) => void
  onRemove: (id: string) => void
}) {
  const [editing, setEditing] = useState<string | null>(null)

  if (pins.length === 0) {
    return (
      <p className="text-ink">
        No places yet. Search for a place above and tap it to add it: it is
        marked on the charts that show it.
      </p>
    )
  }

  return (
    <ul className="divide-rule border-rule divide-y border-y">
      {pins.map((pin) => {
        const charts = chartsShowing(pin)
        return (
          <li key={pin.id} className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-ink font-semibold">{pin.name}</p>
                {pin.label && (
                  <p className="text-ink text-sm">
                    On the charts as <strong>{pin.label}</strong>
                  </p>
                )}
                <p className="text-ink-soft font-mono text-xs">
                  {pin.kind} · {pin.context}
                </p>
                <p className="text-ink-soft mt-1 text-sm">
                  {charts.length === 0 ? (
                    'No chart shows this place.'
                  ) : (
                    <>
                      Shown on:{' '}
                      {charts.map((chart, index) => (
                        <span key={chart.code}>
                          {index > 0 && ', '}
                          <Link
                            href={chart.href}
                            prefetch={false}
                            className="text-ink focus-visible:outline-cold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                          >
                            {chart.name}
                          </Link>
                        </span>
                      ))}
                    </>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  aria-label={`Label ${pin.name}`}
                  aria-expanded={editing === pin.id}
                  onClick={() => setEditing(editing === pin.id ? null : pin.id)}
                  className={actionClasses.secondary}
                >
                  Label
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${pin.name}`}
                  onClick={() => onRemove(pin.id)}
                  className={actionClasses.secondary}
                >
                  Remove
                </button>
              </div>
            </div>
            {editing === pin.id && (
              <LabelEditor
                pin={pin}
                onSave={(label) => {
                  onLabel(pin.id, label)
                  setEditing(null)
                }}
                onCancel={() => setEditing(null)}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
