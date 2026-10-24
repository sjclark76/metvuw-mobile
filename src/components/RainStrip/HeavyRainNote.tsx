'use client'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect, useState } from 'react'

import { useTrackOnce } from '@/components/Analytics/useTrackOnce'
import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { track } from '@/shared/helpers/analytics/track'
import type { HeavyRain } from '@/shared/helpers/heavyRain'
import { chartLabel, type Pin } from '@/shared/helpers/pins/pins'

const SIX_HOURS = 6 * 60 * 60 * 1000
const MOST_SHOWN = 3
const DISMISSED_KEY = 'heavyRainDismissed'
// Only the forecasts closed lately are worth remembering.
const DISMISSED_KEPT = 30

export interface PinHeavyRain {
  pin: Pin
  rain: HeavyRain
}

function readDismissed(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]')
    return Array.isArray(value)
      ? value.filter((v) => typeof v === 'string')
      : []
  } catch {
    return []
  }
}

function rememberDismissed(key: string) {
  try {
    const kept = [key, ...readDismissed().filter((k) => k !== key)]
    localStorage.setItem(
      DISMISSED_KEY,
      JSON.stringify(kept.slice(0, DISMISSED_KEPT)),
    )
  } catch {
    // Not remembered: it shows again next time, which is no harm.
  }
}

/**
 * A heads-up that heavy rain is ahead at the visitor's pins, from what the
 * forecast charts show there. It slides in over the top of the page, under the
 * header, rather than taking room in it: it is only known once the charts have
 * been read, a moment after the page has drawn, and pushing the page down then
 * would move what the visitor is reading. One line for each pin, each a link to
 * the chart where it happens; closing it hides it until the next forecast.
 *
 * Our own wording and thresholds, said plainly as not a MetService warning.
 */
export function HeavyRainNote({
  found,
  times,
  forecastKey,
  onSeek,
}: {
  found: readonly PinHeavyRain[]
  times: readonly number[]
  /** Names this forecast for this page, so closing it lasts until the next. */
  forecastKey: string
  onSeek: (index: number) => void
}) {
  const formatDate = useFormatDate()
  const trackOnce = useTrackOnce()
  const [dismissed, setDismissed] = useState<string[] | null>(null)
  useEffect(() => {
    // localStorage is only there in the browser, after the page has come alive.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(readDismissed())
  }, [])

  const showing =
    dismissed !== null && found.length > 0 && !dismissed.includes(forecastKey)
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
          className="fixed inset-x-0 top-16 z-20 px-2 pt-2 lg:left-64 print:hidden"
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
            <button
              type="button"
              aria-label="Close the heavy rain note"
              onClick={() => {
                track('heavy_rain_closed')
                rememberDismissed(forecastKey)
                setDismissed((current) => [forecastKey, ...(current ?? [])])
              }}
              className="text-ink-soft hover:text-ink focus-visible:outline-cold -m-1 grid size-9 shrink-0 place-items-center rounded focus-visible:outline-2"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </m.section>
      )}
    </AnimatePresence>
  )
}
