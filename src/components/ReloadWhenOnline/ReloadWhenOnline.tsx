'use client'

import { useEffect } from 'react'

/**
 * Reloads the page once connectivity returns. The offline page is served in
 * place of whatever page was requested, so a reload fetches that page for real.
 */
export function ReloadWhenOnline({
  reload = () => window.location.reload(),
}: {
  reload?: () => void
}) {
  useEffect(() => {
    window.addEventListener('online', reload)
    return () => window.removeEventListener('online', reload)
  }, [reload])

  return null
}
