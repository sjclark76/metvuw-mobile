import { useSyncExternalStore } from 'react'

/**
 * The current time (epoch ms), updated every `intervalMs` and rounded down to it,
 * so a component that shows "3 hours ago" stays right without a timer of its own.
 * Zero while the page is rendered ahead of time and hydrating: the host's clock
 * is not the visitor's, and the real time follows straight after.
 */
export function useNow(intervalMs = 60 * 1000): number {
  return useSyncExternalStore(
    (onChange) => {
      const timer = setInterval(onChange, intervalMs)
      return () => clearInterval(timer)
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => 0,
  )
}
