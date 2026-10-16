'use client'

import { Provider } from 'jotai'
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react'
import { ReactNode } from 'react'

/**
 * The client-side providers for every page, kept out of the root layout so the
 * layout itself stays a server component.
 *
 * `LazyMotion` loads only the animation features the app uses, and `strict`
 * makes the full `motion` component throw: use `m` from 'motion/react-m'.
 * `MotionConfig` honours prefers-reduced-motion: motion skips transform and
 * layout animations for visitors who ask for less movement.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <Provider>{children}</Provider>
      </MotionConfig>
    </LazyMotion>
  )
}
