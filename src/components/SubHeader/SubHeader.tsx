'use client'
import clsx from 'clsx'
import { useAtomValue } from 'jotai'

import { isMenuOpenAtom } from '@/components/Atoms/GlobalState'

export function SubHeader({ submenuText }: { submenuText: string }) {
  const menuOpen = useAtomValue(isMenuOpenAtom)

  const styling = clsx(
    'sticky  z-10',
    menuOpen && 'top-[29rem]',
    !menuOpen && 'top-16',
  )
  return (
    <div className={styling}>
      <div className="flex flex-row justify-center">
        <div className="w-full bg-gray-50 px-2 filter dark:bg-stone-700">
          <h1 className="my-4 text-center text-sm font-medium text-gray-800 dark:text-stone-100">
            {submenuText}
          </h1>
        </div>
      </div>
    </div>
  )
}
