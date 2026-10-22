'use client'
import Link from 'next/link'
import { useState } from 'react'

import { usePins } from '@/components/Pins/usePins'
import { useSavedPageList } from '@/components/SavedPages/useSavedPages'
import { actionClasses } from '@/components/StatusMessage'

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

function ClearRow({
  title,
  href,
  count,
  summary,
  confirmText,
  onClear,
}: {
  title: string
  href: string
  count: number
  summary: string
  confirmText: string
  onClear: () => void | Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-ink font-semibold">{title}</p>
          <p className="text-ink-soft text-sm">
            {summary}{' '}
            <Link
              href={href}
              prefetch={false}
              className="text-ink focus-visible:outline-cold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              See them
            </Link>
          </p>
        </div>
        {!confirming && (
          <button
            type="button"
            disabled={count === 0}
            onClick={() => setConfirming(true)}
            className={`${actionClasses.secondary} shrink-0 disabled:opacity-50`}
          >
            Clear all {title.toLowerCase()}
          </button>
        )}
      </div>
      {confirming && (
        <div
          role="alertdialog"
          aria-label={confirmText}
          className="border-rule mt-3 rounded border p-3"
        >
          <p className="text-ink mb-3 text-sm">{confirmText}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                await onClear()
                setConfirming(false)
              }}
              className={actionClasses.primary}
            >
              Yes, clear
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={actionClasses.secondary}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * What the app keeps on this device, with a way to clear each: the pins, and the
 * pages saved for offline use. Clearing asks first, because it cannot be undone.
 */
export function DataSettings() {
  const { pins, remove } = usePins()
  const { pages, removeAll } = useSavedPageList()

  return (
    <>
      <ClearRow
        title="Pins"
        href="/pins"
        count={pins.length}
        summary={
          pins.length === 0
            ? 'No pins.'
            : `${plural(pins.length, 'pin', 'pins')} on this device.`
        }
        confirmText={`Clear ${plural(pins.length, 'pin', 'pins')}? This cannot be undone.`}
        onClear={() => pins.forEach((pin) => remove(pin.id))}
      />
      <ClearRow
        title="Saved pages"
        href="/saved"
        count={pages.length}
        summary={
          pages.length === 0
            ? 'No saved pages.'
            : `${plural(pages.length, 'page', 'pages')} saved on this device.`
        }
        confirmText={`Clear ${plural(pages.length, 'saved page', 'saved pages')}? They will not open offline any more.`}
        onClear={removeAll}
      />
    </>
  )
}
