import { useEffect, useState } from 'react'

export type Presence = 'shown' | 'leaving' | 'gone'

/**
 * Keeps something on the page for `exitMs` after it is closed, so it can play a
 * CSS exit animation before it goes. Opening shows it at once.
 *
 * 'shown' while open, 'leaving' for `exitMs` after it closes (give it the exit
 * animation), then 'gone' (render nothing).
 */
export function usePresence(show: boolean, exitMs: number): Presence {
  const [mounted, setMounted] = useState(show)

  // Mounted the moment it opens, in the same render, rather than a render later.
  if (show && !mounted) setMounted(true)

  useEffect(() => {
    if (show || !mounted) return
    const timer = setTimeout(() => setMounted(false), exitMs)
    return () => clearTimeout(timer)
  }, [show, mounted, exitMs])

  if (show) return 'shown'
  return mounted ? 'leaving' : 'gone'
}
