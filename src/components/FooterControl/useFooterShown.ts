'use client'
import { useEffect } from 'react'

// How far down the page the top of it has to be to count as scrolled off: the
// height of the bar across the top, which is over the page.
const BAR_PX = 64

/**
 * Tells the page whether the footer is wanted: `data-footer-shown` on the page's
 * root, which the stylesheet uses, on small screens, to slide the footer out of
 * sight (and take its height out of what sits above it) until it is. It is wanted
 * once the top of the page (`PageTopEnd`) has scrolled up under the bar, whenever
 * the animated viewer is open (its controls are the footer), and on a page that
 * has no such mark. Before this runs the stylesheet hides it, which is also how
 * the page begins, so it does not appear and then go.
 *
 * Using the footer keeps it up. Dragging the time axis back to the first chart
 * scrolls the page to the top, which would take the footer from under the
 * finger; so once it has been touched it stays until the visitor takes hold of
 * the page itself (a touch, the wheel or a key anywhere but on it).
 *
 * An attribute rather than state: the stylesheet decides on which screens it
 * applies, and nothing needs rendering again when it changes.
 */
export function useFooterShown({ viewerOpen }: { viewerOpen: boolean }) {
  useEffect(() => {
    const root = document.documentElement
    const set = (shown: boolean) =>
      shown
        ? root.setAttribute('data-footer-shown', '')
        : root.removeAttribute('data-footer-shown')

    const end = document.querySelector('[data-page-top-end]')
    if (viewerOpen || !end || typeof IntersectionObserver === 'undefined') {
      set(true)
      return () => root.removeAttribute('data-footer-shown')
    }

    let wanted = false
    let holding = false
    const apply = () => set(wanted || holding)
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Above the bar, as opposed to still below it or across it.
        wanted = !entry.isIntersecting && entry.boundingClientRect.top < BAR_PX
        apply()
      },
      { rootMargin: `-${BAR_PX}px 0px 0px 0px` },
    )
    const inFooter = (event: Event) =>
      event.target instanceof Element && !!event.target.closest('[data-footer]')
    const hold = (event: Event) => {
      if (!inFooter(event)) return
      holding = true
      apply()
    }
    const release = (event: Event) => {
      if (!holding || inFooter(event)) return
      holding = false
      apply()
    }
    document.addEventListener('pointerdown', hold, true)
    document.addEventListener('keydown', hold, true)
    for (const name of ['touchstart', 'wheel', 'keydown'])
      document.addEventListener(name, release, { capture: true, passive: true })
    observer.observe(end)
    return () => {
      observer.disconnect()
      document.removeEventListener('pointerdown', hold, true)
      document.removeEventListener('keydown', hold, true)
      for (const name of ['touchstart', 'wheel', 'keydown'])
        document.removeEventListener(name, release, true)
      root.removeAttribute('data-footer-shown')
    }
  }, [viewerOpen])
}
