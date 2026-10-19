'use client'
import { useCallback, useEffect, useRef } from 'react'

// The page scrolls itself to a chart it was sent to, passing every chart on the
// way. For this long after sending it, the page's own position is not news.
const SCROLL_SETTLE_MS = 900
// A drag asks for a new chart many times a second. Asks closer together than
// this are a drag: the page jumps instead of gliding to each one in turn.
const DRAG_GAP_MS = 400
const POLL_MS = 16
// The list is not on the page for a moment after the viewer closes.
const GIVE_UP_AFTER_MS = 1500

const chartElement = (index: number) =>
  document.querySelector<HTMLElement>(`[data-chart-index="${index}"]`)

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Keeps the footer's time axis and the list of charts in step. While the list
 * is showing, the chart nearest the middle of the screen is reported, so the
 * handle follows as you scroll; `scrollToChart` does the reverse for a drag on
 * the axis. Returning from the viewer scrolls the list back to where you were.
 *
 * Charts mark themselves with `data-chart-index`.
 */
export function useChartScrollSync({
  enabled,
  index,
  onIndex,
}: {
  /** True while the list is showing (the viewer is closed). */
  enabled: boolean
  index: number
  onIndex: (index: number) => void
}) {
  const ignoreUntil = useRef(0)
  const lastScrollAt = useRef(0)
  const latest = useRef({ index, onIndex })
  useEffect(() => {
    latest.current = { index, onIndex }
  })

  const scrollToChart = useCallback(
    (target: number, behavior?: 'auto' | 'smooth') => {
      const element = chartElement(target)
      if (!element) return
      const now = Date.now()
      const dragging = now - lastScrollAt.current < DRAG_GAP_MS
      lastScrollAt.current = now
      ignoreUntil.current = now + SCROLL_SETTLE_MS
      element.scrollIntoView({
        block: 'start',
        behavior:
          behavior ?? (prefersReducedMotion() || dragging ? 'auto' : 'smooth'),
      })
    },
    [],
  )

  // Follow the page.
  useEffect(() => {
    // Without it the axis still works; it just does not follow the scrolling.
    if (!enabled || typeof IntersectionObserver === 'undefined') return

    let observer: IntersectionObserver | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let waited = 0

    const attach = () => {
      const elements =
        document.querySelectorAll<HTMLElement>('[data-chart-index]')
      if (elements.length === 0) {
        waited += POLL_MS
        if (waited < GIVE_UP_AFTER_MS) timer = setTimeout(attach, POLL_MS)
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          if (Date.now() < ignoreUntil.current) return
          const mostVisible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
          if (mostVisible) {
            latest.current.onIndex(
              Number((mostVisible.target as HTMLElement).dataset.chartIndex),
            )
          }
        },
        // A thin band across the middle of the screen: the chart in it is "the
        // chart you are looking at".
        { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.5, 1] },
      )
      elements.forEach((element) => observer!.observe(element))
    }
    attach()

    return () => {
      clearTimeout(timer)
      observer?.disconnect()
    }
  }, [enabled])

  // Come back to where you were when the viewer closes.
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (!enabled || latest.current.index === 0) return

    let timer: ReturnType<typeof setTimeout> | undefined
    let waited = 0
    const restore = () => {
      if (chartElement(latest.current.index)) {
        scrollToChart(latest.current.index, 'auto')
        return
      }
      waited += POLL_MS
      if (waited < GIVE_UP_AFTER_MS) timer = setTimeout(restore, POLL_MS)
    }
    restore()

    return () => clearTimeout(timer)
  }, [enabled, scrollToChart])

  return { scrollToChart }
}
