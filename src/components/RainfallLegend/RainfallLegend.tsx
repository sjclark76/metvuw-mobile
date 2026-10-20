'use client'

import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useState } from 'react'

import { RAIN_BANDS } from '@/shared/helpers/rainBands'

function RainfallLegend() {
  return (
    <div
      id="rainfall-legend"
      className="border-rule bg-plate/90 max-h-[40vh] overflow-y-auto rounded-lg border p-2 shadow-lg backdrop-blur-[1px]"
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
    </div>
  )
}

export function RainfallLegendSection() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    // Fixed above the footer, not sticky, for the same reason the footer is: on an
    // iPhone a sticky element flashes when the page jumps. The section keeps the
    // room the button takes at the end of the page.
    <section className="h-12 print:hidden">
      <div className="fixed right-2 bottom-[calc(var(--footer-height,5rem)+0.25rem)] z-30 flex items-end gap-2">
        <AnimatePresence initial={false}>
          {isOpen && (
            <m.div
              key="rainfall-legend-panel"
              initial={{ opacity: 0, x: 8, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-max max-w-[80vw]"
            >
              <RainfallLegend />
            </m.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
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
