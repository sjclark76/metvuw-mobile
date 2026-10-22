'use client'

import { track } from '@/shared/helpers/analytics/track'

import { RefreshIcon } from '../icons/RefreshIcon'

export const RefreshButton = () => {
  const handleRefresh = () => {
    // A beacon, so the count is sent even as the page goes away.
    track('refresh_pressed', { transport_type: 'beacon' })
    window.location.reload()
  }

  return (
    <button
      onClick={handleRefresh}
      className="bg-plate text-ink-soft ring-ink/10 hover:bg-paper focus-visible:outline-cold flex h-9 w-9 items-center justify-center rounded-full shadow-sm ring-1 focus-visible:outline-2"
      aria-label="Refresh page"
    >
      <RefreshIcon className="h-6 w-6" />
    </button>
  )
}
