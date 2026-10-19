'use client'
import clsx from 'clsx'
import { useAtomValue } from 'jotai'
import { ReactNode } from 'react'

import { isMenuOpenAtom } from '@/components/Atoms/GlobalState'
import { useImageProgress } from '@/components/ImageProgress/ImageProgress'

import { RefreshButton } from '../RefreshButton/RefreshButton'

/**
 * The top of a chart page: what it shows (`title`, the page's one heading), a
 * small label for the kind of chart (`eyebrow`) and a plain line of detail such
 * as when the forecast was issued. A thin line under it fills as the charts
 * load, and stays pinned under the navigation bar while scrolling.
 */
export function SubHeader({
  title,
  eyebrow,
  detail,
}: {
  title: string
  eyebrow?: string
  detail?: ReactNode
}) {
  const menuOpen = useAtomValue(isMenuOpenAtom)
  const progress = useImageProgress()

  const progressStyling = clsx(
    // For screen: pin under the navigation bar. For print: stay in the flow.
    'sticky print:static z-10 print:z-auto',
    menuOpen && 'top-[29rem]',
    !menuOpen && 'top-16',
  )

  return (
    <div>
      <div className="relative mx-auto max-w-176 px-4 pt-5 pb-3 md:px-0">
        {eyebrow && (
          <p className="text-ink-soft font-mono text-xs tracking-[0.12em] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-ink mt-2 mb-2 text-[clamp(2.6rem,11vw,4rem)] leading-[0.95] font-bold tracking-[0.015em] uppercase">
          {title}
        </h1>
        {detail && (
          <p className="text-ink-soft font-mono text-sm leading-normal">
            {detail}
          </p>
        )}
        <div className="absolute top-4 right-4 md:right-0">
          <RefreshButton />
        </div>
      </div>
      <div className={progressStyling}>
        <div className="bg-rule mx-auto h-0.5 max-w-176">
          <div
            className="bg-ink h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
