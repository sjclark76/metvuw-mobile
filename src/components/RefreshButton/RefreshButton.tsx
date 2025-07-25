'use client'

import { RefreshIcon } from '../icons/RefreshIcon'

export const RefreshButton = () => {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <button
      onClick={handleRefresh}
      className="hidden h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 shadow-sm hover:bg-gray-200 focus:outline-none md:flex dark:bg-stone-600 dark:text-stone-200 dark:hover:bg-stone-500"
      aria-label="Refresh page"
    >
      <RefreshIcon className="h-6 w-6" />
    </button>
  )
}
