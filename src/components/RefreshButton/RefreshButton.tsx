'use client'

import { useIsStandalone } from '../Hooks/useIsStandalone'
import { RefreshIcon } from '../icons/RefreshIcon'

export const RefreshButton = () => {
  const isStandalone = useIsStandalone()

  const handleRefresh = () => {
    window.location.reload()
  }

  if (!isStandalone) {
    return null
  }

  return (
    <button
      onClick={handleRefresh}
      className="hidden h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 shadow-sm hover:bg-gray-200 focus:outline-none dark:bg-stone-600 dark:text-stone-200 dark:hover:bg-stone-500 md:flex"
      aria-label="Refresh page"
    >
      <RefreshIcon className="h-6 w-6" />
    </button>
  )
}
