'use client'

import { useEffect, useRef, useState } from 'react'

// The slice of `window.serwist` (a @serwist/window Serwist, created by
// @serwist/next) that this component uses. It does not exist in development,
// where the service worker is disabled.
type SerwistWindow = {
  register: () => void
  messageSkipWaiting: () => void
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

/**
 * Registers the service worker and offers a reload when a new version is ready.
 *
 * A new worker waits instead of taking over, so open tabs keep running the JS
 * they loaded. "Reload" asks it to activate and reloads once it controls the
 * page; "Later" leaves it waiting until the next visit.
 */
export function UpdateNotification({
  reload = () => window.location.reload(),
}: {
  reload?: () => void
}) {
  const [updateReady, setUpdateReady] = useState(false)
  const reloadRequested = useRef(false)
  // Held in a ref so a new `reload` function never re-runs the effect below.
  const reloadRef = useRef(reload)
  useEffect(() => {
    reloadRef.current = reload
  })

  useEffect(() => {
    const serwist = (window as Window & { serwist?: SerwistWindow }).serwist
    if (!serwist) return

    const onWaiting = () => setUpdateReady(true)
    // Only reload for the update the visitor asked for, not for the first
    // worker claiming a page that had none.
    const onControlling = () => {
      if (reloadRequested.current) reloadRef.current()
    }
    serwist.addEventListener('waiting', onWaiting)
    serwist.addEventListener('controlling', onControlling)
    serwist.register()

    return () => {
      serwist.removeEventListener('waiting', onWaiting)
      serwist.removeEventListener('controlling', onControlling)
    }
  }, [])

  if (!updateReady) return null

  const applyUpdate = () => {
    reloadRequested.current = true
    ;(
      window as Window & { serwist?: SerwistWindow }
    ).serwist?.messageSkipWaiting()
  }

  return (
    <div
      role="status"
      className="fixed inset-x-2 bottom-24 z-40 mx-auto flex max-w-md flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white p-3 text-gray-800 shadow-lg dark:border-slate-600 dark:bg-stone-700 dark:text-stone-100 print:hidden"
    >
      <p className="font-medium">A new version is available.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setUpdateReady(false)}
          className="inline-flex min-h-11 items-center justify-center rounded border border-gray-400 px-4 font-semibold hover:bg-gray-100 dark:hover:bg-stone-600"
        >
          Later
        </button>
        <button
          type="button"
          onClick={applyUpdate}
          className="inline-flex min-h-11 items-center justify-center rounded bg-sky-700 px-4 font-semibold text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          Reload
        </button>
      </div>
    </div>
  )
}
