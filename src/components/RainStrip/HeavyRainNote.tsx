'use client'
import { useEffect } from 'react'

import { useTrackOnce } from '@/components/Analytics/useTrackOnce'
import { useAnimation } from '@/components/Animation/Animation'
import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { useIsMounted } from '@/components/Hooks/useIsMounted'
import { track } from '@/shared/helpers/analytics/track'
import type { HeavyRain } from '@/shared/helpers/heavyRain'
import { chartLabel, type Pin } from '@/shared/helpers/pins/pins'

import { useRainWatch } from './RainWatch'

const SIX_HOURS = 6 * 60 * 60 * 1000
const MOST_SHOWN = 3

export interface PinHeavyRain {
  pin: Pin
  rain: HeavyRain
}

const band =
  'flex min-h-11 items-center gap-3 border-l-4 bg-plate px-3 py-2.5 text-sm leading-snug'

/**
 * What the forecast charts show at the visitor's pins, in a band under the top of
 * the page: heavy rain ahead, one line for each pin and each a link to the chart
 * where it happens; or, until every chart has been read and when none shows any,
 * a quiet line saying so. It is in the page and scrolls away with it, and it is
 * always the same height for a visitor with pins, which the page holds room for
 * from its first paint (`data-heavy-rain-slot`, see Settings/layoutScript), so it
 * is neither missed nor moves the page when the charts have been read.
 */
export function HeavyRainNote({
  found,
  times,
  watching,
  checked,
  onSeek,
}: {
  found: readonly PinHeavyRain[]
  times: readonly number[]
  /** Whether there are pins on this chart, and warnings are on. */
  watching: boolean
  /** Whether every chart has been read at those pins. */
  checked: boolean
  onSeek: (index: number) => void
}) {
  const formatDate = useFormatDate()
  const trackOnce = useTrackOnce()
  const showing = found.length > 0
  const strongest = found.some((f) => f.rain.level === 'veryHeavy')
    ? 'veryHeavy'
    : 'heavy'
  useEffect(() => {
    if (showing) trackOnce('heavy_rain_shown', { level: strongest })
  }, [showing, strongest, trackOnce])

  const when = (time: number) => formatDate(time, 'EEE h:mmaaa')
  const line = ({ pin, rain }: PinHeavyRain) =>
    rain.level === 'veryHeavy'
      ? {
          title: `Very heavy rain ahead at ${chartLabel(pin)}`,
          detail: `20+ mm in the 6 hours from ${when(times[rain.to] - SIX_HOURS)}`,
        }
      : {
          title: `Heavy rain ahead at ${chartLabel(pin)}`,
          detail: `at least ${rain.atLeastMm} mm over the 24 hours from ${when(times[rain.from] - SIX_HOURS)}`,
        }

  if (!watching) return null

  const shown = found.slice(0, MOST_SHOWN)
  const more = found.length - shown.length

  return (
    <>
      {showing ? (
        <section
          aria-label="Heavy rain ahead"
          className={`${band} border-[#ff3f00]`}
        >
          <ul aria-live="polite" className="space-y-1.5">
            {shown.map((entry) => {
              const { title, detail } = line(entry)
              return (
                <li key={entry.pin.id}>
                  <button
                    type="button"
                    onClick={() => {
                      track('heavy_rain_opened', { level: entry.rain.level })
                      onSeek(entry.rain.from)
                    }}
                    className="text-ink focus-visible:outline-cold rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <strong className="font-semibold">{title}:</strong>{' '}
                    <span className="underline underline-offset-2">
                      {detail}
                    </span>
                  </button>
                </li>
              )
            })}
            {more > 0 && <li className="text-ink-soft">and {more} more</li>}
          </ul>
        </section>
      ) : (
        <p role="status" className={`${band} border-rule text-ink-soft`}>
          {checked
            ? 'No heavy rain ahead at your places'
            : 'Checking rain at your places…'}
        </p>
      )}
    </>
  )
}

/**
 * The note's place on a chart page, with the note in it: it takes the viewer to
 * the chart. The place is drawn by the server and is shown, with room for the
 * band, only for a visitor with pins (the page says so before it first paints);
 * once the page is running here and finds nothing to watch it is hidden again.
 */
export function HeavyRainSlot() {
  const mounted = useIsMounted()
  const { heavyRain, watching, checked } = useRainWatch()
  const { times, seek } = useAnimation()
  return (
    <div
      data-heavy-rain-slot
      style={mounted && !watching ? { display: 'none' } : undefined}
      className="mx-auto mt-3 max-w-176 px-4 md:px-0 print:hidden"
    >
      <HeavyRainNote
        found={heavyRain}
        times={times}
        watching={watching}
        checked={checked}
        onSeek={(index) => {
          seek(index)
          document
            .querySelector(`[data-chart-index="${index}"]`)
            ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        }}
      />
    </div>
  )
}
