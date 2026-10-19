'use client'
import { RefObject, useEffect, useRef, useState } from 'react'

/**
 * The width of an element, kept up to date as it is resized. `fallback` is what
 * it reports until the element has been measured (and where the browser cannot
 * watch for resizes), so the first render needs no guess at the screen size.
 */
export function useElementWidth<T extends HTMLElement>(
  fallback = 0,
): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return

    const measure = () => setWidth(element.clientWidth || fallback)
    const watcher = new ResizeObserver(measure)
    watcher.observe(element)
    measure()
    return () => watcher.disconnect()
  }, [fallback])

  return [ref, width]
}
