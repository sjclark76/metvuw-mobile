'use client'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'

import { useIsMounted } from '@/components/Hooks/useIsMounted'
import { useOnline } from '@/components/Hooks/useOnline'
import { formatBytes } from '@/shared/helpers/offline/format'

import { supportsSavingPages } from './browserDependencies'
import { useSavedPage } from './useSavedPages'

const iconProps = {
  viewBox: '0 0 24 24',
  className: 'size-5 shrink-0',
  'aria-hidden': true,
  focusable: false,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const DownloadIcon = () => (
  <svg {...iconProps}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />
  </svg>
)
const CheckIcon = () => (
  <svg {...iconProps}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)

/**
 * Keeps the page's charts on the device so they can be looked at with no
 * connection. A toggle: pressed means saved. What is saved is only known once
 * the page is running in the browser, so nothing is drawn before then.
 */
export function SaveForOfflineButton() {
  const path = usePathname()
  const isMounted = useIsMounted()
  const online = useOnline()
  const { saved, status, save, remove } = useSavedPage(path ?? '')

  const ready = isMounted && !!path && supportsSavingPages()

  const saving = status === 'saving'
  const failed = status === 'failed'
  const cannotSave = !saved && !online
  const message = saving
    ? 'Saving…'
    : failed
      ? 'Could not save. Check your connection and try again.'
      : saved
        ? `Saved, ${formatBytes(saved.bytes)}`
        : cannotSave
          ? 'Connect to save this page'
          : ''

  return (
    // The space is reserved from the first paint, as the button only appears once
    // the page is running in the browser: otherwise the charts would jump down.
    // The message stays on the one line (it is short) so that a saved page's
    // does not wrap and change the height when it arrives; only a failure, which
    // follows a press, is allowed to.
    <div
      className={clsx(
        'mt-3 flex min-h-9 items-center gap-x-3 pointer-coarse:min-h-11',
        failed ? 'flex-wrap gap-y-1' : 'flex-nowrap',
      )}
    >
      {ready && (
        <>
          <button
            type="button"
            aria-pressed={!!saved}
            disabled={saving || cannotSave}
            onClick={() => void (saved ? remove() : save())}
            className={clsx(
              'ring-ink/10 focus-visible:outline-cold inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 pointer-coarse:min-h-11',
              saved
                ? 'bg-ink text-paper hover:bg-ink-soft'
                : 'bg-plate text-ink hover:bg-paper',
            )}
          >
            {saved ? <CheckIcon /> : <DownloadIcon />}
            Save for offline
          </button>
          <p
            role="status"
            className={clsx(
              'text-ink-soft min-w-0 font-mono text-xs empty:hidden',
              !failed && 'truncate',
            )}
          >
            {message}
          </p>
        </>
      )}
    </div>
  )
}
