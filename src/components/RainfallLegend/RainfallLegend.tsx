'use client'

import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useState } from 'react'

interface RainfallLegendBand {
  amount: string
  hexCode: string
}

const rainfallLegendBands: ReadonlyArray<RainfallLegendBand> = [
  { amount: '0.1 - 0.5 mm', hexCode: '#E6E6FA' },
  { amount: '0.5 - 1.0 mm', hexCode: '#D8BFD8' },
  { amount: '1.0 - 2.0 mm', hexCode: '#DA70D6' },
  { amount: '2.0 - 5.0 mm', hexCode: '#FF00FF' },
  { amount: '5.0 - 10.0 mm', hexCode: '#9400D3' },
  { amount: '10.0 - 20.0 mm', hexCode: '#0000FF' },
  { amount: '20.0 - 50.0 mm', hexCode: '#00FFFF' },
  { amount: '50.0 - 100.0 mm', hexCode: '#00FF00' },
  { amount: '100.0 - 200.0 mm', hexCode: '#FFFF00' },
  { amount: '> 200.0 mm', hexCode: '#FF0000' },
]

function RainfallLegend() {
  return (
    <div
      id="rainfall-legend"
      className="border-rule bg-plate/90 max-h-[40vh] overflow-y-auto rounded-lg border p-2 shadow-lg backdrop-blur-[1px]"
    >
      <ul className="grid grid-cols-2 gap-1">
        {rainfallLegendBands.map((band) => (
          <li
            key={band.amount}
            className="bg-paper/90 flex items-center gap-1 rounded-sm px-2 py-1"
          >
            <span
              className="border-ink-soft/40 h-3 w-3 shrink-0 rounded-xs border"
              style={{ backgroundColor: band.hexCode }}
              aria-hidden="true"
            />
            <p className="text-ink text-[11px] font-semibold">{band.amount}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RainfallLegendSection() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className="sticky bottom-[calc(var(--footer-height,5rem)+0.25rem)] z-30 flex w-full justify-end px-2 py-1">
      <div className="flex items-end gap-2">
        <AnimatePresence initial={false}>
          {isOpen && (
            <m.div
              key="rainfall-legend-panel"
              initial={{ opacity: 0, x: 8, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-[min(80vw,20rem)]"
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
