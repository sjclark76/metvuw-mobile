import { useSyncExternalStore } from 'react'

/** The width from which the menu is a column down the side (Tailwind's `lg`). */
const QUERY = '(min-width: 1024px)'

// A browser without media queries (and a test's fake one) is not wide.
const query = () =>
  typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : undefined

const subscribe = (onChange: () => void) => {
  const list = query()
  list?.addEventListener('change', onChange)
  return () => list?.removeEventListener('change', onChange)
}

/**
 * Whether the screen is wide enough for the side menu. False while the page is
 * rendered ahead of time and while it hydrates, so what React hydrates matches what
 * the host rendered; the real answer follows straight after. Only for behaviour,
 * never for what is drawn: that is the stylesheet's job, which has no such wait.
 */
export function useIsWide(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => query()?.matches ?? false,
    () => false,
  )
}
