'use client'
import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { chartLabel } from '@/shared/helpers/pins/pins'
import type { PinAlert } from '@/shared/helpers/warnings/alertsForPins'

import { MOST_SHOWN } from './band'

/** "A", "A and B", "A, B and C". */
const joinNames = (names: string[]) =>
  names.length < 2
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`

/**
 * MetService's alerts for the visitor's pins, worst first, each a link to the
 * alert on MetService's site: they are official, so they come above what the
 * charts say. Shows nothing without alerts.
 */
export function AlertLines({ alerts }: { alerts: readonly PinAlert[] }) {
  const formatDate = useFormatDate()
  if (alerts.length === 0) return null

  const shown = alerts.slice(0, MOST_SHOWN)
  const more = alerts.length - shown.length
  const when = (time: number) => formatDate(time, 'EEE h:mmaaa')

  return (
    <section
      aria-label="Weather alerts"
      className="bg-plate mb-2 px-3 py-2.5 text-sm leading-snug"
    >
      <ul className="space-y-1.5">
        {shown.map(({ alert, pins, upcoming }) => (
          <li
            key={alert.id}
            // Where MetService gives a colour, its own: validated as #rrggbb when read.
            style={
              alert.colourHex ? { borderColor: alert.colourHex } : undefined
            }
            className={`border-l-4 pl-2 ${alert.colourHex ? '' : 'border-rule'}`}
          >
            <a
              href={alert.web}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink focus-visible:outline-cold rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <strong className="font-semibold">
                {alert.headline} at {joinNames(pins.map(chartLabel))}:
              </strong>{' '}
              <span className="underline underline-offset-2">
                {upcoming
                  ? `from ${when(alert.onsetUTC)}`
                  : `until ${when(alert.expiresUTC)}`}
              </span>
            </a>
          </li>
        ))}
        {more > 0 && <li className="text-ink-soft">and {more} more</li>}
      </ul>
      <p className="text-ink-soft mt-2 text-xs">
        Alerts from{' '}
        <a
          href="https://www.metservice.com"
          className="underline underline-offset-2"
        >
          MetService
        </a>
        , licensed{' '}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          className="underline underline-offset-2"
        >
          CC BY 4.0
        </a>
        ; areas simplified.
      </p>
    </section>
  )
}
