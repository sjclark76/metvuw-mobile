'use client'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect } from 'react'

import { useTrackOnce } from '@/components/Analytics/useTrackOnce'
import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { track } from '@/shared/helpers/analytics/track'
import type { HeavyRain } from '@/shared/helpers/heavyRain'
import { chartLabel, type Pin } from '@/shared/helpers/pins/pins'

const SIX_HOURS = 6 * 60 * 60 * 1000
const MOST_SHOWN = 3
export interface PinHeavyRain {
  pin: Pin
  rain: HeavyRain
}

/**
 * A heads-up that heavy rain is ahead at the visitor's pins, from what the
 * forecast charts show there. It sits over the top of the page, under the
 * header, and scrolls away with the page rather than following it. It floats
 * rather than taking room: it is only known once the charts have been read, a
 * moment after the page has drawn, and pushing the page down then would move
 * what the visitor is reading. One line for each pin, each a link to the chart
 * where it happens. It stays while the rain is ahead, and is not dismissed.
 */
export function HeavyRainNote({
  found,
  times,
  onSeek,
}: {
  found: readonly PinHeavyRain[]
  times: readonly number[]
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
          detail: `20+ mm in the 6 hours to ${when(times[rain.to])}`,
        }
      : {
          title: `Heavy rain ahead at ${chartLabel(pin)}`,
          detail: `at least ${rain.atLeastMm} mm over the 24 hours from ${when(times[rain.from] - SIX_HOURS)}`,
        }

  const shown = found.slice(0, MOST_SHOWN)
  const more = found.length - shown.length

  return (
    <AnimatePresence initial>
      {showing && (
        <m.section
          key="heavy-rain"
          aria-label="Heavy rain ahead"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute inset-x-0 top-16 z-20 px-2 pt-2 lg:left-64 print:hidden"
        >
          <div className="bg-plate mx-auto flex max-w-176 items-start gap-3 rounded-lg border border-[#ff9a6b] p-3 shadow-lg">
            <span
              aria-hidden="true"
              className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#ff3f00]"
            />
            <div className="min-w-0 flex-1">
              <ul aria-live="polite" className="space-y-1.5">
                {shown.map((entry) => {
                  const { title, detail } = line(entry)
                  return (
                    <li key={entry.pin.id}>
                      <button
                        type="button"
                        onClick={() => {
                          track('heavy_rain_opened', {
                            level: entry.rain.level,
                          })
                          onSeek(entry.rain.from)
                        }}
                        className="text-ink focus-visible:outline-cold rounded-sm text-left text-sm leading-snug focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        <strong className="font-semibold">{title}:</strong>{' '}
                        <span className="underline underline-offset-2">
                          {detail}
                        </span>
                      </button>
                    </li>
                  )
                })}
                {more > 0 && (
                  <li className="text-ink-soft text-sm">and {more} more</li>
                )}
              </ul>
            </div>
          </div>
        </m.section>
      )}
    </AnimatePresence>
  )
}
