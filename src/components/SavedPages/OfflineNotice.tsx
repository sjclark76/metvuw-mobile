'use client'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'

import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { useIsMounted } from '@/components/Hooks/useIsMounted'
import { useNow } from '@/components/Hooks/useNow'
import { useOnline } from '@/components/Hooks/useOnline'
import { formatAge } from '@/shared/helpers/offline/format'

import { useSavedPageList } from './useSavedPages'

// A forecast older than this is out of date: charts are issued every few hours,
// and weather changes. Someone relying on it should be told.
const OUT_OF_DATE_AFTER_MS = 24 * 60 * 60 * 1000

/**
 * Shown on a saved page while there is no connection. It says how old what is on
 * screen is, and warns when the forecast is out of date: a saved chart looks
 * exactly like a current one, and someone in the backcountry may be deciding what
 * to do by it.
 */
export function OfflineNotice() {
  const path = usePathname()
  const isMounted = useIsMounted()
  const online = useOnline()
  const now = useNow()
  const formatDate = useFormatDate()
  const { pages } = useSavedPageList()

  if (!isMounted || online || !path) return null

  // Only for a page that was saved: that is the one whose age matters. Anything
  // else shown offline is the offline page itself, or what was merely viewed.
  const saved = pages.find((page) => page.path === path)
  if (!saved) return null
  const outOfDate =
    saved.issued !== undefined && now - saved.issued > OUT_OF_DATE_AFTER_MS

  return (
    <div
      role="status"
      className={clsx(
        'bg-plate text-ink mx-auto mt-3 max-w-176 border-l-4 px-4 py-3 text-sm md:px-4',
        outOfDate ? 'border-warm' : 'border-ink',
      )}
    >
      <p className="font-semibold">You&apos;re offline.</p>
      <p>Charts saved {formatAge(now - saved.refreshedAt)}.</p>
      {saved.issued !== undefined && (
        <p className="text-ink-soft font-mono text-xs">
          Forecast issued {formatDate(saved.issued, 'EEE d MMM, h:mmaaa')} (
          {formatAge(now - saved.issued)}).
        </p>
      )}
      {outOfDate && (
        <p className="mt-1 font-semibold">
          Out of date. Conditions may have changed.
        </p>
      )}
    </div>
  )
}
