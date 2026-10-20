'use client'
import clsx from 'clsx'

import { useIsMounted } from '@/components/Hooks/useIsMounted'
import { chartPosition } from '@/shared/helpers/chartGeometry'
import { chartLabel } from '@/shared/helpers/pins/pins'
import type { RegionCode } from '@/shared/types/region'

import { usePins } from './usePins'

// Past this far across the chart, a name goes on the left of its ring: there is
// more room that way.
const FLIP_AFTER = 0.55

/**
 * The visitor's pins, marked on a region's chart: a small hollow ring where the
 * place is (so the chart shows through) with its name, or its label, beside it.
 * Drawn over the chart image, which it sits exactly on, so nothing moves; a pin
 * the chart does not show draws nothing.
 *
 * The chart image is light in both themes (charts cannot be recoloured), so the
 * marker uses fixed dark colours with a light edge, not the theme's. What is
 * pinned is only known in the browser, so nothing is drawn before the page is
 * running there. The Pins page lists the same pins in words, so these are not read
 * out.
 */
export function PinMarkers({ region }: { region: RegionCode }) {
  const isMounted = useIsMounted()
  const { pins } = usePins()
  if (!isMounted) return null

  const markers = pins.flatMap((pin) => {
    const position = chartPosition(region, pin.latitude, pin.longitude)
    return position ? [{ pin, position }] : []
  })
  if (markers.length === 0) return null

  return (
    <div
      aria-hidden="true"
      data-pin-markers
      className="pointer-events-none absolute inset-0"
    >
      {markers.map(({ pin, position }) => (
        <span
          key={pin.id}
          data-pin-marker
          data-pin-name={pin.name}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${position.x * 100}%`,
            top: `${position.y * 100}%`,
          }}
        >
          <span className="block size-3.5 rounded-full border-2 border-[#1b1740] shadow-[0_0_0_1.5px_rgba(255,255,255,0.9)]" />
          <span
            data-pin-label
            className={clsx(
              'absolute top-1/2 -translate-y-1/2 text-[11px] leading-none font-semibold whitespace-nowrap text-[#1b1740] [text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff,0_0_3px_#fff]',
              position.x > FLIP_AFTER ? 'right-full mr-2' : 'left-full ml-2',
            )}
          >
            {chartLabel(pin)}
          </span>
        </span>
      ))}
    </div>
  )
}
