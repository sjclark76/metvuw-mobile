'use client'
import { useEffect } from 'react'

import { track } from '@/shared/helpers/analytics/track'

const KEY = 'appOpenedTracked'

/**
 * Counts a visit made from the installed app (a home screen icon) as opposed to
 * a browser tab, once per visit. Renders nothing.
 */
export function AppOpenedTracker() {
  useEffect(() => {
    const installed =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (!installed) return
    try {
      if (sessionStorage.getItem(KEY)) return
      sessionStorage.setItem(KEY, '1')
    } catch {
      // No session storage: count it, rather than not at all.
    }
    track('app_opened_installed')
  }, [])
  return null
}
