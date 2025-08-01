'use client'
import clsx from 'clsx'
import { useAtomValue } from 'jotai'

import { loadedImageStateAtom } from '@/app/regions/[name]/state'
import { isMenuOpenAtom } from '@/components/Atoms/GlobalState'

import { RefreshButton } from '../RefreshButton/RefreshButton'

export function SubHeader({ submenuText }: { submenuText: string }) {
  const menuOpen = useAtomValue(isMenuOpenAtom)
  const loadedImageState = useAtomValue(loadedImageStateAtom)

  const loadedCount = Array.from(loadedImageState.values()).filter(
    Boolean,
  ).length
  const totalCount = loadedImageState.size
  const progress = totalCount > 0 ? (loadedCount / totalCount) * 100 : 0

  const styling = clsx(
    // For screen: apply sticky positioning with a z-index.
    // For print: override to use static positioning, removing sticky behavior.
    'sticky print:static z-10 print:z-auto',
    menuOpen && 'top-[29rem]',
    !menuOpen && 'top-16',
  )
  return (
    <div className={styling}>
      <div className="w-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-1 bg-sky-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="relative flex h-14 items-center justify-center bg-gray-50 px-4 filter dark:bg-stone-700">
        <h1 className="text-center text-sm font-medium text-gray-800 dark:text-stone-100">
          {submenuText}
        </h1>
        <div className="absolute top-1/2 right-4 -translate-y-1/2 transform">
          <RefreshButton />
        </div>
      </div>
    </div>
  )
}
