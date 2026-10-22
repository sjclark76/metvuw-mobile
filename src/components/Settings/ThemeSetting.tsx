'use client'
import { useAtom } from 'jotai'

import { themeAtom, type ThemeChoice } from '@/components/Atoms/GlobalState'
import { track } from '@/shared/helpers/analytics/track'

const choices: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const isChoice = (value: unknown): value is ThemeChoice =>
  value === 'system' || value === 'light' || value === 'dark'

/**
 * Light, dark, or whatever the device is set to: the same saved choice as the
 * theme menu in the navigation, which is what applies it to the page.
 */
export function ThemeSetting() {
  const [saved, setSaved] = useAtom(themeAtom)
  const choice: ThemeChoice = isChoice(saved) ? saved : 'system'

  return (
    <div className="py-4">
      <p id="theme-setting" className="text-ink font-semibold">
        Theme
      </p>
      <p className="text-ink-soft mb-2 text-sm">
        System follows your device’s own setting.
      </p>
      <div
        role="group"
        aria-labelledby="theme-setting"
        className="border-ink/30 grid grid-cols-3 overflow-hidden rounded border"
      >
        {choices.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={choice === value}
            onClick={() => {
              track('theme_changed', { theme: value })
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
