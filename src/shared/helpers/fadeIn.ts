import clsx from 'clsx'
import { CSSProperties } from 'react'

const FADE_IN_COUNT = 3
const FADE_IN_STAGGER_MS = 100

/**
 * Props for a list item: an entrance fade for the first few, and deferred
 * rendering for the rest. Only the first few items fade in (CSS,
 * no JavaScript), so the initial HTML is never hidden waiting for hydration.
 * `motion-safe` skips it for people who prefer reduced motion.
 *
 * `aspect` is how tall the item's chart is for each unit of its width. While an
 * item is skipped it holds that much room (see `defer-offscreen`), so the page
 * does not jump when items above the screen are drawn.
 */
export function fadeInProps(
  index: number,
  className?: string,
  aspect?: number,
): { className: string; style?: CSSProperties } {
  // Below the first screen: no fade, and the browser may skip rendering the
  // item until it nears the viewport (see `defer-offscreen` in globals.css).
  if (index >= FADE_IN_COUNT) {
    return {
      className: clsx(className, 'defer-offscreen'),
      style:
        aspect === undefined
          ? undefined
          : ({ '--chart-aspect': String(aspect) } as CSSProperties),
    }
  }

  return {
    className: clsx(className, 'motion-safe:animate-fade-in-up'),
    style: { animationDelay: `${index * FADE_IN_STAGGER_MS}ms` },
  }
}
