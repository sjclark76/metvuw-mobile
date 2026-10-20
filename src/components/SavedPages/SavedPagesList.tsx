'use client'
import Link from 'next/link'

import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { useIsMounted } from '@/components/Hooks/useIsMounted'
import { useNow } from '@/components/Hooks/useNow'
import { useOnline } from '@/components/Hooks/useOnline'
import { actionClasses } from '@/components/StatusMessage'
import { formatAge, formatBytes } from '@/shared/helpers/offline/format'
import {
  describeFreshness,
  freshness,
} from '@/shared/helpers/offline/freshness'

import { useSavedPageList } from './useSavedPages'

// Whether the forecast kept is the newest: quiet when it is, in the warm colour
// when it is not.
function FreshnessLine({ status }: { status: string | undefined }) {
  if (!status) return null
  return (
    <p
      data-freshness
      className={
        'font-mono text-xs font-semibold ' +
        (status === 'up to date' ? 'text-ink-soft' : 'text-warm')
      }
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </p>
  )
}

/**
 * The pages kept for offline use: what each is, how big, and how recently it was
 * checked, with a way to remove it. What is saved is only known in the browser,
 * so nothing is drawn before the page is running there.
 */
export function SavedPagesList() {
  const isMounted = useIsMounted()
  const now = useNow()
  const online = useOnline()
  const formatDate = useFormatDate()
  const { pages, remove } = useSavedPageList()

  if (!isMounted) return null

  if (pages.length === 0) {
    return (
      <p className="text-ink">
        Nothing is saved yet. Open a chart page and choose Save for offline, and
        its charts will be here, with no connection, for a week.
      </p>
    )
  }

  const total = pages.reduce((sum, page) => sum + page.bytes, 0)

  return (
    <>
      <p className="text-ink-soft mb-4 font-mono text-xs">
        {formatBytes(total)} on this device
      </p>
      <ul className="divide-rule border-rule divide-y border-y">
        {pages.map((page) => (
          <li
            key={page.path}
            className="flex items-center justify-between gap-4 py-4"
          >
            <div className="min-w-0">
              <Link
                href={page.path}
                prefetch={false}
                className="text-ink focus-visible:outline-cold font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {page.title}
              </Link>
              <p className="text-ink-soft font-mono text-xs">
                {page.issued !== undefined &&
                  `Issued ${formatDate(page.issued, 'EEE d MMM, h:mmaaa')} · `}
                {formatBytes(page.bytes)} · Checked{' '}
                {formatAge(now - page.refreshedAt)}
              </p>
              <FreshnessLine
                status={describeFreshness(freshness(page.issued, now), online)}
              />
            </div>
            <button
              type="button"
              aria-label={`Remove ${page.title}`}
              onClick={() => void remove(page.path)}
              className={actionClasses.secondary}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
