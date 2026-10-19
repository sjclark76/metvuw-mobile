'use client'
import { useStore } from 'jotai'
import { useEffect } from 'react'

import { browserDependencies, supportsSavingPages } from './browserDependencies'
import { syncSavedPages } from './syncSavedPages'

// Coming back to the app only checks again after this long: switching between
// apps all day should not be a request each time.
const REVISIT_INTERVAL_MS = 5 * 60 * 1000

/**
 * Keeps the saved pages current: when the app opens, when the connection comes
 * back, and when the visitor returns to it. Renders nothing.
 */
export function SavedPagesSync() {
  const store = useStore()

  useEffect(() => {
    if (!supportsSavingPages()) return

    let running = false
    let lastRun = Number.NEGATIVE_INFINITY

    const run = async (always: boolean) => {
      if (running || !navigator.onLine) return
      if (!always && Date.now() - lastRun < REVISIT_INTERVAL_MS) return
      running = true
      lastRun = Date.now()
      try {
        await syncSavedPages(store, browserDependencies())
      } catch {
        // Offline again, or storage trouble: the next trigger tries again.
      } finally {
        running = false
      }
    }

    const onOnline = () => void run(true)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void run(false)
    }

    void run(true)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [store])

  return null
}
