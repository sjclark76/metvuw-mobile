import clsx from 'clsx'
import { CSSProperties } from 'react'

const FADE_IN_COUNT = 3
const FADE_IN_STAGGER_MS = 100

/**
 * Props for a list item's entrance fade. Only the first few items fade in (CSS,
 * no JavaScript), so the initial HTML is never hidden waiting for hydration.
 * `motion-safe` skips it for people who prefer reduced motion.
 */
export function fadeInProps(
  index: number,
  className?: string,
): { className: string; style?: CSSProperties } {
  if (index >= FADE_IN_COUNT) return { className: clsx(className) }

  return {
    className: clsx(className, 'motion-safe:animate-fade-in-up'),
    style: { animationDelay: `${index * FADE_IN_STAGGER_MS}ms` },
  }
}
