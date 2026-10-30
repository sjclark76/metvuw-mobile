'use client'
import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { chartLabel } from '@/shared/helpers/pins/pins'
import {
  nearestChartIndex,
  type PinAlert,
} from '@/shared/helpers/warnings/alertsForPins'

import { band, MOST_SHOWN } from './band'

/** "A", "A and B", "A, B and C". */
const joinNames = (names: string[]) =>
  names.length < 2
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`

const action =
  'text-ink focus-visible:outline-cold rounded-sm underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2'

/**
 * MetService's alerts for the visitor's pins, worst first: they are official, so
 * they come above what the charts say. Each has a button to the forecast chart
 * nearest its time (its start, or now if it is under way), and a link to the
 * original alert on MetService's site. Shows nothing without alerts.
 */
export function AlertLines({
  alerts,
  times,
  onSeek,
}: {
  alerts: readonly PinAlert[]
  /** When each chart on the page is for. */
  times: readonly number[]
  /** Shows a chart: its index in `times`. */
  onSeek: (index: number) => void
}) {
  const formatDate = useFormatDate()
  if (alerts.length === 0) return null

  const shown = alerts.slice(0, MOST_SHOWN)
  const more = alerts.length - shown.length
  const when = (time: number) => formatDate(time, 'EEE h:mmaaa')

  return (
    <section aria-label="Weather alerts" className="mb-2">
      {/* Side by side where there is room, stacked on a phone; blocks in a row are as tall as each other. */}
      <ul aria-live="polite" className="grid gap-2 md:grid-cols-2">
        {shown.map(({ alert, pins, upcoming, mapTimeUTC }) => {
          const chart = nearestChartIndex(times, mapTimeUTC)
          const time = upcoming ? alert.onsetUTC : alert.expiresUTC
          return (
            <li
              key={alert.id}
              // Where MetService gives a colour, its own: validated as #rrggbb when read.
              style={
                alert.colourHex ? { borderColor: alert.colourHex } : undefined
              }
              // The same block as the heavy rain band's, edged in the alert's colour.
              className={`${band} ${alert.colourHex ? '' : 'border-rule'}`}
            >
              <div className="min-w-0">
                <div>
                  <strong className="font-semibold">
                    {alert.headline} at {joinNames(pins.map(chartLabel))}:
                  </strong>{' '}
                  {upcoming ? 'from' : 'until'}{' '}
                  <time dateTime={new Date(time).toISOString()}>
                    {when(time)}
                  </time>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs">
                  {chart !== undefined && (
                    <button
                      type="button"
                      onClick={() => onSeek(chart)}
                      className={action}
                    >
                      Map for {when(times[chart])}
                    </button>
                  )}
                  <a
                    href={alert.web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={action}
                  >
                    On MetService{' '}
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </div>
              </div>
            </li>
          )
        })}
        {more > 0 && (
          <li className="text-ink-soft px-3 text-sm md:col-span-full">
            and {more} more
          </li>
        )}
      </ul>
      <p className="text-ink-soft mt-2 px-3 text-xs">
        Alerts from{' '}
        <a
          href="https://www.metservice.com"
          className="focus-visible:outline-cold rounded-sm underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          MetService
        </a>
        , licensed{' '}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          className="focus-visible:outline-cold rounded-sm underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          CC BY 4.0
        </a>
        ; areas simplified.
      </p>
    </section>
  )
}
