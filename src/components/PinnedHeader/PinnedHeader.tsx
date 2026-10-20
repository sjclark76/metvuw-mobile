'use client'
import { ReactNode, useEffect, useRef } from 'react'

/**
 * The bar across the top of every page. It is fixed to the top of the screen
 * rather than sticky: on an iPhone a sticky bar is put in place a frame behind a
 * large scroll, so jumping the page by the time slider made it flash, most when
 * going back up. A fixed bar is placed with the page's own layer and does not.
 *
 * A fixed bar takes no room, so a gap of the same height keeps the page below it.
 * It is the bar's usual 4rem until the bar is measured, so nothing moves, and it
 * then follows the bar, which grows when the mobile menu opens (as the sticky one
 * always did, pushing the page down).
 */
export function PinnedHeader({ children }: { children: ReactNode }) {
  const headerRef = useRef<HTMLElement>(null)
  const gapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const header = headerRef.current
    const gap = gapRef.current
    if (!header || !gap || typeof ResizeObserver === 'undefined') return

    // Written straight to the element, not through React state: this runs before
    // the frame is drawn, so the page never shows a gap that is out of date.
    const follow = () => {
      gap.style.height = `${header.getBoundingClientRect().height}px`
    }
    const observer = new ResizeObserver(follow)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <header
        ref={headerRef}
        className="bg-bar fixed inset-x-0 top-0 z-30 print:hidden"
      >
        {children}
      </header>
      <div ref={gapRef} aria-hidden="true" className="h-16 print:hidden" />
    </>
  )
}
