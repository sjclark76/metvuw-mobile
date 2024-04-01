'use client'
import clsx from 'clsx'
import { useAtomValue } from 'jotai'

import { isMenuOpenAtom, submenuTextAtom } from '@/components/Atoms/GlobalState'

export function SubHeader() {
  const submenuText = useAtomValue(submenuTextAtom)
  const menuOpen = useAtomValue(isMenuOpenAtom)

  const styling = clsx(
    'sticky  z-50',
    menuOpen && 'top-[29rem]',
    !menuOpen && 'top-16',
  )
  return (
    <div className={styling}>
      <div className="flex flex-row justify-center">
        <div className="w-full bg-gray-50  px-2 filter ">
          <h1 className="my-4 text-center text-sm font-medium text-gray-800 ">
            {submenuText}
          </h1>
        </div>
      </div>
    </div>
  )
}
