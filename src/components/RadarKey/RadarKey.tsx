'use client'

import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useState } from 'react'

import { track } from '@/shared/helpers/analytics/track'
import { RADAR_BANDS, type RadarGroup } from '@/shared/helpers/radarBands'

const CELL_PX = 24
const GROUPS: { group: RadarGroup; label: string }[] = [
  { group: 'heavy', label: 'Heavy' },
  { group: 'medium', label: 'Medium' },
  { group: 'light', label: 'Light' },
]

// Heaviest at the top, as metvuw draws it.
const bands = [...RADAR_BANDS].reverse()
// The strengths between colours, top to bottom: 70, 60 ... 0, -5.
const edges = [bands[0].toDbz, ...bands.map((band) => band.fromDbz)]

function RadarKeyPanel() {
  return (
    <div
      id="radar-key"
      role="region"
      aria-label="Radar key"
      className="border-rule bg-plate/90 max-h-[60vh] overflow-y-auto rounded-lg border p-3 shadow-lg backdrop-blur-[1px]"
    >
      <p className="text-ink mb-2 text-[11px] font-semibold">
        Radar echoes (dBZ)
      </p>
      <div className="flex gap-2">
        <div
          aria-hidden="true"
          className="text-ink-soft relative w-6 text-right font-mono text-[10px]"
          style={{ height: CELL_PX * bands.length }}
        >
          {edges.map((dbz, index) => (
            <span
              key={dbz}
              data-dbz
              className="absolute right-0 -translate-y-1/2 leading-none"
              style={{ top: index * CELL_PX }}
            >
              {dbz}
            </span>
          ))}
        </div>
        <ul className="border-ink/60 overflow-hidden rounded-xs border">
          {bands.map((band) => (
            <li
              key={band.hexCode}
              data-radar-band
              title={`${band.fromDbz} to ${band.toDbz} dBZ, ${band.group}`}
              className="border-ink/30 w-7 border-b last:border-b-0"
              style={{ height: CELL_PX, backgroundColor: band.hexCode }}
            />
          ))}
        </ul>
        <div className="text-[11px]">
          {GROUPS.map(({ group, label }) => (
            <p
              key={group}
              data-radar-group={group}
              className="border-ink/40 text-ink border-t-rule flex items-center border-t border-l-2 pl-2 font-semibold first:border-t-0"
              style={{
                height:
                  CELL_PX * RADAR_BANDS.filter((b) => b.group === group).length,
              }}
            >
              {label}
            </p>
          ))}
        </div>
      </div>
      <p className="text-ink-soft mt-3 max-w-56 text-[11px] leading-snug">
        Colours blend smoothly on the radar, so match them by eye.
      </p>
    </div>
  )
}

/**
 * The key to the radar's colours: the strength of the echo in dBZ down one side and
 * light, medium and heavy rain down the other, as metvuw shows them. A button above
 * the footer opens it, in the same place as the rainfall key on the forecast pages.
 */
export function RadarKeySection() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    // Fixed above the footer, like the rainfall key: on an iPhone a sticky element
    // flashes when the page jumps. The section keeps the room the button takes.
    <section className="h-12 print:hidden">
      <div className="fixed right-2 bottom-[calc(var(--footer-height,5rem)+0.25rem)] z-30 flex items-end gap-2">
        <AnimatePresence initial={false}>
          {isOpen && (
            <m.div
              key="radar-key-panel"
              initial={{ opacity: 0, x: 8, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-max max-w-[80vw]"
            >
              <RadarKeyPanel />
            </m.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => {
            if (!isOpen) track('key_opened', { key: 'radar' })
            setIsOpen((prev) => !prev)
          }}
          aria-label={isOpen ? 'Hide radar key' : 'Show radar key'}
          aria-expanded={isOpen}
          aria-controls="radar-key"
          className="border-rule bg-plate text-ink flex h-10 w-10 items-center justify-center rounded-full border shadow"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="3.5" width="5" height="3.5" rx="0.5" />
            <rect x="5" y="8" width="5" height="3.5" rx="0.5" />
            <rect x="5" y="12.5" width="5" height="3.5" rx="0.5" />
            <rect x="5" y="17" width="5" height="3.5" rx="0.5" />
            <path d="M13 5.25h6M13 9.75h6M13 14.25h6M13 18.75h6" />
          </svg>
        </button>
      </div>
    </section>
  )
}
