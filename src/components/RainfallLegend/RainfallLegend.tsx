'use client'

import { useState } from 'react'

import { usePresence } from '@/components/Hooks/usePresence'
import { track } from '@/shared/helpers/analytics/track'
import { RAIN_BANDS } from '@/shared/helpers/rainBands'

import { HowToReadChart } from './HowToReadChart'

function RainfallLegend() {
  return (
    <div
      id="rainfall-legend"
      className="border-rule bg-plate/90 max-h-[60vh] overflow-y-auto rounded-lg border p-2 shadow-lg backdrop-blur-[1px]"
    >
      <p className="text-ink mb-2 text-[11px] font-semibold">
        Rain in 6 hours (mm)
      </p>
      <ul className="grid grid-flow-col grid-rows-10 gap-x-4">
        {RAIN_BANDS.map((band) => (
          <li key={band.label} className="flex items-center gap-2 py-px">
            <span
              className="border-ink-soft/30 h-4 w-6 shrink-0 rounded-xs border"
              style={{ backgroundColor: band.hexCode }}
              aria-hidden="true"
            />
            <p className="text-ink w-6 text-[11px] font-semibold tabular-nums">
              {band.label}
            </p>
          </li>
        ))}
      </ul>
      <HowToReadChart />
    </div>
  )
}

// As long as the closing key's animation (animate-pop-out in globals.css).
const KEY_EXIT_MS = 180

export function RainfallLegendSection() {
  const [isOpen, setIsOpen] = useState(false)
  const presence = usePresence(isOpen, KEY_EXIT_MS)

  return (
    // Fixed above the footer, not sticky, for the same reason the footer is: on an
    // iPhone a sticky element flashes when the page jumps. The section keeps the
    // room the button takes at the end of the page.
    <section className="h-12 print:hidden">
      <div className="fixed right-2 bottom-[calc(var(--footer-height,5rem)+0.25rem)] z-30 flex items-end gap-2">
        {presence !== 'gone' && (
          <div
            className={`w-max max-w-[80vw] ${presence === 'shown' ? 'animate-pop-in' : 'animate-pop-out'}`}
          >
            <RainfallLegend />
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            if (!isOpen) track('key_opened', { key: 'rainfall' })
            setIsOpen((prev) => !prev)
          }}
          aria-label={isOpen ? 'Hide rainfall legend' : 'Show rainfall legend'}
          aria-expanded={isOpen}
          aria-controls="rainfall-legend"
          className="border-rule bg-plate text-ink flex h-10 w-10 items-center justify-center rounded-full border shadow"
        >
          <svg
            data-testid="rainfall-legend-toggle-icon"
            className={`h-5 w-5 transition-transform ${isOpen ? 'scale-95' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="5" width="3" height="3" rx="0.5" />
            <path d="M10 6.5h10" />
            <rect x="4" y="10.5" width="3" height="3" rx="0.5" />
            <path d="M10 12h10" />
            <rect x="4" y="16" width="3" height="3" rx="0.5" />
            <path d="M10 17.5h10" />
          </svg>
        </button>
      </div>
    </section>
  )
}
