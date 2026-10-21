'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** A page loaded longer ago than this is refreshed when the visitor comes back to it. */
export const STALE_AFTER_MS = 30 * 60 * 1000

/**
 * Brings a page up to date when the visitor returns to the app. An installed app
 * that is switched away from is suspended and, when it is opened again, shows the
 * page exactly as it was (no reload), so after a night in the background it still
 * shows yesterday's charts. When the app is visible again, or restored from the
 * back/forward cache, a page last loaded over half an hour ago has its data
 * fetched again: the place on the page and anything open are kept.
 *
 * Going to another page loads it afresh, so that starts the half hour again.
 * Renders nothing.
 */
export function RefreshWhenStale() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let loadedAt = Date.now()

    const refreshIfStale = () => {
      if (Date.now() - loadedAt < STALE_AFTER_MS) return
      loadedAt = Date.now()
      router.refresh()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshIfStale()
    }
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) refreshIfStale()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
    }
    // `pathname` is here to start the half hour again on another page.
  }, [router, pathname])

  return null
}
