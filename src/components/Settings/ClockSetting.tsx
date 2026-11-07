'use client'
import { useAtom } from 'jotai'

import { clockAtom, type ClockChoice } from '@/components/Atoms/GlobalState'
import { track } from '@/shared/helpers/analytics/track'

const choices: { value: ClockChoice; label: string }[] = [
  { value: '24h', label: '24-hour' },
  { value: '12h', label: '12-hour' },
]

/** 24-hour (14:00) or 12-hour (2:00pm) times on the charts and the time slider. */
export function ClockSetting() {
  const [saved, setSaved] = useAtom(clockAtom)
  const choice: ClockChoice = saved === '12h' ? '12h' : '24h'

  return (
    <div className="py-4">
      <p id="clock-setting" className="text-ink font-semibold">
        Clock
      </p>
      <p className="text-ink-soft mb-2 text-sm">
        24-hour shows 14:00, 12-hour shows 2:00pm.
      </p>
      <div
        role="group"
        aria-labelledby="clock-setting"
        className="border-ink/30 grid grid-cols-2 overflow-hidden rounded border"
      >
        {choices.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={choice === value}
            onClick={() => {
              track('setting_changed', { setting: 'clock', value })
              setSaved(value)
            }}
            className={`focus-visible:outline-cold min-h-11 px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 ${
              choice === value
                ? 'bg-ink text-paper'
                : 'bg-plate text-ink hover:bg-paper'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
