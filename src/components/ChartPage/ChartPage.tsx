'use client'
import { ReactNode } from 'react'

import { AnimationProvider } from '@/components/Animation/Animation'
import { FooterControl } from '@/components/FooterControl'
import { PageTopEnd } from '@/components/FooterControl/PageTopEnd'
import { ImageProgressProvider } from '@/components/ImageProgress/ImageProgress'
import { expectedLoadedImages } from '@/shared/helpers/imageLoading'

/**
 * What every page of charts shares: the loading progress (counting only the
 * eagerly loaded charts), the animation over the charts' times, and a layout at
 * least as tall as the screen under the navbar, with the footer at its foot.
 */
export function ChartPage({
  times,
  intervalMs,
  header,
  legend,
  footer = <FooterControl />,
  within = (layout) => layout,
  children,
}: {
  /** When each chart is for (epoch ms), in page order: the footer's time axis. */
  times: number[]
  /** How long the animation shows each chart. */
  intervalMs: number
  /** Above the charts: the page's title, and anything that goes with it. */
  header: ReactNode
  /** The chart's key, between the charts and the footer. */
  legend?: ReactNode
  footer?: ReactNode
  /** Wraps the layout in providers that need the animation, which is set up here. */
  within?: (layout: ReactNode) => ReactNode
  /** The charts. */
  children: ReactNode
}) {
  return (
    <ImageProgressProvider expected={expectedLoadedImages(times.length)}>
      <AnimationProvider
        count={times.length}
        times={times}
        intervalMs={intervalMs}
      >
        {within(
          <div className="flex min-h-[calc(100vh-4rem)] flex-col">
            {/* The page's content grows to fill the space above the footer. */}
            <div className="flex flex-grow flex-col">
              {header}
              <PageTopEnd />
              {children}
            </div>
            {legend}
            {footer}
          </div>,
        )}
      </AnimationProvider>
    </ImageProgressProvider>
  )
}
